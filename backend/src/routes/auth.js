import { Router } from "express";
import { login, me, register, forgotPassword, resetPassword, checkResetToken, googleLogin, checkEmailExists } from "../controllers/auth.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/check-email", checkEmailExists);
router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
router.get("/me", requireAuth, me);
router.get("/admin-only", requireAuth, requireRole("admin"), (req, res) => {
  res.json({ message: "Welcome Admin!" });
});
router.post("/forgot-password", forgotPassword);
router.get("/reset-token-status/:token", checkResetToken);
router.post("/reset-password/:token", resetPassword);


export default router;
