import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { startExam, submitExam, myAttempts, adminAttempts, adminAttemptDetail } from "../controllers/examsController.js";

const router = Router();

// student-only in UI; backend checks only auth here
router.post("/start", requireAuth, startExam);
router.post("/submit/:attemptId", requireAuth, submitExam);
router.get("/attempts", requireAuth, myAttempts);
router.get("/admin/attempts", requireAuth, adminAttempts); 
router.get("/admin/attempts/:id", requireAuth, adminAttemptDetail);

export default router;
