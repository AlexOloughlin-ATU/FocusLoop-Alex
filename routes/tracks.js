const express = require("express");
const Track = require("../models/Track");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, targetPerWeek, xpPerSession, accent } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Track title is required" });
    }

    const track = await Track.create({
      user: req.user.id,
      title: title.trim(),
      targetPerWeek: Number(targetPerWeek) || 3,
      xpPerSession: Number(xpPerSession) || 10,
      accent: accent || "indigo",
    });

    res.status(201).json(track);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const tracks = await Track.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(tracks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const { title, targetPerWeek, xpPerSession, accent } = req.body;

    const updated = await Track.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      {
        ...(title ? { title: title.trim() } : {}),
        ...(targetPerWeek ? { targetPerWeek: Number(targetPerWeek) } : {}),
        ...(xpPerSession ? { xpPerSession: Number(xpPerSession) } : {}),
        ...(accent ? { accent } : {}),
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Track not found" });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const track = await Track.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!track) {
      return res.status(404).json({ message: "Track not found" });
    }

    res.json({ message: "Track deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
