import jwt from "jsonwebtoken";

/* =========================
   ACCESS TOKEN (SHORT-LIVED)
========================= */
export const signAccessToken = (user) => {
  if (!user) throw new Error("User is required to sign token");

  return jwt.sign(
    {
      userId: user.id,
      email: user.email,   // 
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "30m",
      issuer: "fasyl-pmo",
      audience: "fasyl-users",
    }
  );
};

/* =========================
   REFRESH TOKEN (LONG-LIVED)
========================= */
export const signRefreshToken = (user) => {
  if (!user) throw new Error("User is required to sign token");

  return jwt.sign(
    {
      userId: user.id,
      // optional but useful for security debugging
      tokenVersion: user.tokenVersion || 1,
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
      issuer: "fasyl-pmo",
      audience: "fasyl-refresh",
    }
  );
};