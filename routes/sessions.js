const express = require("express");
const Session = require("../models/Session");
const Track = require("../models/Track");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

function dublinDayKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Dublin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const y = parts.find((p) => p.type === "year").value;
  const m = parts.find((p) => p.type === "month").value;
  const d = parts.find((p) => p.type === "day").value;
  return `${y}-${m}-${d}`;
}

function dayKeyMinusDays(dayKey, days) {
  const [y, m, d] = dayKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - days);

  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");

  return `${yy}-${mm}-${dd}`;
}

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { trackId, duration } = req.body;

    const track = await Track.findOne({ _id: trackId, user: req.user.id });
    if (!track) {
      return res.status(404).json({ message: "Track not found" });
    }

    await Session.create({
      user: req.user.id,
      track: trackId,
      duration: Number(duration) || 0,
    });

    const user = await User.findById(req.user.id);

    const todayKey = dublinDayKey(new Date());
    const yesterdayKey = dayKeyMinusDays(todayKey, 1);
    const prevLastActive = user.lastActiveDate || null;
    const isAlreadyActiveToday = prevLastActive === todayKey;

    if (!prevLastActive) {
      user.currentStreak = 1;
    } else if (isAlreadyActiveToday) {
      // no streak change
    } else if (prevLastActive === yesterdayKey) {
      user.currentStreak += 1;
    } else {
      user.currentStreak = 1;
    }

    user.lastActiveDate = todayKey;

    let bonusXP = 0;
    if (!isAlreadyActiveToday) {
      if (user.currentStreak === 7) bonusXP = 25;
      if (user.currentStreak === 14) bonusXP = 50;
      if (user.currentStreak === 30) bonusXP = 150;
    }

    user.totalXP += track.xpPerSession + bonusXP;
    user.level = Math.floor(user.totalXP / 100) + 1;

    await user.save();

    res.status(201).json({
      message: "Session logged",
      newXP: user.totalXP,
      newLevel: user.level,
      currentStreak: user.currentStreak,
      bonusXP,
    });
  } catch (err) {
    console.log("SESSION ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const sessions = await Session.find({ user: req.user.id })
      .sort({ completedAt: -1 })
      .limit(25)
      .populate("track", "title xpPerSession accent");

    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
