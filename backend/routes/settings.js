const router      = require("express").Router();
const { protect, attachUser } = require("../middleware/auth");
const { requireAdmin }        = require("../middleware/admin");
const SiteSettings = require("../models/SiteSettings");

router.use(protect, attachUser);

// ── GET /settings/:page — all authenticated users ─────────────────────────
router.get("/:page", async (req, res) => {
  try {
    const doc = await SiteSettings.findOne({ page: req.params.page }).lean();
    res.json({ success: true, settings: doc || { page: req.params.page } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /settings/:page — admin only (upsert) ─────────────────────────────
router.put("/:page", requireAdmin, async (req, res) => {
  try {
    const { heroTitle, heroSubtitle, buttonText } = req.body;
    const doc = await SiteSettings.findOneAndUpdate(
      { page: req.params.page },
      { heroTitle, heroSubtitle, buttonText },
      { new: true, upsert: true, runValidators: true }
    ).lean();
    res.json({ success: true, settings: doc });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
