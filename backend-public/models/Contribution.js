// backend-public/models/Contribution.js
const mongoose = require("mongoose");

const ContributionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  link: { type: String },
  description: { type: String },
  date: { type: String },
  screenshot: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

module.exports = mongoose.model("Contribution", ContributionSchema);
