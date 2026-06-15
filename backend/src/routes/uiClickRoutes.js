import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import UiClickEvent from "../models/UiClickEvent.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

function cleanText(value, fallback = "") {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getOptionalUser(req) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return null;

  try {
    const token = auth.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = payload?.sub || payload?.id || payload?._id;
    if (!userId) return null;

    return await User.findById(userId).lean();
  } catch {
    return null;
  }
}

router.post("/", async (req, res) => {
  try {
    const user = await getOptionalUser(req);
    const body = req.body || {};

    if (user && String(user.role || "").toLowerCase() !== "student") {
      return res.status(204).end();
    }

    const buttonLabel = cleanText(body.buttonLabel);
    if (!buttonLabel) {
      return res.status(400).json({ message: "buttonLabel is required" });
    }

    await UiClickEvent.create({
      userId: user?._id || null,
      userName: cleanText(user?.name || body.userName),
      userEmail: cleanText(user?.email || body.userEmail),
      userRole: cleanText(user?.role || body.userRole),
      sessionId: cleanText(body.sessionId),
      buttonLabel,
      pagePath: cleanText(body.pagePath),
      pageTitle: cleanText(body.pageTitle),
      elementType: cleanText(body.elementType, "button"),
      href: cleanText(body.href),
      context: body.context && typeof body.context === "object" ? body.context : {},
      userAgent: cleanText(req.headers["user-agent"]),
    });

    res.status(201).json({ success: true });
  } catch (error) {
    console.error("ui-click create error:", error);
    res.status(500).json({ message: "Failed to record click event" });
  }
});

router.post("/merge-session", requireAuth, async (req, res) => {
  try {
    if (String(req.user?.role || "").toLowerCase() !== "student") {
      return res.status(204).end();
    }

    const sessionId = cleanText(req.body?.sessionId);
    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required" });
    }

    const user = await User.findById(req.user.id).lean();
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const update = {
      userId: user._id,
      userName: cleanText(user.name),
      userEmail: cleanText(user.email),
      userRole: "student",
    };

    const result = await UiClickEvent.updateMany(
      {
        sessionId,
        $or: [{ userId: null }, { userId: { $exists: false } }],
      },
      { $set: update }
    );

    res.json({
      success: true,
      matchedCount: result.matchedCount || 0,
      modifiedCount: result.modifiedCount || 0,
    });
  } catch (error) {
    console.error("ui-click merge error:", error);
    res.status(500).json({ message: "Failed to merge click session" });
  }
});

router.get("/admin/summary", requireAuth, async (req, res) => {
  try {
    if (String(req.user?.role || "").toLowerCase() !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const rangeDays = Math.max(1, Math.min(365, Number(req.query.days || 30) || 30));
    const search = cleanText(req.query.search);
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (rangeDays - 1));

    const match = { createdAt: { $gte: since }, userRole: "student" };
    if (search) {
      const pattern = escapeRegex(search);
      match.$or = [
        { buttonLabel: { $regex: pattern, $options: "i" } },
        { pagePath: { $regex: pattern, $options: "i" } },
        { userName: { $regex: pattern, $options: "i" } },
        { userEmail: { $regex: pattern, $options: "i" } },
      ];
    }

    const [
      overview,
      topButtons,
      topPages,
      topUsers,
      recentEvents,
      dailyTrend,
    ] = await Promise.all([
      UiClickEvent.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalClicks: { $sum: 1 },
            uniqueUsers: { $addToSet: "$userId" },
            uniqueButtons: { $addToSet: "$buttonLabel" },
            uniquePages: { $addToSet: "$pagePath" },
          },
        },
        {
          $project: {
            _id: 0,
            totalClicks: 1,
            uniqueUsers: {
              $size: {
                $filter: {
                  input: "$uniqueUsers",
                  as: "user",
                  cond: { $ne: ["$$user", null] },
                },
              },
            },
            uniqueButtons: { $size: "$uniqueButtons" },
            uniquePages: {
              $size: {
                $filter: {
                  input: "$uniquePages",
                  as: "page",
                  cond: { $and: [{ $ne: ["$$page", null] }, { $ne: ["$$page", ""] }] },
                },
              },
            },
          },
        },
      ]),
      UiClickEvent.aggregate([
        { $match: match },
        {
          $group: {
            _id: "$buttonLabel",
            count: { $sum: 1 },
            lastClickedAt: { $max: "$createdAt" },
            uniqueUsers: { $addToSet: "$userId" },
            samplePagePath: { $last: "$pagePath" },
          },
        },
        {
          $project: {
            _id: 0,
            buttonLabel: "$_id",
            count: 1,
            lastClickedAt: 1,
            uniqueUsers: {
              $size: {
                $filter: {
                  input: "$uniqueUsers",
                  as: "user",
                  cond: { $ne: ["$$user", null] },
                },
              },
            },
            samplePagePath: 1,
          },
        },
        { $sort: { count: -1, lastClickedAt: -1 } },
        { $limit: 20 },
      ]),
      UiClickEvent.aggregate([
        { $match: match },
        {
          $group: {
            _id: "$pagePath",
            count: { $sum: 1 },
            lastClickedAt: { $max: "$createdAt" },
          },
        },
        {
          $project: {
            _id: 0,
            pagePath: "$_id",
            count: 1,
            lastClickedAt: 1,
          },
        },
        { $sort: { count: -1, lastClickedAt: -1 } },
        { $limit: 20 },
      ]),
      UiClickEvent.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              userId: "$userId",
              userName: "$userName",
              userEmail: "$userEmail",
              userRole: "$userRole",
            },
            count: { $sum: 1 },
            lastClickedAt: { $max: "$createdAt" },
          },
        },
        {
          $project: {
            _id: 0,
            userId: "$_id.userId",
            userName: "$_id.userName",
            userEmail: "$_id.userEmail",
            userRole: "$_id.userRole",
            count: 1,
            lastClickedAt: 1,
          },
        },
        { $sort: { count: -1, lastClickedAt: -1 } },
        { $limit: 20 },
      ]),
      UiClickEvent.find(match)
        .sort({ createdAt: -1 })
        .limit(50)
        .populate("userId", "name email role")
        .lean(),
      UiClickEvent.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            year: "$_id.year",
            month: "$_id.month",
            day: "$_id.day",
            count: 1,
          },
        },
        { $sort: { year: 1, month: 1, day: 1 } },
      ]),
    ]);

    res.json({
      summary: {
        totalClicks: overview?.[0]?.totalClicks || 0,
        uniqueUsers: overview?.[0]?.uniqueUsers || 0,
        uniqueButtons: overview?.[0]?.uniqueButtons || 0,
        uniquePages: overview?.[0]?.uniquePages || 0,
        rangeDays,
      },
      topButtons,
      topPages,
      topUsers,
      recentEvents,
      dailyTrend,
    });
  } catch (error) {
    console.error("ui-click summary error:", error);
    res.status(500).json({ message: "Failed to load click analytics" });
  }
});

export default router;
