/**
 * Upload Middleware — Cloudinary
 *
 * If Cloudinary credentials are missing or invalid, falls back to
 * local disk storage so the app still works without file upload.
 *
 * Common error: "getaddrinfo EAI_AGAIN api.cloudinary.com"
 *   → Either your Cloudinary credentials are wrong, OR
 *   → Your internet/DNS can't reach api.cloudinary.com
 *   Fix: double-check CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET in .env
 */

const multer  = require("multer");
const path    = require("path");
const os      = require("os");

const CLOUD_NAME   = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUD_KEY    = process.env.CLOUDINARY_API_KEY;
const CLOUD_SECRET = process.env.CLOUDINARY_API_SECRET;

const hasCloudinary = CLOUD_NAME && CLOUD_KEY && CLOUD_SECRET
  && CLOUD_NAME !== "your_cloud_name";   // ignore placeholder values

let cloudinary = null;
let storage;

if (hasCloudinary) {
  // ── Cloudinary storage ───────────────────────────────────────────────────
  cloudinary = require("cloudinary").v2;
  cloudinary.config({ cloud_name: CLOUD_NAME, api_key: CLOUD_KEY, api_secret: CLOUD_SECRET });

  const { CloudinaryStorage } = require("multer-storage-cloudinary");
  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder:          "healthmate/reports",
      allowed_formats: ["jpg","jpeg","png","pdf","webp"],
      resource_type:   "auto",
    },
  });
  console.log("☁️  Cloudinary storage ready");

} else {
  // ── Local disk fallback ──────────────────────────────────────────────────
  console.warn("⚠️  Cloudinary credentials not set — using local temp storage.");
  console.warn("    Files will NOT persist after server restart.");
  console.warn("    Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env");

  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, os.tmpdir()),
    filename:    (req, file, cb) => {
      const ext  = path.extname(file.originalname);
      const name = `hm_${Date.now()}${ext}`;
      cb(null, name);
    },
  });
}

// ── Multer instance ──────────────────────────────────────────────────────────
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },   // 15 MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg","image/png","image/webp","application/pdf"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, WEBP images and PDF files are allowed"), false);
    }
  },
});

// ── Patch req.file to always have a .path ────────────────────────────────────
// When using local disk, multer gives req.file.path as a local path.
// We expose a helper to get the public URL consistently.
function getFileUrl(file) {
  if (!file) return "";
  // Cloudinary: file.path = secure HTTPS URL
  // Local disk: file.path = local filesystem path — not publicly accessible
  return file.path || "";
}

module.exports = { upload, cloudinary, getFileUrl, hasCloudinary };
