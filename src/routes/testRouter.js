const router = require("express").Router();
const pool = require("../config/db");

router.get("/", async (req, res) => {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows);
});

module.exports = router;
