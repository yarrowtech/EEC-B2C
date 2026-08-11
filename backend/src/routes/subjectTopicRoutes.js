import express from "express";
import jwt from "jsonwebtoken";
import Subject from "../models/Subject.js";
import Topic from "../models/Topic.js";
import Question from "../models/Question.js";
import { requireAuth, requireRole } from "../middleware/auth.js"; // ✅ FIXED IMPORT
import { sendTopicReviewStatusEmail } from "../utils/sendMail.js";
import { sendPushNotification } from "./pushNotificationRoutes.js";

const router = express.Router();
const ALLOWED_WRITE_ROLES = new Set(["admin", "teacher"]);
const TOPIC_REVIEW_STATUSES = new Set(["approved", "rejected"]);

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
    const role = String(req.user?.role || "").toLowerCase();
    if (!ALLOWED_WRITE_ROLES.has(role)) {
      return res.status(403).json({ message: "Only admin or teacher can add subjects" });
    }

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
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Already added" });
    }
    res.status(500).json({ message: err.message });
  }
});

// Get all subjects (filtered by board and class if provided)
// Public: guests can browse subjects too. Auth is only used to scope
// results to "my subjects" for teachers via ?mine=1.
router.get("/subject", async (req, res) => {
  try {
    const { board, class: className, stage, mine } = req.query;
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

    let role = "";
    let userId = null;
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        role = String(decoded.role || "").toLowerCase();
        userId = decoded.sub || null;
      } catch {
        // ignore invalid/expired token, fall back to guest view
      }
    }
    if (mine === "1" && role === "teacher" && userId) {
      filter.createdBy = userId;
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
    const role = String(req.user?.role || "").toLowerCase();
    if (!ALLOWED_WRITE_ROLES.has(role)) {
      return res.status(403).json({ message: "Only admin or teacher can add topics" });
    }

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
      status: role === "admin" ? "approved" : "pending",
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
    const { board, class: className, stage, manage } = req.query;

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

    let includeAllStatuses = false;
    if (manage === "1") {
      const authHeader = req.headers.authorization || "";
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const role = String(decoded.role || "").toLowerCase();
          if (role === "admin" || role === "teacher") includeAllStatuses = true;
        } catch {
          // ignore invalid/expired token, fall back to approved-only
        }
      }
    }
    if (!includeAllStatuses) {
      filter.status = "approved";
    }

    let topics = await Topic.find(filter)
      .populate("board", "name")
      .populate("class", "name")
      .populate("createdBy", "name")
      .populate("contentUpdatedBy", "name role")
      .populate("draftUpdatedBy", "name role")
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

    if (!includeAllStatuses) {
      res.json(
        topics.map((t) => {
          const obj = t.toObject();
          delete obj.draftTopicSummary;
          delete obj.draftLearningOutcome;
          delete obj.draftUpdatedBy;
          return obj;
        })
      );
      return;
    }

    res.json(topics);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// UPDATE SUBJECT
router.put("/subject/:id", requireAuth, async (req, res) => {
  try {
    const role = String(req.user?.role || "").toLowerCase();
    if (!ALLOWED_WRITE_ROLES.has(role)) {
      return res.status(403).json({ message: "Only admin or teacher can update subjects" });
    }

    const existingSubject = await Subject.findById(req.params.id).select("createdBy");
    if (!existingSubject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    if (role === "teacher" && String(existingSubject.createdBy) !== String(req.user.id)) {
      return res.status(403).json({ message: "Not permitted. This subject belongs to another user." });
    }

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
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Already added" });
    }
    res.status(500).json({ message: err.message });
  }
});

