import express from "express";

import {
  createReminder,
  getReminders,
  getUserReminders,
  getReminder,
  updateReminder,
  completeReminder,
  dismissReminder,
  cancelReminder,
  deleteReminder,
  getMyReminders
} from "./reminder.controller.js";
import { authMiddleWare } from "../../middleware/auth.middleware.js";
// import { allowRoles } from "../../middleware/rbac.middleware.js";
// import { ROLES } from "../../constants/roles.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reminders
 *   description: Task and milestone reminders
 */

/**
 * @swagger
 * /reminders:
 *   post:
 *     summary: Create a reminder
 *     description: Creates a reminder for a user, project, task and/or stage.
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *               projectId:
 *                 type: string
 *               taskId:
 *                 type: integer
 *               stageId:
 *                 type: integer
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [GENERAL, TASK_DUE, PROJECT_DUE, STAGE_DUE, APPROVAL, REVIEW, MEETING, FOLLOW_UP]
 *                 default: GENERAL
 *               remindAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Reminder created successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Create reminder
router.post(
  "/", 
  authMiddleWare,
  createReminder
);

/**
 * @swagger
 * /reminders/my:
 *   get:
 *     summary: Get my reminders
 *     description: Returns the current user's reminders.
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: My reminders
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  "/my",
  authMiddleWare,
  getMyReminders
);

/**
 * @swagger
 * /reminders:
 *   get:
 *     summary: Get all reminders
 *     description: Returns all reminders with related user, project, task and stage details, ordered by remindAt.
 *     tags: [Reminders]
 *     responses:
 *       200:
 *         description: List of reminders
 *       500:
 *         description: Server error
 */
// Get all reminders
router.get("/", getReminders);

/**
 * @swagger
 * /reminders/user/{userId}:
 *   get:
 *     summary: Get reminders for a user
 *     description: Returns all reminders belonging to the given user id.
 *     tags: [Reminders]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: User's reminders
 *       500:
 *         description: Server error
 */
// Get reminders for a specific user
router.get("/user/:userId", getUserReminders);

/**
 * @swagger
 * /reminders/{id}:
 *   get:
 *     summary: Get a single reminder
 *     tags: [Reminders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Reminder details
 *       404:
 *         description: Reminder not found
 *       500:
 *         description: Server error
 */
// Get single reminder
router.get("/:id", getReminder);

/**
 * @swagger
 * /reminders/{id}:
 *   patch:
 *     summary: Update a reminder
 *     tags: [Reminders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [GENERAL, TASK_DUE, PROJECT_DUE, STAGE_DUE, APPROVAL, REVIEW, MEETING, FOLLOW_UP]
 *               status:
 *                 type: string
 *                 enum: [PENDING, SENT, DISMISSED, COMPLETED, CANCELLED]
 *               remindAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Reminder updated successfully
 *       404:
 *         description: Reminder not found
 *       500:
 *         description: Server error
 */
// Update reminder
router.patch("/:id", updateReminder);

/**
 * @swagger
 * /reminders/{id}/complete:
 *   post:
 *     summary: Complete a reminder
 *     tags: [Reminders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Reminder completed successfully
 *       500:
 *         description: Server error
 */
// Complete reminder
router.post("/:id/complete", completeReminder);

/**
 * @swagger
 * /reminders/{id}/dismiss:
 *   post:
 *     summary: Dismiss a reminder
 *     tags: [Reminders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Reminder dismissed successfully
 *       500:
 *         description: Server error
 */
// Dismiss reminder
router.post("/:id/dismiss", dismissReminder);

/**
 * @swagger
 * /reminders/{id}/cancel:
 *   post:
 *     summary: Cancel a reminder
 *     tags: [Reminders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Reminder cancelled successfully
 *       500:
 *         description: Server error
 */
// Cancel reminder
router.post("/:id/cancel", cancelReminder);

/**
 * @swagger
 * /reminders/{id}:
 *   delete:
 *     summary: Delete a reminder
 *     tags: [Reminders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Reminder deleted successfully
 *       404:
 *         description: Reminder not found
 *       500:
 *         description: Server error
 */
// Delete reminder
router.delete("/:id", deleteReminder);

export default router;