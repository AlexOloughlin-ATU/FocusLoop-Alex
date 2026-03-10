const express = require("express");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "email displayName totalXP level currentStreak lastActiveDate theme createdAt"
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/me", authMiddleware, async (req, res) => {
  try {
    const { displayName, theme } = req.body;

    const update = {};
    if (typeof displayName === "string" && displayName.trim()) {
      update.displayName = displayName.trim().slice(0, 40);
    }
    if (["light", "dark"].includes(theme)) {
      update.theme = theme;
    }

    const user = await User.findByIdAndUpdate(req.user.id, update, {
      new: true,
      runValidators: true,
    }).select("email displayName totalXP level currentStreak lastActiveDate theme createdAt");

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
