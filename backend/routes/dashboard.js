const router   = require("express").Router();
const { protect, attachUser } = require("../middleware/auth");
const Hospital  = require("../models/Hospital");
const Emergency = require("../models/Emergency");

router.use(protect, attachUser);

router.get("/stats", async (req, res) => {
  try {
    const [
      totalHospitals,
      featuredHospitals,
      totalEmergencyServices,
      cities,
    ] = await Promise.all([
      Hospital.countDocuments({}),
      Hospital.countDocuments({ featured: true }),
      Emergency.countDocuments({}),
      Hospital.distinct("city"),
    ]);

    res.json({
      success: true,
      totalHospitals,
      featuredHospitals,
      totalEmergencyServices,
      totalCities: cities.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
