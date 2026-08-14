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

const normalizeResourceIdList = (value) => {
    if (value === undefined || value === null) return [];

    const items = Array.isArray(value)
        ? value
        : typeof value === "string"
            ? value.split(",")
            : [value];

    return items
        .flatMap((item) => {
            if (Array.isArray(item)) return item;
            return String(item).trim();
        })
        .filter((item) => item !== undefined && item !== null && String(item).trim() !== "")
        .map((item) => String(item).trim());
};

export const createTaskService = async (body, user, document = null) => {

    const {
        projectId,
        stageOrder,
        assignedResourceIds,
        assignedResourceId,
        assignedToUserId,
        title,
        description,
        priority,
        startDate,
        dueDate,
        reminderDays
    } = body;

    const { id: loggedInUserId, role } = user;

    // recordIds of the project resources the task is assigned to. Multiple
    // resources are supported; the first one is mirrored into the legacy
    // assignedResourceId column for backward compatibility.
    let taskAssignedResourceIds = [];
    let taskAssignedToUserId;

    if (!projectId || !title) throw new Error("Project ID and title are required");

    // A task must always carry a priority and a start/end date — a task without
    // a schedule or urgency is not actionable.
    const ALLOWED_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
    const normalizedPriority = String(priority || "").toUpperCase();

    if (!normalizedPriority) {
        throw new Error("Priority is required");
    }

    if (!ALLOWED_PRIORITIES.includes(normalizedPriority)) {
        throw new Error(
            `Priority must be one of: ${ALLOWED_PRIORITIES.join(", ")}`
        );
    }

    if (!startDate) throw new Error("Start date is required");
    if (!dueDate) throw new Error("Due date is required");

    if (new Date(dueDate) < new Date(startDate)) {
        throw new Error("Due date cannot be before the start date");
    }

    const project = await prisma.project.findUnique({
        where: {
            projectId
        }
    })

    if(!project) throw new Error("Project not found");

    // Task assignment is only enabled once the project reaches the Planning
    // stage (stage 4), i.e. stages 1-3 (Client ID, Engagement, Initiation)
    // have been signed off.
    const TASKS_ENABLED_FROM_STAGE = 4;
    if ((project.currentStageOrder ?? 0) < TASKS_ENABLED_FROM_STAGE) {
        throw new Error(
            "Task assignment is not enabled yet. Stages 1-3 (Client ID, Engagement, Initiation) must be signed off before the project reaches Planning (stage 4)."
        );
    }

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

        const rawResourceIds = normalizeResourceIdList(assignedResourceIds ?? assignedResourceId);

        const requestedIds = rawResourceIds
            .filter((id) => id !== undefined && id !== null && String(id).trim() !== "")
            .map((id) => String(id).trim());

        if (requestedIds.length === 0) {
            throw new Error("At least one Project Resource must be selected");
        }

        const invalidIds = requestedIds.filter(
            (id) => !projectResources.some((resource) => resource.recordId === id)
        );

        if (invalidIds.length > 0) {
            throw new Error("One or more selected resources are not assigned to this project.");
        }

        taskAssignedResourceIds = [...new Set(requestedIds)];

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
            priority: normalizedPriority,

            startDate: new Date(startDate),

            dueDate: new Date(dueDate),

            assignedById: loggedInUserId,
            createdById: loggedInUserId,
            assignedToUserId: taskAssignedToUserId ?? null,
            assignedResourceId: taskAssignedResourceIds[0] ?? null,
            documents: document ? [document] : undefined
        },

        include: {
            assignedResources: true,
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

    // Persist every resource assignment in the join table so a task can carry
    // more than one resource.
    if (taskAssignedResourceIds.length > 0) {
        await prisma.taskResource.createMany({
            data: taskAssignedResourceIds.map((resourceId) => ({
                taskId: task.id,
                resourceId
            })),
            skipDuplicates: true
        });

        // The create snapshot above predates the join rows — mirror them so
        // the response reflects every assigned resource.
        task.assignedResources = taskAssignedResourceIds.map((resourceId) => ({
            resourceId
        }));
    }

    // Resolve who the reminders target: each assigned user account (matched
    // via the resource's email), falling back to the task creator.
    const reminderUserIds = new Set();

    if (task.assignedToUserId) reminderUserIds.add(task.assignedToUserId);

    for (const recordId of taskAssignedResourceIds) {
        const resource = findResourceAssignee(projectResources, recordId);

        if (resource?.email) {
            const account = await prisma.user.findUnique({
                where: { email: resource.email },
                select: { id: true }
            });

            if (account) reminderUserIds.add(account.id);
        }
    }

    if (reminderUserIds.size === 0) reminderUserIds.add(loggedInUserId);

    // The assigner chooses how many days before the due date the reminder
    // fires; defaults to 3 when not provided.
    const daysBefore = Math.max(0, Number(reminderDays ?? 3) || 0);

    for (const reminderUserId of reminderUserIds) {
        await createReminder(
            task,
            project,
            stage,
            reminderUserId,
            daysBefore
        );
    }

    const assignees = task.assignedToUser
        ? [task.assignedToUser]
        : taskAssignedResourceIds
            .map((recordId) => findResourceAssignee(projectResources, recordId))
            .filter(Boolean);

    for (const assignee of assignees) {
        if (assignee?.email) {
            notifyTaskAssignment({
                task,
                assignee,
                assignedBy: task.assignedBy
            }).catch((error) => {
                console.error("Task assignment notification failed:", error.message);
            });
        }
    }

    return formatTask(task);
}

