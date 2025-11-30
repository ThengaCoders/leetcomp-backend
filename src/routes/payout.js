import express from "express";
import {
  getPayouts,
  getSinglePayout,
  markAsPaid
} from "../controllers/payoutController.js";

const router = express.Router();


router.get("/", getPayouts);


router.get("/:id", getSinglePayout);


router.patch("/:id/mark-paid", markAsPaid);


export default router;
