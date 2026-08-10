import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/* =========================
   AUDIT LOGGING
   Every mutating request is recorded here: who did it, what was done,
   and when. The AuditLog table already existed in the schema but was
   never written to.
========================= */

/** Fields picked out of request bodies to give the log human-readable context. */
const CONTEXT_FIELDS = [
  "title",
  "name",
  "projectName",
  "clientName",
  "status",
  "comment",
  "reason",
  "stageOrder",
  "description",
  "message",
];

/**
 * Ordered route -> human readable action mapping. Order matters: more
 * specific patterns must come before generic single-segment matches.
 */
const ROUTE_ACTIONS = [
  // Auth
  { method: "POST", pattern: /^\/auth\/register$/, module: "Auth", action: "Registered a new account" },
  { method: "POST", pattern: /^\/auth\/signup$/, module: "Auth", action: "Created a test account" },
  { method: "POST", pattern: /^\/auth\/login$/, module: "Auth", action: "Signed in" },

  // Projects
  { method: "POST", pattern: /^\/projects\/?$/, module: "Projects", action: "Created a project" },
  { method: "PATCH", pattern: /^\/projects\/[^/]+\/assign\/?$/, module: "Projects", action: "Assigned a project manager" },
  { method: "PATCH", pattern: /^\/projects\/[^/]+\/resources\/?$/, module: "Projects", action: "Updated project resources" },
  { method: "PATCH", pattern: /^\/projects\/[^/]+\/stages\/[^/]+\/checklist\/?$/, module: "Projects", action: "Updated a stage checklist" },
  { method: "PATCH", pattern: /^\/projects\/[^/]+\/stages\/[^/]+\/docs\/[^/]+\/?$/, module: "Projects", action: "Updated a stage document" },
  { method: "DELETE", pattern: /^\/projects\/[^/]+\/stages\/[^/]+\/docs\/[^/]+\/?$/, module: "Projects", action: "Deleted a stage document" },
  { method: "PUT", pattern: /^\/projects\/[^/]+$/, module: "Projects", action: "Updated a project" },
  { method: "DELETE", pattern: /^\/projects\/[^/]+$/, module: "Projects", action: "Deleted a project" },

  // Workflow
  { method: "POST", pattern: /^\/workflow\/submit\/.+/, module: "Workflow", action: "Submitted a stage for approval" },
  { method: "POST", pattern: /^\/workflow\/approve\/.+/, module: "Workflow", action: "Approved a stage" },
  { method: "POST", pattern: /^\/workflow\/reject\/.+/, module: "Workflow", action: "Rejected a stage" },

  // Tasks
  { method: "POST", pattern: /^\/tasks\/?$/, module: "Tasks", action: "Created a task" },
  { method: "PATCH", pattern: /^\/tasks\/[^/]+$/, module: "Tasks", action: "Updated a task" },
  { method: "DELETE", pattern: /^\/tasks\/[^/]+$/, module: "Tasks", action: "Deleted a task" },

  // Reports
  { method: "POST", pattern: /^\/reports\/?$/, module: "Reports", action: "Created a report" },
  { method: "PATCH", pattern: /^\/reports\/[^/]+$/, module: "Reports", action: "Updated a report" },
  { method: "DELETE", pattern: /^\/reports\/[^/]+$/, module: "Reports", action: "Deleted a report" },

  // Reminders
  { method: "POST", pattern: /^\/reminders\/?$/, module: "Reminders", action: "Created a reminder" },
  { method: "POST", pattern: /^\/reminders\/[^/]+\/complete\/?$/, module: "Reminders", action: "Completed a reminder" },
  { method: "POST", pattern: /^\/reminders\/[^/]+\/dismiss\/?$/, module: "Reminders", action: "Dismissed a reminder" },
  { method: "POST", pattern: /^\/reminders\/[^/]+\/cancel\/?$/, module: "Reminders", action: "Cancelled a reminder" },
  { method: "PATCH", pattern: /^\/reminders\/[^/]+$/, module: "Reminders", action: "Updated a reminder" },
  { method: "DELETE", pattern: /^\/reminders\/[^/]+$/, module: "Reminders", action: "Deleted a reminder" },

  // Notifications
  { method: "POST", pattern: /^\/notifications\/read-all\/?$/, module: "Notifications", action: "Marked all notifications as read" },
  { method: "POST", pattern: /^\/notifications\/[^/]+\/read\/?$/, module: "Notifications", action: "Marked a notification as read" },
];

