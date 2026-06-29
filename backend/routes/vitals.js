const router = require("express").Router();
const { protect, attachUser } = require("../middleware/auth");
const { analyzeVitals } = require("../middleware/aiService");
const Vital = require("../models/Vital");

// ── Hospital suggestions by city + specialist ──────────────────────────────
const SPECIALIST_HOSPITALS = {
  karachi: {
    Cardiologist:    { name: "Aga Khan University Hospital — Cardiology",     phone: "021-111-911-911", address: "Stadium Road, Karachi" },
    Endocrinologist: { name: "Liaquat National Hospital — Diabetes Clinic",   phone: "021-34412000",    address: "Stadium Road, Karachi" },
    default:         { name: "South City Hospital",                           phone: "021-35864871",    address: "Clifton, Karachi" },
  },
  lahore: {
    Cardiologist: { name: "Shaukat Khanum Memorial",    phone: "042-35945100", address: "Johar Town, Lahore" },
    default:      { name: "Services Hospital Lahore",   phone: "042-99203721", address: "Jail Road, Lahore" },
  },
  islamabad: {
    Cardiologist: { name: "Shifa International Hospital", phone: "051-111-741-741", address: "H-8/4, Islamabad" },
    default:      { name: "PIMS Hospital",                phone: "051-9261170",     address: "G-8/3, Islamabad" },
  },
  default: {
    default: { name: "Nearest Government Hospital", phone: "115", address: "Contact local health dept" },
  },
};

function suggestHospitals(city, aiResult) {
  const key = city?.toLowerCase() || "default";
  const map = SPECIALIST_HOSPITALS[key] || SPECIALIST_HOSPITALS.default;
  const specialist = aiResult?.specialistRecommended;
  const h = (specialist && map[specialist]) ? map[specialist] : map.default;
  return [{ name: h.name, address: h.address, phone: h.phone, type: specialist || "General" }];
}

// ── Build AI input payload from vital readings ─────────────────────────────
function buildVitalsPayload(data) {
  const v = {};
  if (data.bloodPressureSystolic)
    v.bloodPressure = `${data.bloodPressureSystolic}/${data.bloodPressureDiastolic || "?"} mmHg`;
  if (data.heartRate)
    v.heartRate = `${data.heartRate} bpm`;
  if (data.bloodSugar)
    v.bloodSugar = `${data.bloodSugar} mg/dL (${data.bloodSugarType || "random"})`;
  if (data.weight && data.height) {
    v.weight = `${data.weight} kg`;
    v.height = `${data.height} cm`;
    v.bmi    = (data.weight / ((data.height / 100) ** 2)).toFixed(1);
  }
  if (data.temperature)      v.temperature      = `${data.temperature}°F`;
  if (data.oxygenSaturation) v.oxygenSaturation = `${data.oxygenSaturation}%`;
  return v;
}

// ── Background AI job — fires after response is sent ──────────────────────
async function runVitalsAI(vitalId, vitalData, city) {
  try {
    const payload   = buildVitalsPayload(vitalData);
    const aiResult  = await analyzeVitals({ vitals: payload });
    if (aiResult && !aiResult.error) {
      await Vital.findByIdAndUpdate(vitalId, {
        aiAnalysis:         { ...aiResult, analyzedAt: new Date() },
        suggestedHospitals: suggestHospitals(city, aiResult),
      });
      console.log("✅ BG AI vitals saved for", vitalId);
    }
  } catch (e) {
    console.error("❌ BG AI vitals error:", e.message);
  }
}

// ── Auth ───────────────────────────────────────────────────────────────────
router.use(protect, attachUser);

function resolveFilter(id, clerkUserId) {
  const isMongoId = /^[a-f\d]{24}$/i.test(id);
  if (isMongoId) {
    return { $or: [{ publicId: id }, { _id: id }], clerkUserId };
  }
  return { publicId: id, clerkUserId };
}

// ── GET all vitals ─────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const vitals = await Vital.find({ clerkUserId: req.clerkUserId }).sort({ date: -1 }).limit(500);
    res.json({ success: true, vitals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET single vital ───────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const vital = await Vital.findOne(resolveFilter(req.params.id, req.clerkUserId));
    if (!vital) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, vital });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST — save immediately, run AI in background ─────────────────────────
router.post("/", async (req, res) => {
  try {
    const { city, ...vitalData } = req.body;

    if (!vitalData.date) return res.status(400).json({ success: false, message: "date is required" });

    const vital = await Vital.create({ ...vitalData, clerkUserId: req.clerkUserId });

    // Respond immediately — don't block on AI
    res.status(201).json({ success: true, vital, aiPending: true });

    // Fire-and-forget background AI job
    runVitalsAI(vital._id, vitalData, city);
  } catch (err) {
    console.error("POST Vitals Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /:id/analyze — re-run AI for an existing vital (background) ──────
router.post("/:id/analyze", async (req, res) => {
  try {
    const vital = await Vital.findOne(resolveFilter(req.params.id, req.clerkUserId));
    if (!vital) return res.status(404).json({ success: false, message: "Not found" });

    // Respond immediately — AI runs in the background.
    // Client polls GET /:id until aiAnalysis.analyzedAt is newer than this response.
    res.json({ success: true, pending: true, message: "AI analysis started" });

    runVitalsAI(vital._id, vital.toObject(), null);
  } catch (err) {
    console.error("Re-analyze error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE ─────────────────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    await Vital.findOneAndDelete(resolveFilter(req.params.id, req.clerkUserId));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
