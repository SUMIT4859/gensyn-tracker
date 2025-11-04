// backend-public/server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const helmet = require("helmet");

const app = express();

// uploads dir
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Frontend root (one level up)
const frontendRoot = path.join(__dirname, "..");

// CORS - allow same-origin requests; allow deployed origins via env var
const FRONTENDS = (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: FRONTENDS.length ? FRONTENDS : [ "https://gensyn-tracker.onrender.com" ],
  credentials: true
}));

// Security - basic
app.use(helmet());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads and frontend static
app.use("/uploads", express.static(uploadDir));
app.use(express.static(frontendRoot));
app.get("/", (req, res) => res.sendFile(path.join(frontendRoot, "index.html")));

// Health check
app.get("/healthz", (_req, res) => res.send("ok"));

// MongoDB
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ MONGO_URI not set");
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/contributions", require("./routes/contributions"));

// 404
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// error handler
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: "Internal Server Error" });
});

// start
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

process.on("SIGINT", () => {
  console.log("Shutting down...");
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed.");
      process.exit(0);
    });
  });
});
