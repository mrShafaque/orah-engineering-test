import { getRepository } from "typeorm"
import { NextFunction, Request, Response } from "express"
import { Group } from "../entity/group.entity"
import { CreateGroupInput } from "../interface/group.interface"
import { GroupStudent } from "../entity/group-student.entity"
import { Roll } from "../entity/roll.entity"
import { StudentRollState } from "../entity/student-roll-state.entity"
import { CreateGroupStudentInput } from "../interface/group-student.interface"
import { Student } from "../entity/student.entity"
import { studentResponse } from "../utilities/objectConverter"
import { endDate, startDate, currentDate } from "../utilities/dateConverter"

export class GroupController {
  private groupRepository = getRepository(Group)
  private groupStudentRepository = getRepository(GroupStudent)
  private rollRepository = getRepository(Roll)
  private studentRollState = getRepository(StudentRollState)
  private student = getRepository(Student)

  async allGroups(request: Request, response: Response, next: NextFunction) {
    // Task 1:
    // Return the list of all groups
    return this.groupRepository.find()
  }

  async createGroup(request: Request, response: Response, next: NextFunction) {
    // Task 1:
    // Add a Group
    const { body: params } = request

    const createGroupInput: CreateGroupInput = {
      name: params.name,
      number_of_weeks: params.number_of_weeks,
      roll_states: params.roll_states,
      incidents: params.incidents,
      ltmt: params.ltmt,
    }
    const group = new Group()
    group.prepareToCreate(createGroupInput)

    return this.groupRepository.save(group)
  }

  async updateGroup(request: Request, response: Response, next: NextFunction) {
    // Task 1:
    // Update a Group

    const result = { msg: "" }

    const { body: params } = request
    const groupToUpdate = await this.groupRepository.findOne(params.id)

    if (groupToUpdate === undefined) {
      result.msg = "❗❌ Invalid Id Entered ❌❗"
    } else {
      groupToUpdate.id = params.id
      groupToUpdate.name = params.name
      groupToUpdate.number_of_weeks = params.number_of_weeks
      groupToUpdate.roll_states = params.roll_states
      groupToUpdate.incidents = params.incidents
      groupToUpdate.ltmt = params.ltmt
      groupToUpdate.run_at = null
      groupToUpdate.student_count = 0
      this.groupRepository.save(groupToUpdate)
      result.msg = `Group with Id${groupToUpdate.id} updated succesfully ✅✅`
    }
    return result
  }

  async removeGroup(request: Request, response: Response, next: NextFunction) {
    // Task 1:
    // Delete a Group

    const result = { msg: "" }

    let groupToRemove = await this.groupRepository.findOne({ where: { id: parseInt(request.params.id) } })
    if (groupToRemove === undefined) {
      result.msg = "Invalid Id ❗❗"
    } else {
      await this.groupRepository.remove(groupToRemove)
      result.msg = "Group Deleted Successfully ✔"
    }
    return result
  }

  async getGroupStudents(request: Request, response: Response, next: NextFunction) {
    // Task 1:
    // Return the list of Students that are in a Group

    const group_id = request.params.id
    const findGroup = await this.groupRepository.findOne({ where: { id: parseInt(request.params.id) } })
    if (findGroup === undefined) {
      return { msg: "Invalid Group Id" }
    }

    const studentData = await this.student
      .createQueryBuilder("s")
      .innerJoinAndSelect(GroupStudent, "GS", "s.id=GS.student_id")
      .where("GS.group_id = :id", { id: group_id })
      .orderBy("s.id")
      .getMany()

    return studentResponse(studentData)
  }

  async runGroupFilters(request: Request, response: Response, next: NextFunction) {
    // Task 2:
    // 1. Clear out the groups (delete all the students from the groups)

    const end_date = endDate()

    await this.groupStudentRepository.clear()

    // 2. For each group, query the student rolls to see which students match the filter for the group
    const groups = await this.groupRepository.find()

    groups.forEach(async (group) => {
      const start_date = startDate(group.number_of_weeks)
      const current_Date = currentDate()
      const map = new Map()
      const studentData = await this.studentRollState
        .createQueryBuilder("s")
        .innerJoinAndSelect(Roll, "r", "r.id=s.roll_id")
        .where("s.state = :state", { state: group.roll_states })
        .andWhere(`r.completed_at BETWEEN '${start_date}' AND '${end_date}'`)
        .getMany()

      studentData.forEach((item) => {
        if (map.get(item.student_id)) {
          map.set(item.student_id, map.get(item.student_id) + 1)
        } else {
          map.set(item.student_id, 1)
        }
      })

      const studentGroupInput: CreateGroupStudentInput = {
        group_id: group.id,
        student_id: 0,
        incident_count: 0,
      }

      // 3. Add the list of students that match the filter to the group
      let count_no_of_student = 0
      map.forEach((value, key) => {
        const groupStudent = new GroupStudent()
        if (group.ltmt === "<") {
          if (value < group.incidents) {
            count_no_of_student++
            studentGroupInput.student_id = key
            studentGroupInput.incident_count = value
            groupStudent.prepareToCreate(studentGroupInput)
            this.groupStudentRepository.save(groupStudent)
          }
        } else {
          if (value > group.incidents) {
            count_no_of_student++
            studentGroupInput.student_id = key
            studentGroupInput.incident_count = value
            groupStudent.prepareToCreate(studentGroupInput)
            this.groupStudentRepository.save(groupStudent)
          }
        }
      })

      // Update the group for run_at and student_count
      const groupToUpdate = await this.groupRepository.findOne({ where: { id: group.id } })
      groupToUpdate.run_at = current_Date
      groupToUpdate.student_count = count_no_of_student
      this.groupRepository.save(groupToUpdate)
    })
    return { msg: "Successfully run the group filters" }
  }
}
