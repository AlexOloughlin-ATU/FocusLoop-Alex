const express = require("express");
const Track = require("../models/Track");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Create Track
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, targetPerWeek, xpPerSession } = req.body;

    const track = await Track.create({
      user: req.user.id,
      title,
      targetPerWeek,
      xpPerSession
    });

    res.status(201).json(track);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get All User Tracks
router.get("/", authMiddleware, async (req, res) => {
  try {
    const tracks = await Track.find({ user: req.user.id });
    res.json(tracks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete Track
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const track = await Track.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
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