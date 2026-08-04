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
import { ROLES } from "../../constants/roles.js";

const router = express.Router();

router.post(
    "/", 
    authMiddleWare,
    allowRoles(ROLES.HEADOFOPS, ROLES.PROJECTMANAGER),
    createTask
);

router.get(
    "/project/:projectId/stage/:stageOrder", 
    authMiddleWare,
    allowRoles(ROLES.HEADOFOPS, ROLES.PROJECTMANAGER, ROLES.STAFF),
    getTasks
);

// Must be declared before "/:id" or "my-count" would be parsed as an id.
router.get(
    "/my-count",
    authMiddleWare,
    allowRoles(ROLES.HEADOFOPS, ROLES.PROJECTMANAGER, ROLES.STAFF),
    getAssignedTaskCount
);

router.get("/:id", getTask);

router.patch(
    "/:id", 
    authMiddleWare,
    allowRoles(ROLES.HEADOFOPS, ROLES.PROJECTMANAGER, ROLES.STAFF),
    updateTask
);

router.delete(
    "/:id", 
    authMiddleWare,
    allowRoles(ROLES.HEADOFOPS, ROLES.PROJECTMANAGER),
    deleteTask
);

export default router;