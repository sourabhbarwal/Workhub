// backend/routes/taskRoutes.js
const express = require("express");
const router = express.Router();
const Task = require("../models/Task");

// GET /tasks?userId=... OR /tasks?teamId=...
// - Personal board:  /tasks?userId=<firebaseUid>
// - Team board:      /tasks?teamId=<teamId>
router.get("/", async (req, res) => {
  try {
    const { userId, teamId } = req.query;

    if (!userId && !teamId) {
      return res
        .status(400)
        .json({ message: "userId or teamId is required in query params" });
    }

    const query = {};
    if (userId) query.userId = userId;
    if (teamId) query.teamId = teamId;

    const tasks = await Task.find(query).sort({ createdAt: -1 });
    return res.json(tasks);
  } catch (err) {
    console.error("Error fetching tasks:", err);
    return res.status(500).json({ message: "Server error while fetching tasks" });
  }
});

// --- STATS ENDPOINT ---
// GET /tasks/stats?userId=...
// Used by Layout.jsx to show streak / summary.
// This returns simple aggregate numbers. You can extend later if needed.
router.get("/stats", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    // All tasks for this user (personal + team-created-by-them)
    const tasks = await Task.find({ userId });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "done").length;
    const completionRate = totalTasks
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

    // Simple placeholder streak logic: you can improve later
    const streak = 0;

    return res.json({
      totalTasks,
      completedTasks,
      completionRate,
      streak,
    });
  } catch (err) {
    console.error("Error fetching task stats:", err);
    return res.status(500).json({ message: "Server error while fetching stats" });
  }
});

// POST /tasks
// Body:
// {
//   title: string (required),
//   description?: string,
//   status?: "todo" | "in-progress" | "done",
//   dueDate?: ISO string,
//   userId: string (creator, required),
//   teamId?: string (if it’s a team task)
// }
router.post("/", async (req, res) => {
  try {
    const { title, description, status, dueDate, userId, teamId } = req.body;

    // if (!title || !userId) {
    //   return res
    //     .status(400)
    //     .json({ message: "title and userId are required" });
    // }

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title is required." });
    }

    if (!dueDate) {
      return res.status(400).json({ message: "Due date is required." });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    if (isNaN(due.getTime())) {
      return res.status(400).json({ message: "Invalid due date." });
    }

    if (due < today) {
      return res
        .status(400)
        .json({ message: "Due date cannot be in the past." });
    }
    
    const task = new Task({
      title: title.trim(),
      description: (description || "").trim(),
      status: status || "todo",
      userId,
      teamId: teamId || null,
      dueDate: dueDate ? new Date(dueDate) : null,
    });

    const saved = await task.save();
    return res.status(201).json(saved);
  } catch (err) {
    console.error("Error creating task:", err);
    return res.status(500).json({ message: "Server error while creating task" });
  }
});

// PUT /tasks/:id
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const update = {};
    const allowedFields = [
      "title",
      "description",
      "status",
      "dueDate",
      "userId",
      "teamId",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === "title" || field === "description") {
          update[field] = String(req.body[field]).trim();
        } else if (field === "dueDate" && req.body[field]) {
          update[field] = new Date(req.body[field]);
        } else {
          update[field] = req.body[field];
        }
      }
    });

    const updated = await Task.findByIdAndUpdate(id, update, {
      new: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.json(updated);
  } catch (err) {
    console.error("Error updating task:", err);
    return res.status(500).json({ message: "Server error while updating task" });
  }
});

// DELETE /tasks/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Task.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.json({ message: "Task deleted", id: deleted._id });
  } catch (err) {
    console.error("Error deleting task:", err);
    return res.status(500).json({ message: "Server error while deleting task" });
  }
});

module.exports = router;
