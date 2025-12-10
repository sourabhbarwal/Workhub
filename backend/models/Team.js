// const mongoose = require("mongoose");
// const teamSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     adminFirebaseUid: {
//       type: String,
//       required: true,
//       index: true,
//     },
//     memberFirebaseUids: {
//       type: [String], // includes admin + members
//       default: [],
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Team", teamSchema);

// server/models/Team.js
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
