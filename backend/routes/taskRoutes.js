//backend/routes/tasks.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Task = require("../models/Task");
const User = require("../models/User");

// Helper: normalize date to YYYY-MM-DD for comparing days
function normalizeDate(d) {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

// Helper: validate due date (required + not past)
function validateDueDate(dueDateStr) {
  if (!dueDateStr) {
    return { ok: false, message: "Due date is required" };
  }
  const d = new Date(dueDateStr);
  if (isNaN(d.getTime())) {
    return { ok: false, message: "Invalid due date" };
  }
  const today = normalizeDate(new Date());
  const due = normalizeDate(d);
  if (due < today) {
    return {
      ok: false,
      message: "Due date cannot be in the past. Use today or a future date.",
    };
  }
  return { ok: true, date: d };
}

// Helper: build completion score
// - done on/before due: 100
// - done late: 100 - 10 * daysLate (min 10)
// - not done: 0
function computeCompletionScore(task) {
  if (task.status !== "done" || !task.completedAt || !task.dueDate) {
    return 0;
  }

  const due = normalizeDate(task.dueDate);
  const completed = normalizeDate(task.completedAt);
  const diffMs = completed - due;
  const daysLate = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (daysLate <= 0) return 100;

  const score = 100 - daysLate * 10;
  return score < 10 ? 10 : score;
}

// ─────────────────────────
// GET /tasks
// query:
//   - userFirebaseUid or userId (personal tasks)
//   - teamId (team tasks)
// ─────────────────────────
router.get("/", async (req, res) => {
  try {
    const { userFirebaseUid, userId, teamId } = req.query;

    const filter = {};

    if (teamId) {
      if (!mongoose.Types.ObjectId.isValid(teamId)) {
        return res.status(400).json({ message: "Invalid teamId" });
      }
      filter.teamId = new mongoose.Types.ObjectId(teamId);
    } else {
      // personal tasks
      const uid = userFirebaseUid || userId;
      if (!uid) {
        return res.status(400).json({
          message:
            "Provide userFirebaseUid/userId for personal tasks or teamId for team tasks.",
        });
      }
      filter.userFirebaseUid = uid;
      filter.teamId = null;
    }

    const tasks = await Task.find(filter).sort({ dueDate: 1, createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    console.error("GET /tasks error:", err);
    res.status(500).json({ message: "Failed to load tasks" });
  }
});

// ─────────────────────────
// POST /tasks
// Body:
//   title, description, status?, dueDate (required, not past)
//   userFirebaseUid (personal) OR teamId (team task)
// ─────────────────────────
router.post("/", async (req, res) => {
  try {
    const {
      title,
      description,
      status,
      dueDate,
      userFirebaseUid,
      teamId,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Task title is required" });
    }

    // must be either personal OR team
    if (!userFirebaseUid && !teamId) {
      return res.status(400).json({
        message:
          "Either userFirebaseUid (for personal task) or teamId (for team task) is required.",
      });
    }

    const dueValidation = validateDueDate(dueDate);
    if (!dueValidation.ok) {
      return res.status(400).json({ message: dueValidation.message });
    }

    // figure out creator
    const creatorUid = userFirebaseUid;
    if (!creatorUid) {
      return res
        .status(400)
        .json({ message: "userFirebaseUid (creator) is required" });
    }

    const creatorUser = await User.findOne({ firebaseUid: creatorUid }).lean();
    const createdByName =
      (creatorUser && (creatorUser.name || creatorUser.email)) || "Unknown user";

    const doc = new Task({
      title: title.trim(),
      description: description?.trim() || "",
      status: status || "todo",
      dueDate: dueValidation.date,
      userFirebaseUid: userFirebaseUid || null,
      teamId: teamId || null,
      createdByFirebaseUid: creatorUid,
      createdByName,
      // completion fields remain null
    });

    const saved = await doc.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("POST /tasks error:", err);
    res.status(500).json({ message: "Failed to create task" });
  }
});

// ─────────────────────────
// PUT /tasks/:id
// Body can contain: title, description, status, dueDate, updatedByFirebaseUid
// Handles "completed by" tracking automatically.
// ─────────────────────────
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      status,
      dueDate,
      updatedByFirebaseUid,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid task id" });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const prevStatus = task.status;

    if (title !== undefined) {
      task.title = title.trim();
    }
    if (description !== undefined) {
      task.description = description.trim();
    }

    if (dueDate !== undefined) {
      const dueValidation = validateDueDate(dueDate);
      if (!dueValidation.ok) {
        return res.status(400).json({ message: dueValidation.message });
      }
      task.dueDate = dueValidation.date;
    }

    if (status !== undefined) {
      task.status = status;

      const justCompleted = prevStatus !== "done" && status === "done";
      const revertedFromDone = prevStatus === "done" && status !== "done";

      if (justCompleted) {
        const completerUid =
          updatedByFirebaseUid || task.userFirebaseUid || task.createdByFirebaseUid;

        let completedByName = task.completedByName;
        if (!completedByName) {
          const completerUser = await User.findOne({
            firebaseUid: completerUid,
          }).lean();
          completedByName =
            (completerUser &&
              (completerUser.name || completerUser.email)) ||
            "Unknown user";
        }

        task.completedAt = new Date();
        task.completedByFirebaseUid = completerUid;
        task.completedByName = completedByName;
      } else if (revertedFromDone) {
        task.completedAt = null;
        task.completedByFirebaseUid = null;
        task.completedByName = null;
      }
    }

    const saved = await task.save();
    res.json(saved);
  } catch (err) {
    console.error("PUT /tasks/:id error:", err);
    res.status(500).json({ message: "Failed to update task" });
  }
});