export const stripApiPrefix = (path) =>
  path.replace(/^\/api\/v\d+/, "").replace(/^\/api/, "");

/** Safe path-based projectId extraction (string projectId, not numeric task id). */
const extractProjectId = (cleanPath) => {
  const match =
    cleanPath.match(/^\/projects\/([^/]+)/) ||
    cleanPath.match(/^\/workflow\/(?:submit|approve|reject)\/([^/]+)/);
  return match ? match[1] : null;
};

/** Turn a request into { module, action, details }. */
export const humanizeRequest = ({ method, path, body }) => {
  const cleanPath = stripApiPrefix(path).replace(/\/+$/, "");
  const upperMethod = method.toUpperCase();

  const match = ROUTE_ACTIONS.find(
    (route) => route.method === upperMethod && route.pattern.test(cleanPath),
  );

  let module;
  let action;

  if (match) {
    module = match.module;
    action = match.action;
  } else {
    const segments = cleanPath.split("/").filter(Boolean);
    module = segments[0]
      ? segments[0][0].toUpperCase() + segments[0].slice(1)
      : "System";

    const verbs = { POST: "Created", PUT: "Updated", PATCH: "Updated", DELETE: "Deleted" };
    const verb = verbs[upperMethod] || upperMethod;
    const last = segments[segments.length - 1];
    const entity =
      last && /^[a-zA-Z]+$/.test(last) && !/^\d+$/.test(last) ? last : "item";
    action = `${verb} ${entity}`;
  }

  const context = {};
  for (const item of Array.isArray(body) ? body : [body]) {
    if (!item || typeof item !== "object") continue;
    for (const field of CONTEXT_FIELDS) {
      if (
        context[field] === undefined &&
        item[field] !== undefined &&
        item[field] !== null &&
        item[field] !== ""
      ) {
        context[field] = item[field];
      }
    }
  }

  const summary = Object.entries(context)
    .map(([key, value]) => `${key}="${value}"`)
    .join(", ");

  const details = JSON.stringify({
    summary,
    method: upperMethod,
    path: cleanPath,
  });

  return { module, action, details };
};

/**
 * Write one audit row. Best-effort: failures are logged to the console and
 * never allowed to break the request that triggered them.
 */
export const logAudit = async ({ req }) => {
  try {
    const { module, action, details } = humanizeRequest({
      method: req.method,
      path: req.originalUrl,
      body: req.body,
    });

    let userId = req.user?.id ?? null;

    // Login / signup / register don't run the auth middleware, so resolve the
    // actor from the submitted email instead of showing "unknown".
    if (
      !userId &&
      ["/auth/login", "/auth/signup", "/auth/register"].some((suffix) =>
        req.originalUrl.endsWith(suffix),
      )
    ) {
      const email = req.body?.email;
      if (email) {
        const user = await prisma.user.findUnique({
          where: { email: String(email).trim().toLowerCase() },
          select: { id: true },
        });
        userId = user?.id ?? null;
      }
    }

    await prisma.auditLog.create({
      data: {
        userId,
        projectId: extractProjectId(stripApiPrefix(req.originalUrl)),
        module,
        action,
        details,
      },
    });
  } catch (err) {
    console.error("AUDIT LOG ERROR:", err.message);
  }
};

/* =========================
   QUERYING
========================= */
export const getAuditLogsService = async ({
  page = 1,
  pageSize = 10,
  module,
  search,
}) => {
  const where = {};

  if (module) {
    where.module = module;
  }

  if (search) {
    where.OR = [
      { action: { contains: search, mode: "insensitive" } },
      { details: { contains: search, mode: "insensitive" } },
      { user: { fullName: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: {
          select: { id: true, fullName: true, email: true, role: true },
        },
      },
    }),
  ]);

  return { logs, total, page, pageSize };
};
