import express from "express";
import prisma from "../prisma.js";
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

    const user = await prisma.user.upsert({
      where: { googleId: sub },
      update: { email, name, picture },
      create: { googleId: sub, email, name, picture },
    });

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: crypto.randomUUID(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
      },
    });

    const onboardingRequired = !user.username || !user.leetcode;

    res.json({ success: true, token: session.token, user,  onboardingRequired });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Invalid Google token" });
  }
});

export default router;
