const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const Track = require("../models/Track");
const Session = require("../models/Session");

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "email totalXP level currentStreak lastActiveDate"
    );

    const tracksCount = await Track.countDocuments({ user: req.user.id });
    const sessionsCount = await Session.countDocuments({ user: req.user.id });

    res.json({
      user,
      tracksCount,
      sessionsCount
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;