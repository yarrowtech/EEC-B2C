// src/controllers/submissionsController.js
import mongoose from "mongoose";
import Topic from "../models/Topic.js";
import Question from "../models/Question.js";
import { shapeByType } from "./questionsController.js";
import { sendTopicReviewStatusEmail } from "../utils/sendMail.js";
import { sendPushNotification } from "../routes/pushNotificationRoutes.js";
import { assertScopeWriteAccess, findMatchingAssignment } from "../utils/chapterAssignment.js";

const ALLOWED_WRITE_ROLES = new Set(["admin", "teacher"]);
const SUBMISSION_QUESTION_TYPES = new Set(["mcq-single", "mcq-multi", "true-false"]);
const SUBMISSION_REVIEW_STATUSES = new Set(["approved", "rejected"]);

function isAdminOrTeacher(req) {
  return ALLOWED_WRITE_ROLES.has(String(req.user?.role || "").toLowerCase());
}

function validateSubmissionBody(body) {
  const { board, class: className, subject, topicName, questions = [] } = body || {};
  if (!board || !className || !subject || !String(topicName || "").trim()) {
    return "Board, class, subject, and topic name are required";
  }
  if (!Array.isArray(questions) || questions.length === 0) {
    return "At least one tryout question is required";
  }
  for (const q of questions) {
    if (!SUBMISSION_QUESTION_TYPES.has(q?.type)) {
      return `Unsupported question type: ${q?.type}`;
    }
  }
  return null;
}

function buildQuestionDocs(questions, { subject, board, className, topicId, status, submissionId, userId }) {
  const docs = [];
  for (const q of questions) {
    const { ok, doc, message } = shapeByType(q.type, { ...q, subject, topic: String(topicId) }, userId);
    if (!ok) return { ok: false, message };
    doc.board = board;
    doc.class = className;
    doc.status = status;
    doc.submissionId = submissionId;
    docs.push(doc);
  }
  return { ok: true, docs };
}

