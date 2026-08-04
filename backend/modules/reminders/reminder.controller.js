import { PrismaClient } from "@prisma/client";
import { createReminderService, getMyRemindersService } from "./reminder.service.js";

const prisma = new PrismaClient();

/**
 * Create Reminder
 * POST /api/v1/reminders
 */
// reminders.controller.js

export const createReminder = async (
  task,
  project,
  stage,
  assigneeUserId,
  daysBefore = 1
) => {

  const remindAt = new Date(task.dueDate);
  remindAt.setDate(remindAt.getDate() - daysBefore);

  return createReminderService({
      userId: assigneeUserId,
      projectId: project.projectId,
      taskId: task.id,
      stageId: stage?.id,
      title: `Task: ${task.title}`,
      message: `Complete "${task.title}" before ${task.dueDate.toDateString()}`,
      type: "TASK_DUE",
      remindAt
  });
};

export const getMyReminders = async (req, res, next) => {

  try {

      const reminders = await getMyRemindersService(req.user);

      return res.json({
          success: true,
          data: reminders
      });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Failed to get remainders"
    });

    next(error);
  }

}


/**
 * Get All Reminders
 * GET /api/v1/reminders
 */
export const getReminders = async (req, res) => {
  try {
    const reminders = await prisma.reminder.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true
          }
        },

        project: true,
        task: true,
        stage: true
      },

      orderBy: {
        remindAt: "asc"
      }
    });

    return res.json({
      success: true,
      count: reminders.length,
      reminders
    });
  } catch (error) {
    console.error("Get reminders error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch reminders"
    });
  }
};


/**
 * Get User Reminders
 * GET /api/v1/reminders/user/:userId
 */
export const getUserReminders = async (req, res) => {
  try {
    const { userId } = req.params;

    const reminders = await prisma.reminder.findMany({
      where: {
        userId: Number(userId)
      },

      include: {
        project: true,
        task: true,
        stage: true
      },

      orderBy: {
        remindAt: "asc"
      }
    });

    return res.json({
      success: true,
      count: reminders.length,
      reminders
    });
  } catch (error) {
    console.error("Get user reminders error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user reminders"
    });
  }
};


/**
 * Get Single Reminder
 * GET /api/v1/reminders/:id
 */
export const getReminder = async (req, res) => {
  try {
    const { id } = req.params;

    const reminder = await prisma.reminder.findUnique({
      where: {
        id: Number(id)
      },

      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true
          }
        },

        project: true,
        task: true,
        stage: true
      }
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: "Reminder not found"
      });
    }

    return res.json({
      success: true,
      reminder
    });
  } catch (error) {
    console.error("Get reminder error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch reminder"
    });
  }
};


/**
 * Update Reminder
 * PATCH /api/v1/reminders/:id
 */
export const updateReminder = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      message,
      type,
      remindAt,
      status
    } = req.body;

    const existingReminder = await prisma.reminder.findUnique({
      where: {
        id: Number(id)
      }
    });

    if (!existingReminder) {
      return res.status(404).json({
        success: false,
        message: "Reminder not found"
      });
    }

    const reminder = await prisma.reminder.update({
      where: {
        id: Number(id)
      },

      data: {
        title,
        message,
        type,
        status,

        remindAt:
          remindAt !== undefined
            ? new Date(remindAt)
            : undefined
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

    return res.json({
      success: true,
      message: "Reminder updated successfully",
      reminder
    });
  } catch (error) {
    console.error("Update reminder error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update reminder"
    });
  }
};


/**
 * Complete Reminder
 * POST /api/v1/reminders/:id/complete
 */
export const completeReminder = async (req, res) => {
  try {
    const { id } = req.params;

    const reminder = await prisma.reminder.update({
      where: {
        id: Number(id)
      },

      data: {
        status: "COMPLETED",
        completedAt: new Date()
      }
    });

    return res.json({
      success: true,
      message: "Reminder completed successfully",
      reminder
    });
  } catch (error) {
    console.error("Complete reminder error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to complete reminder"
    });
  }
};


/**
 * Dismiss Reminder
 * POST /api/v1/reminders/:id/dismiss
 */
export const dismissReminder = async (req, res) => {
  try {
    const { id } = req.params;

    const reminder = await prisma.reminder.update({
      where: {
        id: Number(id)
      },

      data: {
        status: "DISMISSED",
        dismissedAt: new Date()
      }
    });

    return res.json({
      success: true,
      message: "Reminder dismissed successfully",
      reminder
    });
  } catch (error) {
    console.error("Dismiss reminder error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to dismiss reminder"
    });
  }
};


/**
 * Cancel Reminder
 * POST /api/v1/reminders/:id/cancel
 */
export const cancelReminder = async (req, res) => {
  try {
    const { id } = req.params;

    const reminder = await prisma.reminder.update({
      where: {
        id: Number(id)
      },

      data: {
        status: "CANCELLED"
      }
    });

    return res.json({
      success: true,
      message: "Reminder cancelled successfully",
      reminder
    });
  } catch (error) {
    console.error("Cancel reminder error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel reminder"
    });
  }
};


/**
 * Delete Reminder
 * DELETE /api/v1/reminders/:id
 */
export const deleteReminder = async (req, res) => {
  try {
    const { id } = req.params;

    const existingReminder = await prisma.reminder.findUnique({
      where: {
        id: Number(id)
      }
    });

    if (!existingReminder) {
      return res.status(404).json({
        success: false,
        message: "Reminder not found"
      });
    }

    await prisma.reminder.delete({
      where: {
        id: Number(id)
      }
    });

    return res.json({
      success: true,
      message: "Reminder deleted successfully"
    });
  } catch (error) {
    console.error("Delete reminder error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete reminder"
    });
  }
};