// ─────────────────────────
// DELETE /tasks/:id
// ─────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Task.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Task not found" });
    }
    return res.json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error("Error deleting task:", err);
    return res.status(500).json({ message: "Server error while deleting task" });
  }
});

// ─────────────────────────
// GET /tasks/stats?userId=<firebaseUid>
// Detailed stats for Stats tab
// ─────────────────────────
router.get("/stats", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: "userId (firebaseUid) required" });
    }

    // Stats on personal tasks only (no teamId)
    const tasks = await Task.find({
      userFirebaseUid: userId,
      teamId: null,
    }).sort({ createdAt: -1 });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "done").length;
    const pendingTasks = tasks.filter((t) => t.status !== "done").length;

    const now = normalizeDate(new Date());
    const overdueTasks = tasks.filter((t) => {
      if (!t.dueDate) return false;
      const due = normalizeDate(t.dueDate);
      return t.status !== "done" && due < now;
    }).length;

    let completedOnTime = 0;
    let completedLate = 0;
    let scoreSum = 0;

    const tasksWithExtra = tasks.map((t) => {
      const completionScore = computeCompletionScore(t);

      let completedAfterDueDate = false;
      if (t.status === "done" && t.completedAt && t.dueDate) {
        const due = normalizeDate(t.dueDate);
        const comp = normalizeDate(t.completedAt);
        completedAfterDueDate = comp > due;
        if (completedAfterDueDate) completedLate += 1;
        else completedOnTime += 1;
      }

      if (completionScore > 0) scoreSum += completionScore;

      return {
        _id: t._id,
        title: t.title,
        description: t.description,
        status: t.status,
        createdAt: t.createdAt,
        dueDate: t.dueDate,
        completedAt: t.completedAt,
        createdByFirebaseUid: t.createdByFirebaseUid,
        createdByName: t.createdByName,
        completedByFirebaseUid: t.completedByFirebaseUid,
        completedByName: t.completedByName,
        completedAfterDueDate,
        completionScore,
      };
    });

    const avgCompletionScore =
      completedTasks > 0 ? Math.round(scoreSum / completedTasks) : 0;

    const summary = {
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      completedOnTime,
      completedLate,
      avgCompletionScore,
    };

    res.json({ summary, tasks: tasksWithExtra });
  } catch (err) {
    console.error("GET /tasks/stats error:", err);
    res.status(500).json({ message: "Failed to load stats" });
  }
});

module.exports = router;