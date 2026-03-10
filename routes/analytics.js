const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Session = require("../models/Session");
const User = require("../models/User");

const router = express.Router();

function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

router.get("/weekly", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const weekStart = startOfWeek();

    const sessions = await Session.find({
      user: userId,
      completedAt: { $gte: weekStart }
    }).populate("track", "title xpPerSession");

    const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);

    const totalXP = sessions.reduce((sum, s) => {
      return sum + (s.track?.xpPerSession || 0);
    }, 0);

    const trackCount = {};
    sessions.forEach((s) => {
      const title = s.track?.title || "Unknown";
      trackCount[title] = (trackCount[title] || 0) + 1;
    });

    const mostActiveTrack =
      Object.entries(trackCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    const user = await User.findById(userId).select("currentStreak");

    res.json({
      sessionsThisWeek: sessions.length,
      totalMinutes,
      totalXP,
      mostActiveTrack,
      currentStreak: user?.currentStreak || 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;