import express from "express";
import Subject from "../models/Subject.js";
import Topic from "../models/Topic.js";
import { requireAuth } from "../middleware/auth.js"; // ✅ FIXED IMPORT

const router = express.Router();

/* ---------- SUBJECT ROUTES ---------- */

// Add subject
router.post("/subject", requireAuth, async (req, res) => {
  // ✅ FIXED HERE
  try {
    const { name } = req.body;
    const subject = await Subject.create({
      name,
      createdBy: req.user.id,
    });
    res.json(subject);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all subjects
router.get("/subject", requireAuth, async (req, res) => {
  // ✅ FIXED HERE
  try {
    // const subjects = await Subject.find().sort({ name: 1 });
    const subjects = await Subject.find()
      .populate("createdBy", "name role") // ⭐ includes user name & role
      .sort({ createdAt: -1 });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ---------- TOPIC ROUTES ---------- */

// Add topic
router.post("/topic", requireAuth, async (req, res) => {
  // ✅ FIXED HERE
  try {
    const { name, subject } = req.body;
    const topic = await Topic.create({
      name,
      subject,
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
    const topics = await Topic.find({ subject: req.params.subjectId })
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    res.json(topics);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// UPDATE SUBJECT
router.put("/subject/:id", requireAuth, async (req, res) => {
  try {
    const { name } = req.body;
    const updated = await Subject.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true }
    );
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
    const { name, subject } = req.body;
    const updated = await Topic.findByIdAndUpdate(
      req.params.id,
      { name, subject },
      { new: true }
    );
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
