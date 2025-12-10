// const mongoose = require("mongoose");

// const taskSchema = new mongoose.Schema(
//   {
//     title: { type: String, required: true },
//     description: String,

//     status: {
//       type: String,
//       enum: ["todo", "in-progress", "done"],
//       default: "todo",
//       index: true,
//     },

//     dueDate: Date,
//     completedAt: Date,

//     // who created / owns it
//     userFirebaseUid: {
//       type: String,
//       index: true,
//     },
//     userId: {
//       type: String,
//       index: true,
//     },

//     // if set → team task; visible to all team members
//     teamId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Team",
//       default: null,
//       index: true,
//     },
//   },
//   { timestamps: true }
// );

// taskSchema.index({ userFirebaseUid: 1, status: 1, completedAt: 1 });

// module.exports = mongoose.model("Task", taskSchema);

// backend/models/Task.js
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
      trim: true,
    },
    status: {
      type: String,
      enum: ["todo", "in-progress", "done"],
      default: "todo",
    },

    // For personal tasks – Firebase UID or your internal user id
    userId: {
      type: String,
      required: true,
    },

    // For team tasks – reference to Team._id
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },

    dueDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Task", taskSchema);