// DELETE SUBJECT
router.delete("/subject/:id", requireAuth, async (req, res) => {
  try {
    const role = String(req.user?.role || "").toLowerCase();
    if (!ALLOWED_WRITE_ROLES.has(role)) {
      return res.status(403).json({ message: "Only admin or teacher can delete subjects" });
    }

    const existingSubject = await Subject.findById(req.params.id).select("createdBy");
    if (!existingSubject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    if (role === "teacher" && String(existingSubject.createdBy) !== String(req.user.id)) {
      return res.status(403).json({ message: "Not permitted. This subject belongs to another user." });
    }

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
    const role = String(req.user?.role || "").toLowerCase();
    if (!ALLOWED_WRITE_ROLES.has(role)) {
      return res.status(403).json({ message: "Only admin or teacher can update topics" });
    }

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
    const isTeacher = role === "teacher";

    const isContentUpdate =
      typeof topicSummary === "string" || typeof learningOutcome === "string";
    const isTopicFieldUpdate = Boolean(
      name || subject || board || className || typeof topicImage === "string" || typeof shortDescription === "string"
    );

    // Topic-level fields (name/board/class/subject/image/description) stay
    // restricted to the topic's own creator — any teacher may still propose
    // a content-only update below, since that now goes through admin review
    // rather than applying immediately.
    if (isTeacher && isTopicFieldUpdate && String(existingTopic.createdBy) !== String(req.user.id)) {
      return res
        .status(403)
        .json({ message: "Not permitted. This topic belongs to another user." });
    }

    if (isTeacher && isContentUpdate) {
      const hasPendingDraft = existingTopic.contentStatus === "pending";
      const ownerId = hasPendingDraft && existingTopic.draftUpdatedBy
        ? String(existingTopic.draftUpdatedBy)
        : "";
      if (ownerId && ownerId !== String(req.user.id)) {
        return res
          .status(403)
          .json({ message: "Not permitted. Another teacher already has a pending content submission for this topic." });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (subject) updateData.subject = subject;
    if (board) updateData.board = board;
    if (className) updateData.class = className;
    if (typeof topicImage === "string") updateData.topicImage = topicImage;
    if (typeof shortDescription === "string") updateData.shortDescription = shortDescription;

    if (isContentUpdate) {
      if (isTeacher) {
        // Teacher submissions land in draft form and wait for admin review;
        // live content stays untouched so students keep seeing the last-approved version.
        if (typeof topicSummary === "string") updateData.draftTopicSummary = topicSummary;
        if (typeof learningOutcome === "string") updateData.draftLearningOutcome = learningOutcome;
        updateData.draftUpdatedBy = req.user.id;
        updateData.contentStatus = "pending";
        updateData.contentRejectionReason = "";
      } else {
        // Admin writes go live immediately and are considered auto-reviewed.
        if (typeof topicSummary === "string") updateData.topicSummary = topicSummary;
        if (typeof learningOutcome === "string") updateData.learningOutcome = learningOutcome;
        updateData.contentUpdatedBy = req.user.id;
        updateData.contentStatus = "approved";
        updateData.contentReviewedBy = req.user.id;
        updateData.contentReviewedAt = new Date();
        updateData.contentRejectionReason = "";
        updateData.draftTopicSummary = "";
        updateData.draftLearningOutcome = "";
        updateData.draftUpdatedBy = null;
      }
    }

    if (isTeacher && existingTopic.status === "rejected") {
      updateData.status = "pending";
      updateData.rejectionReason = "";
    }

    const updated = await Topic.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
      .populate("board", "name")
      .populate("class", "name")
      .populate("contentUpdatedBy", "name role")
      .populate("draftUpdatedBy", "name role");
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE TOPIC
router.delete("/topic/:id", requireAuth, async (req, res) => {
  try {
    const role = String(req.user?.role || "").toLowerCase();
    if (!ALLOWED_WRITE_ROLES.has(role)) {
      return res.status(403).json({ message: "Only admin or teacher can delete topics" });
    }

    const existingTopic = await Topic.findById(req.params.id).select("createdBy");
    if (!existingTopic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    if (role === "teacher" && String(existingTopic.createdBy) !== String(req.user.id)) {
      return res
        .status(403)
        .json({ message: "Not permitted. This topic belongs to another user." });
    }

    await Topic.findByIdAndDelete(req.params.id);
    res.json({ message: "Topic deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ---------- TOPIC REVIEW ROUTES (admin only) ---------- */

// List topics for review (topic submissions or content submissions)
router.get("/topic-review", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { type = "topic", status = "pending", q, limit = 50, page = 1 } = req.query;
    const isContentReview = type === "content";

    const filter = {};
    if (status && status !== "all") {
      filter[isContentReview ? "contentStatus" : "status"] = status;
    }
    if (q) {
      const escaped = String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (escaped) filter.name = { $regex: escaped, $options: "i" };
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const safePage = Math.max(Number(page) || 1, 1);

    const [items, total] = await Promise.all([
      Topic.find(filter)
        .populate("board", "name")
        .populate("class", "name")
        .populate("subject", "name")
        .populate("createdBy", "name email role")
        .populate("reviewedBy", "name")
        .populate("draftUpdatedBy", "name email role")
        .populate("contentReviewedBy", "name")
        .sort({ createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit),
      Topic.countDocuments(filter),
    ]);

    res.json({
      items,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Approve or reject a topic submission or a content submission
router.patch("/topic/:id/review", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { type = "topic", status, reason } = req.body || {};
    const normalizedStatus = String(status || "").trim().toLowerCase();
    const isContentReview = type === "content";

    if (!TOPIC_REVIEW_STATUSES.has(normalizedStatus)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    let updateData;
    let existingTopic;
    if (isContentReview) {
      existingTopic = await Topic.findById(req.params.id);
      if (!existingTopic) {
        return res.status(404).json({ message: "Topic not found" });
      }

      if (normalizedStatus === "approved") {
        updateData = {
          topicSummary: existingTopic.draftTopicSummary,
          learningOutcome: existingTopic.draftLearningOutcome,
          contentUpdatedBy: existingTopic.draftUpdatedBy,
          draftTopicSummary: "",
          draftLearningOutcome: "",
          contentStatus: "approved",
          contentReviewedBy: req.user.id,
          contentReviewedAt: new Date(),
          contentRejectionReason: "",
        };
      } else {
        updateData = {
          contentStatus: "rejected",
          contentReviewedBy: req.user.id,
          contentReviewedAt: new Date(),
          contentRejectionReason: String(reason || "").trim(),
        };
      }
    } else {
      updateData = {
        status: normalizedStatus,
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
        rejectionReason: normalizedStatus === "rejected" ? String(reason || "").trim() : "",
      };
    }

    const updated = await Topic.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate("subject", "name")
      .populate("createdBy", "name email")
      .populate("draftUpdatedBy", "name email");

    if (!updated) {
      return res.status(404).json({ message: "Topic not found" });
    }

    const recipient = isContentReview ? updated.draftUpdatedBy : updated.createdBy;

    if (recipient?.email) {
      const kind = isContentReview ? "content" : "topic";
      const title =
        normalizedStatus === "approved"
          ? isContentReview ? "Content Approved" : "Topic Approved"
          : isContentReview ? "Content Needs Changes" : "Topic Needs Changes";
      const message =
        normalizedStatus === "approved"
          ? isContentReview
            ? `Your content update for "${updated.name}" was approved and is now live.`
            : `Your topic "${updated.name}" was approved and is now live.`
          : isContentReview
            ? `Your content update for "${updated.name}" was not approved. Please review and resubmit.`
            : `Your topic "${updated.name}" was not approved. Please review and resubmit.`;

      sendTopicReviewStatusEmail({
        to: recipient.email,
        name: recipient.name,
        topicName: updated.name,
        subjectName: updated.subject?.name || "",
        status: normalizedStatus,
        reason: isContentReview ? updated.contentRejectionReason : updated.rejectionReason,
        kind,
      }).catch((mailErr) => {
        console.error("Topic review email failed:", mailErr?.message || mailErr);
      });

      sendPushNotification(recipient._id, title, message).catch((pushErr) => {
        console.error("Topic review push notification failed:", pushErr?.message || pushErr);
      });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
