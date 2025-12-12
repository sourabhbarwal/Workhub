//backend/models/Team.js
const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    adminFirebaseUid: {
      type: String,
      required: true,
    },
    memberFirebaseUids: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Team", teamSchema);