// POST /api/submissions
export const createSubmission = async (req, res) => {
  try {
    if (!isAdminOrTeacher(req)) return res.status(403).json({ message: "Forbidden" });

    const validationError = validateSubmissionBody(req.body);
    if (validationError) return res.status(400).json({ message: validationError });

    const {
      board,
      class: className,
      subject,
      topicName,
      shortDescription = "",
      topicImage = "",
      topicSummary = "",
      learningOutcome = "",
      questions = [],
    } = req.body;

    const access = await assertScopeWriteAccess({ board, classId: className, subject }, req.user);
    if (!access.ok) return res.status(403).json({ message: access.message });

    const role = String(req.user.role || "").toLowerCase();
    const status = role === "admin" ? "approved" : "pending";
    const submissionId = new mongoose.Types.ObjectId();
    const matchingAssignment = await findMatchingAssignment(
      { board, classId: className, subject },
      req.user.id
    );

    const topic = await Topic.create({
      name: String(topicName).trim(),
      subject,
      board,
      class: className,
      shortDescription,
      topicImage,
      topicSummary,
      learningOutcome,
      createdBy: req.user.id,
      status,
      contentStatus: "approved",
      submissionId,
      assignmentId: matchingAssignment?._id || null,
      budgetAmount: matchingAssignment?.amount || 0,
    });

    const { ok, docs, message } = buildQuestionDocs(questions, {
      subject,
      board,
      className,
      topicId: topic._id,
      status,
      submissionId,
      userId: req.user.id,
    });
    if (!ok) {
      await Topic.findByIdAndDelete(topic._id);
      return res.status(400).json({ message: message || "Invalid question data" });
    }

    await Question.insertMany(docs);

    res.status(201).json({ message: "Submitted", submissionId, topicId: topic._id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/submissions/mine
export const getMySubmissions = async (req, res) => {
  try {
    if (!isAdminOrTeacher(req)) return res.status(403).json({ message: "Forbidden" });

    const topics = await Topic.find({ createdBy: req.user.id, submissionId: { $ne: null } })
      .populate("board", "name")
      .populate("class", "name")
      .populate("subject", "name")
      .sort({ createdAt: -1 });

    const items = await Promise.all(
      topics.map(async (t) => {
        const questions = await Question.find({ submissionId: t.submissionId }).sort({ createdAt: 1 });
        return { ...t.toObject(), questions, questionCount: questions.length };
      })
    );

    res.json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/submissions/:submissionId
export const getSubmissionDetail = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const topic = await Topic.findOne({ submissionId })
      .populate("board", "name")
      .populate("class", "name")
      .populate("subject", "name")
      .populate("createdBy", "name email role");
    if (!topic) return res.status(404).json({ message: "Submission not found" });

    const role = String(req.user?.role || "").toLowerCase();
    if (role === "teacher" && String(topic.createdBy?._id || topic.createdBy) !== String(req.user.id)) {
      return res.status(403).json({ message: "Not permitted" });
    }

    const questions = await Question.find({ submissionId }).sort({ createdAt: 1 });
    res.json({ topic, questions });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/submissions/:submissionId
export const updateSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const topic = await Topic.findOne({ submissionId });
    if (!topic) return res.status(404).json({ message: "Submission not found" });

    const role = String(req.user?.role || "").toLowerCase();
    if (role === "teacher" && String(topic.createdBy) !== String(req.user.id)) {
      return res.status(403).json({ message: "Not permitted" });
    }
    if (topic.status === "approved") {
      return res.status(403).json({ message: "This submission is already approved and cannot be edited here." });
    }

    const validationError = validateSubmissionBody(req.body);
    if (validationError) return res.status(400).json({ message: validationError });

    const {
      board,
      class: className,
      subject,
      topicName,
      shortDescription = "",
      topicImage = "",
      topicSummary = "",
      learningOutcome = "",
      questions = [],
    } = req.body;

    const { ok, docs, message } = buildQuestionDocs(questions, {
      subject,
      board,
      className,
      topicId: topic._id,
      status: "pending",
      submissionId: topic.submissionId,
      userId: req.user.id,
    });
    if (!ok) return res.status(400).json({ message: message || "Invalid question data" });

    topic.name = String(topicName).trim();
    topic.board = board;
    topic.class = className;
    topic.subject = subject;
    topic.shortDescription = shortDescription;
    topic.topicImage = topicImage;
    topic.topicSummary = topicSummary;
    topic.learningOutcome = learningOutcome;
    topic.status = "pending";
    topic.rejectionReason = "";
    await topic.save();

    await Question.deleteMany({ submissionId: topic.submissionId });
    await Question.insertMany(docs);

    res.json({ message: "Resubmitted", submissionId: topic.submissionId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/submissions/review (admin only)
export const listSubmissionsForReview = async (req, res) => {
  try {
    const { status = "pending" } = req.query;
    const filter = { submissionId: { $ne: null } };
    if (status && status !== "all") filter.status = status;

    const topics = await Topic.find(filter)
      .populate("board", "name")
      .populate("class", "name")
      .populate("subject", "name")
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    const items = await Promise.all(
      topics.map(async (t) => {
        const questions = await Question.find({ submissionId: t.submissionId }).sort({ createdAt: 1 });
        return { topic: t, questions };
      })
    );

    res.json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

// PATCH /api/submissions/:submissionId/review (admin only)
export const reviewSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { status, reason } = req.body || {};
    const normalizedStatus = String(status || "").trim().toLowerCase();

    if (!SUBMISSION_REVIEW_STATUSES.has(normalizedStatus)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const topic = await Topic.findOne({ submissionId }).populate("createdBy", "name email");
    if (!topic) return res.status(404).json({ message: "Submission not found" });

    const rejectionReason = normalizedStatus === "rejected" ? String(reason || "").trim() : "";
    const reviewFields = {
      status: normalizedStatus,
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
      rejectionReason,
    };

    const questionCount = await Question.countDocuments({ submissionId });
    await Topic.updateOne({ _id: topic._id }, reviewFields);
    await Question.updateMany({ submissionId }, reviewFields);

    const recipient = topic.createdBy;
    if (recipient?.email) {
      const title = normalizedStatus === "approved" ? "Submission Approved" : "Submission Needs Changes";
      const message =
        normalizedStatus === "approved"
          ? `Your topic submission "${topic.name}" (with ${questionCount} question${questionCount === 1 ? "" : "s"}) was approved and is now live.`
          : `Your topic submission "${topic.name}" was not approved. Please review and resubmit.`;

      sendTopicReviewStatusEmail({
        to: recipient.email,
        name: recipient.name,
        topicName: topic.name,
        subjectName: "",
        status: normalizedStatus,
        reason: rejectionReason,
        kind: "submission",
      }).catch((err) => console.error("Submission review email failed:", err?.message || err));

      sendPushNotification(recipient._id, title, message).catch((err) =>
        console.error("Submission review push notification failed:", err?.message || err)
      );
    }

    res.json({ message: "Reviewed", status: normalizedStatus });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};
