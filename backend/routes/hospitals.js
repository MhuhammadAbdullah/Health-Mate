const router   = require("express").Router();
const { protect, attachUser } = require("../middleware/auth");
const { requireAdmin }        = require("../middleware/admin");
const Hospital = require("../models/Hospital");

router.use(protect, attachUser);

// ── Haversine distance (km, 1 decimal) ────────────────────────────────────
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

// Helper — convert Mongoose lean doc to plain object with id field
function toPlain(doc) {
  const obj = { ...doc };
  obj.id  = doc._id.toString();
  delete obj._id;
  delete obj.__v;
  return obj;
}

// ── GET /hospitals/meta — filter dropdown options ─────────────────────────
router.get("/meta", async (req, res) => {
  try {
    const [cities, types, specialties] = await Promise.all([
      Hospital.distinct("city"),
      Hospital.distinct("type"),
      Hospital.distinct("specialties"),
    ]);
    res.json({
      success: true,
      cities:      cities.sort(),
      types:       types.sort(),
      specialties: specialties.sort(),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /hospitals — paginated list with search, filters, nearby ──────────
router.get("/", async (req, res) => {
  const { city, type, search, specialty, page = 1, limit = 12, lat, lng, radius } = req.query;

  try {
    const filter = {};
    if (city)      filter.city = { $regex: `^${city.trim()}$`, $options: "i" };
    if (type)      filter.type = { $regex: `^${type.trim()}$`, $options: "i" };
    if (specialty) filter.specialties = { $elemMatch: { $regex: specialty.trim(), $options: "i" } };
    if (search) {
      const q = search.trim();
      filter.$or = [
        { name:        { $regex: q, $options: "i" } },
        { city:        { $regex: q, $options: "i" } },
        { address:     { $regex: q, $options: "i" } },
        { specialties: { $elemMatch: { $regex: q, $options: "i" } } },
      ];
    }

    const pageN  = Math.max(1, parseInt(page));
    const limitN = Math.min(48, Math.max(1, parseInt(limit)));

    // Nearby mode — load all matching, compute distances, filter + sort in JS
    if (lat && lng) {
      const uLat    = parseFloat(lat);
      const uLng    = parseFloat(lng);
      const maxDist = radius ? parseFloat(radius) : 10;

      const all = await Hospital.find(filter).lean();
      const nearby = all
        .map(h => ({ ...toPlain(h), distance: haversine(uLat, uLng, h.lat, h.lng) }))
        .filter(h => h.distance <= maxDist)
        .sort((a, b) => a.distance - b.distance);

      const total = nearby.length;
      const paged = nearby.slice((pageN - 1) * limitN, pageN * limitN);
      return res.json({ success: true, hospitals: paged, total, page: pageN, pages: Math.ceil(total / limitN) });
    }

    const [total, docs] = await Promise.all([
      Hospital.countDocuments(filter),
      Hospital.find(filter).sort({ featured: -1, city: 1, name: 1 }).skip((pageN - 1) * limitN).limit(limitN).lean(),
    ]);

    res.json({
      success: true,
      hospitals: docs.map(toPlain),
      total,
      page: pageN,
      pages: Math.ceil(total / limitN),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /hospitals/:id ────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const doc = await Hospital.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ success: false, message: "Hospital not found" });
    res.json({ success: true, hospital: toPlain(doc) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /hospitals — admin only ──────────────────────────────────────────
router.post("/", requireAdmin, async (req, res) => {
  try {
    const doc = await Hospital.create(req.body);
    res.status(201).json({ success: true, hospital: toPlain(doc.toObject()) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── PUT /hospitals/:id — admin only ──────────────────────────────────────
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const doc = await Hospital.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).lean();
    if (!doc) return res.status(404).json({ success: false, message: "Hospital not found" });
    res.json({ success: true, hospital: toPlain(doc) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── DELETE /hospitals/:id — admin only ────────────────────────────────────
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const doc = await Hospital.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Hospital not found" });
    res.json({ success: true, message: "Hospital deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
