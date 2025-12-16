import { Router } from "express";
import { login, me, register, forgotPassword, resetPassword } from "../controllers/auth.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, me);
router.get("/admin-only", requireAuth, requireRole("admin"), (req, res) => {
  res.json({ message: "Welcome Admin!" });
});
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);


export default router;
