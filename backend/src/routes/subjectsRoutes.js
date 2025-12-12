import express from "express";
import Subject from "../models/Subject.js";
import Topic from "../models/Topic.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Get all subjects
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const subjects = await Subject.find();
    res.json({ items: subjects });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get topics for specific subject
router.get("/:subjectId/topics", requireAuth, requireAdmin, async (req, res) => {
  try {
    const topics = await Topic.find({ subject: req.params.subjectId });
    res.json({ topics });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
