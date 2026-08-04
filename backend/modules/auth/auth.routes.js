import { Router } from "express";
import {
  register,
  login,
  refresh,
  logout,
  getProjectManagers
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

router.get(
  "/project-managers",
  getProjectManagers
);

export default router;