import { PrismaClient } from "@prisma/client";

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

            /**
             * Future notification integrations:
             *
             * - In-app notification
             * - Email
             * - WhatsApp
             * - Push notification
             * - SMS
             */

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