require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const helmet = require("helmet"); // optional but recommended

const app = express();

// --- uploads folder ---
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// --- CORS: allow env-configured origins (local + deployed) ---
const FRONTENDS = (process.env.ALLOWED_ORIGINS || "http://127.0.0.1:5500,http://localhost:5500")
  .split(",")
  .map(u => u.trim());
app.use(cors({ origin: FRONTENDS, credentials: true }));

// Security headers (optional but recommended)
app.use(helmet());

// parse JSON bodies
app.use(express.json());

// serve uploaded images
app.use("/uploads", express.static(uploadDir));

// --- Serve frontend static files (project root) ---
// server.js is in backend-public; frontend files are in parent folder
const frontendRoot = path.join(__dirname, "..");
app.use(express.static(frontendRoot));
// fallback to index.html for single-page navigation
app.get("/", (req, res) => res.sendFile(path.join(frontendRoot, "index.html")));

// --- Connect to MongoDB ---
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
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
