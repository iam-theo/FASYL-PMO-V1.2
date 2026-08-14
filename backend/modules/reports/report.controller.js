import { PrismaClient } from "@prisma/client";
import { ROLES } from "../../constants/roles.js";

const prisma = new PrismaClient();

/* =========================================================================
   CONFIG
========================================================================= */

/** Values the UI can produce. Mirrors `report.constants.js` on the client. */
const REPORT_TYPES = [
  "PROJECT",
  "STAGE",
  "PROGRESS",
  "FINANCIAL",
  "RISK",
  "RESOURCE",
  "QUALITY",
  "CUSTOM",
];

const REPORT_FORMATS = ["PDF", "DOCX", "XLSX", "CSV", "HTML", "MARKDOWN"];

const LIMITS = {
  title: { min: 3, max: 150 },
  description: { max: 1000 },
  content: { max: 20000 },
  fileName: { max: 255 },
  fileType: { max: 100 },
  fileUrl: { max: 2048 },
};

/* =========================================================================
   HELPERS
========================================================================= */

const fail = (res, status, message, errors) =>
  res.status(status).json({
    success: false,
    message,
    ...(errors && Object.keys(errors).length ? { errors } : {}),
  });

const asText = (value) => (typeof value === "string" ? value.trim() : "");

const isHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

/**
 * Validates report input. `partial` mode (PATCH) only checks the fields the
 * client actually sent, so removing a value is never blocked by the rules for
 * the field it once held.
 * @returns {Record<string, string>} Field-keyed messages, empty when valid.
 */
const validateReport = (body, { partial = false } = {}) => {
  const errors = {};

  if (body.title !== undefined) {
    const title = asText(body.title);
    if (!title) errors.title = "Title is required";
    else if (title.length < LIMITS.title.min)
      errors.title = `Title needs at least ${LIMITS.title.min} characters`;
    else if (title.length > LIMITS.title.max)
      errors.title = `Title cannot exceed ${LIMITS.title.max} characters`;
  } else if (!partial) {
    errors.title = "Title is required";
  }

  if (body.format !== undefined) {
    if (!REPORT_FORMATS.includes(body.format))
      errors.format = "Format must be one of: " + REPORT_FORMATS.join(", ");
  } else if (!partial) {
    errors.format = "Format is required";
  }

  if (body.type !== undefined && !REPORT_TYPES.includes(body.type)) {
    errors.type = "Type must be one of: " + REPORT_TYPES.join(", ");
  }

  for (const [field, max] of [
    ["description", LIMITS.description.max],
    ["content", LIMITS.content.max],
    ["fileName", LIMITS.fileName.max],
    ["fileType", LIMITS.fileType.max],
    ["fileUrl", LIMITS.fileUrl.max],
  ]) {
    if (body[field] === undefined) continue;
    const value = asText(body[field]);
    if (value.length > max) {
      errors[field] = `${field} cannot exceed ${max.toLocaleString()} characters`;
    }
  }

  if (body.fileUrl !== undefined && body.fileUrl) {
    const fileUrl = asText(body.fileUrl);
    if (fileUrl && !isHttpUrl(fileUrl)) {
      errors.fileUrl = "Enter a full URL, including https://";
    }
  }

  const periodStart = body.periodStart;
  const periodEnd = body.periodEnd;

  if (periodStart !== undefined && periodStart !== null && periodStart !== "") {
    const date = new Date(periodStart);
    if (Number.isNaN(date.getTime())) errors.periodStart = "Enter a valid period start";
  }
  if (periodEnd !== undefined && periodEnd !== null && periodEnd !== "") {
    const date = new Date(periodEnd);
    if (Number.isNaN(date.getTime())) errors.periodEnd = "Enter a valid period end";
  }
  if (
    !errors.periodStart &&
    !errors.periodEnd &&
    periodStart &&
    periodEnd &&
    new Date(periodEnd) <= new Date(periodStart)
  ) {
    errors.periodEnd = "The period must end after it starts";
  }

  // Content or a file — a report with neither carries no information.
  if (!partial) {
    const hasContent = Boolean(asText(body.content));
    const hasFileUrl = Boolean(asText(body.fileUrl));
    if (!hasContent && !hasFileUrl) {
      errors.content = "Add the report content, or link to a generated file";
    }
  }

  return errors;
};

