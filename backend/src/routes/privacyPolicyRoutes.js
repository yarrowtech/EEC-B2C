import express from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import PrivacyPolicy from "../models/PrivacyPolicy.js";

const router = express.Router();

// Public – get current policy (custom or signals to use default)
router.get("/", async (req, res) => {
  try {
    const doc = await PrivacyPolicy.findOne();
    if (!doc) return res.json({ useDefault: true });
    res.json(doc);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// Admin – save custom policy
router.put("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { useDefault, lastUpdated, introText, sections } = req.body;
    let doc = await PrivacyPolicy.findOne();
    if (!doc) {
      doc = new PrivacyPolicy({ useDefault, lastUpdated, introText, sections });
    } else {
      doc.useDefault  = Boolean(useDefault);
      doc.lastUpdated = String(lastUpdated || "").trim();
      doc.introText   = String(introText || "").trim();
      doc.sections    = Array.isArray(sections) ? sections : doc.sections;
    }
    await doc.save();
    res.json(doc);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
