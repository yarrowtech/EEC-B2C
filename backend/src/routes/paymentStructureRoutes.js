import express from "express";
import PaymentStructure from "../models/PaymentStructure.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// List rate cards
router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const items = await PaymentStructure.find({})
      .populate("board", "name")
      .populate("class", "name")
      .populate("subject", "name")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });
    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a rate card
router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { name, board, class: classId, subject, amountPerChapter } = req.body || {};
    const amount = Number(amountPerChapter);

    if (!String(name || "").trim()) {
      return res.status(400).json({ message: "Name is required" });
    }
    if (!Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({ message: "amountPerChapter must be a non-negative number" });
    }

    const structure = await PaymentStructure.create({
      name: String(name).trim(),
      board: board || null,
      class: classId || null,
      subject: subject || null,
      amountPerChapter: amount,
      createdBy: req.user.id,
    });

    const populated = await PaymentStructure.findById(structure._id)
      .populate("board", "name")
      .populate("class", "name")
      .populate("subject", "name");

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a rate card
router.put("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { name, board, class: classId, subject, amountPerChapter, active } = req.body || {};
    const updateData = {};

    if (typeof name === "string" && name.trim()) updateData.name = name.trim();
    if (board !== undefined) updateData.board = board || null;
    if (classId !== undefined) updateData.class = classId || null;
    if (subject !== undefined) updateData.subject = subject || null;
    if (typeof active === "boolean") updateData.active = active;
    if (amountPerChapter !== undefined) {
      const amount = Number(amountPerChapter);
      if (!Number.isFinite(amount) || amount < 0) {
        return res.status(400).json({ message: "amountPerChapter must be a non-negative number" });
      }
      updateData.amountPerChapter = amount;
    }

    const updated = await PaymentStructure.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate("board", "name")
      .populate("class", "name")
      .populate("subject", "name");

    if (!updated) return res.status(404).json({ message: "Payment structure not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a rate card
router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const deleted = await PaymentStructure.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Payment structure not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
