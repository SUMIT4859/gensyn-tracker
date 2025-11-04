// backend-public/server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const helmet = require("helmet");

const app = express();

// --- uploads folder ---
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// --- CORS: allow env-configured origins (local + deployed) ---
const FRONTENDS = (process.env.ALLOWED_ORIGINS || "http://127.0.0.1:5500,http://localhost:5500")
  .split(",")
  .map(u => u.trim());
app.use(cors({ origin: FRONTENDS, credentials: true }));

// Security headers: keep helmet but disable CSP temporarily so inline scripts work
app.use(helmet({
  contentSecurityPolicy: false
}));

// parse JSON and urlencoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// serve uploaded images
app.use("/uploads", express.static(uploadDir));

// --- Serve frontend static files (project root) ---
// server.js is in backend-public; frontend files are in parent folder
const frontendRoot = path.join(__dirname, "..");
app.use(express.static(frontendRoot));
// fallback to index.html
app.get("/", (req, res) => res.sendFile(path.join(frontendRoot, "index.html")));

// optional health check
app.get("/healthz", (_req, res) => res.status(200).send("ok"));

// --- Connect to MongoDB ---
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ MONGO_URI is not set. Please add it to environment variables.");
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// --- Routes ---
app.use("/api/auth", require("./routes/auth"));
app.use("/api/contributions", require("./routes/contributions"));

// 404 handler
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// error handler
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: "Internal Server Error" });
});

// start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

// graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down...");
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed.");
      process.exit(0);
    });
  });
});
