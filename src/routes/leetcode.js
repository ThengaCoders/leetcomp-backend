import express from "express";
import { validateLeetCodeUsername } from "../utils/validateLeetCode.js";

const router = express.Router();

router.get("/validate-leetcode", async (req, res) => {
  const username = req.query.username?.trim();

  if (!username) {
    return res.json({ valid: false });
  }

  const isValid = await validateLeetCodeUsername(username);

  return res.json({ valid: isValid });
});

export default router;
