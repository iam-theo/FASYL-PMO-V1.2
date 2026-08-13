import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import { ROLES } from "../../constants/roles.js";
import { signAccessToken, signRefreshToken } from "../../utils/jwt.js";

const prisma = new PrismaClient();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MIN_PASSWORD_LENGTH = 6;

/* =========================
   SIGNUP (TEST ACCOUNTS)
========================= */
export const signupUser = async ({ fullName, email, password, role }) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedRole = String(role || "").toUpperCase();

  if (!fullName || !normalizedEmail || !password) {
    throw new Error("Full name, email and password are required");
  }

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw new Error("Please enter a valid email address");
  }

  if (
    normalizedRole !== ROLES.PROJECTMANAGER &&
    normalizedRole !== ROLES.STAFF
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

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      fullName: String(fullName).trim(),
      email: normalizedEmail,
      password: passwordHash,
      role: ROLES[normalizedRole],
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
        role: ROLES[data.role] || ROLES.STAFF,
      },
    });

    const { password, ...safeUser } = user;
    return safeUser;
  } catch (err) {
    console.error("PRISMA CREATE ERROR:", err)
  }
};

/* =========================
   LOGIN (WITH ACCOUNT LOCKOUT)
========================= */

const MAX_LOGIN_ATTEMPTS = Number(process.env.MAX_LOGIN_ATTEMPTS || 5);
const LOGIN_LOCKOUT_MINUTES = Number(process.env.LOGIN_LOCKOUT_MINUTES || 15);

/** Throws an Error carrying an HTTP status so controllers can map it. */
const loginError = (message, status) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

