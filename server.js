require("dotenv").config();
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");

const authRoutes = require("./routes/auth");
const trackRoutes = require("./routes/tracks");
const sessionRoutes = require("./routes/sessions");
const statsRoutes = require("./routes/stats");
const analyticsRoutes = require("./routes/analytics");
const insightsRoutes = require("./routes/insights");
const profileRoutes = require("./routes/profile");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/tracks", trackRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/insights", insightsRoutes);

app.get("/health", (req, res) => {
  res.json({ ok: true, status: "up" });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/auth", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "auth.html"));
});

app.get("/app", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "app.html"));
});

async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in .env");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in .env");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Startup error:", error.message);
    process.exit(1);
  }
}

startServer();
