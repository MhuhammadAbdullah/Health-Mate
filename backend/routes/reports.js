const router = require("express").Router();
const { protect, attachUser } = require("../middleware/auth");
const { upload, cloudinary } = require("../middleware/upload");
const { analyzeReport } = require("../middleware/aiService");
const Report = require("../models/Report");

// Pakistan hospitals by city for suggestions
const HOSPITALS_BY_CITY = {
  karachi: [
    { name: "Aga Khan University Hospital", address: "Stadium Road, Karachi", phone: "021-111-911-911", type: "Private" },
    { name: "South City Hospital", address: "Clifton, Karachi", phone: "021-35864871", type: "Private" },
    { name: "Civil Hospital Karachi", address: "Baba-e-Urdu Road, Karachi", phone: "021-99215740", type: "Government" },
    { name: "Liaquat National Hospital", address: "Stadium Road, Karachi", phone: "021-34412000", type: "Private" },
    { name: "Ziauddin Hospital", address: "North Nazimabad, Karachi", phone: "021-111-942-942", type: "Private" },
  ],
  lahore: [
    { name: "Mayo Hospital", address: "Nila Gumbad, Lahore", phone: "042-99231404", type: "Government" },
    { name: "Shaukat Khanum Cancer Hospital", address: "Johar Town, Lahore", phone: "042-35945100", type: "Private" },
    { name: "Services Hospital", address: "Jail Road, Lahore", phone: "042-99203721", type: "Government" },
  ],
  islamabad: [
    { name: "PIMS Hospital", address: "G-8/3, Islamabad", phone: "051-9261170", type: "Government" },
    { name: "Shifa International Hospital", address: "H-8/4, Islamabad", phone: "051-111-741-741", type: "Private" },
  ],
  default: [
    { name: "Nearest Govt Hospital", address: "Contact local health department", phone: "115", type: "Government" },
    { name: "Edhi Foundation", address: "Nearest branch", phone: "115", type: "NGO" },
  ],
};

function getHospitals(city, urgency) {
  const key = city ? city.toLowerCase() : "default";
  const list = HOSPITALS_BY_CITY[key] || HOSPITALS_BY_CITY.default;
  const count = urgency === "HIGH" ? 3 : urgency === "MEDIUM" ? 2 : 1;
  return list.slice(0, count);
}

router.use(protect, attachUser);

// Accept both publicId (e.g. "RPT-8KX29M4Q") and legacy MongoDB _id.
// After migration runs all records will have publicId; until then _id fallback
// ensures existing records remain accessible.
function resolveFilter(id, clerkUserId) {
  const isMongoId = /^[a-f\d]{24}$/i.test(id);
  if (isMongoId) {
    return { $or: [{ publicId: id }, { _id: id }], clerkUserId };
  }
  return { publicId: id, clerkUserId };
}

router.get("/", async (req, res) => {
  try {
    const { type, status, search, page = 1, limit = 20 } = req.query;
    const q = { clerkUserId: req.clerkUserId };
    if (type) q.type = type;
    if (status) q.status = status;
    if (search) q.$or = [
      { title: { $regex: search, $options: "i" } },
      { labName: { $regex: search, $options: "i" } },
      { doctorName: { $regex: search, $options: "i" } },
    ];
    const total = await Report.countDocuments(q);
    const reports = await Report.find(q).sort("-date").limit(+limit).skip((+page - 1) * +limit);
    res.json({ success: true, total, reports });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get("/:id", async (req, res) => {
  try {
    const report = await Report.findOne(resolveFilter(req.params.id, req.clerkUserId));
    if (!report) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, report });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post("/", upload.single("file"), async (req, res) => {
  try {
    const { title, type, date, labName, doctorName, description, findings, notes, status, tags, city } = req.body;
    let fileUrl = "", filePublicId = "", fileType = "none";
    if (req.file) {
      fileUrl = req.file.path;
      filePublicId = req.file.filename;
      fileType = req.file.mimetype === "application/pdf" ? "pdf" : "image";
    }

    // Run AI analysis
    let aiAnalysis = null;
    let suggestedHospitals = [];
    try {
      aiAnalysis = await analyzeReport({ imageUrl: fileUrl, fileType, title, reportType: type, description });
      if (aiAnalysis) {
        aiAnalysis.analyzedAt = new Date();
        const urgency = aiAnalysis.urgency || "LOW";
        suggestedHospitals = getHospitals(city, urgency);
      }
    } catch (e) { console.error("AI step failed:", e.message); }

    const report = await Report.create({
      clerkUserId: req.clerkUserId,
      title, type, date, labName, doctorName, description, findings, notes,
      status: status || "pending",
      tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      fileUrl, filePublicId, fileType,
      aiAnalysis,
      suggestedHospitals,
    });

    res.status(201).json({ success: true, report });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put("/:id", async (req, res) => {
  try {
    const report = await Report.findOneAndUpdate(
      resolveFilter(req.params.id, req.clerkUserId),
      req.body, { new: true }
    );
    if (!report) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, report });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// router.delete("/:id", async (req, res) => {
//   try {
//     const report = await Report.findOne({ _id: req.params.id, clerkUserId: req.clerkUserId });
//     if (!report) return res.status(404).json({ success: false, message: "Not found" });
//     if (report.filePublicId) await cloudinary.uploader.destroy(report.filePublicId, { resource_type: "auto" });
//     await report.deleteOne();
//     res.json({ success: true });
//   } catch (err) { res.status(500).json({ success: false, message: err.message }); }
// });



router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invalid report id"
      });
    }

    const report = await Report.findOneAndDelete(resolveFilter(id, req.clerkUserId));

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found or unauthorized"
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE REPORT ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

router.patch("/:id/star", async (req, res) => {
  try {
    const report = await Report.findOne(resolveFilter(req.params.id, req.clerkUserId));
    if (!report) return res.status(404).json({ success: false, message: "Not found" });
    report.isStarred = !report.isStarred;
    await report.save();
    res.json({ success: true, isStarred: report.isStarred });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Re-run AI analysis
router.post("/:id/analyze", async (req, res) => {
  try {
    const report = await Report.findOne(resolveFilter(req.params.id, req.clerkUserId));
    if (!report) return res.status(404).json({ success: false, message: "Not found" });
    const aiAnalysis = await analyzeReport({
      imageUrl: report.fileUrl, fileType: report.fileType,
      title: report.title, reportType: report.type, description: report.description,
    });
    if (aiAnalysis) {
      aiAnalysis.analyzedAt = new Date();
      report.aiAnalysis = aiAnalysis;
      await report.save();
    }
    res.json({ success: true, aiAnalysis: report.aiAnalysis });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
