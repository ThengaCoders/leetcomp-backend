import dotenv from 'dotenv';
dotenv.config();


// Express & core middleware
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import bodyParser from "body-parser";

const app = express();

// Global middleware
app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));

// Rate limiter
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));

// Routes
import authRoutes from "./routes/auth.js";
import leetcodeRoutes from "./routes/leetcode.js";
import paymentsRoute from "./routes/payments.js";
import roomRouter from "./routes/roomRouter.js";
import { webhookHandler } from "./controllers/paymentsController.js";

// Payment webhook must use raw body
app.post(
  "/api/payments/webhook",
  bodyParser.raw({ type: "application/json" }),
  webhookHandler
);

// Normal JSON parser after webhook
app.use(express.json());

// API routes
app.use("/auth", authRoutes);
app.use("/api", leetcodeRoutes);
app.use("/api/rooms", roomRouter);
app.use("/api/payments", paymentsRoute);

import "./cron/roomCron.js";

// Health check
app.get("/", (req, res) => res.send("Backend running"));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
