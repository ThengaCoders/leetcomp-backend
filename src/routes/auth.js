import express from "express";
import prisma from "../prisma.js";
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";
import auth from "../middleware/auth.js";

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post("/onboard", auth, async (req, res) => {
  const { username, leetcode } = req.body;

  if (req.user.username && req.user.leetcode) {
    return res.status(403).json({
      error: "Profile already completed. Cannot edit username or leetcode."
    });
  }

  if (!username || !leetcode) {
    return res.status(400).json({ error: "Username and LeetCode required" });
  }

  // Check if username already taken
  const existing = await prisma.user.findUnique({
    where: { username }
  });

  if (existing && existing.id !== req.user.id) {
    return res.status(409).json({ error: "Username already exists" });
  }

  // TODO: optional — check LeetCode validity (API call)

  // Update user
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { username, leetcode }
  });

  res.json({ message: "Profile completed", user });
});

router.get("/me", auth, async (req, res) => {
  return res.json({
    id: req.user.id,
    email: req.user.email,
    username: req.user.username,
    leetcode: req.user.leetcode,
  });
});

// Google OAuth login
router.post("/google", async (req, res) => {
  const { credential } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;

    // Create or update user
    const user = await prisma.user.upsert({
      where: { googleId: sub },
      update: { email, name, picture },
      create: { googleId: sub, email, name, picture },
    });

    // Detect whether they need onboarding
    const onboardingRequired = !user.username || !user.leetcode;

    // Create session ALWAYS
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: crypto.randomUUID(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      },
    });

    // Final response
    res.json({
      success: true,
      token: session.token,
      onboardingRequired,
      user,
    });

  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Invalid Google token" });
  }
});


router.post("/logout", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // Try to delete the session
    const session = await prisma.session.delete({
      where: { token: token },
    });

    return res.json({ success: true, message: "Logged out" });
  } catch (err) {
    if (err.code === "P2025") {
      // Prisma: record not found
      return res.status(404).json({ error: "Session not found" });
    }

    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});


export default router;
