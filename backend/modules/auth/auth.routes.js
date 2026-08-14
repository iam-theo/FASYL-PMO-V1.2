import { Router } from "express";
import {
  register,
  login,
  refresh,
  logout,
  getProjectManagers,
  getStaff,
  signup,
  getXnetEmployees,
  createUserAccount,
  changePassword,
  forgotPassword,
  resetPassword,
  resendCredentials,
  removeUser,
} from "./auth.controller.js";

import { authMiddleWare } from "../../middleware/auth.middleware.js";
import { allowRoles } from "../../middleware/rbac.middleware.js";
import { ROLES } from "../../constants/roles.js";

import {
  loginLimiter,
  registerLimiter,
  refreshLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  writeLimiter,
  authSlowDown,
} from "../../middleware/rateLimit.middleware.js";

const router = Router();

/* =========================
    AUTH ROUTES (SWAGGER)
========================= */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - password
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: strongpassword123
 *               role:
 *                 type: string
 *                 enum:
 *                   - HEADOFOPS
 *                   - PROJECTMANAGER
 *                   - STAFF
 *                 example: HEADOFOPS
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 */
router.post(
  "/register",
  registerLimiter,
  authSlowDown,
  register
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user and return tokens
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: strongpassword123
 *     responses:
 *       200:
 *         description: Login successful (JWT returned)
 *       401:
 *         description: Invalid credentials
 */
router.post(
  "/login",
  loginLimiter,
  authSlowDown,
  login
);

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Create a Project Manager or Staff test account directly
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - password
 *               - role
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Test Project Manager
 *               email:
 *                 type: string
 *                 example: pm-test@example.com
 *               password:
 *                 type: string
 *                 example: strongpassword123
 *               role:
 *                 type: string
 *                 enum:
 *                   - PROJECTMANAGER
 *                   - STAFF
 *     responses:
 *       201:
 *         description: Account created and signed in
 *       400:
 *         description: Validation error
 */
router.post(
  "/signup",
  registerLimiter,
  authSlowDown,
  signup
);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Unauthorized or expired token
 */
router.post(
  "/refresh",
  refreshLimiter,
  refresh
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user and invalidate session
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post("/logout", logout);

/**
 * @swagger
 * /auth/project-managers:
 *   get:
 *     summary: Get all project managers
 *     description: Returns all users with the PROJECTMANAGER role, used to populate assignment dropdowns.
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Project managers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       fullName:
 *                         type: string
 *                       email:
 *                         type: string
 *                       role:
 *                         type: string
 *                         example: PROJECTMANAGER
 *       500:
 *         description: Server error
 */
router.get(
  "/project-managers",
  getProjectManagers
);

/**
 * @swagger
 * /auth/staff:
 *   get:
 *     summary: Get all staff users
 *     description: Returns all users with the STAFF role, used to populate the resource selection dropdown.
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Staff retrieved successfully
 *       500:
 *         description: Server error
 */
router.get(
  "/staff",
  getStaff
);

/**
 * @swagger
 * /auth/employees:
 *   get:
 *     summary: Get the XNETT employee directory
 *     description: Returns ACTIVE employees from the XNETT staff directory, used to populate the Add Resource and User Management forms.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employees retrieved successfully
 *       502:
 *         description: XNETT API unavailable
 */
router.get(
  "/employees",
  authMiddleWare,
  allowRoles(ROLES.PROJECTMANAGER, ROLES.HEADOFOPS),
  getXnetEmployees
);

/**
 * @swagger
 * /auth/users:
 *   post:
 *     summary: Create a user account (PM/STAFF) with a default password
 *     description: Creates an account flagged for a mandatory first-login password change and emails the default password to the new user. Head of Operations only.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - password
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [PROJECTMANAGER, STAFF]
 *                 default: STAFF
 *     responses:
 *       201:
 *         description: Account created
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 */
router.post(
  "/users",
  authMiddleWare,
  registerLimiter,
  authSlowDown,
  allowRoles(ROLES.HEADOFOPS),
  createUserAccount
);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change the current user's password
 *     description: Verifies the current password, sets the new one and clears the first-login change flag.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed
 *       400:
 *         description: Validation error
 */
router.post(
  "/change-password",
  authMiddleWare,
  loginLimiter,
  changePassword
);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password reset link
 *     description: Emails a short-lived reset link if the account exists. Always responds the same way to avoid leaking account existence.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset link sent (if the account exists)
 */
router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  authSlowDown,
  forgotPassword
);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Set a new password from a reset link
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset
 *       400:
 *         description: Invalid or expired token
 */
router.post(
  "/reset-password",
  resetPasswordLimiter,
  resetPassword
);

/**
 * @swagger
 * /auth/users/{userId}/resend-credentials:
 *   post:
 *     summary: Resend credentials for a PM/STAFF account
 *     description: Generates a fresh temporary password, rotates the account to it, and emails the account-created message with the new password. Head of Operations only.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Credentials resent
 *       400:
 *         description: User not found or not a PM/STAFF account
 *       403:
 *         description: Forbidden
 */
router.post(
  "/users/:userId/resend-credentials",
  authMiddleWare,
  writeLimiter,
  allowRoles(ROLES.HEADOFOPS),
  resendCredentials
);

/**
 * @swagger
 * /auth/users/{userId}:
 *   delete:
 *     summary: Remove a PM/STAFF account (soft delete)
 *     description: Deactivates a Project Manager or Staff account. It can no longer sign in and disappears from all lists; historical references remain intact. Head of Operations only.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Account removed
 *       400:
 *         description: User not found, already removed, or not PM/STAFF
 *       403:
 *         description: Forbidden
 */
router.delete(
  "/users/:userId",
  authMiddleWare,
  writeLimiter,
  allowRoles(ROLES.HEADOFOPS),
  removeUser
);

export default router;