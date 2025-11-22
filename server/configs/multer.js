// backend/configs/multer.js
import multer from "multer";
import fs from "fs";
import path from "path";

// Determine upload directory based on environment
// Vercel serverless functions have a read-only filesystem except for /tmp
// Check multiple Vercel environment variables to detect serverless environment
const isVercel = 
  process.env.VERCEL === "1" || 
  process.env.VERCEL_ENV ||
  process.env.VERCEL_URL ||
  // Check if we're in /var/task (Vercel deployment directory)
  process.cwd().startsWith("/var/task");

const uploadDir = isVercel 
  ? path.join("/tmp", "uploads")  // Use /tmp in Vercel (writable)
  : path.join(process.cwd(), "uploads");  // Use project directory locally

// Don't create directory at module load - create it lazily in destination callback
// This prevents crashes during module initialization in serverless environments

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure directory exists at request time (creates it if needed)
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    } catch (error) {
      console.error("Error ensuring upload directory:", error);
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    cb(null, unique);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});
