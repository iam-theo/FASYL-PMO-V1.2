import express from "express";

import {
  createReport,
  getReports,
  getReport,
  updateReport,
  deleteReport,
} from "./report.controller.js";
import { authMiddleWare } from "../../middleware/auth.middleware.js";
import { allowRoles } from "../../middleware/rbac.middleware.js";
import { ROLES } from "../../constants/roles.js";
import { writeLimiter } from "../../middleware/rateLimit.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Project report management and analytics
 */

/**
 * @swagger
 * /reports:
 *   post:
 *     summary: Generate a new report
 *     description: Creates a generated project analytics report.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/CreateReportRequest"
 *     responses:
 *       201:
 *         description: Report generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Report"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — the user does not manage the project
 *       404:
 *         description: Project or stage not found
 *       500:
 *         description: Server error
 */
router.post("/", writeLimiter, authMiddleWare, allowRoles(ROLES.HEADOFOPS, ROLES.PROJECTMANAGER), createReport);

/**
 * @swagger
 * /reports:
 *   get:
 *     summary: Get all reports
 *     description: Retrieves all reports the caller may see, scoped by role.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of reports
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Report"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get("/", authMiddleWare, allowRoles(ROLES.HEADOFOPS, ROLES.PROJECTMANAGER), getReports);

/**
 * @swagger
 * /reports/{id}:
 *   get:
 *     summary: Get a single report
 *     description: Retrieves a report by ID.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Report details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Report"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Report not found
 *       500:
 *         description: Server error
 */
router.get("/:id", authMiddleWare, allowRoles(ROLES.HEADOFOPS, ROLES.PROJECTMANAGER), getReport);

/**
 * @swagger
 * /reports/{id}:
 *   patch:
 *     summary: Update a report
 *     description: Updates report metadata or content.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/UpdateReportRequest"
 *     responses:
 *       200:
 *         description: Report updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Report"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — the user does not manage the project
 *       404:
 *         description: Report not found
 *       500:
 *         description: Server error
 */
router.patch("/:id", writeLimiter, authMiddleWare, allowRoles(ROLES.HEADOFOPS, ROLES.PROJECTMANAGER), updateReport);

/**
 * @swagger
 * /reports/{id}:
 *   delete:
 *     summary: Delete a report
 *     description: Deletes a generated report.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Report deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — the user does not manage the project
 *       404:
 *         description: Report not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", writeLimiter, authMiddleWare, allowRoles(ROLES.HEADOFOPS, ROLES.PROJECTMANAGER), deleteReport);

export default router;
