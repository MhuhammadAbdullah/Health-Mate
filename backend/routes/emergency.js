const router    = require("express").Router();
const { protect, attachUser } = require("../middleware/auth");
const { requireAdmin }        = require("../middleware/admin");
const Emergency = require("../models/Emergency");

router.use(protect, attachUser);

function toPlain(doc) {
  const obj = { ...doc };
  obj.id = doc._id.toString();
  delete obj._id;
  delete obj.__v;
  return obj;
}

// ── GET /emergency/meta — distinct filter values ──────────────────────────
router.get("/meta", async (req, res) => {
  try {
    const [categories, provinces, cities] = await Promise.all([
      Emergency.distinct("category"),
      Emergency.distinct("province"),
      Emergency.distinct("city"),
    ]);
    const clean = arr => arr.filter(Boolean).sort();
    res.json({ success: true, categories: clean(categories), provinces: clean(provinces), cities: clean(cities) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /emergency — server-side filtering + pagination ───────────────────
router.get("/", async (req, res) => {
  const {
    search, category, province, city, featured,
    page = 1, limit = 12, sort,
  } = req.query;

  try {
    const filter = {};

    if (category) filter.category = category.trim();
    if (province) filter.province = province.trim();
    if (city)     filter.city     = { $regex: city.trim(), $options: "i" };
    if (featured === "true") filter.featured = true;

    if (search) {
      const q = search.trim();
      filter.$or = [
        { name:   { $regex: q, $options: "i" } },
        { number: { $regex: q, $options: "i" } },
        { desc:   { $regex: q, $options: "i" } },
      ];
    }

    const pageN  = Math.max(1, parseInt(page));
    const limitN = Math.min(100, Math.max(1, parseInt(limit)));

    const sortMap = {
      newest:  { createdAt: -1 },
      oldest:  { createdAt:  1 },
    };
    const sortOrder = sortMap[sort] || { featured: -1, order: 1, createdAt: 1 };

    const [total, docs] = await Promise.all([
      Emergency.countDocuments(filter),
      Emergency.find(filter).sort(sortOrder).skip((pageN - 1) * limitN).limit(limitN).lean(),
    ]);

    res.json({
      success: true,
      emergencyNumbers: docs.map(toPlain),
      total,
      page:  pageN,
      pages: Math.ceil(total / limitN),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /emergency/:id ─────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const doc = await Emergency.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, service: toPlain(doc) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /emergency — admin only ───────────────────────────────────────────
router.post("/", requireAdmin, async (req, res) => {
  try {
    const doc = await Emergency.create(req.body);
    res.status(201).json({ success: true, service: toPlain(doc.toObject()) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── PUT /emergency/:id — admin only ───────────────────────────────────────
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const doc = await Emergency.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    ).lean();
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, service: toPlain(doc) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── DELETE /emergency/:id — admin only ────────────────────────────────────
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const doc = await Emergency.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
