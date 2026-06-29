const { getAuth } = require("@clerk/express");

// Checks ADMIN_USER_IDS env var (comma-separated Clerk user IDs).
// Set in backend/.env:  ADMIN_USER_IDS=user_abc123,user_def456
function requireAdmin(req, res, next) {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  const adminIds = (process.env.ADMIN_USER_IDS || "")
    .split(",").map(s => s.trim()).filter(Boolean);

  if (!adminIds.length) {
    return res.status(403).json({
      success: false,
      message: "No admin users configured. Set ADMIN_USER_IDS in backend .env",
    });
  }

  if (!adminIds.includes(userId)) {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }

  next();
}

module.exports = { requireAdmin };
