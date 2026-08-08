import { Router } from "express";
import {
  register,
  login,
  refresh,
  logout,
  getProjectManagers,
  requestSignupOtp,
  verifySignupOtp
} from "./auth.controller.js";

import {
  loginLimiter,
  registerLimiter,
  refreshLimiter,
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
 * /auth/signup/request-otp:
 *   post:
 *     summary: Request an OTP to create a Project Manager or Staff test account
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
 *       200:
 *         description: Verification code sent to the email address
 *       400:
 *         description: Validation error
 */
router.post(
  "/signup/request-otp",
  registerLimiter,
  authSlowDown,
  requestSignupOtp
);

/**
 * @swagger
 * /auth/signup/verify-otp:
 *   post:
 *     summary: Verify the OTP and create the account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 example: pm-test@example.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       201:
 *         description: Account created and signed in
 *       400:
 *         description: Invalid or expired code
 */
router.post(
  "/signup/verify-otp",
  registerLimiter,
  authSlowDown,
  verifySignupOtp
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

export default router;