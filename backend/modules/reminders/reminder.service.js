import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// reminders.service.js

export const createReminderService = async (body) => {

    const {
        userId,
        projectId,
        taskId = null,
        stageId = null,
        title,
        message = null,
        type = "GENERAL",
        remindAt
    } = body;

    if (!userId || !title || !remindAt) {
        throw new Error("User, title and remindAt date are required.");
    }

    const user = await prisma.user.findUnique({
        where: {
            id: Number(userId)
        }
    });

    if (!user) {
        throw new Error("User not found.");
    }

    // let project = null;
    // let task = null;
    // let stage = null;

    if (projectId) {

        const project = await prisma.project.findUnique({
            where: {
                projectId
            }
        });

        if (!project) {
            throw new Error("Project not found.");
        }
    }

    if (stageId) {

        const stage = await prisma.projectStage.findUnique({
            where: {
                id: Number(stageId)
            }
        });

        if (!stage) {
            throw new Error("Stage not found.");
        }
    }

    if (taskId) {

        const task = await prisma.task.findUnique({
            where: {
                id: Number(taskId)
            }
        });

        if (!task) {
            throw new Error("Task not found.");
        }
    }

    return await prisma.reminder.create({

        data: {

            userId: Number(userId),

            projectId,

            taskId,

            stageId,

            title,

            message,

            type,

            remindAt: new Date(remindAt)
        },

        include: {

            user: {
                select: {
                    id: true,
                    fullName: true,
                    email: true
                }
            },

            project: true,

            task: true,

            stage: true
        }
    });
};

export const getMyRemindersService = async (user) => {

    const now = new Date();

    const reminders = await prisma.reminder.findMany({
        where: {
            userId: user.id,
            status: "PENDING",
            remindAt: {
                lte: now
            }
        },

        include: {
            project: {
                select: {
                    projectId: true,
                    projectName: true
                }
            },

            task: {
                select: {
                    id: true,
                    title: true,
                    dueDate: true,
                    priority: true,
                    status: true
                }
            },

            stage: {
                select: {
                    id: true,
                    stageName: true
                }
            }
        },

        orderBy: {
            remindAt: "asc"
        }
    });

    return reminders;
}