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

// Create reminder
router.post(
  "/", 
  authMiddleWare,
  createReminder
);

router.get(
  "/my",
  authMiddleWare,
  getMyReminders
);

// Get all reminders
router.get("/", getReminders);

// Get reminders for a specific user
router.get("/user/:userId", getUserReminders);

// Get single reminder
router.get("/:id", getReminder);

// Update reminder
router.patch("/:id", updateReminder);

// Complete reminder
router.post("/:id/complete", completeReminder);

// Dismiss reminder
router.post("/:id/dismiss", dismissReminder);

// Cancel reminder
router.post("/:id/cancel", cancelReminder);

// Delete reminder
router.delete("/:id", deleteReminder);

export default router;