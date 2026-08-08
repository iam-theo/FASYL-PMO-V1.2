import { Router } from "express";
import { authMiddleWare } from "../../middleware/auth.middleware.js";
import { allowRoles } from "../../middleware/rbac.middleware.js";
import { ROLES } from "../../constants/roles.js";
import { uploadStageDocumentFile } from "../../config/multer.js";

import {
   getProjects,
   getProjectById,
   assignProject,
   updateProject,
   deleteProject,
   updateChecklistBulk,
   uploadStageDocument,
   deleteStageDocument,
   addProjectResource
} from "./project.controller.js";

import { uploadLimiter, writeLimiter } from "../../middleware/rateLimit.middleware.js";


const router = Router();

/* =========================================
   CREATE PROJECT
========================================= */
// /**
//  * @swagger
//  * /projects:
//  *   post:
//  *     summary: Create a new PMO project with workflow initialization
//  *     tags: [Projects]
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - name
//  *               - clientName
//  *               - industry
//  *               - productName
//  *             properties:
//  *               name:
//  *                 type: string
//  *                 example: ERP System Upgrade
//  *
//  *               clientName:
//  *                 type: string
//  *                 example: Fasyl Finance Ltd
//  *
//  *               industry:
//  *                 type: string
//  *                 example: Financial Technology
//  *
//  *               productName:
//  *                 type: string
//  *                 example: ERP Core Platform
//  *
//  *               description:
//  *                 type: string
//  *                 example: Internal ERP modernization project
//  *
//  *               projectManagerEmail:
//  *                 type: string
//  *                 format: email
//  *                 example: pm1@fasyl.com
//  *                 description: Email of assigned project manager
//  *     responses:
//  *       201:
//  *         description: Project created successfully
//  *       400:
//  *         description: Validation error
//  *       401:
//  *         description: Unauthorized
//  *       403:
//  *         description: Forbidden
//  */
// router.post(
//    "/",
//    writeLimiter,
//    authMiddleWare,
//    allowRoles(ROLES.HEADOFOPS),
//    createProject
// );

/* =========================================
   GET ALL PROJECTS
========================================= */
/**
 * @swagger
 * /projects:
 *   get:
 *     summary: Get projects (role-based filtering applied)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Projects retrieved successfully
 */
router.get(
   "/", 
   authMiddleWare, 
   allowRoles(ROLES.HEADOFOPS, ROLES.PROJECTMANAGER, ROLES.STAFF), 
   getProjects
);

/* =========================================
   ASSIGN PROJECT
========================================= */
/**
 * @swagger
 * /projects/{projectId}/assign:
 *   patch:
 *     summary: Assign a project manager to a project
 *     tags:
 *       - Projects
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *           example: 69
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectManagerEmail
 *             properties:
 *               projectManagerEmail:
 *                 type: string
 *                 format: email
 *                 example: pm1@fasyl.com
 *     responses:
 *       200:
 *         description: Project assigned successfully
 *       400:
 *         description: projectManagerEmail is required
 *       403:
 *         description: Forbidden (HEADOFOPS only)
 *       500:
 *         description: Server error
 */
router.patch(
   "/:projectId/assign/",
   authMiddleWare,
   allowRoles(ROLES.HEADOFOPS),
   assignProject
);

/* =========================================
   ADD RESOURCE TO PROJECT
========================================= */
/**
 * @swagger
 * /projects/{projectId}/resources:
 *   patch:
 *     summary: Add a resource to a project
 *     description: Adds a resource (by manual entry) to the project's resources list. Duplicate email/staffId/recordId are rejected.
 *     tags:
 *       - Projects
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *           example: 69
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: Nkechi
 *               lastName:
 *                 type: string
 *                 example: Ijoma
 *               email:
 *                 type: string
 *                 format: email
 *                 example: nkechi.ijoma@fasylng.com
 *               phoneNumber:
 *                 type: string
 *                 example: "09098983152"
 *               staffId:
 *                 type: string
 *                 example: FNG23156
 *               designation:
 *                 type: string
 *                 example: Business Analyst
 *               recordId:
 *                 type: string
 *                 description: Optional; defaults to a generated MAN-<timestamp> value
 *     responses:
 *       200:
 *         description: Resource added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: "#/components/schemas/Project"
 *       400:
 *         description: Missing first/last name or duplicate resource
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Project Manager or HEADOFOPS only)
 *       404:
 *         description: Project not found
 */
