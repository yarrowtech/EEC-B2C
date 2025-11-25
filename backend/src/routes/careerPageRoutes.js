// backend/src/routes/careerPageRoutes.js
import express from "express";
import {
  getCareerPageSettings,
  updateCareerPageSettings,
} from "../controllers/careerPageController.js";

// if you have auth middleware, you can import and wrap update route, e.g.
// import { requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// GET /api/settings/career-page
router.get("/career-page", getCareerPageSettings);

// PUT /api/settings/career-page
router.put("/career-page", updateCareerPageSettings);
// or with auth: router.put("/career-page", requireAdmin, updateCareerPageSettings);

export default router;