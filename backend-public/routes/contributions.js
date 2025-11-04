// backend-public/routes/contributions.js
const express = require("express");
const router = express.Router();
const Contribution = require("../models/Contribution");
const auth = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { Parser } = require("json2csv");

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// CREATE
router.post("/", auth, upload.single("screenshot"), async (req, res) => {
  try {
    const contributionData = { ...req.body, userId: req.userId };
    if (req.file) {
      contributionData.screenshot = `/uploads/${req.file.filename}`;
    }
    const contribution = new Contribution(contributionData);
    await contribution.save();
    res.status(201).json(contribution);
  } catch (err) {
    console.error("Save Error:", err);
    res.status(400).json({ error: err.message || "Failed to save contribution" });
  }
});

// READ ALL
router.get("/", auth, async (req, res) => {
  try {
    const list = await Contribution.find({ userId: req.userId }).sort({ date: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch contributions" });
  }
});

// READ ONE
router.get("/:id", auth, async (req, res) => {
  try {
    const contribution = await Contribution.findOne({ _id: req.params.id, userId: req.userId });
    if (!contribution) return res.status(404).json({ error: "Contribution not found" });
    res.json(contribution);
  } catch (err) {
    res.status(400).json({ error: "Invalid request" });
  }
});

// UPDATE
router.put("/:id", auth, upload.single("screenshot"), async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) updateData.screenshot = `/uploads/${req.file.filename}`;
    const updated = await Contribution.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updateData,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Contribution not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Failed to update contribution" });
  }
});

// DELETE
router.delete("/:id", auth, async (req, res) => {
  try {
    const deleted = await Contribution.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!deleted) return res.status(404).json({ error: "Contribution not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: "Failed to delete contribution" });
  }
});

// EXPORT CSV
router.get("/export/csv", auth, async (req, res) => {
  try {
    const contributions = await Contribution.find({ userId: req.userId }).lean();
    if (!contributions.length) return res.status(404).json({ message: "No data available for export" });

    const fields = ["title", "category", "link", "description", "date", "screenshot"];
    const parser = new Parser({ fields });
    const csv = parser.parse(contributions);

    res.header("Content-Type", "text/csv");
    res.attachment("contributions.csv");
    res.send(csv);
  } catch (err) {
    console.error("CSV Error:", err);
    res.status(500).json({ error: "Error exporting CSV" });
  }
});

module.exports = router;