router.patch(
   "/:projectId/resources",
   authMiddleWare,
   writeLimiter,
   allowRoles(ROLES.PROJECTMANAGER, ROLES.HEADOFOPS),
   addProjectResource
);

/* =========================================
   GET SINGLE PROJECT
========================================= */

/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     summary: Get a single project
 *     tags:
 *       - Projects
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *           example: 69
 *     responses:
 *       200:
 *         description: Project fetched successfully
 *       404:
 *         description: Project not found
 *       403:
 *         description: Unauthorized
 */
router.get(
   "/:projectId",
   authMiddleWare,
   allowRoles(ROLES.HEADOFOPS, ROLES.PROJECTMANAGER),
   getProjectById
);


/* =========================================
   UPDATE PROJECT
========================================= */

/**
 * @swagger
 * /projects/{id}:
 *   put:
 *     summary: Update a project
 *     tags:
 *       - Projects
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *           example: 69
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               projectName:
 *                 type: string
 *                 example: Customer Experience Optimization
 *               clientName:
 *                 type: string
 *                 example: Velocity Telecom
 *               industry:
 *                 type: string
 *                 example: Telecommunications
 *               productName:
 *                 type: string
 *                 example: CX Analytics Platform
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Project not found
 */
router.put(
   "/:projectId",
   writeLimiter,
   authMiddleWare,
   allowRoles(ROLES.HEADOFOPS),
   updateProject
);


/* =========================================
   UPDATE CHECKLIST
========================================= */

/**
 * @swagger
 * /projects/{projectId}/stages/{stageId}/checklist:
 *   patch:
 *     summary: Update project stage checklist
 *     tags:
 *       - Projects
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *           example: 69
 *       - name: stageId
 *         in: path
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
 *               checklist:
 *                 type: array
 *                 example:
 *                   - key: client_brief
 *                     completed: true
 *                   - key: nda_signed
 *                     completed: true
 *     responses:
 *       200:
 *         description: Checklist updated successfully
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Stage not found
 */
router.patch(
   "/:projectId/stages/:stageId/checklist",
   writeLimiter,
   authMiddleWare,
   allowRoles(ROLES.PROJECTMANAGER),
   updateChecklistBulk
);


/* =========================================
   UPLOAD DOCS
========================================= */

/**
 * @swagger
 * /projects/{projectId}/stages/{stageId}/docs/{docKey}:
 *   patch:
 *     summary: Upload a stage document
 *     tags:
 *       - Projects
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *           example: 69
 *       - name: stageId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *       - name: docKey
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: nda_document
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Document uploaded successfully
 *       400:
 *         description: Invalid file
 *       403:
 *         description: Unauthorized
 */
   router.patch(
   "/:projectId/stages/:stageId/docs/:docKey",
   authMiddleWare,
   uploadLimiter,
   allowRoles(ROLES.PROJECTMANAGER),
   uploadStageDocumentFile,
   uploadStageDocument
  );

/**
 * @swagger
 * /projects/{projectId}/stages/{stageId}/docs/{docKey}:
 *   delete:
 *     summary: Delete a stage document
 *     tags:
 *       - Projects
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *           example: 69
 *       - name: stageId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *       - name: docKey
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: nda_document
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Project Manager only)
 *       404:
 *         description: Stage or document not found
 */
router.delete(
   "/:projectId/stages/:stageId/docs/:docKey",
   writeLimiter,
   authMiddleWare,
   allowRoles(ROLES.PROJECTMANAGER),
   deleteStageDocument
);
/* =========================================
   DELETE PROJECT
========================================= */

/**
 * @swagger
 * /projects/{id}:
 *   delete:
 *     summary: Delete a project
 *     tags:
 *       - Projects
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *           example: 69
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Project not found
 */
router.delete(
   "/:projectId",
   writeLimiter,
   authMiddleWare,
   allowRoles(ROLES.HEADOFOPS),
   deleteProject
);

export default router;