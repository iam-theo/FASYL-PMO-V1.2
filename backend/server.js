import dotenv from "dotenv";
dotenv.config();

import { app, prisma } from "./app.js";
import { startSalesSync } from "./modules/projects/salesSync.job.js";
import { startReminderScheduler } from "./modules/reminders/reminder.scheduler.js";
import { setupRealtime, stopRealtime } from "./modules/realtime/realtime.service.js";

/* =========================
    ENV
========================= */
const PORT = process.env.PORT || 5000;
const API_V1 = "/api/v1";
const API_LEGACY = "/api";

/* =========================
    SCHEDULED JOBS (persistent host only)
========================= */
startSalesSync();

startReminderScheduler();

/* =========================
    START SERVER
========================= */
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌍 API (v1): ${API_V1}`);
  console.log(`📦 Legacy API: ${API_LEGACY}`);
  console.log(`📚 Docs: http://localhost:${PORT}/docs`);
  console.log(`📊 Reports API: ${API_V1}/reports`);
  console.log(`⏰ Reminders API: ${API_V1}/reminders`);
  console.log(`❤️ Health Check: ${API_V1}/health`);
});

setupRealtime(server);

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 ${signal} received. Shutting down server...`);

  try {
    // Close HTTP server
    await new Promise((resolve) => {
      server.close(() => {
        console.log("🌐 HTTP server closed.");
        resolve();
      });
    });

    // Close the WebSocket hub + Redis pub/sub connections
    stopRealtime();

    // Disconnect Prisma
    await prisma.$disconnect();

    console.log("🗄️ Prisma disconnected.");
    console.log("✅ Server shutdown completed.");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error during server shutdown:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

// =========================
// PROCESS SIGNALS
// =========================

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
