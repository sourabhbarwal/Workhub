const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      index: true,
    },
    name: String,
    photoURL: String,

    // App-specific settings you can add later
    theme: {
      type: String,
      default: "dark",
    },
    defaultSessionMinutes: {
      type: Number,
      default: 25,
    },

    lastLoginAt: Date,
  },
  { timestamps: true } // adds createdAt, updatedAt
);

module.exports = mongoose.model("User", userSchema);
