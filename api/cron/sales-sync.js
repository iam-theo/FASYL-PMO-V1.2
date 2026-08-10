import { syncSalesProjects } from "../../backend/modules/projects/salesSync.service.js";

/**
 * Vercel Cron job — replaces the node-cron sales sync that only runs on a
 * persistent host. Skips quietly when SALES_API_URL is unset (the sales API is
 * on a private network and may be unreachable from Vercel).
 */
export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }

  if (!process.env.SALES_API_URL) {
    res.status(200).json({ success: true, skipped: true });
    return;
  }

  try {
    const result = await syncSalesProjects();
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error("Sales sync cron failed:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}
