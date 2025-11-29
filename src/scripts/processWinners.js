import { prisma } from "../services/prismaClient.js";
import fetchLeetCodeSolved from "../services/leetcodeStatsService.js";

console.log("🚀 Winner Processing Script Started");

export const processWinners = async () => {
    try {
        const now = new Date();

        // 1️⃣ Find rooms that ended AND not processed yet
        const rooms = await prisma.rooms.findMany({
            where: {
                end_date: { lte: now },
                isPayout: false
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                username: true,
                                phone: true,
                                leetcode: true,
                            }
                        }
                    }
                }
            }
        });

        if (!rooms.length) {
            console.log("➡️ No rooms to process");
            return;
        }

        console.log(`📌 Found ${rooms.length} rooms to process`);

        for (const room of rooms) {

            console.log(`\n🏁 Processing room: ${room.id}`);

            // 2️⃣ Update participant final counts (same as roomCron.js)
            for (const participant of room.participants) {
                const leetcodeUsername = participant.user.leetcode;

                if (!leetcodeUsername) {
                    console.log(`⚠️ User ${participant.user.username} has no LeetCode username.`);
                    continue;
                }

                const finalCount = await fetchLeetCodeSolved(leetcodeUsername);

                await prisma.roomUser.update({
                    where: { id: participant.id },
                    data: {
                        final_qn_count: finalCount
                    }
                });

                console.log(`  🔹 Updated ${participant.user.username} final count → ${finalCount}`);
            }

            // 3️⃣ Re-fetch updated participants after updating final counts
            const updatedParticipants = await prisma.roomUser.findMany({
                where: { room_id: room.id },
                include: { user: true }
            });

            // 4️⃣ Compute winner
            const winner = updatedParticipants
                .map(p => ({
                    ...p,
                    score: p.final_qn_count - p.initial_qn_count
                }))
                .sort((a, b) => b.score - a.score)[0];

            if (!winner) {
                console.log("⚠️ No winner found for this room.");
                continue;
            }

            console.log(`🏆 Winner: ${winner.user.username} (Score: ${winner.score})`);

            // 5️⃣ Create payout entry (using UPSERT)
            await prisma.payout.upsert({
                where: {
                    roomId_userId: {
                        roomId: room.id,
                        userId: winner.userId,
                    }
                },
                update: {}, // do nothing if already exists
                create: {
                    userName: winner.user.username,
                    userId: winner.userId,
                    roomName: room.roomName,
                    roomId: room.id,
                    amount: room.prizePool,
                    phone: winner.user.phone,
                    status: "Pending"
                }
            });

            console.log(`💸 Payout added for ${winner.user.username}`);

            // 6️⃣ Mark room as processed
            await prisma.rooms.update({
                where: { id: room.id },
                data: {
                    isPayout: true,
                    winnerUserId: winner.userId,
                    status: "FINISHED"
                }
            });

            console.log(`✅ Room ${room.id} marked as FINISHED & isPayout set to true`);
        }

        console.log("\n🎉 All winners processed successfully.");

    } catch (error) {
        console.error("❌ Error processing winners:", error);
    }
};

processWinners();
