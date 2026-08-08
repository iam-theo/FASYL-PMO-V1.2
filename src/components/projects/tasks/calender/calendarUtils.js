export const WEEKDAYS = ["MON", "TUE", "WED", "THUR", "FRI", "SAT", "SUN"]

export const MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

export function formatDateKey(date) {
    const d = new Date(date)

    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
}

export function getMonthLabel(date) {
    return `${MONTH_NAMES[date.getMonth()]}, ${date.getFullYear()}`
}

export function getMonthMatrix(year, month) {
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const cells = []

    for (let i = firstDayIndex - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i
        cells.push({ date: new Date(year, month - 1, day), currentMonth: false })
    }

    for (let day = 1; day <= daysInMonth; day++) {
        cells.push({ date: new Date(year, month, day), currentMonth: true })
    }

    let nextDay = 1
    while (cells.length % 7 !== 0) {
        cells.push({ date: new Date(year, month + 1, nextDay), currentMonth: false })
        nextDay += 1
    }

    return cells
}
