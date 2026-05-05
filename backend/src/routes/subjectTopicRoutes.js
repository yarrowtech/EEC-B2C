import express from "express";
import Subject from "../models/Subject.js";
import Topic from "../models/Topic.js";
import Question from "../models/Question.js";
import { requireAuth } from "../middleware/auth.js"; // ✅ FIXED IMPORT

const router = express.Router();

async function resolveRefFilterValues(rawValue, modelPath) {
  if (!rawValue) return [];
  const value = String(rawValue).trim();
  if (!value) return [];

  const values = [];
  const dedupe = new Set();
  const pushValue = (v) => {
    if (v === null || v === undefined) return;
    const key = typeof v === "string" ? v : String(v);
    if (dedupe.has(key)) return;
    dedupe.add(key);
    values.push(v);
  };
  try {
    const mongoose = await import("mongoose");
    const isObjectId =
      mongoose.default.Types.ObjectId.isValid(value) && /^[0-9a-fA-F]{24}$/.test(value);
    const Model = (await import(modelPath)).default;

    if (isObjectId) {
      pushValue(new mongoose.default.Types.ObjectId(value));
      const doc = await Model.findById(value).select("_id name").lean();
      if (doc?._id) {
        pushValue(doc._id);
      }
    } else {
      const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const doc = await Model.findOne({ name: { $regex: `^${escaped}$`, $options: "i" } })
        .select("_id name")
        .lean();
      if (doc?._id) {
        pushValue(doc._id);
      }
    }
  } catch {
    // ignore lookup failures and keep raw value fallback
  }

  return values.filter(Boolean);
}

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
router.get("/subject", async (req, res) => {
  try {
    const { board, class: className, stage } = req.query;
    // console.log("GET /api/subject - board:", board, "class:", className);

    // Build filter
    const filter = {};

    if (board) {
      const boardValues = await resolveRefFilterValues(board, "../models/Board.js");
      if (boardValues.length === 0) return res.json([]);
      filter.board = { $in: boardValues };
    }

    if (className) {
      const classValues = await resolveRefFilterValues(className, "../models/Class.js");
      if (classValues.length === 0) return res.json([]);
      filter.class = { $in: classValues };
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

router.get("/topic/:subjectId", async (req, res) => {
  try {
    const { board, class: className, stage } = req.query;

    // Build filter
    const filter = { subject: req.params.subjectId };

    if (board) {
      const boardValues = await resolveRefFilterValues(board, "../models/Board.js");
      if (boardValues.length === 0) return res.json([]);
      filter.board = { $in: boardValues };
    }

    if (className) {
      const classValues = await resolveRefFilterValues(className, "../models/Class.js");
      if (classValues.length === 0) return res.json([]);
      filter.class = { $in: classValues };
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
