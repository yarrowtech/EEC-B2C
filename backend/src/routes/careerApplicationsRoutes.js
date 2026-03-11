import express from "express";
import {
  createCareerApplication,
  listCareerApplications,
  updateCareerApplicationStatus,
} from "../controllers/careerApplicationsController.js";
import uploadCareerCv from "../middleware/uploadCareerCv.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Public: submit career application
router.post("/apply", uploadCareerCv.single("cv"), createCareerApplication);

// Admin only: list applications
router.get("/", requireAuth, requireRole("admin"), listCareerApplications);

// Admin only: update application status
router.patch("/:id/status", requireAuth, requireRole("admin"), updateCareerApplicationStatus);

export default router;
