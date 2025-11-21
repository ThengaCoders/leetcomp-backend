const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// ROUTES
app.use("/rooms", require("./routes/roomRouter"));

// Default test route
app.get("/", (req, res) => {
    res.send("Backend running");
});

module.exports = app;
