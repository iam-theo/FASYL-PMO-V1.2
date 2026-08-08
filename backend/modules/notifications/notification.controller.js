import { prisma } from "../../prisma/prisma.client.js";

/**
 * GET /api/v1/notifications/my
 * Returns the current user's notifications, newest first, plus the unread count.
 */
export const getMyNotifications = async (req, res) => {
  try {
    const userId = Number(req.user.id);

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.notification.count({
        where: { userId, readAt: null },
      }),
    ]);

    return res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error) {
    console.error("Get my notifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
};

/**
 * POST /api/v1/notifications/:id/read
 * Marks a single notification as read (only if it belongs to the caller).
 */
export const markNotificationRead = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const notificationId = Number(req.params.id);

    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: notification.readAt ?? new Date() },
    });

    return res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Mark notification read error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
    });
  }
};

/**
 * POST /api/v1/notifications/read-all
 * Marks every unread notification of the caller as read.
 */
export const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = Number(req.user.id);

    await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });

    return res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark all notifications read error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
    });
  }
};
