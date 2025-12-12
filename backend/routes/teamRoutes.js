//backend/routes/teams.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Team = require("../models/Team");
const User = require("../models/User");
const Task = require("../models/Task");

// ─────────────────────────
// POST /teams/createFromUsers
// ─────────────────────────
router.post("/createFromUsers", async (req, res) => {
  try {
    const { adminFirebaseUid, name, memberFirebaseUids } = req.body;

    if (!adminFirebaseUid || !name || !name.trim()) {
      return res
        .status(400)
        .json({ message: "adminFirebaseUid and team name are required" });
    }
    if (!Array.isArray(memberFirebaseUids) || memberFirebaseUids.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one member must be selected" });
    }

    const membersSet = new Set(memberFirebaseUids);
    // ensure admin is part of team
    membersSet.add(adminFirebaseUid);

    const team = new Team({
      name: name.trim(),
      adminFirebaseUid,
      memberFirebaseUids: Array.from(membersSet),
    });

    const saved = await team.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("POST /teams/createFromUsers error:", err);
    res.status(500).json({ message: "Failed to create team" });
  }
});

// ─────────────────────────
// GET /teams/byAdmin?adminFirebaseUid=...
// (kept for backwards compatibility)
// ─────────────────────────
router.get("/byAdmin", async (req, res) => {
  try {
    const { adminFirebaseUid } = req.query;
    if (!adminFirebaseUid) {
      return res
        .status(400)
        .json({ message: "adminFirebaseUid is required" });
    }

    const teams = await Team.find({ adminFirebaseUid }).sort({
      createdAt: -1,
    });

    res.json(teams);
  } catch (err) {
    console.error("GET /teams/byAdmin error:", err);
    res.status(500).json({ message: "Failed to load teams" });
  }
});

// ─────────────────────────
// NEW: GET /teams/adminList
// All teams for any admin (used in AdminPanel)
// ─────────────────────────
router.get("/adminList", async (_req, res) => {
  try {
    const teams = await Team.find().sort({ createdAt: -1 }).lean();
    res.json(teams);
  } catch (err) {
    console.error("GET /teams/adminList error:", err);
    res.status(500).json({ message: "Failed to load teams" });
  }
});

// ─────────────────────────
// GET /teams/forUser?firebaseUid=...
// Used in Dashboard to show user's teams
// ─────────────────────────
router.get("/forUser", async (req, res) => {
  try {
    const { firebaseUid } = req.query;
    if (!firebaseUid) {
      return res.status(400).json({ message: "firebaseUid is required" });
    }

    const teams = await Team.find({
      $or: [
        { adminFirebaseUid: firebaseUid },
        { memberFirebaseUids: firebaseUid },
      ],
    }).sort({ createdAt: -1 });

    res.json(teams);
  } catch (err) {
    console.error("GET /teams/forUser error:", err);
    res.status(500).json({ message: "Failed to load teams for user" });
  }
});

// ─────────────────────────
// PUT /teams/:id
// Admin-only edit (enforced by adminFirebaseUid)
// ─────────────────────────
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { adminFirebaseUid, name, memberFirebaseUids } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid team id" });
    }
    if (!adminFirebaseUid) {
      return res
        .status(400)
        .json({ message: "adminFirebaseUid is required" });
    }

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (team.adminFirebaseUid !== adminFirebaseUid) {
      return res.status(403).json({ message: "Not allowed to edit this team" });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ message: "Team name cannot be empty" });
      }
      team.name = name.trim();
    }

    if (Array.isArray(memberFirebaseUids)) {
      const membersSet = new Set(memberFirebaseUids);
      membersSet.add(adminFirebaseUid); // admin always part of team
      team.memberFirebaseUids = Array.from(membersSet);
    }

    const saved = await team.save();
    res.json(saved);
  } catch (err) {
    console.error("PUT /teams/:id error:", err);
    res.status(500).json({ message: "Failed to update team" });
  }
});

// ─────────────────────────
// GET /teams/details?teamId=...
// Returns: { team, users, stats, tasks }
// tasks include creator + completer info fields
// ─────────────────────────
router.get("/details", async (req, res) => {
  try {
    const { teamId } = req.query;
    if (!teamId) {
      return res.status(400).json({ message: "teamId is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({ message: "Invalid teamId" });
    }

    const team = await Team.findById(teamId).lean();
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    const memberUids = team.memberFirebaseUids || [];
    const users = await User.find({
      firebaseUid: { $in: memberUids },
    }).lean();

    // Be tolerant to schema: teamId could be ObjectId or string
    const teamObjectId = new mongoose.Types.ObjectId(teamId);

    const tasks = await Task.find({
      $or: [{ teamId: teamObjectId }, { teamId: teamId }],
    })
      .sort({ dueDate: 1, createdAt: -1 })
      .lean();

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "done").length;
    const progressPercent =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const userMap = new Map(users.map((u) => [u.firebaseUid, u]));

    // Ensure every task has createdByName & completedByName (for frontend)
    const tasksWithNames = tasks.map((t) => {
      let createdByName = t.createdByName;
      let completedByName = t.completedByName;

      if (!createdByName && t.createdByFirebaseUid) {
        const creator = userMap.get(t.createdByFirebaseUid);
        if (creator) {
          createdByName = creator.name || creator.email;
        }
      }

      if (!completedByName && t.completedByFirebaseUid) {
        const completer = userMap.get(t.completedByFirebaseUid);
        if (completer) {
          completedByName = completer.name || completer.email;
        }
      }

      return {
        ...t,
        createdByName: createdByName || t.createdByName || "Unknown user",
        completedByName:
          completedByName ||
          t.completedByName ||
          (t.completedAt ? "Unknown user" : null),
      };
    });

    const stats = {
      totalTasks,
      completedTasks,
      progressPercent,
    };

    res.json({
      team,
      users,
      stats,
      tasks: tasksWithNames,
    });
  } catch (err) {
    console.error("GET /teams/details error:", err);
    res.status(500).json({ message: "Failed to load team details" });
  }
});

module.exports = router;
