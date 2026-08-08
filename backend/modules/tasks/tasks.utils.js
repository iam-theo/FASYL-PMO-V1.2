import { ROLES } from "../../constants/roles.js";

export const formatTask = (task) => {

    let assignee = null;

    if (task.assignedToUser) {

        assignee = {
            type: ROLES.PROJECTMANAGER,
            id: task.assignedToUser.id,
            fullName: task.assignedToUser.fullName,
            email: task.assignedToUser.email,
            role: task.assignedToUser.role
        };

    } else if (task.assignedResourceId) {

        const resources = Array.isArray(task.project.resources)
            ? task.project.resources
            : [];

        const resource = resources.find(
            resource => resource.recordId === task.assignedResourceId
        );

        if (resource) {
            assignee = {
                type: ROLES.RESOURCE,
                id: resource.recordId,
                fullName: `${resource.firstName} ${resource.lastName}`,
                email: resource.email,
                staffId: resource.staffId,
                phoneNumber: resource.phoneNumber
            };
        }
    }

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

        project: {
            id: task.project.id,
            projectId: task.project.projectId,
            projectName: task.project.projectName
        },

        stage: task.stage,
        assignee,
        assignedBy: task.assignedBy,
        createdBy: task.createdBy
    };
};