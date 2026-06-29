const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  city:        { type: String, required: true, trim: true, index: true },
  address:     { type: String, required: true, trim: true },
  phone:       { type: String, trim: true, default: "" },
  type:        { type: String, required: true,
                 enum: ["Government", "Private", "Welfare", "Military"] },
  emergency:   { type: Boolean, default: false },
  featured:    { type: Boolean, default: false, index: true },
  specialties: [{ type: String, trim: true }],
  rating:      { type: Number, min: 0, max: 5, default: null },
  lat:         { type: Number, default: null },
  lng:         { type: Number, default: null },
}, { timestamps: true });

hospitalSchema.index({ name: "text", city: "text", address: "text" });

module.exports = mongoose.model("Hospital", hospitalSchema);
