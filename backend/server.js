// // backend/server.js
// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// require("dotenv").config();

// const app = express();
// const PORT = process.env.PORT || 5000;
// const taskRoutes = require("./routes/taskRoutes");
// app.use("/tasks", taskRoutes);


// // middlewares
// app.use(cors());
// app.use(express.json());

// // connect MongoDB (replace <your-connection-string> with real Atlas string)
// mongoose
//   .connect("mongodb+srv://sourabh17barwal_db_user:sb%40_1709@cluster0.ftksikt.mongodb.net/workhublite?retryWrites=true&w=majority")
//   .then(() => console.log("✅ MongoDB connected"))
//   .catch((err) => console.error("Mongo error:", err));

// app.get("/", (req, res) => {
//   res.send("WorkHub Lite API running");
// });

// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
// });

// backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ---- MIDDLEWARE ----
app.use(
  cors({
    origin: "http://localhost:5173", // frontend dev server
    credentials: true,
  })
);
app.use(express.json());

// ---- MONGO CONNECTION ----
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ No MONGO_URI / MONGODB_URI set in .env");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// ---- ROUTES ----
const taskRoutes = require("./routes/taskRoutes");
// const userRoutes = require("./routes/userRoutes"); // only if you created it

app.use("/tasks", taskRoutes);
// app.use("/users", userRoutes);

app.get("/", (req, res) => {
  res.send("FocusTrack backend running 🚀");
});

// ---- START SERVER ----
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
