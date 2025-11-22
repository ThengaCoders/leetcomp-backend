import express from "express";
import auth from "../middleware/auth.js";
import prisma from "../prisma.js";

const router = express.Router();

router.post("/complete-profile", auth, async (req, res) => {
  const { username, leetcode } = req.body;

  if (!username || !leetcode) {
    return res.status(400).json({ error: "All fields required" });
  }

  const exists = await validateLeetCodeUsername(leetcode);
  if (!exists) {
    return res.status(400).json({ error: "Invalid LeetCode username" });
  }

  try {
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { username, leetcode }
    });

    return res.json({ success: true, user: updated });
  } 
  catch (err) {
    if (err.code === "P2002") {
      return res.status(400).json({ error: "Username already taken" });
    }
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
