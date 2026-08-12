import { ROLES } from "../../constants/roles.js";

const resolveResource = (projectResources, recordId) => {
  const resource = projectResources.find(
    (candidate) => candidate.recordId === recordId,
  );

  if (!resource) return null;

  return {
    type: ROLES.RESOURCE,
    id: resource.recordId,
    fullName:
      `${resource.firstName ?? ""} ${resource.lastName ?? ""}`.trim() ||
      resource.email ||
      "Unassigned",
    email: resource.email,
    staffId: resource.staffId,
    phoneNumber: resource.phoneNumber,
    designation: resource.designation ?? null,
  };
};

export const formatTask = (task) => {
  const projectResources = Array.isArray(task.project?.resources)
    ? task.project.resources
    : [];

  // All assigned resources live in the TaskResource join table; older tasks
  // only carry the legacy single assignedResourceId column.
  const resourceIds =
    Array.isArray(task.assignedResources) && task.assignedResources.length > 0
      ? task.assignedResources.map((assignment) => assignment.resourceId)
      : task.assignedResourceId
        ? [task.assignedResourceId]
        : [];

  const assignees = resourceIds
    .map((recordId) => resolveResource(projectResources, recordId))
    .filter(Boolean);

  // HOPS-assigned tasks target a Project Manager user account instead.
  if (task.assignedToUser) {
    assignees.unshift({
      type: ROLES.PROJECTMANAGER,
      id: task.assignedToUser.id,
      fullName: task.assignedToUser.fullName,
      email: task.assignedToUser.email,
      role: task.assignedToUser.role,
    });
  }

  // Backward-compatible single assignee (the first one).
  const assignee = assignees[0] ?? null;

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    startDate: task.startDate,
    dueDate: task.dueDate,
    completedAt: task.completedAt,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    documents: Array.isArray(task.documents) ? task.documents : [],
    assignedToUserId: task.assignedToUserId ?? null,
    assignedResourceId: task.assignedResourceId ?? null,
    assignedResourceIds: resourceIds,
    assignees,

    project: {
      id: task.project.id,
      projectId: task.project.projectId,
      projectName: task.project.projectName,
    },

    stage: task.stage,
    assignee,
    assignedBy: task.assignedBy,
    createdBy: task.createdBy,
  };
};
