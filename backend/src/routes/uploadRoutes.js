// backend/src/routes/uploadRoutes.js
import express from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "eec_about_us",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const upload = multer({ storage });

// POST /api/upload/image
router.post("/image", upload.single("image"), (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(500).json({ message: "Upload failed: no file returned" });
    }

    // req.file.path is the Cloudinary URL
    return res.json({ url: req.file.path });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ message: "Upload failed" });
  }
});

export default router;
