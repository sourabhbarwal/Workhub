// const mongoose = require("mongoose");

// const userSchema = new mongoose.Schema(
//   {
//     firebaseUid: {
//       type: String,
//       required: true,
//       unique: true,
//       index: true,
//     },
//     email: {
//       type: String,
//       required: true,
//       index: true,
//     },
//     name: String,
//     photoURL: String,
//     role: {
//       type: String,
//       enum: ["admin", "member"],
//       required: true,
//     },
//     provider: String, // "password", "google.com", etc.
//     teamId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Team",
//       default: null,
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("User", userSchema);

// server/models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
    },
    name: {
      type: String,
    },
    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
