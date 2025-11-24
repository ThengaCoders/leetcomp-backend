import express from "express";
import cors from "cors";
import paymentsRoute from './routes/payments.js';
import roomRouter from './routes/roomRouter.js';
const app = express();

app.use(cors());
app.use(express.json());

// ROUTES
app.use("/api/rooms",roomRouter);
app.use('/api/payments',paymentsRoute)
// Default test route
app.get("/", (req, res) => {
    res.send("Backend running");
});

export default app;
