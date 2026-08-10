import { matchesDueDateFilter } from "../tasks/dueDateFilters";

export const percentOf = (count, total) => (total > 0 ? Math.round((count / total) * 100) : 0);

export const isTaskDone = (task) => task?.status === "DONE" || task?.status === "COMPLETED";

const STATUS_COLORS = {
  done: "#34C759",
  inProgress: "#08F",
  pending: "#FF8D28",
  blocked: "#FF383C",
  overdue: "#FF383C",
};

const STATUS_LABELS = {
  done: "Completed",
  inProgress: "In Progress",
  pending: "Pending",
  blocked: "Blocked",
  overdue: "Overdue",
};

const ASSIGNEE_COLORS = [
  "#34C759",
  "#0088FF",
  "#FF8D28",
  "#FF383C",
  "#228CEE",
  "#7F56D9",
];

export const buildStatusItems = (tasks) => {
  const buckets = { done: 0, inProgress: 0, pending: 0, blocked: 0, overdue: 0 };

  tasks.forEach((task) => {
    const status = task?.status;
    if (isTaskDone(task)) buckets.done += 1;
    else if (status === "BLOCKED") buckets.blocked += 1;
    else if (matchesDueDateFilter(task?.dueDate, "Overdue")) buckets.overdue += 1;
    else if (status === "IN_PROGRESS" || status === "IN_REVIEW") buckets.inProgress += 1;
    else buckets.pending += 1;
  });

  const total = tasks.length;
  return Object.entries(buckets)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => ({
      label: STATUS_LABELS[key],
      color: STATUS_COLORS[key],
      count,
      percent: percentOf(count, total),
    }));
};

export const buildAllocationItems = (tasks) => {
  const countsByAssignee = new Map();

  tasks.forEach((task) => {
    const name = task?.assignee?.fullName || "Unassigned";
    countsByAssignee.set(name, (countsByAssignee.get(name) || 0) + 1);
  });

  const total = tasks.length;
  return [...countsByAssignee.entries()].map(([label, count], index) => ({
    label,
    color: ASSIGNEE_COLORS[index % ASSIGNEE_COLORS.length],
    count,
    percent: percentOf(count, total),
  }));
};

const monthKey = (dateString) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

export const buildTrend = (tasks) => {
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: date.toLocaleString("en-US", { month: "short" }),
    });
  }

  const created = new Map(months.map((month) => [month.key, 0]));
  const completed = new Map(months.map((month) => [month.key, 0]));

  tasks.forEach((task) => {
    const createdKey = monthKey(task?.createdAt);
    if (createdKey && created.has(createdKey)) {
      created.set(createdKey, created.get(createdKey) + 1);
    }
    const completedKey = monthKey(task?.completedAt);
    if (completedKey && completed.has(completedKey)) {
      completed.set(completedKey, completed.get(completedKey) + 1);
    }
  });

  return {
    months,
    created: months.map((month) => created.get(month.key)),
    completed: months.map((month) => completed.get(month.key)),
  };
};

const DAY_MS = 24 * 60 * 60 * 1000;

const reminderLabel = (due, now) => {
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / DAY_MS);
  if (diffDays < 0) {
    const overdue = Math.abs(diffDays);
    return `Overdue by ${overdue} ${overdue === 1 ? "day" : "days"}`;
  }
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "In 1 day";
  return `In ${diffDays} days`;
};

export const buildUpcoming = (tasks) => {
  const now = new Date();

  return (Array.isArray(tasks) ? tasks : [])
    .map((task) => ({
      id: task?.id,
      task: task?.title,
      dueDate: task?.dueDate ? new Date(task.dueDate) : null,
    }))
    .filter((entry) => entry.dueDate && !Number.isNaN(entry.dueDate.getTime()))
    .sort((a, b) => a.dueDate - b.dueDate)
    .slice(0, 5)
    .map((entry) => ({
      id: entry.id,
      task: entry.task,
      dueDate: entry.dueDate.toLocaleDateString("en-GB"),
      reminder: reminderLabel(entry.dueDate, now),
    }));
};

export const getSortedStages = (project) =>
  Array.isArray(project?.stages)
    ? [...project.stages].sort((a, b) => (a.stageOrder ?? 0) - (b.stageOrder ?? 0))
    : [];

// A stage is "done" once it is APPROVED; the final stage becomes COMPLETED.
// Counting only COMPLETED would report 0% for every in-flight project.
export const isStageDone = (stage) =>
  stage?.workflowStatus === "APPROVED" || stage?.workflowStatus === "COMPLETED";

export const computeLifecycleProgress = (project) => {
  const stages = Array.isArray(project?.stages) ? project.stages : [];
  if (stages.length > 0) {
    const doneCount = stages.filter(isStageDone).length;
    return Math.round((doneCount / stages.length) * 100);
  }
  return Math.round(Number(project?.progressPercent) || 0);
};

export const getCurrentStageName = (project) => {
  const currentStageOrder = project?.currentStageOrder ?? 0;
  const current = getSortedStages(project).find(
    (stage) => (stage.stageOrder ?? 0) === currentStageOrder,
  );
  return current?.stageName ?? "";
};

export const getProjectResources = (project) =>
  Array.isArray(project?.resources) ? project.resources : [];

export const formatDate = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB");
};

const TASK_STATUS_LABELS = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  BLOCKED: "Blocked",
  PENDING_CONFIRMATION: "Pending Confirmation",
  DONE: "Done",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const formatTaskStatus = (status) => TASK_STATUS_LABELS[status] ?? (status ?? "");

/**
 * All tasks for the project: aggregated from every stage, with the current
 * stage's richer task list layered on top so assignee data is preserved.
 */
export const getProjectTasks = (project, currentTasks = []) => {
  const byId = new Map();

  (Array.isArray(project?.stages) ? project.stages : []).forEach((stage) =>
    (Array.isArray(stage?.tasks) ? stage.tasks : []).forEach((task) => {
      if (task?.id != null) byId.set(task.id, task);
    }),
  );

  (Array.isArray(currentTasks) ? currentTasks : []).forEach((task) => {
    if (task?.id != null) byId.set(task.id, task);
  });

  return [...byId.values()];
};

export const resolveTaskAssignee = (task, resources = []) => {
  const assignee = task?.assignee;
  if (assignee?.fullName) return assignee.fullName;
  if (task?.assignedToUser?.fullName) return task.assignedToUser.fullName;
  if (task?.assignedResourceId) {
    const resource = resources.find((r) => r?.recordId === task.assignedResourceId);
    if (resource) {
      const name = `${resource.firstName ?? ""} ${resource.lastName ?? ""}`.trim();
      return name || resource.email || "Unassigned";
    }
  }
  return "Unassigned";
};
