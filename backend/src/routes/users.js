// src/routes/users.js
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { listStudents } from "../controllers/users.js";

const router = Router();

// Allow admin AND teacher. We gate with requireAuth, then manual role check.
router.get("/students", requireAuth, (req, res, next) => {
  if (!["admin", "teacher"].includes(req.user?.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}, listStudents);
export default router;
