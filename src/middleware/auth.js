import prisma from "../prisma.js";

export default async function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Missing token" });

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date())
    return res.status(401).json({ error: "Invalid or expired token" });
  const incomplete = !session.user.username || !session.user.leetcode;

  if (incomplete && !req.path.startsWith("/onboard")) {
    return res.status(403).json({
      error: "Profile incomplete",
      onboardingRequired: true
    });
  }
  req.user = session.user;
  req.token = token;
  next();
}
