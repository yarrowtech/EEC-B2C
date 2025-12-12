import { Router } from "express";
import { requireAuth, requireAdminOrTeacher } from "../middleware/auth.js";
import { 
  startExam, 
  submitExam, 
  myAttempts, 
  adminAttempts, 
  adminAttemptDetail,
  getUserResults 
} from "../controllers/examsController.js";

const router = Router();

// Student start + submit exam
router.post("/start", requireAuth, startExam);
router.post("/submit/:attemptId", requireAuth, submitExam);

// ✅ Students can now view ONLY their own attempts
router.get("/attempts", requireAuth, myAttempts);

// Admin/teacher access
router.get("/admin/attempts", requireAuth, requireAdminOrTeacher, adminAttempts);
router.get("/admin/attempts/:id", requireAuth, requireAdminOrTeacher, adminAttemptDetail);

// View all attempts for specific user (admin/teacher)
router.get("/user-results/:userId", requireAuth, requireAdminOrTeacher, getUserResults);

export default router;
