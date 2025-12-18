// backend/utils/ensureUser.js
const User = require("../models/User");

async function ensureUser(firebaseUser) {
  // firebaseUser: { uid, email, displayName, photoURL }
  if (!firebaseUser?.uid || !firebaseUser?.email) return null;

  const update = {
    email: firebaseUser.email,
    name: firebaseUser.displayName || firebaseUser.email,
    photoURL: firebaseUser.photoURL,
    lastLoginAt: new Date(),
  };

  const user = await User.findOneAndUpdate(
    { firebaseUid: firebaseUser.uid },
    { $set: update },
    { new: true, upsert: true }
  );

  return user;
}

module.exports = { ensureUser };
