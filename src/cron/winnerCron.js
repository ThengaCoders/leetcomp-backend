import cron from "node-cron";
import { processWinners } from "../scripts/processWinners.js";

console.log("⏱  Cron service loaded");

// Runs every day at 12 AM IST
cron.schedule("00 00 * * *", async () => {
  try {
    console.log("⚡ Running daily winner processor...");
    await processWinners();
    console.log("✅ Daily winner processing finished");
  } catch (err) {
    console.error("❌ Cron error:", err);
  }
}, {
  timezone: "Asia/Kolkata"
});
