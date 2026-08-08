export const STATUS_COLUMNS = [
    { key: "TODO", label: "To-Do" },
    { key: "IN_PROGRESS", label: "In Progress" },
    { key: "IN_REVIEW", label: "In Review" },
    { key: "DONE", label: "Done" },
]

export function formatDueDate(dueDate) {
    if (!dueDate) return "--"
    const date = new Date(dueDate)
    if (Number.isNaN(date.getTime())) return dueDate
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
}
