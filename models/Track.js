const mongoose = require("mongoose");

const trackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  targetPerWeek: {
    type: Number,
    default: 3,
  },
  xpPerSession: {
    type: Number,
    default: 10,
  },
  accent: {
    type: String,
    default: "indigo",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Track", trackSchema);
