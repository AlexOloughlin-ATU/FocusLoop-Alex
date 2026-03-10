const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  displayName: {
    type: String,
    default: "Alex",
    trim: true,
  },
  totalXP: {
    type: Number,
    default: 0,
  },
  level: {
    type: Number,
    default: 1,
  },
  currentStreak: {
    type: Number,
    default: 0,
  },
  lastActiveDate: {
    type: String,
  },
  theme: {
    type: String,
    enum: ["light", "dark"],
    default: "light",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", userSchema);
