const mongoose = require("mongoose");

function makePublicId(prefix) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return prefix + "-" + Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

const schema = new mongoose.Schema({
  clerkUserId: { type: String, required: true, index: true },
  publicId:    { type: String, unique: true, sparse: true, index: true },
  date: { type: Date, required: true, default: Date.now },
  bloodPressureSystolic: Number,
  bloodPressureDiastolic: Number,
  heartRate: Number,
  bloodSugar: Number,
  bloodSugarType: { type: String, enum: ["fasting", "random", "post_meal"], default: "random" },
  weight: Number,
  height: Number,
  temperature: Number,
  oxygenSaturation: Number,
  notes: String,
  aiAnalysis: {
    overallStatus: String,
    summary: String,
    romanUrduSummary: String,
    abnormalFindings: [String],
    dietAdvice: [String],
    lifestyleAdvice: [String],
    urgency: String,
    specialistRecommended: String,
    doctorQuestions: [String],
    analyzedAt: Date,
  },
  // suggestedHospitals: [
  //   { 
  //     name: String, 
  //     address: String, 
  //     phone: String, 
  //     type: String }
  //   ],

  suggestedHospitals: [
    {
      name: { type: String, default: "" },
      address: { type: String, default: "" },
      phone: { type: String, default: "" },
      type: { type: String, default: "General" },
    }
  ],

}, { timestamps: true });

schema.pre("validate", async function (next) {
  if (!this.publicId) {
    let id;
    do {
      id = makePublicId("VTL");
    } while (await this.constructor.exists({ publicId: id }));
    this.publicId = id;
  }
  next();
});

module.exports = mongoose.model("Vital", schema);
