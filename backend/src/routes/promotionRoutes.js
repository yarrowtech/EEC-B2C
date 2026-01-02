import express from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { runAutoPromotion, promoteUser } from "../services/autoPromotionService.js";
import User from "../models/User.js";

const router = express.Router();

/* ---------------- ADMIN: RUN MANUAL PROMOTION (FOR TESTING) ---------------- */
router.post("/run-promotion", requireAuth, requireAdmin, async (req, res) => {
  try {
    const stats = await runAutoPromotion();
    res.json({
      message: "Promotion process completed",
      stats,
    });
  } catch (error) {
    console.error("Manual promotion error:", error);
    res.status(500).json({ message: "Promotion failed", error: error.message });
  }
});

/* ---------------- ADMIN: PROMOTE SPECIFIC USER (FOR TESTING) ---------------- */
router.post("/promote-user/:userId", requireAuth, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Force promotion by temporarily setting lastPromotedYear to a past year
    const originalYear = user.lastPromotedYear;
    user.lastPromotedYear = user.lastPromotedYear ? user.lastPromotedYear - 1 : null;
    await user.save();

    const result = await promoteUser(user);

    if (result) {
      res.json({
        message: `User promoted successfully`,
        user: {
          id: result._id,
          name: result.name,
          email: result.email,
          oldClass: req.body.oldClass || "N/A",
          newClass: result.className,
          board: result.board,
          lastPromotedYear: result.lastPromotedYear,
        },
      });
    } else {
      // Restore original year if promotion didn't happen
      user.lastPromotedYear = originalYear;
      await user.save();

      res.json({
        message: "User not eligible for promotion",
        reason: "Either already in final class or promotion conditions not met",
        user: {
          id: user._id,
          name: user.name,
          currentClass: user.className,
          board: user.board,
        },
      });
    }
  } catch (error) {
    console.error("User promotion error:", error);
    res.status(500).json({ message: "Promotion failed", error: error.message });
  }
});

/* ---------------- ADMIN: GET PROMOTION STATISTICS ---------------- */
router.get("/stats", requireAuth, requireAdmin, async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: "student" });
    const studentsWithBoard = await User.countDocuments({
      role: "student",
      board: { $in: ["CBSE", "ICSE", "WB Board", "State Board"] },
    });
    const studentsEligible = await User.countDocuments({
      role: "student",
      board: { $in: ["CBSE", "ICSE", "WB Board", "State Board"] },
      className: { $exists: true, $ne: "" },
      registrationYear: { $exists: true, $ne: null },
    });

    const currentYear = new Date().getFullYear();
    const promotedThisYear = await User.countDocuments({
      role: "student",
      lastPromotedYear: currentYear,
    });

    res.json({
      totalStudents,
      studentsWithBoard,
      studentsEligible,
      promotedThisYear,
      notPromotedYet: studentsEligible - promotedThisYear,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to get stats", error: error.message });
  }
});

/* ---------------- ADMIN: RESET USER PROMOTION DATA (FOR TESTING) ---------------- */
router.post("/reset-user/:userId", requireAuth, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Reset to initial class
    user.className = user.initialClass || user.className;
    user.class = user.initialClass || user.class;
    user.lastPromotedYear = null;

    await user.save();

    res.json({
      message: "User promotion data reset successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        currentClass: user.className,
        initialClass: user.initialClass,
        lastPromotedYear: user.lastPromotedYear,
      },
    });
  } catch (error) {
    console.error("Reset user error:", error);
    res.status(500).json({ message: "Reset failed", error: error.message });
  }
});

export default router;
