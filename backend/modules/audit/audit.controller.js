import { getAuditLogsService } from "./audit.service.js";

/* =========================
   AUDIT LOGS (HEADOFOPS only)
========================= */
export const getAuditLogs = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(
      Math.max(parseInt(req.query.pageSize, 10) || 10, 1),
      100,
    );

    const data = await getAuditLogsService({
      page,
      pageSize,
      module: req.query.module,
      search: req.query.search,
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
