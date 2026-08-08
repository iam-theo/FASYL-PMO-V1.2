import express from "express";

import {
    createTask,
    getTasks,
    getTask,
    getAssignedTaskCount,
    updateTask,
    deleteTask
} from "./tasks.controller.js";
import { authMiddleWare } from "../../middleware/auth.middleware.js";
import { allowRoles } from "../../middleware/rbac.middleware.js";
import { uploadLimiter } from "../../middleware/rateLimit.middleware.js";
import { uploadTaskDocumentFile } from "../../config/multer.js";
import { ROLES } from "../../constants/roles.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task management inside project stages
 */

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create a task
 *     description: Creates a task on a project stage and assigns it to a project resource. Project Managers only. Accepts an optional multipart file upload (field name `file`).
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *               - title
 *             properties:
 *               projectId:
 *                 type: string
 *                 description: The project's string projectId (e.g. PROJ-731443)
 *                 example: PROJ-731443
 *               stageOrder:
 *                 type: integer
 *                 description: Optional stage order the task belongs to
 *                 example: 1
 *               title:
 *                 type: string
 *                 example: Prepare migration runbook
 *               description:
 *                 type: string
 *               assignedResourceId:
 *                 type: string
 *                 description: recordId of the assigned project resource
 *                 example: EMP-419102
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *                 default: MEDIUM
 *               startDate:
 *                 type: string
 *                 format: date
 *               dueDate:
 *                 type: string
 *                 format: date
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Optional task document (SVG, JPG, or PDF, max 5MB)
 *     responses:
 *       201:
 *         description: Task created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Project Manager only)
 *       500:
 *         description: Server error
 */
router.post(
    "/", 
    authMiddleWare,
    allowRoles(ROLES.PROJECTMANAGER),
    uploadLimiter,
    uploadTaskDocumentFile,
    createTask
);

/**
 * @swagger
 * /tasks/project/{projectId}/stage/{stageOrder}:
 *   get:
 *     summary: Get tasks for a project stage
 *     description: Returns tasks for the given project string projectId and numeric stage order.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           example: PROJ-731443
 *       - in: path
 *         name: stageOrder
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
    "/project/:projectId/stage/:stageOrder", 
    authMiddleWare,
    allowRoles(ROLES.HEADOFOPS, ROLES.PROJECTMANAGER, ROLES.STAFF),
    getTasks
);

/**
 * @swagger
 * /tasks/my-count:
 *   get:
 *     summary: Get assigned task count
 *     description: Returns the count of tasks assigned to the current user, scoped by role.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Assigned task count retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Must be declared before "/:id" or "my-count" would be parsed as an id.
router.get(
    "/my-count",
    authMiddleWare,
    allowRoles(ROLES.HEADOFOPS, ROLES.PROJECTMANAGER, ROLES.STAFF),
    getAssignedTaskCount
);

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Get a single task
 *     description: Retrieves a task by id with its project, stage and assignee details.
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Task details
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.get("/:id", getTask);

/**
 * @swagger
 * /tasks/{id}:
 *   patch:
 *     summary: Update a task
 *     description: Updates task details. Project Managers update any task; Staff may only update the status of their own tasks; HEADOFOPS is blocked.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
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
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [TODO, IN_PROGRESS, IN_REVIEW, BLOCKED, DONE, CANCELLED]
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *               assignedResourceId:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               dueDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (HEADOFOPS cannot update tasks)
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.patch(
    "/:id", 
    authMiddleWare,
    allowRoles(ROLES.PROJECTMANAGER, ROLES.STAFF),
    updateTask
);

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     description: Deletes a task by id. Project Managers only.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Project Manager only)
 *       500:
 *         description: Server error
 */
router.delete(
    "/:id", 
    authMiddleWare,
    allowRoles(ROLES.PROJECTMANAGER),
    deleteTask
);

export default router;