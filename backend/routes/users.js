const router = require("express").Router();
const { protect, attachUser } = require("../middleware/auth");
const UserProfile = require("../models/UserProfile");

router.use(protect, attachUser);

router.get("/profile", async (req, res) => {
  try {
    let p = await UserProfile.findOne({ clerkUserId: req.clerkUserId });
    if (!p) p = await UserProfile.create({ clerkUserId: req.clerkUserId });
    const profile = p.toObject();
    // Backfill: surface legacy phone field under phoneNumber if new field is empty
    if (!profile.phoneNumber && profile.phone) profile.phoneNumber = profile.phone;
    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/profile", async (req, res) => {
  try {
    const {
      profilePicture, name, country, phoneCountryCode, phoneNumber,
      city, gender, bloodGroup, dateOfBirth,
    } = req.body;

    if (!name || !name.trim())
      return res.status(400).json({ success: false, message: "Full name is required" });

    const update = {
      name:             name.trim(),
      country:          (country          || "").trim(),
      phoneCountryCode: (phoneCountryCode || "").trim(),
      phoneNumber:      (phoneNumber      || "").trim(),
      city:             (city             || "").trim(),
      gender:           gender      || "",
      bloodGroup:       bloodGroup  || "",
      dateOfBirth:      dateOfBirth || null,
    };
    if (profilePicture !== undefined) update.profilePicture = profilePicture;

    const p = await UserProfile.findOneAndUpdate(
      { clerkUserId: req.clerkUserId },
      update,
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ success: true, profile: p });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
