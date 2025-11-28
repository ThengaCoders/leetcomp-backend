// src/cron/roomCron.js
import cron from "node-cron";
import prisma from "../prisma.js";
import finalizeRoom from "../services/roomFinalizeService.js";

let isRunning = false;

console.log("[CRON] Room scheduler initialized");

cron.schedule("* * * * *", async () => {
    if (isRunning) return;     // prevent overlapping runs
    isRunning = true;

    try {
        const now = new Date();

        const roomsToEnd = await prisma.Rooms.findMany({
            where: {
                status: "ONGOING",
                end_date: { lte: now }
            }
        });

        if (roomsToEnd.length === 0) {
            isRunning = false;
            return;
        }

        console.log(`[CRON] Found ${roomsToEnd.length} rooms to finalize`);

        for (const room of roomsToEnd) {
            try {
                await finalizeRoom(room.id);
                console.log(`[CRON] Finalized room ${room.id}`);
            } catch (err) {
                console.error(`[CRON] Failed finalizing room ${room.id}:`, err);
            }
        }
    } catch (err) {
        console.error("[CRON ERROR] Unexpected cron failure:", err);
    } finally {
        isRunning = false;
    }
});
