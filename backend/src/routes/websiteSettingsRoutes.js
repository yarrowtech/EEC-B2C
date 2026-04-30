import express from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { getWebsiteSettings, updateWebsiteSettings } from "../controllers/websiteSettingsController.js";

const router = express.Router();

router.get("/", getWebsiteSettings);
router.put("/", requireAuth, requireAdmin, updateWebsiteSettings);

export default router;
