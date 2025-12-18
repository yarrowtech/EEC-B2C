import express from "express";
import Board from "../models/Board.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const data = await Board.find().populate("createdBy", "name").sort({ createdAt: 1 });

    res.json(data);
  } catch (err) {
    console.error("FETCH BOARDS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch boards" });
  }
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const board = await Board.create({
    name: req.body.name,
    createdBy: req.user.id,
  });
  res.json(board);
});

router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  await Board.findByIdAndUpdate(req.params.id, { name: req.body.name });
  res.json({ success: true });
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  await Board.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

export default router;
