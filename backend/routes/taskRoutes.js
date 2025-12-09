// // backend/routes/taskRoutes.js
// const express = require("express");
// const Task = require("../models/Task");

// const router = express.Router();

// // CREATE task  -----------------------------
// router.post("/", async (req, res) => {
//   try {
//     console.log("📥 POST /tasks body:", req.body);
//     const { title, description, status, dueDate, userId, priority } = req.body;

//     if (!title || !userId) {
//       console.log("❌ Missing title or userId");
//       return res.status(400).json({ message: "title and userId (firebase uid)  required" });
//     }

//     const task = await Task.create({
//       title,
//       description,
//       status: status || "todo",
//       dueDate,
//       userId,
//       priority: priority || "medium",
//       userFirebaseUid: userId,
//     });

//     res.status(201).json(task);
//   } catch (err) {
//     console.error("❌ Error in POST /tasks:", err);
//     res.status(500).json({ message: err.message });
//   }
// });

// // READ tasks (by user)  --------------------
// router.get("/", async (req, res) => {
//   try {
//     const { userId } = req.query;
//     if (!userId) {
//       return res.status(400).json({ message: "userId required" });
//     }

//     const tasks = await Task.find({ userFirebaseUid: userId }).sort({
//       createdAt: -1,
//     });
//     res.json(tasks);
//   } catch (err) {
//     console.error("❌ Error in GET /tasks:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // UPDATE task ------------------------------
// router.put("/:id", async (req, res) => {
//   try {
//     const { status, title, description, dueDate, priority} = req.body;
//     const task = await Task.findById(req.params.id);

//     if (!task) return res.status(404).json({ message: "Task not found" });

//     if (title !== undefined) task.title = title;
//     if (description !== undefined) task.description = description;
//     if (dueDate !== undefined) task.dueDate = dueDate;
//     if (priority !== undefined) task.priority = priority;
//     if (status !== undefined) {
//       if (status === "done" && task.status !== "done" ) {
//         task.completedAt = new Date();
//       }
//       if (status !== "done" && task.status === "done") {
//         task.completedAt = null;
//       }
//       task.status = status;
//     }

//     await task.save();
//     res.json(task);
//   } catch (err) {
//     console.error("❌ Error in PUT /tasks/:id:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // DELETE task ------------------------------
// router.delete("/:id", async (req, res) => {
//   try {
//     console.log("🗑 DELETE /tasks/" + req.params.id);
//     const deleted = await Task.findByIdAndDelete(req.params.id);
//     if (!deleted) return res.status(404).json({ message: "Task not found" });
//     res.json({ message: "Task deleted" });
//   } catch (err) {
//     console.error("❌ Error in DELETE /tasks/:id:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // STATS: /tasks/stats?userId=... -----------
// router.get("/stats", async (req, res) => {
//   try {
//     const { userId } = req.query;
//     if (!userId) {
//       return res.status(400).json({ message: "userId required" });
//     }

//     console.log("📊 GET /tasks/stats for userId:", userId);

//     const tasks = await Task.find({
//       userId,
//       status: "done",
//       completedAt: { $ne: null },
//     });

//     const map = {};
//     tasks.forEach((t) => {
//       const d = new Date(t.completedAt);
//       const year = d.getFullYear();
//       const month = String(d.getMonth() + 1).padStart(2, "0");
//       const day = String(d.getDate()).padStart(2, "0");
//       const key = `${year}-${month}-${day}`;
//       if (!map[key]) {
//         map[key] = { date: key, tasksCompleted: 0, score: 0 };
//       }
//       map[key].tasksCompleted += 1;
//       map[key].score += 10;
//     });

//     const stats = Object.values(map).sort((a, b) =>
//       a.date.localeCompare(b.date)
//     );

//     res.json(stats);
//   } catch (err) {
//     console.error("❌ Error in GET /tasks/stats:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// module.exports = router;


// backend/routes/taskRoutes.js
const express = require("express");
const Task = require("../models/Task");

const router = express.Router();

// CREATE task ------------------------------
router.post("/", async (req, res) => {
  try {
    const { title, description, status, dueDate, userId } = req.body; // userId = firebase uid

    if (!title || !userId) {
      return res
        .status(400)
        .json({ message: "title and userId (firebase uid) required" });
    }

    const task = await Task.create({
      title,
      description,
      status: status || "todo",
      dueDate,
      userFirebaseUid: userId, // new field
      userId, // keep as backup
    });

    res.status(201).json(task);
  } catch (err) {
    console.error("Error in POST /tasks:", err);
    res.status(500).json({ message: err.message });
  }
});

// READ tasks -------------------------------
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query; // firebase uid
    if (!userId) {
      return res.status(400).json({ message: "userId required" });
    }

    const tasks = await Task.find({
      $or: [{ userFirebaseUid: userId }, { userId }],
    }).sort({
      createdAt: -1,
    });

    res.json(tasks);
  } catch (err) {
    console.error("Error in GET /tasks:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE task ------------------------------
router.put("/:id", async (req, res) => {
  try {
    const { status, title, description, dueDate } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (dueDate !== undefined) task.dueDate = dueDate;

    if (status !== undefined) {
      // going to done → set completedAt now
      if (status === "done" && task.status !== "done") {
        task.completedAt = new Date();
      }
      // leaving done → clear completedAt (optional)
      if (status !== "done" && task.status === "done") {
        task.completedAt = null;
      }
      task.status = status;
    }

    await task.save();
    console.log(
      "UPDATED TASK",
      task._id.toString(),
      "status=",
      task.status,
      "completedAt=",
      task.completedAt
    );

    res.json(task);
  } catch (err) {
    console.error("Error in PUT /tasks/:id:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE task ------------------------------
router.delete("/:id", async (req, res) => {
  try {
    console.log("🗑 DELETE /tasks/" + req.params.id);
    const deleted = await Task.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Task not found" });
    res.json({ message: "Task deleted" });
  } catch (err) {
    console.error("Error in DELETE /tasks/:id:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// STATS ------------------------------------
router.get("/stats", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: "userId required" });
    }

    const query = {
      status: "done",
      completedAt: { $ne: null },
      $or: [{ userFirebaseUid: userId }, { userId }],
    };

    const tasks = await Task.find(query);

    console.log(
      "STATS query for",
      userId,
      "found",
      tasks.length,
      "completed tasks"
    );

    const map = {};

    tasks.forEach((t) => {
      const d = new Date(t.completedAt);

      // LOCAL date key YYYY-MM-DD
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const key = `${year}-${month}-${day}`;

      if (!map[key]) {
        map[key] = { date: key, tasksCompleted: 0, score: 0 };
      }
      map[key].tasksCompleted += 1;
      map[key].score += 10;
    });

    const stats = Object.values(map).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    res.json(stats);
  } catch (err) {
    console.error("Error in GET /tasks/stats:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
