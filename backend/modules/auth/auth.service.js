import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";
import { signAccessToken, signRefreshToken } from "../../utils/jwt.js";

const prisma = new PrismaClient();

/* =========================
   REGISTER
========================= */
export const registerUser = async (data) => {
  try {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        password: hashedPassword,
        role: Role[data.role] || Role.STAFF,
      },
    });

    const { password, ...safeUser } = user;
    return safeUser;
  } catch (err) {
    console.error("PRISMA CREATE ERROR:", err)
  }
};

/* =========================
   LOGIN
========================= */
export const loginUser = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new Error("User not found");

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error("Invalid credentials");

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const { password: _, ...safeUser } = user;

  return {
    user: safeUser,
    accessToken,
    refreshToken,
  };
};

/* =========================
   REFRESH TOKEN
========================= */
export const refreshTokenService = async (token) => {
  const stored = await prisma.refreshToken.findUnique({
    where: { token },
  });

  if (!stored) throw new Error("Invalid refresh token");

  const user = await prisma.user.findUnique({
    where: { id: stored.userId },
  });

  if (!user) throw new Error("User no longer exists");

  const newAccessToken = signAccessToken(user);

  return { accessToken: newAccessToken };
};

/* =========================
   LOGOUT
========================= */
export const logoutUser = async (token) => {
  if (!token) return;

  await prisma.refreshToken.delete({
    where: { token },
  });
};

// GET PROJECTMANAGERS

export const getProjectManagersService = async () => {
  return await prisma.user.findMany({
    where: {
      role: "PROJECTMANAGER",
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: {
      fullName: "asc",
    },
  });
};