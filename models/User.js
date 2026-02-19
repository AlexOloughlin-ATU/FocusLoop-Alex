const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  totalXP: {
    type: Number,
    default: 0
  },

  level: {
    type: Number,
    default: 1
  },

  currentStreak: {
    type: Number,
    default: 0
  },

  lastActiveDate: {
    type: String // stored as "YYYY-MM-DD" (Europe/Dublin safe)
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", userSchema);

