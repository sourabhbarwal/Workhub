// // backend/routes/userRoutes.js
// const express = require("express");
// const User = require("../models/User");

// const router = express.Router();

// // 🔹 GET /users → list all users (for admin panel)
// router.get("/", async (req, res) => {
//   try {
//     const users = await User.find()
//       .sort({ createdAt: -1 })
//       .select("firebaseUid email name role createdAt");
//     res.json(users);
//   } catch (err) {
//     console.error("Error in GET /users:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // 🔹 POST /users → create user on signup (or return existing)
// router.post("/", async (req, res) => {
//   try {
//     const { firebaseUid, email, name, photoURL, role, provider } = req.body;

//     if (!firebaseUid || !email || !role) {
//       return res
//         .status(400)
//         .json({ message: "firebaseUid, email and role are required" });
//     }

//     const existing = await User.findOne({ firebaseUid });
//     if (existing) {
//       return res.status(200).json(existing);
//     }

//     const user = await User.create({
//       firebaseUid,
//       email,
//       name,
//       photoURL,
//       role,
//       provider,
//     });

//     res.status(201).json(user);
//   } catch (err) {
//     console.error("Error in POST /users:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // 🔹 GET /users/byUid?firebaseUid=... → used by AuthContext
// router.get("/byUid", async (req, res) => {
//   try {
//     const { firebaseUid } = req.query;
//     if (!firebaseUid) {
//       return res.status(400).json({ message: "firebaseUid required" });
//     }

//     const user = await User.findOne({ firebaseUid });
//     if (!user) return res.status(404).json({ message: "User not found" });

//     res.json(user);
//   } catch (err) {
//     console.error("Error in GET /users/byUid:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// module.exports = router;

// server/routes/users.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Get all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    res.json(users);
  } catch (err) {
    console.error("GET /users error:", err);
    res.status(500).json({ message: "Failed to load users" });
  }
});

// Get /users/byUid?firebaseUid=...
router.get("/byUid", async (req, res) => {
  try {
    const { firebaseUid } = req.query;
    if (!firebaseUid) {
      return res.status(400).json({ message: "firebaseUid is required" });
    }

    const user = await User.findOne({ firebaseUid }).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error("GET /users/byUid error:", err);
    res.status(500).json({ message: "Failed to load user" });
  }
});

// Optional: upsert user from Firebase
router.post("/syncFromFirebase", async (req, res) => {
  try {
    const { firebaseUid, email, name, role } = req.body;
    if (!firebaseUid || !email) {
      return res
        .status(400)
        .json({ message: "firebaseUid and email are required" });
    }

    const update = {
      email,
      name: name || email,
    };
    if (role) update.role = role;

    const user = await User.findOneAndUpdate({ firebaseUid }, update, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    });

    res.json(user);
  } catch (err) {
    console.error("POST /users/syncFromFirebase error:", err);
    res.status(500).json({ message: "Failed to sync user" });
  }
});

module.exports = router;
