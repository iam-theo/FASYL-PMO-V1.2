export const STATUS_COLUMNS = [
    {
        key: "TODO",
        label: "To-Do",
        icon: "fa-solid fa-inbox",
        theme: {
            from: "#818CF8",
            to: "#4F46E5",
            text: "#4338CA",
            soft: "#EEF2FF",
            body: "#F5F7FF",
            ring: "rgba(99, 102, 241, 0.45)",
            hint: "Not started yet",
        },
    },
    {
        key: "IN_PROGRESS",
        label: "In Progress",
        icon: "fa-solid fa-bolt",
        theme: {
            from: "#FBBF24",
            to: "#F59E0B",
            text: "#B45309",
            soft: "#FEF3C7",
            body: "#FFFBEB",
            ring: "rgba(245, 158, 11, 0.45)",
            hint: "Active work",
        },
    },
    {
        key: "IN_REVIEW",
        label: "In Review",
        icon: "fa-solid fa-eye",
        theme: {
            from: "#38BDF8",
            to: "#0EA5E9",
            text: "#0369A1",
            soft: "#E0F2FE",
            body: "#F0F9FF",
            ring: "rgba(14, 165, 233, 0.45)",
            hint: "Under inspection",
        },
    },
    {
        key: "PENDING_CONFIRMATION",
        label: "Pending Confirmation",
        icon: "fa-solid fa-hourglass-half",
        theme: {
            from: "#A78BFA",
            to: "#8B5CF6",
            text: "#7E22CE",
            soft: "#F3E8FF",
            body: "#FAF5FF",
            ring: "rgba(139, 92, 246, 0.45)",
            hint: "Awaiting sign-off",
        },
    },
    {
        key: "DONE",
        label: "Done",
        icon: "fa-solid fa-circle-check",
        theme: {
            from: "#34D399",
            to: "#10B981",
            text: "#047857",
            soft: "#D1FAE5",
            body: "#ECFDF5",
            ring: "rgba(16, 185, 129, 0.45)",
            hint: "Complete",
        },
    },
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
