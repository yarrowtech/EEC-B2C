import express from "express";
import Class from "../models/Class.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// GET all
router.get("/", async (req, res) => {
  try {
    const data = await Class.find()
      .populate("createdBy", "name")
      .sort({ createdAt: 1 });

    res.json(data);
  } catch (err) {
    console.error("FETCH CLASSES ERROR:", err);
    res.status(500).json({ message: "Failed to fetch classes" });
  }
});

// CREATE
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const cls = await Class.create({
    name: req.body.name,
    createdBy: req.user.id,
  });
  res.json(cls);
});

// UPDATE
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  await Class.findByIdAndUpdate(req.params.id, { name: req.body.name });
  res.json({ success: true });
});

// DELETE
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  await Class.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

export default router;
