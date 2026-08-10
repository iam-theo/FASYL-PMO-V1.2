export const TASK_STATUS_OPTIONS = ["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "PENDING_CONFIRMATION", "DONE"]
export const TASK_PRIORITY_OPTIONS = ["URGENT", "HIGH", "MEDIUM", "LOW"]

// Tasks can only be created/assigned once the project reaches the Planning
// stage (stage 4). Stages 1-3 (Client ID, Engagement, Initiation) must be
// signed off before task assignment is enabled.
export const TASKS_ENABLED_FROM_STAGE = 4;

export const areTasksEnabledForProject = (project) => {
    const currentStageOrder = Number(project?.currentStageOrder ?? 0);
    return currentStageOrder >= TASKS_ENABLED_FROM_STAGE;
};

export const TASK_STATUS_LABELS = {
    TODO: "To Do",
    IN_PROGRESS: "In Progress",
    IN_REVIEW: "In Review",
    BLOCKED: "Blocked",
    PENDING_CONFIRMATION: "Pending Confirmation",
    DONE: "Done",
    CANCELLED: "Cancelled",
}

// export const TASK_ASSIGNEES = [
//     "Olusoga Eniola",
//     "Are Rahman",
//     "Bamidele Talabi",
//     "Grace Nwosu",
//     "Michael Adeyemi",
// ]

export const PRIORITY_BADGE_COLORS = {
    URGENT: "#D92D20",
    HIGH: "#F5A200",
    MEDIUM: "#949494",
    LOW: "#12B76A",
}
