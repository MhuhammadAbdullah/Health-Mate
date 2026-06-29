const mongoose = require("mongoose");

const emergencySchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  number:   { type: String, required: true, trim: true },
  desc:     { type: String, trim: true, default: "" },
  icon:     { type: String, trim: true, default: "bx bxs-first-aid" },
  color:    { type: String, trim: true, default: "#185FA5" },
  category: { type: String, trim: true, default: "" },
  province: { type: String, trim: true, default: "" },
  city:     { type: String, trim: true, default: "" },
  featured: { type: Boolean, default: false, index: true },
  order:    { type: Number, default: 0 },
}, { timestamps: true });

emergencySchema.index({ name: "text", number: "text", desc: "text" });
emergencySchema.index({ category: 1 });
emergencySchema.index({ province: 1 });

module.exports = mongoose.model("Emergency", emergencySchema);
