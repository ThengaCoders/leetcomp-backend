import express from "express";
const router = express.Router();
import pool from '../config/db.js';

router.get("/", async (req, res) => {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows);
});

export default router;
