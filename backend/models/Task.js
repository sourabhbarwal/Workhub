const mongoose = require("mongoose");
const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    status: {
      type: String,
      enum: ["todo", "in-progress", "done"],
      default: "todo",
      index: true,
    },
    dueDate: Date,
    completedAt: Date,

    // link to user
    userFirebaseUid: {
      type: String,
      required: true,
      index: true,
    },
    
    userId: {
      type: String,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// helpful indexes
taskSchema.index({ userFirebaseUid: 1, status: 1, dueDate: 1 });

module.exports = mongoose.model("Task", taskSchema);
