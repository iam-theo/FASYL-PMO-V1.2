import { PrismaClient } from "@prisma/client";
import { ROLES } from "../../constants/roles.js";
import { formatTask } from "./tasks.utils.js";
// import { createReminderService } from "../reminders/reminder.service.js";
import { createReminder } from "../reminders/reminder.controller.js";
import { notifyTaskAssignment } from "../notifications/notification.service.js";

const findResourceAssignee = (projectResources, recordId) => {
  const resources = Array.isArray(projectResources) ? projectResources : [];

  return resources.find(
    (resource) => resource.recordId === recordId
  );
};

const prisma = new PrismaClient();

// const getReminderDate = (dueDate, daysBefore = 1) => {
//     const remindAt = new Date(dueDate);
//     remindAt.setDate(remindAt.getDate() - daysBefore);
//     return remindAt;
// };

export const createTaskService = async (body, user, document = null) => {

    const {
        projectId,
        stageOrder,
        assignedResourceId,
        title,
        description,
        priority,
        startDate,
        dueDate
    } = body;

    const { id: loggedInUserId, role } = user;

    let taskAssignedResourceId;

    if (!projectId || !title) throw new Error("Project ID and title are required");

    const project = await prisma.project.findUnique({
        where: {
            projectId
        }
    })

    if(!project) throw new Error("Project not found");

    const projectResources = Array.isArray(project.resources) ? project.resources : [];

    let stage = null;

    if(stageOrder !== undefined && stageOrder !== null) {
        stage = await prisma.projectStage.findUnique({
            where: {
                projectId_stageOrder: {
                    projectId,
                    stageOrder: Number(stageOrder)
                }
            }
        });

        if(!stage) throw new Error("Stage not found");
    }

    if(role === ROLES.PROJECTMANAGER) {

        if(!assignedResourceId) throw new Error("A Project Resource must be selected");

        const resource = projectResources.find(
            (resource) => resource.recordId === assignedResourceId
        );

        if(!resource) throw new Error("The selected resource is not assigned to this project.");

        taskAssignedResourceId = resource.recordId;

    } else {
        throw new Error("You are not authorized to assign tasks.")
    }

    const task = await prisma.task.create({
        data: {
            projectId: project.id,
            stageId: stage ? stage.id : null,

            title,
            description,
            priority: priority || "MEDIUM",

            startDate: startDate ? new Date(startDate) : null,

            dueDate: dueDate ? new Date(dueDate) : null,

            assignedById: loggedInUserId,
            createdById: loggedInUserId,
            assignedToUserId: null,
            assignedResourceId: taskAssignedResourceId,
            documents: document ? [document] : undefined
        },

        include: {
            assignedToUser: {
                select: {
                    id: true,
                    fullName: true,
                    email: true
                }
            },

            stage: {
                select: {
                    id: true,
                    stageName: true,
                    stageOrder: true
                }
            },

            project: {
                select: {
                    id: true,
                    projectId: true,
                    projectName: true,
                    resources: true
                }
            },

            assignedBy: {
                select: {
                    id: true,
                    fullName: true,
                    email: true
                }
            },

            createdBy: {
                select: {
                    id: true,
                    fullName: true,
                    email: true
                }
            }
        }

    });

    // const reminderUserId = task.assignedToUserId ?? loggedInUserId;
    // const remindAt = new Date(task.dueDate);
    // remindAt.setDate(remindAt.getDate() -2);

    await createReminder(
        task,
        project,
        stage,
        task.assignedToUserId ?? loggedInUserId,
        2
    );

    const assignee = task.assignedToUser
        ? task.assignedToUser
        : findResourceAssignee(projectResources, task.assignedResourceId);

    if (assignee?.email) {
        notifyTaskAssignment({
            task,
            assignee,
            assignedBy: task.assignedBy
        }).catch((error) => {
            console.error("Task assignment notification failed:", error.message);
        });
    }

    return formatTask(task);
}

