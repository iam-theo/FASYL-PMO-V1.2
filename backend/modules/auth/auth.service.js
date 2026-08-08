import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";
import { PrismaClient, Role } from "@prisma/client";
import { signAccessToken, signRefreshToken } from "../../utils/jwt.js";
import { sendEmail } from "../../utils/email.service.js";

const prisma = new PrismaClient();

/* =========================
   OTP SIGNUP (TEST ACCOUNTS)
========================= */
const OTP_TTL_MS = 10 * 60 * 1000;
const pendingSignups = new Map();

const generateOtp = () => String(randomInt(100000, 1000000));

const buildOtpEmail = (otp) => `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f4f5f7;padding:24px">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px">
      <h2 style="margin:0 0 12px;color:#1B3C4A">FASYL PMO — Signup Verification</h2>
      <p style="color:#333;font-size:15px;line-height:1.6">
        Use the code below to complete your Project Manager / Staff test account signup.
        It expires in 10 minutes.
      </p>
      <div style="background:#F3F3F3;border-radius:8px;padding:16px;text-align:center;font-size:28px;font-weight:700;letter-spacing:6px;color:#1B3C4A">${otp}</div>
      <p style="color:#667085;font-size:13px;line-height:1.5;margin-top:16px">
        This email address will also receive task and project notification test emails.
      </p>
    </div>
  </div>
`;

export const requestSignupOtpService = async ({
  fullName,
  email,
  password,
  role,
}) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedRole = String(role || "").toUpperCase();

  if (!fullName || !normalizedEmail || !password) {
    throw new Error("Full name, email and password are required");
  }

  if (
    normalizedRole !== Role.PROJECTMANAGER &&
    normalizedRole !== Role.STAFF
  ) {
    throw new Error(
      "Signup is only available for Project Manager and Staff test accounts",
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    throw new Error("An account with this email already exists");
  }

  const otp = generateOtp();
  const passwordHash = await bcrypt.hash(password, 10);

  pendingSignups.set(normalizedEmail, {
    fullName: String(fullName).trim(),
    email: normalizedEmail,
    passwordHash,
    role: normalizedRole,
    otp,
    expiresAt: Date.now() + OTP_TTL_MS,
  });

  await sendEmail({
    to: normalizedEmail,
    subject: "[FASYL PMO] Your signup verification code",
    text: `Your FASYL PMO signup verification code is ${otp}. It expires in 10 minutes.`,
    html: buildOtpEmail(otp),
  });

  return { message: "Verification code sent to your email" };
};

export const verifySignupOtpService = async ({ email, otp }) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const pending = pendingSignups.get(normalizedEmail);

  if (!pending) {
    throw new Error("No pending signup found. Please request a code first");
  }

  if (Date.now() > pending.expiresAt) {
    pendingSignups.delete(normalizedEmail);
    throw new Error("Verification code has expired. Please request a new one");
  }

  if (String(otp || "").trim() !== pending.otp) {
    throw new Error("Invalid verification code");
  }

  pendingSignups.delete(normalizedEmail);

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    throw new Error("An account with this email already exists");
  }

  const user = await prisma.user.create({
    data: {
      fullName: pending.fullName,
      email: normalizedEmail,
      password: pending.passwordHash,
      role: Role[pending.role],
    },
  });

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

  return { user: safeUser, accessToken, refreshToken };
};

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