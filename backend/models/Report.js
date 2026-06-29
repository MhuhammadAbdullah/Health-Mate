const mongoose = require("mongoose");

function makePublicId(prefix) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // omit I/O/0/1 to avoid visual confusion
  return prefix + "-" + Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

const schema = new mongoose.Schema({
  clerkUserId: { type: String, required: true, index: true },
  publicId:    { type: String, unique: true, sparse: true, index: true },
  title: { type: String, required: true, trim: true },
  type: { type: String, required: true },
  date: { type: Date, required: true },
  labName: { type: String, trim: true },
  doctorName: { type: String, trim: true },
  description: { type: String },
  findings: { type: String },
  notes: { type: String },
  status: { type: String, enum: ["normal", "abnormal", "critical", "pending"], default: "pending" },
  fileUrl: { type: String },
  filePublicId: { type: String },
  fileType: { type: String, enum: ["pdf", "image", "none"], default: "none" },
  tags: [String],
  isStarred: { type: Boolean, default: false },
  aiAnalysis: {
    summary: String,
    abnormalValues: String,
    normalValues: String,
    healthInsights: String,
    dietAdvice: String,
    homeRemedies: String,
    doctorQuestions: String,
    urgency: { type: String, enum: ["LOW", "MEDIUM", "HIGH"] },
    romanUrduSummary: String,
    analyzedAt: Date,
  },
  // suggestedHospitals: [{
  //   name: String,
  //   address: String,
  //   phone: String,
  //   type: String,
  //   distance: String
  // }],
  suggestedHospitals: [
    {
      _id: false,
      name: { type: String, default: "" },
      address: { type: String, default: "" },
      phone: { type: String, default: "" },
      type: { type: String, default: "" },   // must use { type: String } not plain String — Mongoose treats a bare `type` key as the path's type declaration, collapsing the sub-doc to [String]
    }
  ]
}, { timestamps: true });

// Auto-generate publicId on first save
schema.pre("validate", async function (next) {
  if (!this.publicId) {
    let id;
    do {
      id = makePublicId("RPT");
    } while (await this.constructor.exists({ publicId: id }));
    this.publicId = id;
  }
  next();
});

module.exports = mongoose.model("Report", schema);
