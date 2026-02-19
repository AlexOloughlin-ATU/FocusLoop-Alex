const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

app.get("/", (req, res) => res.send("FocusLoop API Running"));

const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const authMiddleware = require("./middleware/authMiddleware");

app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({ message: "You accessed protected data!", userId: req.user.id });
});

const trackRoutes = require("./routes/tracks");
app.use("/api/tracks", trackRoutes);

const sessionRoutes = require("./routes/sessions");
app.use("/api/sessions", sessionRoutes);

const statsRoutes = require("./routes/stats");
app.use("/api/stats", statsRoutes);

const insightsRoutes = require("./routes/insights");
app.use("/api/insights", insightsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const analyticsRoutes = require("./routes/analytics");
app.use("/api/analytics", analyticsRoutes);