/**
 * The report rows a user may touch. HEADOFOPS sees every project; a project
 * manager sees only the projects they manage, because every report hangs off
 * a project.
 */
const buildReportScope = async (user) => {
  if (user.role === ROLES.HEADOFOPS) return {};

  const projects = await prisma.project.findMany({
    where: { projectManagerId: user.id },
    select: { projectId: true },
  });

  return { projectId: { in: projects.map((project) => project.projectId) } };
};

/** Does the authenticated user own (or fully administer) this project? */
const canManageProject = async (user, projectId) => {
  if (user.role === ROLES.HEADOFOPS) return true;

  const project = await prisma.project.findUnique({
    where: { projectId: String(projectId) },
    select: { projectId: true, projectManagerId: true },
  });

  return Boolean(project && project.projectManagerId === user.id);
};

/** Trimmed list shape: stage/project names plus the identity of the creator. */
const reportListSelect = {
  id: true,
  projectId: true,
  stageId: true,
  createdById: true,
  title: true,
  description: true,
  type: true,
  format: true,
  fileUrl: true,
  fileName: true,
  fileType: true,
  periodStart: true,
  periodEnd: true,
  generatedAt: true,
  createdAt: true,
  updatedAt: true,
  stage: { select: { id: true, stageName: true } },
  project: { select: { projectId: true, projectName: true } },
  createdBy: { select: { id: true, fullName: true, email: true, role: true } },
};

/** Full shape for a single report, including the heavy `content` column. */
const reportDetailSelect = {
  ...reportListSelect,
  content: true,
};

/* =========================================================================
   CREATE
========================================================================= */

/**
 * POST /api/v1/reports
 *
 * The creator is taken from the token, never from the body — a client cannot
 * claim authorship of someone else's report.
 */
export const createReport = async (req, res) => {
  try {
    const errors = validateReport(req.body);
    if (Object.keys(errors).length) {
      return fail(res, 400, "Report validation failed", errors);
    }

    const {
      projectId,
      stageId,
      title,
      description,
      type,
      format,
      content,
      fileUrl,
      fileName,
      fileType,
      periodStart,
      periodEnd,
    } = req.body;

    // Verify project exists using projectId
    // because Report.projectId references Project.projectId.
    const project = await prisma.project.findUnique({
      where: { projectId: String(projectId) },
    });

    if (!project) {
      return fail(res, 404, "Project not found", { projectId: "Project not found" });
    }

    if (!(await canManageProject(req.user, project.projectId))) {
      return fail(res, 403, "You can only create reports for projects you manage");
    }

    if (stageId) {
      const stage = await prisma.projectStage.findUnique({
        where: { id: Number(stageId) },
      });

      if (!stage) {
        return fail(res, 404, "Project stage not found", { stageId: "Project stage not found" });
      }

      if (stage.projectId !== project.projectId) {
        return fail(res, 400, "The selected stage does not belong to this project", {
          stageId: "The selected stage does not belong to this project",
        });
      }
    }

    const report = await prisma.report.create({
      data: {
        projectId: String(projectId),
        stageId: stageId ? Number(stageId) : null,
        createdById: req.user.id,
        title,
        description,
        type: type || "PROJECT",
        format,
        content: content || null,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileType: fileType || null,
        periodStart: periodStart ? new Date(periodStart) : null,
        periodEnd: periodEnd ? new Date(periodEnd) : null,
        generatedAt: new Date(),
      },
      select: reportDetailSelect,
    });

    return res.status(201).json({
      success: true,
      message: "Report generated successfully",
      report,
    });
  } catch (error) {
    console.error("Create report error:", error);
    return fail(res, 500, "Failed to generate report");
  }
};

/* =========================================================================
   LIST / DETAIL
========================================================================= */

/**
 * GET /api/v1/reports
 *
 * Returns only the rows the caller may see (role-scoped), and omits the heavy
 * `content` column — a table of titles does not need 20k-character cells. The
 * detail endpoint returns the full record, and the client re-fetches it when
 * a row's download needs the real content.
 */
