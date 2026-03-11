import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "eec-career-cv",
    resource_type: "raw",
    allowed_formats: ["pdf", "doc", "docx"],
    use_filename: true,
    unique_filename: true,
    flags: "attachment:false",
  },
});

const uploadCareerCv = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export default uploadCareerCv;