export const getTaskServiceAll = async () => {

    const tasks = await prisma.task.findMany({

        include: {
            project: {
                select: {
                    id: true,
                    projectId: true,
                    projectName: true,
                    workflowStatus: true,
                    resources: true
                }
            },

            stage: {
                select: {
                    id: true,
                    stageName: true,
                    stageOrder: true
                }
            },

            assignedToUser: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    role: true
                }
            },

            assignedBy: {
                select: {
                    id: true,
                    fullName: true,
                    email: true
                }
            },

            createdBy: {
                select: {
                    id: true,
                    fullName: true,
                    email: true
                }
            }
        },

        orderBy: {
            createdAt: "desc"
        }
    });

    const formattedTasks = tasks.map((task) => {

        let assignee = null;

        if(task.assignedToUser) {
            assignee = {

                type: ROLES.PROJECTMANAGER,
                id: task.assignedToUser.id,
                fullName: task.assignedToUser.fullName,
                email: task.assignedToUser.email,
                role: task.assignedToUser.role
            };
        } else if(task.assignedResourceId) {

            const resources = Array.isArray(task.project.resources)
                ? task.project.resources
                : [];

            const resource = resources.find(
                (resource) => resource.recordId === task.assignedResourceId
            );

            if(resource) {
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
    });

    return formattedTasks
}

export const getAssignedTaskCountService = async (user) => {
    // STAFF tasks are assigned via project resources (assignedResourceId),
    // never via assignedToUserId. Find the recordIds that belong to this user
    // across the projects they are a resource on, then count matching tasks.
    if (user.role === ROLES.STAFF) {
        const projects = await prisma.project.findMany({
            select: {
                id: true,
                resources: true
            }
        });

        const email = (user.email || "").toLowerCase();
        const projectIds = [];
        const recordIds = [];

        for (const project of projects) {
            const resources = Array.isArray(project.resources)
                ? project.resources
                : [];

            const match = resources.find(
                (resource) =>
                    (resource.email || "").toLowerCase() === email
            );

            if (match) {
                projectIds.push(project.id);
                recordIds.push(match.recordId);
            }
        }

        if (projectIds.length === 0) return 0;

        return prisma.task.count({
            where: {
                projectId: { in: projectIds },
                assignedResourceId: { in: recordIds }
            }
        });
    }

    const count = await prisma.task.count({
        where: {
            assignedToUserId: Number(user.id)
        }
    });

    return count;
}

export const getTaskService = async (
    projectId,
    stageOrder
) => {

    const project = await prisma.project.findUnique({

        where: {
            projectId
        },

        select: {
            id: true,
            resources: true
        }

    });

    if (!project) {
        throw new Error("Project not found.");
    }

    const stage = await prisma.projectStage.findUnique({

        where: {

            projectId_stageOrder: {

                projectId,
                stageOrder

            }

        },

        select: {

            id: true

        }

    });

    if (!stage) {
        throw new Error("Project stage not found.");
    }

    const tasks = await prisma.task.findMany({

        where: {
            projectId: project.id,
            stageId: stage.id
        },

        include: {
            project: {
                select: {
                    id: true,
                    projectId: true,
                    projectName: true,
                    workflowStatus: true,
                    resources: true
                }
            },

            stage: {
                select: {
                    id: true,
                    stageName: true,
                    stageOrder: true
                }
            },

            assignedToUser: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    role: true
                }
            },

            assignedBy: {
                select: {
                    id: true,
                    fullName: true,
                    email: true
                }
            },

            createdBy: {
                select: {
                    id: true,
                    fullName: true,
                    email: true
                }
            }
        },

        orderBy: {
            createdAt: "desc"
        }
    });

    return tasks.map(formatTask)
}

