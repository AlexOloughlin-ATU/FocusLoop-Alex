const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Session = require("../models/Session");
const User = require("../models/User");

const router = express.Router();

function startOfWeekMonday(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun, 1 Mon...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function pctChange(current, previous) {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return 100;
  return Math.round(((current - previous) / previous) * 100);
}

router.get("/weekly", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const thisWeekStart = startOfWeekMonday(new Date());
    const lastWeekStart = addDays(thisWeekStart, -7);
    const lastWeekEnd = thisWeekStart;

    // This week sessions
    const thisWeekSessions = await Session.find({
      user: userId,
      completedAt: { $gte: thisWeekStart },
    }).populate("track", "title xpPerSession");

    // Last week sessions
    const lastWeekSessions = await Session.find({
      user: userId,
      completedAt: { $gte: lastWeekStart, $lt: lastWeekEnd },
    }).populate("track", "title xpPerSession");

    const sumMinutes = (arr) => arr.reduce((s, x) => s + (x.duration || 0), 0);
    const sumXP = (arr) =>
      arr.reduce((s, x) => s + (x.track?.xpPerSession || 0), 0);

    const thisSessionsCount = thisWeekSessions.length;
    const lastSessionsCount = lastWeekSessions.length;

    const thisMinutes = sumMinutes(thisWeekSessions);
    const lastMinutes = sumMinutes(lastWeekSessions);

    const thisXP = sumXP(thisWeekSessions);
    const lastXP = sumXP(lastWeekSessions);

    // Most active track this week
    const trackCounts = {};
    for (const s of thisWeekSessions) {
      const title = s.track?.title || "Unknown track";
      trackCounts[title] = (trackCounts[title] || 0) + 1;
    }
    const mostActiveTrack =
      Object.entries(trackCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    const user = await User.findById(userId).select("currentStreak");

    // ----- Insight generation -----
    const insights = [];

    // Momentum headline based on sessions/minutes + change
    const sessionsDelta = pctChange(thisSessionsCount, lastSessionsCount);
    const minutesDelta = pctChange(thisMinutes, lastMinutes);

    let headline = "Weekly check-in";
    let tone = "neutral";

    if (thisSessionsCount >= 5 || thisMinutes >= 120) {
      headline = "Strong week 🔥";
      tone = "positive";
    } else if (thisSessionsCount >= 3 || thisMinutes >= 60) {
      headline = "Good momentum ✅";
      tone = "positive";
    } else if (thisSessionsCount >= 1) {
      headline = "You showed up 🙌";
      tone = "neutral";
    } else {
      headline = "Let’s restart gently 🌱";
      tone = "gentle";
    }

    // Core stats insight
    insights.push(
      `You logged ${thisSessionsCount} session${thisSessionsCount === 1 ? "" : "s"} for ${thisMinutes} minute${thisMinutes === 1 ? "" : "s"} this week.`
    );

    // Compare to last week if meaningful
    if (lastSessionsCount > 0 || lastMinutes > 0) {
      const sWord = sessionsDelta >= 0 ? "up" : "down";
      const mWord = minutesDelta >= 0 ? "up" : "down";
      insights.push(
        `Compared to last week: sessions ${sWord} ${Math.abs(sessionsDelta)}% and time ${mWord} ${Math.abs(minutesDelta)}%.`
      );
    } else if (thisSessionsCount > 0) {
      insights.push("This is your first week of tracked activity — great start.");
    }

    // Focus insight
    if (mostActiveTrack) {
      insights.push(`Most active track: **${mostActiveTrack}**.`);
    }

    // Streak insight
    if (user?.currentStreak >= 7) {
      insights.push(`Streak is at ${user.currentStreak} days — consistency is becoming a habit.`);
    } else if (user?.currentStreak >= 3) {
      insights.push(`Streak is at ${user.currentStreak} days — you’re building a solid rhythm.`);
    } else if (user?.currentStreak >= 1) {
      insights.push(`Streak is at ${user.currentStreak} day — keep it alive with a small session tomorrow.`);
    }

    // Recommendation (simple + actionable)
    let recommendation = "Pick one track and log a 10-minute session tomorrow.";
    if (thisSessionsCount >= 5) {
      recommendation = "Keep the streak alive: schedule one “easy” 10-minute session for a busy day.";
    } else if (thisSessionsCount >= 3) {
      recommendation = "Aim for 4 sessions next week: 3 normal + 1 quick 10-minute backup.";
    } else if (thisSessionsCount >= 1) {
      recommendation = "Try 2 sessions next week. Keep it small and repeatable.";
    } else {
      recommendation = "Start with one 10-minute session. Make it so easy you can’t say no.";
    }

    res.json({
      period: {
        thisWeekStart: thisWeekStart.toISOString(),
        lastWeekStart: lastWeekStart.toISOString(),
      },
      headline,
      tone,
      stats: {
        sessionsThisWeek: thisSessionsCount,
        minutesThisWeek: thisMinutes,
        xpThisWeek: thisXP,
        sessionsLastWeek: lastSessionsCount,
        minutesLastWeek: lastMinutes,
        xpLastWeek: lastXP,
        mostActiveTrack,
      },
      insights,
      recommendation,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;