export const getTaskServiceAll = async () => {

    const tasks = await prisma.task.findMany({

        include: {
            assignedResources: true,
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

    return tasks.map(formatTask);
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

        const tasks = await prisma.task.findMany({
            where: {
                projectId: { in: projectIds }
            },
            select: {
                id: true,
                assignedResourceId: true,
                assignedResources: {
                    select: { resourceId: true }
                }
            }
        });

        return tasks.filter(
            (task) =>
                recordIds.includes(task.assignedResourceId) ||
                task.assignedResources.some((assignment) =>
                    recordIds.includes(assignment.resourceId)
                )
        ).length;
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
            assignedResources: true,
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
        },
        include: {
            assignedResources: true
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

    // New resource assignment set (recordIds) when a Project Manager updates
    // the assignees — mirrors the create flow. null means "not being changed".
    let newAssignedResourceIds = null;

    // The required task fields may be updated but never cleared.
    if (body.priority !== undefined && !String(body.priority).trim()) {
        throw new Error("Priority is required");
    }

    if (body.startDate !== undefined && !body.startDate) {
        throw new Error("Start date is required");
    }

    if (body.dueDate !== undefined && !body.dueDate) {
        throw new Error("Due date is required");
    }

    if (body.startDate && body.dueDate && new Date(body.dueDate) < new Date(body.startDate)) {
        throw new Error("Due date cannot be before the start date");
    }

    let allowedBody = body;

    if (
        user &&
        user.role === ROLES.PROJECTMANAGER &&
        (body.assignedResourceIds !== undefined || body.assignedResourceId !== undefined)
    ) {
        const rawResourceIds = normalizeResourceIdList(
            body.assignedResourceIds ?? body.assignedResourceId
        );

        const requestedIds = rawResourceIds
            .filter((id) => id !== undefined && id !== null && String(id).trim() !== "")
            .map((id) => String(id).trim());

        if (requestedIds.length === 0) {
            throw new Error("At least one Project Resource must be selected");
        }

        const project = await prisma.project.findUnique({
            where: { id: task.projectId },
            select: { resources: true }
        });

        const projectResources = Array.isArray(project?.resources)
            ? project.resources
            : [];

        const invalidIds = requestedIds.filter(
            (id) => !projectResources.some((resource) => resource.recordId === id)
        );

        if (invalidIds.length > 0) {
            throw new Error("One or more selected resources are not assigned to this project.");
        }

        newAssignedResourceIds = [...new Set(requestedIds)];

        // The assignment is handled above; drop the legacy key so the generic
        // mapping below does not override the primary resource.
        delete allowedBody.assignedResourceId;
    }

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

    // Keep the join table and the legacy primary column in sync.
    if (newAssignedResourceIds) {
        data.assignedResourceId = newAssignedResourceIds[0];
    }

    const updatedTask = await prisma.task.update({

        where: {
            id: taskId
        },
        data,

        include: {
            assignedResources: true,
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

    // A task's assignment lives in two places: the legacy assignedResourceId
    // column and the TaskResource join table. Either source can be empty on its
    // own (older rows only carry the column, newer paths only the join rows),
    // so compare the UNION of both. Comparing a single source makes every
    // status-only update look like a reassignment whenever the other source is
    // empty — which fires a spurious "task assigned" notification.
    const previousResourceIds = Array.from(new Set([
        ...(Array.isArray(task.assignedResources)
            ? task.assignedResources.map((assignment) => assignment.resourceId)
            : []),
        ...(previousAssignedResourceId ? [previousAssignedResourceId] : []),
    ]));

    const currentResourceIds = Array.from(new Set([
        ...(newAssignedResourceIds || []),
        ...(updatedTask.assignedResourceId
            ? [updatedTask.assignedResourceId]
            : []),
    ]));

    const resourceSetChanged =
        previousResourceIds.length !== currentResourceIds.length ||
        previousResourceIds.some((id) => !currentResourceIds.includes(id)) ||
        currentResourceIds.some((id) => !previousResourceIds.includes(id));

    if (newAssignedResourceIds && resourceSetChanged) {
        await prisma.taskResource.deleteMany({ where: { taskId } });
        await prisma.taskResource.createMany({
            data: newAssignedResourceIds.map((resourceId) => ({
                taskId,
                resourceId
            })),
            skipDuplicates: true
        });

        // The update snapshot predates the join replacement — mirror the new
        // set so the response reflects every assigned resource.
        updatedTask.assignedResources = newAssignedResourceIds.map(
            (resourceId) => ({ resourceId })
        );
    }

    const assigneeChanged =
        resourceSetChanged ||
        (updatedTask.assignedToUserId !== null &&
            updatedTask.assignedToUserId !== previousAssignedToUserId);

    if (assigneeChanged) {
        const projectResources = Array.isArray(updatedTask.project?.resources)
            ? updatedTask.project.resources
            : [];

        // Only notify the assignees that were just added, so existing assignees
        // are not re-annoyed when the task is edited.
        const addedAssignees = [];

        if (
            updatedTask.assignedToUser &&
            updatedTask.assignedToUserId !== previousAssignedToUserId
        ) {
            addedAssignees.push(updatedTask.assignedToUser);
        }

        for (const recordId of currentResourceIds) {
            if (previousResourceIds.includes(recordId)) continue;

            const resource = findResourceAssignee(projectResources, recordId);
            if (resource) addedAssignees.push(resource);
        }

        for (const assignee of addedAssignees) {
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

        // The PM confirmed the completion — let the assignee know. Staff tasks
        // are assigned via project resources (assignedToUserId is null), so
        // resolve the staff account through the resource's email when there is
        // no direct user id.
        if (confirmed) {
            let assigneeUserId = updatedTask.assignedToUserId;

            if (!assigneeUserId) {
                const projectResources = Array.isArray(updatedTask.project?.resources)
                    ? updatedTask.project.resources
                    : [];

                const recordId = updatedTask.assignedResourceId;
                const resource = recordId
                    ? findResourceAssignee(projectResources, recordId)
                    : null;

                if (resource?.email) {
                    const account = await prisma.user.findUnique({
                        where: { email: resource.email },
                        select: { id: true }
                    });

                    if (account) assigneeUserId = account.id;
                }
            }

            if (assigneeUserId) {
                createInAppNotification({
                    userId: assigneeUserId,
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