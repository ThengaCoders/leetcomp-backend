import { prisma } from "../services/prismaClient.js";
import fetchLeetCodeSolved from "../services/leetcodeStatsService.js";

console.log("🚀 Winner Processing Script Loaded");

export const processWinners = async () => {
  const now = new Date();
  console.log(`⏱ Checking rooms at ${now.toISOString()}`);

  try {
    // 1️⃣ Fetch rooms that ended and not processed yet
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
                id: true,
                username: true,
                phone: true,
                leetcode: true
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
      console.log(`\n🏁 Processing room: ${room.roomName} (${room.id})`);

      // 2️⃣ Update final question counts
      for (const participant of room.participants) {
        const lc = participant.user.leetcode;
        if (!lc) {
          console.log(`⚠️ ${participant.user.username} has no LeetCode`);
          continue;
        }

        let finalCount = participant.final_qn_count ?? 0;

        try {
          finalCount = await fetchLeetCodeSolved(lc);
        } catch (err) {
          console.log(`⚠️ LeetCode error for ${lc}:`, err.message);
        }

        await prisma.roomUser.update({
          where: { id: participant.id },
          data: { final_qn_count: finalCount }
        });

        console.log(`  🔹 ${participant.user.username}: final → ${finalCount}`);
      }

      // 3️⃣ Re-fetch updated participants
      const updated = await prisma.roomUser.findMany({
        where: { room_id: room.id },
        include: { user: true }
      });

      if (!updated.length) {
        console.log("⚠️ No participants found. Skipping.");
        continue;
      }

      // 4️⃣ Compute scores
      const scored = updated.map(p => ({
        ...p,
        score: (p.final_qn_count ?? 0) - (p.initial_qn_count ?? 0)
      }));

      scored.sort((a, b) => b.score - a.score);
      const topScore = scored[0].score;

      // All winners with same top score
      const winners = scored.filter(p => p.score === topScore);
      const prizePerWinner = Math.floor(room.prizePool / winners.length);

      console.log(`🏆 Winners: ${winners.length}, Top Score: ${topScore}`);
      console.log(`💰 Prize each: ₹${prizePerWinner}`);

      // 5️⃣ Insert payouts for all winners
      for (const w of winners) {
        if (!w.user?.id) continue;

        console.log(`💸 Adding payout for: ${w.user.username}`);

        await prisma.payout.upsert({
          where: {
            roomId_userId: {
              roomId: room.id,
              userId: w.user.id
            }
          },
          update: {},
          create: {
            username: w.user.username,
            userId: w.user.id,
            roomName: room.roomName,
            roomId: room.id,
            amount: prizePerWinner,
            phone: w.user.phone || null,
            status: "Pending"
          }
        });
      }

      // 6️⃣ Mark room as finished
      await prisma.rooms.update({
        where: { id: room.id },
        data: {
          isPayout: true,
          winnerUserId: winners[0]?.user?.id ?? null,
          status: "FINISHED"
        }
      });

      console.log(`🎯 Room ${room.roomName} marked as FINISHED`);
    }

    console.log("\n🎉 Winner processing completed successfully.");

  } catch (error) {
    console.error("❌ Error processing winners:", error);
  } finally {
    await prisma.$disconnect();
    console.log("🔌 Prisma disconnected");
  }
};

