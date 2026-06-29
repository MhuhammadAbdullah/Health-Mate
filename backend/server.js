require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { clerkMiddleware } = require("@clerk/express");

// ── Validate required env vars on startup ──────────────────────────────────
const REQUIRED = ["MONGODB_URI", "CLERK_SECRET_KEY", "CLERK_PUBLISHABLE_KEY"];
const missing = REQUIRED.filter(k => !process.env[k]);
if (missing.length) {
  console.error("❌ Missing required env vars:", missing.join(", "));
  console.error("   Copy backend/.env.example to backend/.env and fill in all values");
  process.exit(1);
}

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Clerk middleware — needs both CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY in env
app.use(clerkMiddleware({
  secretKey:       process.env.CLERK_SECRET_KEY,
  publishableKey:  process.env.CLERK_PUBLISHABLE_KEY,
}));

// Routes
app.use("/api/users",     require("./routes/users"));
app.use("/api/reports",   require("./routes/reports"));
app.use("/api/vitals",    require("./routes/vitals"));
app.use("/api/hospitals", require("./routes/hospitals"));
app.use("/api/emergency", require("./routes/emergency"));
app.use("/api/settings",   require("./routes/settings"));
app.use("/api/dashboard", require("./routes/dashboard"));

app.get("/api/health", (_, res) => res.json({
  ok: true,
  timestamp: new Date(),
  ai: process.env.AI_PROVIDER || "gemini",
}));

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);
  res.status(err.status || 500).json({ success: false, message: err.message || "Internal server error" });
});

// Connect MongoDB then start
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 HealthMate server running on http://localhost:${PORT}`);
      console.log(`🤖 AI Provider: ${process.env.AI_PROVIDER || "gemini"}`);
    });
  })
  .catch(err => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });
