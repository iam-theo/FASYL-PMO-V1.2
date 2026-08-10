import { PrismaClient } from "@prisma/client";
import { createInAppNotification } from "../notifications/notification.service.js";
import { broadcast } from "../realtime/realtime.service.js";
import { sendEmail } from "../../utils/email.service.js";

const prisma = new PrismaClient();

let schedulerInterval = null;

/**
 * Process due reminders
 */
export const processDueReminders = async () => {
    try {
        const now = new Date();

        const dueReminders = await prisma.reminder.findMany({
        where: {
            status: "PENDING",
            remindAt: {
            lte: now
            }
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
        },

        orderBy: {
            remindAt: "asc"
        }
        });

        if (dueReminders.length === 0) {
        return;
        }

        console.log(
        `⏰ Processing ${dueReminders.length} due reminder(s)`
        );

        for (const reminder of dueReminders) {
        try {
            console.log(
            `🔔 Reminder triggered: ${reminder.title}`
            );

            console.log(
            `👤 User: ${reminder.user.fullName}`
            );

            if (reminder.message) {
            console.log(
                `📝 Message: ${reminder.message}`
            );
            }

            // Deliver the reminder to the user:
            // 1. In-app notification (bell) — pushed live over the socket.
            // 2. Realtime data-changed event so the active-reminders sections
            //    on the dashboard / overview refresh instantly.
            // 3. Best-effort email so they're reached even when offline.

            await createInAppNotification({
            userId: reminder.userId,
            projectId: reminder.projectId,
            type: "REMINDER",
            title: `Reminder: ${reminder.title}`,
            message: reminder.message || "A reminder you set is now due.",
            data: {
                projectId: reminder.projectId,
                projectName: reminder.project?.projectName || null,
                taskId: reminder.taskId,
                taskTitle: reminder.task?.title || null,
                stageName: reminder.stage?.stageName || null,
            },
            });

            broadcast("data:changed", {
            module: "Reminders",
            action: "Reminder triggered",
            projectId: reminder.projectId ?? null,
            userId: reminder.userId,
            });

            await sendEmail({
            to: reminder.user.email,
            subject: `Reminder: ${reminder.title}`,
            text: `${reminder.message ? `${reminder.message}\n\n` : ""}Due: ${
                reminder.remindAt?.toLocaleString() ?? "—"
            }\nThis is an automated message from the FASYL PMO portal.`,
            html: `<p>${
                (reminder.message || "A reminder you set is now due.").replaceAll(
                "&",
                "&amp;"
                ).replaceAll("<", "&lt;")
            }</p>
                <p><strong>Due:</strong> ${
                reminder.remindAt?.toLocaleString() ?? "—"
                }</p>
                <p style="color:#98a2b3;font-size:13px;">This is an automated message from the FASYL PMO portal.</p>`,
            });

            await prisma.reminder.update({
            where: {
                id: reminder.id
            },

            data: {
                status: "SENT",
                sentAt: new Date()
            }
            });

            console.log(
            `✅ Reminder ${reminder.id} marked as SENT`
            );

        } catch (error) {
            console.error(
            `❌ Failed to process reminder ${reminder.id}:`,
            error
            );
        }
        }

    } catch (error) {
        console.error(
        "Reminder scheduler error:",
        error
        );
    }
};


/**
 * Start Reminder Scheduler
 *
 * Runs every 60 seconds
 */
export const startReminderScheduler = () => {
    if (schedulerInterval) {
        console.log(
        "⚠️ Reminder scheduler already running"
        );

        return;
    }

    console.log(
        "⏰ Reminder scheduler started"
    );

    // Run immediately
    processDueReminders();

    // Run every 60 seconds
    schedulerInterval = setInterval(
        processDueReminders,
        60 * 1000
    );
    };


    /**
     * Stop Reminder Scheduler
     */
    export const stopReminderScheduler = () => {
    if (!schedulerInterval) {
        return;
    }

    clearInterval(schedulerInterval);

    schedulerInterval = null;

    console.log(
        "🛑 Reminder scheduler stopped"
    );
};