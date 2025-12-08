// backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// middlewares
app.use(cors());
app.use(express.json());

// connect MongoDB (replace <your-connection-string> with real Atlas string)
mongoose
  .connect("mongodb+srv://sourabh17barwal_db_user:sb%40_1709@cluster0.ftksikt.mongodb.net/workhublite?retryWrites=true&w=majority")
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("Mongo error:", err));

// Task routes (we'll create the file next)
const taskRoutes = require("./routes/taskRoutes");
app.use("/tasks", taskRoutes);

app.get("/", (req, res) => {
  res.send("WorkHub Lite API running");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
