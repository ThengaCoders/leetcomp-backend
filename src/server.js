import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import authMiddleware from "./middleware/auth.js";
import leetcodeRoutes from "./routes/leetcode.js";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use("/api", leetcodeRoutes);

// Rate limiter
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
}));

// Routes
app.use("/auth", authRoutes);

// Protected route example
app.get("/profile", authMiddleware, (req, res) => {
  res.json(req.user);
});

// Health check
app.get("/", (req, res) => res.send("API is running"));

const PORT = process.env.PORT || 5173;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
