import { processDueReminders } from "../../backend/modules/reminders/reminder.scheduler.js";

/**
 * Vercel Cron job — replaces the 60s in-process reminder scheduler that only
 * runs on a persistent host. On Hobby plans this fires at most once per day
 * (see vercel.json). processDueReminders() picks up every reminder with
 * remindAt <= now, so anything that became due while the job slept is caught
 * on the next run instead of being lost.
 */
export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }

  try {
    await processDueReminders();
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Reminder cron failed:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}