export const updateTaskService = async (
    taskId,
    body,
    user
) => {

    const task = await prisma.task.findUnique({
        where: {
            id: taskId
        }
    });

    if(!task) throw new Error("Task not found")

    if (user && user.role === ROLES.HEADOFOPS) {
        throw new Error("You are not authorized to update tasks");
    }

    const previousAssignedToUserId = task.assignedToUserId;
    const previousAssignedResourceId = task.assignedResourceId;

    let allowedBody = body;

    if (user && user.role === ROLES.STAFF) {
        const project = await prisma.project.findUnique({
            where: { id: task.projectId },
            select: { resources: true }
        });

        const resources = Array.isArray(project?.resources) ? project.resources : [];
        const email = (user.email || "").toLowerCase();

        const me = resources.find(
            (resource) => (resource.email || "").toLowerCase() === email
        );

        if (!me || task.assignedResourceId !== me.recordId) {
            throw new Error("You are not authorized to update this task");
        }

        // Staff may only change the status of their own tasks.
        allowedBody = {
            ...(body.status !== undefined && { status: body.status })
        };
    }

    const data = {
        ...(allowedBody.title !== undefined && {
            title: allowedBody.title
        }),

        ...(allowedBody.description !== undefined && {
            description: allowedBody.description
        }),

        ...(allowedBody.priority !== undefined && {
            priority: allowedBody.priority
        }),

        ...(allowedBody.status !== undefined && {
            status: allowedBody.status,
            completedAt:
                allowedBody.status === "COMPLETED"
                    ? new Date()
                    : null
        }),

        ...(allowedBody.startDate !== undefined && {
            startDate: allowedBody.startDate
                ? new Date(allowedBody.startDate)
                : null
        }),

        ...(allowedBody.dueDate !== undefined && {
            dueDate: allowedBody.dueDate
                ? new Date(allowedBody.dueDate)
                : null
        }),

        ...(allowedBody.assignedToUserId !== undefined && {
            assignedToUserId: allowedBody.assignedToUserId
                ? Number(allowedBody.assignedToUserId)
                : null
        }),

        ...(allowedBody.assignedResourceId !== undefined && {
            assignedResourceId: allowedBody.assignedResourceId || null
        })
    };

    const updatedTask = await prisma.task.update({

        where: {
            id: taskId
        },
        data,

        include: {
            project: {
                select: {
                    id: true,
                    projectId: true,
                    projectName: true,
                    workflowStatus: true,
                    resources: true
                }
            },

            stage: {
                select: {
                    id: true,
                    stageName: true,
                    stageOrder: true
                }
            },

            assignedToUser: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    role: true
                }
            },

            assignedBy: {
                select: {
                    id: true,
                    fullName: true,
                    email: true
                }
            },

            createdBy: {
                select: {
                    id: true,
                    fullName: true,
                    email: true
                }
            }
        }
    });

    const assigneeChanged =
        (updatedTask.assignedToUserId !== null &&
            updatedTask.assignedToUserId !== previousAssignedToUserId) ||
        (updatedTask.assignedResourceId !== null &&
            updatedTask.assignedResourceId !== previousAssignedResourceId);

    if (assigneeChanged) {
        const projectResources = Array.isArray(updatedTask.project?.resources)
            ? updatedTask.project.resources
            : [];

        const assignee = updatedTask.assignedToUser
            ? updatedTask.assignedToUser
            : findResourceAssignee(
                projectResources,
                updatedTask.assignedResourceId
              );

        if (assignee?.email) {
            notifyTaskAssignment({
                task: updatedTask,
                assignee,
                assignedBy: updatedTask.assignedBy
            }).catch((error) => {
                console.error("Task assignment notification failed:", error.message);
            });
        }
    }

    return formatTask(updatedTask);
}

export const deleteTaskService = async (taskId) => {

    const task = await prisma.task.findUnique({
        where: {
            id: taskId
        }
    });

    if (!task) {
        throw new Error("Task not found");
    }

    await prisma.task.delete({
        where: {
            id: taskId
        }
    });

    return task;
};