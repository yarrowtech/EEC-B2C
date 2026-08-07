// src/routes/submissionRoutes.js
import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  createSubmission,
  getMySubmissions,
  getSubmissionDetail,
  updateSubmission,
  listSubmissionsForReview,
  reviewSubmission,
} from "../controllers/submissionsController.js";

const router = express.Router();

router.get("/mine", requireAuth, getMySubmissions);
router.get("/review", requireAuth, requireRole("admin"), listSubmissionsForReview);

router.post("/", requireAuth, createSubmission);
router.get("/:submissionId", requireAuth, getSubmissionDetail);
router.put("/:submissionId", requireAuth, updateSubmission);
router.patch("/:submissionId/review", requireAuth, requireRole("admin"), reviewSubmission);

export default router;