export const loginUser = async (email, password) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) throw loginError("User not found", 401);

  // Removed (soft-deleted) accounts can no longer sign in.
  if (user.deletedAt) {
    throw loginError("This account has been deactivated", 403);
  }

  // Reject attempts while the account is locked.
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutes = Math.max(
      1,
      Math.ceil((user.lockedUntil - Date.now()) / 60000),
    );

    throw loginError(
      `Account temporarily locked. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
      429,
    );
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    const attempts = (user.failedLoginAttempts || 0) + 1;

    // Lock the account once the threshold is crossed and restart the counter
    // so the user gets a fresh set of tries after the lockout window.
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: new Date(
            Date.now() + LOGIN_LOCKOUT_MINUTES * 60 * 1000,
          ),
        },
      });

      throw loginError(
        `Too many failed attempts. Account locked for ${LOGIN_LOCKOUT_MINUTES} minutes.`,
        429,
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: attempts },
    });

    throw loginError("Invalid credentials", 401);
  }

  // Success — clear any lockout state from previous failures.
  if (user.failedLoginAttempts || user.lockedUntil) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }

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
      deletedAt: null,
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

// GET STAFF USERS

export const getStaffService = async () => {
  return await prisma.user.findMany({
    where: {
      role: "STAFF",
      deletedAt: null,
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

/* =========================
   XNETT EMPLOYEE DIRECTORY
========================= */

/**
 * Fetches the staff directory from the XNETT API and normalizes it for the
 * resource / user-management forms. Only ACTIVE employees are returned so the
 * dropdowns never offer departed staff. The API key stays on the server — the
 * browser only ever talks to this endpoint.
 */
export const getXnetEmployeesService = async () => {
  const baseUrl = process.env.XNETT_API_BASE_URL;
  const apiKey = process.env.SALES_PORTAL_API_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error(
      "XNETT API is not configured (XNETT_API_BASE_URL / SALES_PORTAL_API_KEY)",
    );
  }

  const response = await axios.get(`${baseUrl}/api/v1/employee/all`, {
    headers: { "x-api-key": apiKey },
    timeout: 15000,
  });

  const employees =
    response.data?.data ??
    (Array.isArray(response.data) ? response.data : null);

  if (!Array.isArray(employees)) {
    throw new Error("Invalid XNETT employee response");
  }

  return employees
    .filter((emp) => String(emp.status || "").toUpperCase() === "ACTIVE")
    .map((emp) => ({
      id: emp.id,
      recordId: emp.recordId,
      staffId: emp.staffId,
      firstName: emp.firstName,
      lastName: emp.lastName,
      middleName: emp.middleName,
      fullName: [emp.firstName, emp.middleName, emp.lastName]
        .filter(Boolean)
        .join(" "),
      email: emp.email,
      phoneNumber: emp.phoneNumber,
      designation: emp.designation?.designation || null,
      designationId: emp.designation?.designationId || null,
      department: emp.department?.name || null,
      unit: emp.unit?.unitName || null,
      location: emp.location?.cityName || null,
      status: emp.status,
    }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
};

/* =========================
   CREATE USER ACCOUNT (PM/STAFF)
   Used by User Management (PROJECTMANAGER) and the Add Resource flow
   (STAFF). Accounts created with a default password are flagged so the
   first login forces a password change.
========================= */
export const createUserAccountService = async ({
  fullName,
  email,
  password,
  role,
}) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedRole = String(role || ROLES.STAFF).toUpperCase();

  if (!fullName || !normalizedEmail || !password) {
    throw new Error("Full name, email and password are required");
  }

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw new Error("Please enter a valid email address");
  }

  if (String(password).length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    );
  }

  if (
    normalizedRole !== ROLES.PROJECTMANAGER &&
    normalizedRole !== ROLES.STAFF
  ) {
    throw new Error("Role must be PROJECTMANAGER or STAFF");
  }

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing && !existing.deletedAt) {
    throw new Error("An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const accountData = {
    fullName: String(fullName).trim(),
    email: normalizedEmail,
    password: passwordHash,
    role: normalizedRole,
    mustChangePassword: true,
    failedLoginAttempts: 0,
    lockedUntil: null,
  };

  // A previously removed account frees its email — resurrect the row with the
  // new credentials so the record keeps its history.
  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: { ...accountData, deletedAt: null },
      })
    : await prisma.user.create({ data: accountData });

  const { password: _, ...safeUser } = user;

  return safeUser;
};

/* =========================
   CHANGE PASSWORD (LOGGED IN)
========================= */
export const changePasswordService = async (
  userId,
  currentPassword,
  newPassword,
) => {
  if (!userId) throw new Error("User not found");
  if (!currentPassword || !newPassword) {
    throw new Error("Current and new password are required");
  }

  if (String(newPassword).length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
  });

  if (!user) throw new Error("User not found");

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw new Error("Current password is incorrect");

  if (currentPassword === newPassword) {
    throw new Error("New password must be different from the current password");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      password: passwordHash,
      mustChangePassword: false,
    },
  });

  const { password: _, ...safeUser } = updated;

  return safeUser;
};

/* =========================
   FORGOT PASSWORD (RESET LINK)
   A short-lived signed token is emailed to the user. No DB table needed;
   the JWT carries the user id and expires in 30 minutes.
========================= */
export const forgotPasswordService = async (email) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true, fullName: true },
  });

  // Never reveal whether an account exists.
  if (!user) return { sent: false };

  const token = jwt.sign(
    { userId: user.id, purpose: "password-reset" },
    process.env.JWT_SECRET,
    {
      expiresIn: "30m",
      issuer: "fasyl-pmo",
      audience: "fasyl-password-reset",
    },
  );

  return { sent: true, token, user };
};

/* =========================
   REMOVE USER (SOFT DELETE)
   PM/STAFF accounts are deactivated, not hard-deleted: the row stays so
   historical projects/tasks/audit trail keep their references, but the
   account can no longer sign in and disappears from every list. Existing
   sessions die by revoking their refresh tokens.
========================= */
export const removeUserService = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
  });

  if (!user) throw new Error("User not found");

  if (user.role !== ROLES.PROJECTMANAGER && user.role !== ROLES.STAFF) {
    throw new Error(
      "Only Project Manager and Staff accounts can be removed",
    );
  }

  if (user.deletedAt) {
    throw new Error("This account has already been removed");
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      deletedAt: new Date(),
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  // Kill any live sessions so a removed account is signed out everywhere.
  await prisma.refreshToken.deleteMany({
    where: { userId: user.id },
  });

  const { password: _, ...safeUser } = updated;

  return safeUser;
};

/* =========================
   RESEND CREDENTIALS
   Plaintext passwords are never stored (only bcrypt hashes), so a resend
   rotates the account to a freshly generated temporary password and emails
   it. Keeps mustChangePassword=true so the first login still forces a change.
========================= */
const generateTemporaryPassword = () =>
  crypto.randomBytes(9).toString("base64url").slice(0, 12);

export const resendCredentialsService = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
  });

  if (!user) throw new Error("User not found");

  if (user.role !== ROLES.PROJECTMANAGER && user.role !== ROLES.STAFF) {
    throw new Error(
      "Credentials can only be resent for Project Manager and Staff accounts",
    );
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      password: passwordHash,
      mustChangePassword: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  const { password: _, ...safeUser } = updated;

  return { user: safeUser, temporaryPassword };
};

export const resetPasswordService = async (token, newPassword) => {
  if (!token || !newPassword) {
    throw new Error("Token and new password are required");
  }

  if (String(newPassword).length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    );
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: "fasyl-pmo",
      audience: "fasyl-password-reset",
    });
  } catch {
    throw new Error("Reset link is invalid or has expired");
  }

  if (decoded?.purpose !== "password-reset" || !decoded?.userId) {
    throw new Error("Reset link is invalid or has expired");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  const user = await prisma.user.update({
    where: { id: Number(decoded.userId) },
    data: {
      password: passwordHash,
      mustChangePassword: false,
    },
  });

  const { password: _, ...safeUser } = user;

  return safeUser;
};