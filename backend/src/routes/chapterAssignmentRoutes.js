import express from "express";
import ChapterAssignment from "../models/ChapterAssignment.js";
import PaymentStructure from "../models/PaymentStructure.js";
import Topic from "../models/Topic.js";
import User from "../models/User.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

const POPULATE_FIELDS = [
  { path: "board", select: "name" },
  { path: "class", select: "name" },
  { path: "subject", select: "name" },
  { path: "topic", select: "name" },
  { path: "writer", select: "name email role" },
  { path: "structure", select: "name" },
];

function populateAll(query) {
  return POPULATE_FIELDS.reduce((q, p) => q.populate(p), query);
}

// Admin: list all scope assignments
router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { board, writer } = req.query;
    const filter = {};
    if (board) filter.board = board;
    if (writer) filter.writer = writer;

    const items = await populateAll(ChapterAssignment.find(filter).sort({ createdAt: -1 }));
    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Writer: view their own assigned scopes
router.get("/mine", requireAuth, async (req, res) => {
  try {
    const items = await populateAll(ChapterAssignment.find({ writer: req.user.id }).sort({ createdAt: -1 }));
    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: assign a writer to a board (optionally narrowed to a class,
// subject, or a single existing chapter within it)
router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { writerId, board, classId, subject, topicId, structureId, amount } = req.body || {};

    if (!writerId || !board) {
      return res.status(400).json({ message: "writerId and board are required" });
    }

    const writer = await User.findById(writerId).select("name email role");
    if (!writer) return res.status(404).json({ message: "Writer not found" });
    if (!["teacher", "admin"].includes(String(writer.role || "").toLowerCase())) {
      return res.status(400).json({ message: "Writer must be a teacher or admin account" });
    }

    let topic = null;
    if (topicId) {
      topic = await Topic.findById(topicId);
      if (!topic) return res.status(404).json({ message: "Chapter not found" });
      if (String(topic.board) !== String(board)) {
        return res.status(400).json({ message: "That chapter doesn't belong to the selected board" });
      }
      if (classId && String(topic.class) !== String(classId)) {
        return res.status(400).json({ message: "That chapter doesn't belong to the selected class" });
      }
      if (subject && String(topic.subject) !== String(subject)) {
        return res.status(400).json({ message: "That chapter doesn't belong to the selected subject" });
      }
    }

    let structure = null;
    let resolvedAmount = Number(amount);
    if (structureId) {
      structure = await PaymentStructure.findById(structureId);
      if (!structure) return res.status(404).json({ message: "Payment structure not found" });
      if (!Number.isFinite(resolvedAmount)) resolvedAmount = structure.amountPerChapter;
    }

    if (!Number.isFinite(resolvedAmount) || resolvedAmount < 0) {
      return res.status(400).json({ message: "A valid amount is required" });
    }

    const duplicate = await ChapterAssignment.findOne({
      writer: writerId,
      board,
      class: classId || null,
      subject: subject || null,
      topic: topicId || null,
    });
    if (duplicate) {
      return res.status(409).json({ message: "This writer already has an assignment for this exact scope." });
    }

    const created = await ChapterAssignment.create({
      writer: writerId,
      board,
      class: classId || null,
      subject: subject || null,
      topic: topicId || null,
      structure: structureId || null,
      amount: resolvedAmount,
      assignedBy: req.user.id,
    });

    // A chapter-level grant targets a chapter that already exists — fill in
    // its budget right away instead of waiting for it to be re-created.
    if (topic) {
      topic.assignmentId = created._id;
      topic.budgetAmount = resolvedAmount;
      await topic.save();
    }

    const populated = await populateAll(ChapterAssignment.findById(created._id));
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: adjust the rate / structure for an assignment
router.patch("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { amount, structureId } = req.body || {};
    const updateData = {};

    if (amount !== undefined) {
      const resolvedAmount = Number(amount);
      if (!Number.isFinite(resolvedAmount) || resolvedAmount < 0) {
        return res.status(400).json({ message: "A valid amount is required" });
      }
      updateData.amount = resolvedAmount;
    }
    if (structureId !== undefined) updateData.structure = structureId || null;

    const updated = await populateAll(
      ChapterAssignment.findByIdAndUpdate(req.params.id, updateData, { new: true })
    );
    if (!updated) return res.status(404).json({ message: "Assignment not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: revoke a writer's access to a scope
router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const assignment = await ChapterAssignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    const hasPaidChapters = await Topic.exists({ assignmentId: assignment._id, paymentStatus: "paid" });
    if (hasPaidChapters) {
      return res.status(400).json({
        message: "This assignment has chapters with completed payments and can't be removed.",
      });
    }

    await ChapterAssignment.findByIdAndDelete(req.params.id);
    await Topic.updateMany({ assignmentId: assignment._id }, { assignmentId: null });
    res.json({ message: "Assignment removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
