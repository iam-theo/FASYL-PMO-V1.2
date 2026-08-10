import {
  logAudit,
  humanizeRequest,
  extractProjectId,
  stripApiPrefix,
} from "./audit.service.js";
import { broadcast } from "../realtime/realtime.service.js";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Noisy / non-action endpoints we don't want in the trail.
const SKIP_AUDIT = [/^\/api.*\/auth\/refresh/];

/**
 * Request-level audit logging. Wraps every mutating /api request and, once
 * the response has finished, records the action in the AuditLog table. It is
 * mounted before the route handlers, so it picks up `req.user` set by the
 * route's auth middleware.
 */
export const auditMiddleware = (req, res, next) => {
  const method = req.method.toUpperCase();

  if (!MUTATING_METHODS.has(method)) return next();

  const url = req.originalUrl;
  if (!url.startsWith("/api")) return next();
  if (SKIP_AUDIT.some((pattern) => pattern.test(url))) return next();

  res.on("finish", () => {
    // Only successful actions are worth an audit trail.
    if (res.statusCode < 200 || res.statusCode >= 400) return;

    const { module, action } = humanizeRequest({
      method: req.method,
      path: req.originalUrl,
      body: req.body,
    });

    logAudit({ req });

    // Push a generic data-changed event so every connected client can refresh
    // the affected module. Auth churn (logins/signups) is skipped so a login
    // never triggers a project-wide refetch.
    if (module !== "Auth") {
      broadcast("data:changed", {
        module,
        action,
        projectId: extractProjectId(stripApiPrefix(req.originalUrl)),
      });
    }
  });

  next();
};
