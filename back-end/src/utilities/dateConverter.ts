// export class DateConverter {
//     public currentDate() {
//         const date = new Date();
//         const currentOffset = date.getTimezoneOffset();
//         const ISTOffset = 330;   // IST offset UTC +5:30

//         const ISTDate = new Date(date.getTime() + (ISTOffset + currentOffset)*60000);
//         console.log(ISTDate);
//     }
// }

function dateToString(date: Date) {
  const month = date.getMonth() + 1
  const date2 = date.getDate()
  const newDate = String(date.getFullYear()) + "-" + (month < 10 ? "0" + String(month) : String(month)) + "-" + (date2 < 10 ? "0" + String(date2) : String(date2))
  return newDate
}

function ISTDate() {
  const date = new Date()
  const currentOffset = date.getTimezoneOffset()
  const ISTOffset = 330 // IST offset UTC +5:30
  const ISTDate = new Date(date.getTime() + (ISTOffset + currentOffset) * 60000)
  return ISTDate
}

export function currentDate() {
  const date = new Date()
  return date
}

export function endDate() {
  const date = ISTDate()
  date.setDate(date.getDate() + 1)
  return dateToString(date)
}

export function startDate(number_of_weeks: number) {
  const date = ISTDate()
  const day = date.getDay()
  var totalNoOfDays = day + 7 * number_of_weeks - 1
  date.setDate(date.getDate() - totalNoOfDays)
  return dateToString(date)
}
