import cron from "node-cron";
import { syncSalesProjects } from "./salesSync.service.js";

export const startSalesSync = () => {
    // runs every 5 minutes
    cron.schedule("*/1 * * * *", async () => {
        try {
            await syncSalesProjects();
        } catch (err) {
            console.error("Sales → PMO sync failed:", err.message);
        }
    });
};