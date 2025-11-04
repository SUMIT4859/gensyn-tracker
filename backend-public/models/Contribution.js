const mongoose = require("mongoose");

const ContributionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  link: { type: String },
  description: { type: String },
  date: { type: String }, // Accept string for easier front-end handling
  screenshot: { type: String }, // always use 'screenshot'
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
});

module.exports = mongoose.model("Contribution", ContributionSchema);
