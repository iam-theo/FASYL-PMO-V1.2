import express from "express";
import { authMiddleWare } from "../../middleware/auth.middleware.js";
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "./notification.controller.js";

const router = express.Router();

router.get("/my", authMiddleWare, getMyNotifications);

router.post("/read-all", authMiddleWare, markAllNotificationsRead);

router.post("/:id/read", authMiddleWare, markNotificationRead);

export default router;
