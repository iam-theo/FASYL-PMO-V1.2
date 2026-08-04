export const allowRoles = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      const { role } = req.user || {};

      if (!role) {
        return res.status(401).json({
          message: "Unauthorized: missing role",
        });
      }

      // ✅ optional: system admin override (future-proof)
      const isAdmin = role === "ADMIN";

      if (!allowedRoles.includes(role) && !isAdmin) {
        return res.status(403).json({
          message: "Forbidden: insufficient permissions",
          userRole: role,
          requiredRoles: allowedRoles,
        });
      }

      next();
    } catch (err) {
      return res.status(500).json({
        message: "RBAC middleware failure",
        error: err.message,
      });
    }
  };
};