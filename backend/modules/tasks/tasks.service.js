import { PrismaClient } from "@prisma/client";
import { ROLES } from "../../constants/roles.js";
import { formatTask } from "./tasks.utils.js";
// import { createReminderService } from "../reminders/reminder.service.js";
import { createReminder } from "../reminders/reminder.controller.js";
import { notifyTaskAssignment, createInAppNotification } from "../notifications/notification.service.js";

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
        assignedToUserId,
        title,
        description,
        priority,
        startDate,
        dueDate
    } = body;

    const { id: loggedInUserId, role } = user;

    let taskAssignedResourceId;
    let taskAssignedToUserId;

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

    } else if (role === ROLES.HEADOFOPS) {

        if (!assignedToUserId) throw new Error("A Project Manager must be selected");

        const assignee = await prisma.user.findUnique({
            where: {
                id: Number(assignedToUserId)
            }
        });

        if (!assignee) throw new Error("The selected user was not found.");

        if (assignee.role !== ROLES.PROJECTMANAGER) {
            throw new Error("Tasks can only be assigned to a Project Manager.");
        }

        taskAssignedToUserId = assignee.id;

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
            assignedToUserId: taskAssignedToUserId ?? null,
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
        if (body.assignedToUserId !== undefined) {
            const assignee = await prisma.user.findUnique({
                where: {
                    id: Number(body.assignedToUserId)
                }
            });

            if (!assignee) throw new Error("The selected user was not found.");

            if (assignee.role !== ROLES.PROJECTMANAGER) {
                throw new Error("Tasks can only be assigned to a Project Manager.");
            }
        }
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

        // Staff may only change the status of their own tasks, plus attach
        // proof-of-completion documents to that status change.
        allowedBody = {
            ...(body.status !== undefined && { status: body.status }),
            ...(Array.isArray(body.documents) && {
                documents: body.documents
            })
        };
    }

    const isStaff = user && user.role === ROLES.STAFF;
    const status = allowedBody.status;

    if (isStaff) {
        // Staff cannot mark a task done directly — completion has to go
        // through the project manager via PENDING_CONFIRMATION.
        if (status === "DONE") {
            throw new Error(
                "You cannot mark a task as done directly. Submit proof of completion for the project manager to confirm it."
            );
        }

        // Marking a task "complete but awaiting confirmation" requires proof.
        if (
            status === "PENDING_CONFIRMATION" &&
            !(Array.isArray(allowedBody.documents) && allowedBody.documents.length > 0)
        ) {
            throw new Error("A proof of completion document is required.");
        }
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
                allowedBody.status === "DONE"
                    ? new Date()
                    : null
        }),

        ...(Array.isArray(allowedBody.documents) &&
            allowedBody.documents.length > 0 && {
                documents: [
                    ...(Array.isArray(task.documents) ? task.documents : []),
                    ...allowedBody.documents,
                ]
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

    const statusChanged = updatedTask.status !== task.status;

    if (statusChanged) {
        const wasPending = task.status === "PENDING_CONFIRMATION";
        const isPending = updatedTask.status === "PENDING_CONFIRMATION";
        const confirmed = updatedTask.status === "DONE" && wasPending;

        const projectInfo = await prisma.project.findUnique({
            where: { id: task.projectId },
            select: {
                projectId: true,
                projectName: true,
                projectManagerId: true
            }
        });

        // The assignee submitted proof — surface it to the project manager so
        // the completion can be reviewed and confirmed.
        if (isPending && projectInfo?.projectManagerId) {
            createInAppNotification({
                userId: projectInfo.projectManagerId,
                projectId: projectInfo.projectId,
                type: "TASK_COMPLETION_SUBMITTED",
                title: "Task awaiting confirmation",
                message: `"${updatedTask.title}" was marked complete and awaits your confirmation.`,
                data: {
                    projectId: projectInfo.projectId,
                    projectName: projectInfo.projectName,
                    taskId,
                    taskTitle: updatedTask.title
                }
            });
        }

        // The PM confirmed the completion — let the assignee know.
        if (confirmed && updatedTask.assignedToUserId) {
            createInAppNotification({
                userId: updatedTask.assignedToUserId,
                projectId: projectInfo?.projectId ?? null,
                type: "TASK_COMPLETION_CONFIRMED",
                title: "Task confirmed complete",
                message: `Your task "${updatedTask.title}" was confirmed complete.`,
                data: {
                    projectId: projectInfo?.projectId ?? null,
                    projectName: projectInfo?.projectName ?? null,
                    taskId,
                    taskTitle: updatedTask.title
                }
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