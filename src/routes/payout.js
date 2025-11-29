import express from "express";
import {
  getPayouts,
  getSinglePayout,
  markAsPaid,
  updateUTR
} from "../controllers/payoutController.js";

const router = express.Router();

// Fetch pending or paid payouts
router.get("/", getPayouts);

// Fetch single payout
router.get("/:id", getSinglePayout);

// Mark payout as paid (with UTR)
router.patch("/:id/mark-paid", markAsPaid);

// Update UTR only (optional endpoint)
router.patch("/:id/update-utr", updateUTR);

export default router;
