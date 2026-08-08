import jwt from "jsonwebtoken";

export const authMiddleWare = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authorization token missing or malformed",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({
        message: "Invalid token",
      });
    }

    // ✅ NORMALIZED USER OBJECT (VERY IMPORTANT)
    req.user = {
      id: decoded.userId || decoded.id || decoded.sub || null,
      email: decoded.email || null,
      role: decoded.role || null,
    };

    if (!req.user.id || !req.user.role) {
      return res.status(401).json({
        message: "Invalid token payload (missing user identity)",
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({
      message: "Unauthorized: token expired or invalid",
      error: err.message,
    });
  }
};