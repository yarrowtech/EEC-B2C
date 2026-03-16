import express from "express";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { sendPushNotification } from "./pushNotificationRoutes.js";

const router = express.Router();

function getClassCandidates(rawClass) {
  const trimmed = String(rawClass || "").trim();
  if (!trimmed) return [];

  const candidates = new Set([trimmed]);
  const withoutPrefix = trimmed.replace(/^class\s*/i, "").trim();
  if (withoutPrefix) {
    candidates.add(withoutPrefix);
    candidates.add(`Class ${withoutPrefix}`);
  }
  return Array.from(candidates);
}

function buildStudentAudienceFilter(user) {
  const clauses = [];

  const classCandidates = getClassCandidates(user.class || user.className);
  const classClause = [{ "audience.class": { $exists: false } }, { "audience.class": "" }];
  if (classCandidates.length) {
    classClause.push({ "audience.class": { $in: classCandidates } });
  }
  clauses.push({ $or: classClause });

  const board = String(user.board || "").trim();
  const boardClause = [{ "audience.board": { $exists: false } }, { "audience.board": "" }];
  if (board) {
    boardClause.push({ "audience.board": board });
  }
  clauses.push({ $or: boardClause });

  return clauses;
}

function isVisibleToUser(notification, user) {
  if (!notification || !user) return false;

  const userCreatedAt = user?.createdAt ? new Date(user.createdAt) : null;
  const notificationCreatedAt = notification?.createdAt ? new Date(notification.createdAt) : null;
  if (userCreatedAt && notificationCreatedAt && notificationCreatedAt < userCreatedAt) {
    return false;
  }

  if (!(notification.role === "all" || notification.role === user.role)) {
    return false;
  }

  if (user.role !== "student") return true;

  const studentClassCandidates = getClassCandidates(user.class || user.className);
  const targetClass = String(notification?.audience?.class || "").trim();
  const targetBoard = String(notification?.audience?.board || "").trim();
  const studentBoard = String(user.board || "").trim();

  const classOk = !targetClass || studentClassCandidates.includes(targetClass);
  const boardOk = !targetBoard || (studentBoard && studentBoard === targetBoard);
  return classOk && boardOk;
}

function buildNotificationVisibilityQuery(user) {
  const query = {
    $or: [{ role: user.role }, { role: "all" }],
  };

  const andClauses = [];
  if (reqUserCreatedAtIsValid(user)) {
    andClauses.push({ createdAt: { $gte: new Date(user.createdAt) } });
  }

  if (user.role === "student") {
    andClauses.push(...buildStudentAudienceFilter(user));
  }

  if (andClauses.length) {
    query.$and = andClauses;
  }

  return query;
}

function reqUserCreatedAtIsValid(user) {
  return Boolean(user?.createdAt && !Number.isNaN(new Date(user.createdAt).getTime()));
}

/* ---------------- ADMIN: CREATE NOTIFICATION ---------------- */
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { title, message, role } = req.body;

  const notification = await Notification.create({
    title,
    message,
    role,
    createdBy: req.user.id,
  });

  // Send web push notifications to target users
  try {
    let targetUsers = [];

    if (role === "all") {
      targetUsers = await User.find({}, "_id");
    } else {
      targetUsers = await User.find({ role }, "_id");
    }

    // Send push notification to each user with notification ID
    const pushPromises = targetUsers.map((user) =>
      sendPushNotification(user._id, title, message, notification._id.toString())
    );

    await Promise.all(pushPromises);
  } catch (error) {
    console.error("Failed to send push notifications:", error);
  }

  res.status(201).json(notification);
});


/* ---------------- USER: GET NOTIFICATIONS ---------------- */
router.get("/", requireAuth, async (req, res) => {
  const baseQuery = buildNotificationVisibilityQuery(req.user);

  const notifications = await Notification.find(baseQuery)
    .sort({ createdAt: -1 })
    .populate("createdBy", "name role");

  res.json(notifications);
});


/* ---------------- MARK AS READ ---------------- */
router.post("/:id/read", requireAuth, async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) {
    return res.status(404).json({ message: "Not found" });
  }
  if (!isVisibleToUser(notification, req.user)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await Notification.findByIdAndUpdate(req.params.id, {
    $addToSet: { readBy: req.user.id },
  });

  res.json({ success: true });
});

/* ---------------- CLEAR ALL ---------------- */
router.post("/clear-all", requireAuth, async (req, res) => {
  const visibleQuery = buildNotificationVisibilityQuery(req.user);
  await Notification.updateMany(
    visibleQuery,
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
  if (!isVisibleToUser(notification, req.user)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  res.json(notification);
});

// DELETE notification (admin only)
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  await Notification.findByIdAndDelete(req.params.id);
  res.json({ message: "Notification deleted" });
});


export default router;
