import express from "express";
import Notification from "../models/Notification.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

/* ---------------- ADMIN: CREATE NOTIFICATION ---------------- */
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { title, message, role } = req.body;

  const notification = await Notification.create({
    title,
    message,
    role,
    createdBy: req.user.id,
  });

  res.status(201).json(notification);
});


/* ---------------- USER: GET NOTIFICATIONS ---------------- */
router.get("/", requireAuth, async (req, res) => {
  const notifications = await Notification.find({
    $or: [{ role: req.user.role }, { role: "all" }],
  })
    .sort({ createdAt: -1 })
    .populate("createdBy", "name role");

  res.json(notifications);
});


/* ---------------- MARK AS READ ---------------- */
router.post("/:id/read", requireAuth, async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, {
    $addToSet: { readBy: req.user.id },
  });

  res.json({ success: true });
});

/* ---------------- CLEAR ALL ---------------- */
router.post("/clear-all", requireAuth, async (req, res) => {
  await Notification.updateMany(
    {},
    { $addToSet: { readBy: req.user.id } }
  );

  res.json({ success: true });
});

// GET single notification
router.get("/:id", requireAuth, async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) {
    return res.status(404).json({ message: "Not found" });
  }
  res.json(notification);
});

// DELETE notification (admin only)
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  await Notification.findByIdAndDelete(req.params.id);
  res.json({ message: "Notification deleted" });
});


export default router;
