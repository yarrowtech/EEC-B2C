import express from "express";
import ChatMessage from "../models/ChatMessage.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Send message
// router.post("/", requireAuth, async (req, res) => {
//   const msg = await ChatMessage.create({
//     from: req.user.id,
//     to: req.body.to,
//     message: req.body.message,
//   });
//   res.json(msg);
// });

router.post("/", requireAuth, async (req, res) => {
  try {
    const msg = await ChatMessage.create({
      from: req.user.id,
      name: req.user.name,
      message: req.body.message,
      createdAt: new Date(),
      to: null, // group chat → no receiver
    });

    res.json(msg);
  } catch (err) {
    console.log("Chat save error:", err);
    res.status(500).json({ message: "Server error" });
  }
});



// Get chat between admin & teacher
// router.get("/:userId", requireAuth, async (req, res) => {
//   const messages = await ChatMessage.find({
//     $or: [
//       { from: req.user.id, to: req.params.userId },
//       { from: req.params.userId, to: req.user.id },
//     ],
//   })
//     .populate("from", "name role")
//     .populate("to", "name role")
//     .sort({ createdAt: 1 });

//   res.json(messages);
// });

router.get("/", requireAuth, async (req, res) => {
  const messages = await ChatMessage.find().sort({ createdAt: 1 });
  res.json(messages);
});

router.post("/read", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    await ChatMessage.updateMany(
      { seenBy: { $ne: userId } },
      { $push: { seenBy: userId } }
    );

    res.json({ message: "Read updated" });
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
        await ChatMessage.findByIdAndDelete(req.params.id);
        res.json({ message: "Message deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete("/", requireAuth, requireAdmin, async (req, res) => {
    try {
        await ChatMessage.deleteMany({});
        res.json({ message: "Chat cleared" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});



export default router;
