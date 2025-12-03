import dotenv from 'dotenv';
dotenv.config();


// Express & core middleware
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import bodyParser from "body-parser";
import auth from "./middleware/auth.js";

const app = express();

// Global middleware
app.use(cookieParser());
app.use(helmet());
app.use(cors({
  origin: [
    "http://localhost:5173",                  // your local frontend
    "https://leetcomp-frontend.vercel.app"    // your hosted frontend
  ],
  credentials: true,   // OK even without cookies
}));

// Rate limiter
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));

// Routes
import authRoutes from "./routes/auth.js";
import payout from "./routes/payout.js";
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

// Health check
app.get("/", (req, res) => res.send("Backend running"));

// API routes
app.use("/auth", authRoutes);

app.use(auth);

app.use("/api", leetcodeRoutes);
app.use("/api/rooms", roomRouter);
app.use("/api/payments", paymentsRoute);
app.use("/api/payout", payout);
app.get("/time", (req, res) => {
  res.json({ now: new Date() });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

