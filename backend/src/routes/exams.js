import { Router } from "express";
import { requireAuth, requireAdminOrTeacher } from "../middleware/auth.js";
import {
  startExam,
  submitExam,
  myAttempts,
  adminAttempts,
  adminAttemptDetail,
  getUserResults,
  getClassRank,
} from "../controllers/examsController.js";

const router = Router();

// Student start + submit exam
router.post("/start", requireAuth, startExam);
router.post("/submit/:attemptId", requireAuth, submitExam);

// ✅ Students can now view ONLY their own attempts
router.get("/attempts", requireAuth, myAttempts);

// Admin/teacher access
router.get(
  "/admin/attempts",
  requireAuth,
  requireAdminOrTeacher,
  adminAttempts
);
router.get(
  "/admin/attempts/:id",
  requireAuth,
  requireAdminOrTeacher,
  adminAttemptDetail
);

// View all attempts for specific user (admin/teacher)
// router.get("/user-results/:userId", requireAuth, requireAdminOrTeacher, getUserResults);
router.get(
  "/user-results/:userId",
  requireAuth,
  (req, res, next) => {
    // allow admin and teacher
    if (req.user.role === "admin" || req.user.role === "teacher") {
      return next();
    }

    // allow student ONLY for their own results
    if (req.user.role === "student" && req.user.id == req.params.userId) {
      return next();
    }

    return res.status(403).json({ message: "Forbidden" });
  },
  getUserResults
);

router.get("/class-rank/:userId", requireAuth, getClassRank);

export default router;
