export function studentResponse(studentData: Array<{ id; first_name; last_name }>) {
  let studentResponse = []
  studentData.forEach((item) => {
    studentResponse.push({
      id: item.id,
      first_name: item.first_name,
      last_name: item.last_name,
      full_name: item.first_name + " " + item.last_name,
    })
  })
  return studentResponse
}
