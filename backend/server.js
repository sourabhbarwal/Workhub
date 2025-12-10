// backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ====== MIDDLEWARE ======
app.use(
  cors({
    origin: "http://localhost:5173", // Vite dev server
    credentials: true,
  })
);
app.use(express.json());

// ====== MONGO CONNECTION ======
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ No MONGODB_URI or MONGO_URI in .env");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// ====== ROUTES ======
const taskRoutes = require("./routes/taskRoutes");
const userRoutes = require("./routes/userRoutes");
const teamRoutes = require("./routes/teamRoutes");

app.use("/tasks", taskRoutes);
app.use("/users", userRoutes);
app.use("/teams", teamRoutes);

app.get("/", (req, res) => {
  res.send("FocusTrack backend running 🚀");
});

// ====== START SERVER ======
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
