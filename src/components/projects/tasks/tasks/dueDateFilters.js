export const DUE_DATE_FILTERS = ["Due Date", "Overdue", "Due Today", "Due This Week", "Due This Month"]

function isWithinDays(dueDate, days) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)
    const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24))
    return diffDays >= 0 && diffDays <= days
}

export function matchesDueDateFilter(dueDate, filter) {
    if (filter === "Due Date" || !dueDate) return true
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)

    if (filter === "Overdue") return due < today
    if (filter === "Due Today") return due.getTime() === today.getTime()
    if (filter === "Due This Week") return isWithinDays(dueDate, 7)
    if (filter === "Due This Month") return isWithinDays(dueDate, 30)
    return true
}
