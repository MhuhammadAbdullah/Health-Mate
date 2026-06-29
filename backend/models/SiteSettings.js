const mongoose = require("mongoose");

const siteSettingsSchema = new mongoose.Schema({
  page:         { type: String, required: true, unique: true, trim: true },
  heroTitle:    { type: String, trim: true, default: "" },
  heroSubtitle: { type: String, trim: true, default: "" },
  buttonText:   { type: String, trim: true, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("SiteSettings", siteSettingsSchema);
