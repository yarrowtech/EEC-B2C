import express from "express";
import Topic from "../models/Topic.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// GET all topics
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const topics = await Topic.find().select("_id name subject");
    res.json({ items: topics });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
