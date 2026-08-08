import express from "express";
import { authMiddleWare } from "../../middleware/auth.middleware.js";

import {
  submitStage,
  approveStage,
  rejectStage,
  getStageState
} from "./workflow.controller.js";

const router = express.Router();

/* =========================================
    WORKFLOW ROUTES (SWAGGER)
========================================= */

/**
 * @swagger
 * /workflow/submit/{projectId}/{stageOrder}:
 *   post:
 *     summary: Submit a project stage for approval
 *     tags:
 *       - Workflow
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *           example: 69
 *         description: Project ID
 *       - in: path
 *         name: stageOrder
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Workflow stage order
 *     responses:
 *       200:
 *         description: Stage submitted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not allowed to submit this stage
 */
router.post(
  "/submit/:projectId/:stageOrder",
  authMiddleWare,
  submitStage
);



/**
 * @swagger
 * /workflow/approve/{projectId}/{stageOrder}:
 *   post:
 *     summary: Approve a workflow stage
 *     tags:
 *       - Workflow
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *           example: 69
 *         description: Project ID
 *       - in: path
 *         name: stageOrder
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Workflow stage order
 *     responses:
 *       200:
 *         description: Stage approved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient role)
 *       404:
 *         description: Stage not found
 */
router.post(
  "/approve/:projectId/:stageOrder",
  authMiddleWare,
  approveStage
);



/**
 * @swagger
 * /workflow/reject/{projectId}/{stageOrder}:
 *   post:
 *     summary: Reject a workflow stage
 *     tags:
 *       - Workflow
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *           example: 69
 *         description: Project ID
 *       - in: path
 *         name: stageOrder
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Workflow stage order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Missing financial approval
 *     responses:
 *       200:
 *         description: Stage rejected successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Approval record not found
 */
router.post(
  "/reject/:projectId/:stageOrder",
  authMiddleWare,
  rejectStage
);



/**
 * @swagger
 * /workflow/{projectId}/stage/{stageOrder}:
 *   get:
 *     summary: Get workflow stage state
 *     tags:
 *       - Workflow
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *           example: 69
 *         description: Project ID
 *       - in: path
 *         name: stageOrder
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Workflow stage order
 *     responses:
 *       200:
 *         description: Workflow stage retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Project or stage not found
 */
router.get(
  "/:projectId/stage/:stageOrder",
  authMiddleWare,
  getStageState
);


export default router;