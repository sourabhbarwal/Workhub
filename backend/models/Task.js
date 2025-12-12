//backend/models/Task.js
const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["todo", "in-progress", "done"],
      default: "todo",
    },

    // Personal tasks
    userFirebaseUid: {
      type: String,
      default: null,
    },

    // Team tasks
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },

    // Due date is required and validated in route
    dueDate: {
      type: Date,
      required: true,
    },

    // Creator info (always set)
    createdByFirebaseUid: {
      type: String,
      required: true,
    },
    createdByName: {
      type: String,
      required: true,
    },

    // Completion info (only set when status === 'done')
    completedAt: {
      type: Date,
      default: null,
    },
    completedByFirebaseUid: {
      type: String,
      default: null,
    },
    completedByName: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);