import express from "express";
import Subject from "../models/Subject.js";
import Topic from "../models/Topic.js";
import Question from "../models/Question.js";
import { requireAuth } from "../middleware/auth.js"; // ✅ FIXED IMPORT

const router = express.Router();

function normalizeStageQuery(stageValue) {
  if (stageValue === null || stageValue === undefined || stageValue === "") {
    return null;
  }
  const raw = String(stageValue).trim().toLowerCase();
  if (!raw) return null;
  if (/^\d+$/.test(raw)) return Math.max(1, Number(raw));
  const match = raw.match(/^stage[-\s]*(\d+)$/);
  if (match) return Math.max(1, Number(match[1]));
  if (raw === "foundation") return 1;
  if (raw === "intermediate") return 2;
  if (raw === "advanced") return 3;
  return null;
}

/* ---------- SUBJECT ROUTES ---------- */

// Add subject
router.post("/subject", requireAuth, async (req, res) => {
  try {
    const { name, board, class: className } = req.body;

    if (!name || !board || !className) {
      return res.status(400).json({ message: "Name, board, and class are required" });
    }

    const subject = await Subject.create({
      name,
      board,
      class: className,
      createdBy: req.user.id,
    });
    res.json(subject);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all subjects (filtered by board and class if provided)
router.get("/subject", requireAuth, async (req, res) => {
  try {
    const { board, class: className, stage } = req.query;
    // console.log("GET /api/subject - board:", board, "class:", className);

    // Build filter
    const filter = {};

    // Handle board parameter (could be ObjectId or name)
    if (board) {
      // Check if it's a valid ObjectId
      const mongoose = await import("mongoose");
      if (mongoose.default.Types.ObjectId.isValid(board) && /^[0-9a-fA-F]{24}$/.test(board)) {
        filter.board = board;
      } else {
        // It's a board name, look up the ID
        const Board = (await import("../models/Board.js")).default;
        const boardDoc = await Board.findOne({ name: board });
        if (boardDoc) {
          filter.board = boardDoc._id;
        } else {
          // Board name not found, return empty array
          return res.json([]);
        }
      }
    }

    // Handle class parameter (could be ObjectId or name)
    if (className) {
      const mongoose = await import("mongoose");
      if (mongoose.default.Types.ObjectId.isValid(className) && /^[0-9a-fA-F]{24}$/.test(className)) {
        filter.class = className;
      } else {
        // It's a class name, look up the ID
        const Class = (await import("../models/Class.js")).default;
        const classDoc = await Class.findOne({ name: className });
        if (classDoc) {
          filter.class = classDoc._id;
        } else {
          // Class name not found, return empty array
          return res.json([]);
        }
      }
    }

    // console.log("Final filter:", JSON.stringify(filter));

    let subjects = await Subject.find(filter)
      .populate("board", "name")
      .populate("class", "name")
      .populate("createdBy", "name role")
      .sort({ createdAt: -1 });

    const stageNumber = normalizeStageQuery(stage);
    if (stageNumber !== null && subjects.length > 0) {
      const subjectIds = subjects.map((s) => String(s._id));
      const activeSubjectIds = await Question.distinct("subject", {
        stage: stageNumber,
        subject: { $in: subjectIds },
      });
      const allowed = new Set(activeSubjectIds.map((id) => String(id)));
      subjects = subjects.filter((s) => allowed.has(String(s._id)));
    }

    // console.log(`Found ${subjects.length} subjects`);
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ---------- TOPIC ROUTES ---------- */

// Add topic
router.post("/topic", requireAuth, async (req, res) => {
  try {
    const {
      name,
      subject,
      board,
      class: className,
      topicImage = "",
      shortDescription = "",
      topicSummary = "",
      learningOutcome = "",
    } = req.body;

    if (!name || !subject || !board || !className) {
      return res.status(400).json({ message: "Name, subject, board, and class are required" });
    }

    const topic = await Topic.create({
      name,
      subject,
      board,
      class: className,
      topicImage,
      shortDescription,
      topicSummary,
      learningOutcome,
      createdBy: req.user.id,
    });
    res.json(topic);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get topics by subject
// router.get("/topic/:subjectId", requireAuth, async (req, res) => {
//   // ✅ FIXED HERE
//   try {
//     // const topics = await Topic.find({ subject: req.params.subjectId }).sort({
//     //   name: 1,
//     // });
//     const topics = await Topic.find({ subject: req.params.id })
//       .populate("createdBy", "name role")
//       .sort({ createdAt: -1 });
//     res.json(topics);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

router.get("/topic/:subjectId", requireAuth, async (req, res) => {
  try {
    const { board, class: className, stage } = req.query;

    // Build filter
    const filter = { subject: req.params.subjectId };

    // Handle board parameter (could be ObjectId or name)
    if (board) {
      const mongoose = await import("mongoose");
      if (mongoose.default.Types.ObjectId.isValid(board) && /^[0-9a-fA-F]{24}$/.test(board)) {
        filter.board = board;
      } else {
        // It's a board name, look up the ID
        const Board = (await import("../models/Board.js")).default;
        const boardDoc = await Board.findOne({ name: board });
        if (boardDoc) {
          filter.board = boardDoc._id;
        } else {
          // Board name not found, return empty array
          return res.json([]);
        }
      }
    }

    // Handle class parameter (could be ObjectId or name)
    if (className) {
      const mongoose = await import("mongoose");
      if (mongoose.default.Types.ObjectId.isValid(className) && /^[0-9a-fA-F]{24}$/.test(className)) {
        filter.class = className;
      } else {
        // It's a class name, look up the ID
        const Class = (await import("../models/Class.js")).default;
        const classDoc = await Class.findOne({ name: className });
        if (classDoc) {
          filter.class = classDoc._id;
        } else {
          // Class name not found, return empty array
          return res.json([]);
        }
      }
    }

    let topics = await Topic.find(filter)
      .populate("board", "name")
      .populate("class", "name")
      .populate("createdBy", "name")
      .populate("contentUpdatedBy", "name role")
      .sort({ createdAt: -1 });

    const stageNumber = normalizeStageQuery(stage);
    if (stageNumber !== null && topics.length > 0) {
      const topicIds = topics.map((t) => String(t._id));
      const activeTopicIds = await Question.distinct("topic", {
        stage: stageNumber,
        subject: String(req.params.subjectId),
        topic: { $in: topicIds },
      });
      const allowed = new Set(activeTopicIds.map((id) => String(id)));
      topics = topics.filter((t) => allowed.has(String(t._id)));
    }

    res.json(topics);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// UPDATE SUBJECT
router.put("/subject/:id", requireAuth, async (req, res) => {
  try {
    const { name, board, class: className } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (board) updateData.board = board;
    if (className) updateData.class = className;

    const updated = await Subject.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate("board", "name").populate("class", "name");
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE SUBJECT
router.delete("/subject/:id", requireAuth, async (req, res) => {
  try {
    await Topic.deleteMany({ subject: req.params.id }); // also delete its topics
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ message: "Subject deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE TOPIC
router.put("/topic/:id", requireAuth, async (req, res) => {
  try {
    const existingTopic = await Topic.findById(req.params.id);
    if (!existingTopic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    const {
      name,
      subject,
      board,
      class: className,
      topicImage,
      shortDescription,
      topicSummary,
      learningOutcome,
    } = req.body;
    const role = String(req.user?.role || "").toLowerCase();
    const isTeacher = role === "teacher";

    const isContentUpdate =
      typeof topicSummary === "string" || typeof learningOutcome === "string";

    if (isTeacher && isContentUpdate) {
      const hasExistingContent = Boolean(
        String(existingTopic.topicSummary || "").trim() ||
        String(existingTopic.learningOutcome || "").trim()
      );
      const ownerId = existingTopic.contentUpdatedBy
        ? String(existingTopic.contentUpdatedBy)
        : hasExistingContent && existingTopic.createdBy
          ? String(existingTopic.createdBy)
          : "";
      if (ownerId && ownerId !== String(req.user.id)) {
        return res
          .status(403)
          .json({ message: "Not permitted. This content belongs to another user." });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (subject) updateData.subject = subject;
    if (board) updateData.board = board;
    if (className) updateData.class = className;
    if (typeof topicImage === "string") updateData.topicImage = topicImage;
    if (typeof shortDescription === "string") updateData.shortDescription = shortDescription;
    if (typeof topicSummary === "string") updateData.topicSummary = topicSummary;
    if (typeof learningOutcome === "string") updateData.learningOutcome = learningOutcome;
    if (isContentUpdate) updateData.contentUpdatedBy = req.user.id;

    const updated = await Topic.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
      .populate("board", "name")
      .populate("class", "name")
      .populate("contentUpdatedBy", "name role");
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE TOPIC
router.delete("/topic/:id", requireAuth, async (req, res) => {
  try {
    await Topic.findByIdAndDelete(req.params.id);
    res.json({ message: "Topic deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