export const getReports = async (req, res) => {
  try {
    const scope = await buildReportScope(req.user);

    const reports = await prisma.report.findMany({
      where: scope,
      select: reportListSelect,
      orderBy: { createdAt: "desc" },
    });

    return res.json(reports);
  } catch (error) {
    console.error("Get reports error:", error);
    return fail(res, 500, "Failed to fetch reports");
  }
};

/**
 * GET /api/v1/reports/:id
 */
export const getReport = async (req, res) => {
  try {
    const { id } = req.params;
    const scope = await buildReportScope(req.user);

    const report = await prisma.report.findFirst({
      where: { id: Number(id), ...scope },
      select: reportDetailSelect,
    });

    if (!report) {
      return fail(res, 404, "Report not found");
    }

    return res.json(report);
  } catch (error) {
    console.error("Get report error:", error);
    return fail(res, 500, "Failed to fetch report");
  }
};

/* =========================================================================
   UPDATE
========================================================================= */

/**
 * PATCH /api/v1/reports/:id
 *
 * A project manager may only edit reports on projects they manage.
 */
export const updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const scope = await buildReportScope(req.user);

    const existingReport = await prisma.report.findFirst({
      where: { id: Number(id), ...scope },
    });

    if (!existingReport) {
      return fail(res, 404, "Report not found");
    }

    // Only the author may edit a report — a user must not change a report
    // generated by someone else.
    if (existingReport.createdById !== req.user.id) {
      return fail(res, 403, "You can only edit reports you created");
    }

    const {
      title,
      description,
      type,
      format,
      content,
      fileUrl,
      fileName,
      fileType,
      periodStart,
      periodEnd,
      stageId,
    } = req.body;

    const errors = validateReport(req.body, { partial: true });
    if (Object.keys(errors).length) {
      return fail(res, 400, "Report validation failed", errors);
    }

    // If stageId is being updated, verify that the stage exists
    // and belongs to the same project.
    if (stageId !== undefined && stageId !== null) {
      const stage = await prisma.projectStage.findUnique({
        where: { id: Number(stageId) },
      });

      if (!stage) {
        return fail(res, 404, "Project stage not found", { stageId: "Project stage not found" });
      }

      if (stage.projectId !== existingReport.projectId) {
        return fail(res, 400, "The selected stage does not belong to this project", {
          stageId: "The selected stage does not belong to this project",
        });
      }
    }

    const report = await prisma.report.update({
      where: { id: Number(id) },
      data: {
        title: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
        type: type !== undefined ? type : undefined,
        format: format !== undefined ? format : undefined,
        content: content !== undefined ? content : undefined,
        fileUrl: fileUrl !== undefined ? fileUrl || null : undefined,
        fileName: fileName !== undefined ? fileName || null : undefined,
        fileType: fileType !== undefined ? fileType || null : undefined,
        stageId: stageId !== undefined ? (stageId ? Number(stageId) : null) : undefined,
        periodStart:
          periodStart !== undefined ? (periodStart ? new Date(periodStart) : null) : undefined,
        periodEnd: periodEnd !== undefined ? (periodEnd ? new Date(periodEnd) : null) : undefined,
      },
      select: reportDetailSelect,
    });

    return res.json({
      success: true,
      message: "Report updated successfully",
      report,
    });
  } catch (error) {
    console.error("Update report error:", error);
    return fail(res, 500, "Failed to update report");
  }
};

/* =========================================================================
   DELETE
========================================================================= */

/**
 * DELETE /api/v1/reports/:id
 *
 * A project manager may only delete reports on projects they manage.
 */
export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const scope = await buildReportScope(req.user);

    const existingReport = await prisma.report.findFirst({
      where: { id: Number(id), ...scope },
    });

    if (!existingReport) {
      return fail(res, 404, "Report not found");
    }

    // Deletion is the same rule as editing: only the author may remove it.
    if (existingReport.createdById !== req.user.id) {
      return fail(res, 403, "You can only delete reports you created");
    }

    await prisma.report.delete({
      where: { id: Number(id) },
    });

    return res.json({
      success: true,
      message: "Report deleted successfully",
    });
  } catch (error) {
    console.error("Delete report error:", error);
    return fail(res, 500, "Failed to delete report");
  }
};
