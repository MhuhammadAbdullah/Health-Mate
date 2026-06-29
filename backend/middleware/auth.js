const { requireAuth, getAuth } = require("@clerk/express");
const protect = requireAuth();
const attachUser = (req, res, next) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
  req.clerkUserId = userId;
  next();
};
module.exports = { protect, attachUser };
