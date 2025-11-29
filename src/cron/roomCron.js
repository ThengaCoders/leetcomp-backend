import cron from "node-cron";
import prisma from "../prisma.js";
import fetchLeetCodeSolved from "../services/leetcodeStatsService.js";

console.log("[CRON] Room scheduler initialized");

// Runs every 1 minute
cron.schedule("* * * * *", async () => {
    const now = new Date();

    try {
        const roomsToEnd = await prisma.Rooms.findMany({
            where: {
                status: "ONGOING",
                end_date: { lte: now }
            }
        });

        if (roomsToEnd.length === 0) return;

        console.log(`[CRON] Found ${roomsToEnd.length} rooms to finalize`);

        for (const room of roomsToEnd) {
            // Mark the room as FINISHED
            await prisma.Rooms.update({
                where: { id: room.id },
                data: { status: "FINISHED" }
            });

            // Fetch participants
            const participants = await prisma.RoomUser.findMany({
                where: { room_id: room.id },
                include: { user: true }
            });

            for (const participant of participants) {
                const username = participant.user.leetcode;
                const finalCount = await fetchLeetCodeSolved(username);

                // Update participant final count
                await prisma.RoomUser.update({
                    where: { id: participant.id },
                    data: { final_qn_count: finalCount }
                });

                console.log(`[CRON] Updated final count for ${username}: ${finalCount}`);
            }

            console.log(`[CRON] Room ${room.id} finalized.`);
        }

    } catch (err) {
        console.error("[CRON ERROR]", err);
    }
});
