//backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const usersRoute = require("./routes/userRoutes");
const tasksRoute = require("./routes/taskRoutes");
const teamsRoute = require("./routes/teamRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Mongo connection
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/focus_track";

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Routes
app.use("/users", usersRoute);
app.use("/tasks", tasksRoute);
app.use("/teams", teamsRoute);

// Health check
app.get("/", (req, res) => {
  res.json({ ok: true, message: "FocusTrack API running" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});