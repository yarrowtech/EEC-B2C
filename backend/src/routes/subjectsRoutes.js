import express from "express";
import Subject from "../models/Subject.js";
import Topic from "../models/Topic.js";

const router = express.Router();

// Get all subjects
router.get("/", async (req, res) => {
  try {
    const subjects = await Subject.find();
    res.json({ items: subjects });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get topics for specific subject (public for Learn page preview)
router.get("/:subjectId/topics", async (req, res) => {
  try {
    const topics = await Topic.find({ subject: req.params.subjectId });
    res.json({ items: topics });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
