import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "eec-study-materials",
    resource_type: "raw",        // 🔥 IMPORTANT for PDFs
    allowed_formats: ["pdf"],
    use_filename: true,
    unique_filename: true,
    flags: "attachment:false",
  },
});

const uploadPdf = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

export default uploadPdf;
