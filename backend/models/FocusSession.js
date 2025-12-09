// backend/models/FocusSession.js
const mongoose = require("mongoose");

const focusSessionSchema = new mongoose.Schema(
  {
    userFirebaseUid: {
      type: String,
      required: true,
      index: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    },
    startedAt: { type: Date, default: Date.now },
    durationSeconds: Number,
    completed: Boolean,
  },
  { timestamps: true }
);

module.exports = mongoose.model("FocusSession", focusSessionSchema);
