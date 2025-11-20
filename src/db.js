import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

// TEMPORARY TEST
try {
  const res = await pool.query("SELECT NOW()");
  console.log("DB connected. Time:", res.rows[0]);
} catch (err) {
  console.error("DB connection error:", err);
}
