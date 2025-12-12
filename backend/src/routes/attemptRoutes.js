import express from "express";
import Attempt from "../models/Attempt.js";
import Subject from "../models/Subject.js";
import Topic from "../models/Topic.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

/**
 * @route GET /api/attempt/user/:userId
 * @desc Get all attempts for a user (used for points history)
 */
router.get("/user/:userId", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const attempts = await Attempt.find({ userId }).sort({ createdAt: -1 });

    const detailedAttempts = [];

    for (const attempt of attempts) {
      // Fetch subject name
      const subject = await Subject.findById(attempt.subject);
      // Fetch topic name
      const topic = await Topic.findById(attempt.topic);

      detailedAttempts.push({
        stage: attempt.stage,
        subjectName: subject?.name || "Unknown Subject",
        topicName: topic?.name || "Unknown Topic",
        score: attempt.score, // points earned
        total: attempt.total,
        percent: attempt.percent,
        createdAt: attempt.createdAt,
      });
    }

    res.json({ attempts: detailedAttempts });

  } catch (err) {
    console.error("Error fetching attempts:", err);
    res.status(500).json({ message: "Failed to load attempt history" });
  }
});

export default router;
