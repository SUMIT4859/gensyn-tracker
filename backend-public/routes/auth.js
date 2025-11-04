const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const exist = await User.findOne({ email });
    if (exist) return res.status(400).json({ error: "Email already exists" });

    const user = new User({ username, email, password });
    await user.save();
    res.json({ message: "Registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: "2d" });
    res.json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
