import express from "express";
import { requireAuth } from "../middleware/auth.js";
import Question from "../models/Question.js";
import DailyChallengeAttempt from "../models/DailyChallengeAttempt.js";
import User from "../models/User.js";
import Board from "../models/Board.js";
import ClassModel from "../models/Class.js";
import mongoose from "mongoose";
import Subject from "../models/Subject.js";
import Topic from "../models/Topic.js";

const router = express.Router();
const DAILY_CHALLENGE_REWARD_POINTS = 10;

function dateKeyFromDate(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function previousDateKey(dateKey) {
  const d = new Date(`${dateKey}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return dateKeyFromDate(d);
}

function offsetDateKey(dateKey, daysOffset) {
  const d = new Date(`${dateKey}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + Number(daysOffset || 0));
  return dateKeyFromDate(d);
}

function streakBadge(streak) {
  if (streak >= 30) return "legend";
  if (streak >= 14) return "gold";
  if (streak >= 7) return "silver";
  if (streak >= 3) return "bronze";
  if (streak >= 1) return "novice";
  return "none";
}

function normalizeAnswer(raw) {
  if (Array.isArray(raw)) return raw.map((x) => String(x));
  if (raw && typeof raw === "object" && Array.isArray(raw.mcq)) {
    return raw.mcq.map((x) => String(x));
  }
  if (typeof raw === "string") return [raw];
  return [];
}

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function escapeRegex(input) {
  return String(input || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeBoardValue(raw) {
  return String(raw || "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeClassValue(raw) {
  return String(raw || "")
    .trim()
    .replace(/\s+/g, " ");
}

function classRegexCandidates(className) {
  const normalized = normalizeClassValue(className);
  const candidates = [];
  if (normalized) {
    candidates.push(new RegExp(`^${escapeRegex(normalized)}$`, "i"));
  }
  const num = normalized.match(/\d+/)?.[0];
  if (num) {
    candidates.push(new RegExp(`^class\\s*${escapeRegex(num)}$`, "i"));
    candidates.push(new RegExp(`^${escapeRegex(num)}$`, "i"));
  }
  return candidates.length ? candidates : [new RegExp("^$", "i")];
}

function boardRegexCandidates(board) {
  const normalized = normalizeBoardValue(board);
  const candidates = [];
  if (normalized) {
    candidates.push(new RegExp(`^${escapeRegex(normalized)}$`, "i"));
    const withoutBoardWord = normalized.replace(/\s*board\s*$/i, "").trim();
    if (withoutBoardWord && withoutBoardWord.toLowerCase() !== normalized.toLowerCase()) {
      candidates.push(new RegExp(`^${escapeRegex(withoutBoardWord)}(\\s*board)?$`, "i"));
    } else if (withoutBoardWord) {
      candidates.push(new RegExp(`^${escapeRegex(withoutBoardWord)}\\s*board$`, "i"));
    }
  }
  return candidates.length ? candidates : [new RegExp("^$", "i")];
}

async function resolveBoardCandidates(board) {
  const out = new Set();
  const normalized = normalizeBoardValue(board);
  if (normalized) {
    out.add(normalized);
    const withoutBoardWord = normalized.replace(/\s*board\s*$/i, "").trim();
    if (withoutBoardWord) {
      out.add(withoutBoardWord);
      out.add(`${withoutBoardWord} Board`);
    }
  }

  if (mongoose.Types.ObjectId.isValid(normalized) && /^[0-9a-fA-F]{24}$/.test(normalized)) {
    out.add(String(normalized));
  } else if (normalized) {
    const boardDoc = await Board.findOne({ name: { $regex: new RegExp(`^${escapeRegex(normalized)}$`, "i") } })
      .select("_id name")
      .lean();
    if (boardDoc?._id) out.add(String(boardDoc._id));
    if (boardDoc?.name) out.add(String(boardDoc.name));
  }

  return [...out].filter(Boolean);
}

async function resolveClassCandidates(className) {
  const out = new Set();
  const normalized = normalizeClassValue(className);
  if (normalized) {
    out.add(normalized);
    const num = normalized.match(/\d+/)?.[0];
    if (num) {
      out.add(num);
      out.add(`Class ${num}`);
    }
  }

  if (mongoose.Types.ObjectId.isValid(normalized) && /^[0-9a-fA-F]{24}$/.test(normalized)) {
    out.add(String(normalized));
  } else if (normalized) {
    const classDoc = await ClassModel.findOne({ name: { $regex: new RegExp(`^${escapeRegex(normalized)}$`, "i") } })
      .select("_id name")
      .lean();
    if (classDoc?._id) out.add(String(classDoc._id));
    if (classDoc?.name) out.add(String(classDoc.name));
  }

  return [...out].filter(Boolean);
}

async function buildDailyQuestionFilter({ board, className }) {
  const boardValues = await resolveBoardCandidates(board);
  const classValues = await resolveClassCandidates(className);
  const boardRegex = boardRegexCandidates(board);
  const classRegex = classRegexCandidates(className);

  return {
    type: { $in: ["mcq-single", "mcq-multi"] },
    $and: [
      { board: { $in: [...boardValues, ...boardRegex] } },
      { class: { $in: [...classValues, ...classRegex] } },
    ],
  };
}

function sanitizeQuestion(question) {
  return {
    _id: question._id,
    type: question.type,
    question: question.question || question.prompt || "",
    options: Array.isArray(question.options)
      ? question.options.map((o) => ({ key: o.key, text: o.text }))
      : [],
    subject: question.subject || "",
    topic: question.topic || "",
    board: question.board || "",
    class: question.class || "",
  };
}

function isObjectIdLike(value) {
  const raw = String(value || "").trim();
  return /^[0-9a-fA-F]{24}$/.test(raw);
}

async function resolveLabel(Model, value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (!isObjectIdLike(raw)) return raw;
  const doc = await Model.findById(raw).select("name").lean();
  return doc?.name || raw;
}

async function enrichQuestionLabels(question) {
  const [boardLabel, classLabel, subjectLabel, topicLabel] = await Promise.all([
    resolveLabel(Board, question.board),
    resolveLabel(ClassModel, question.class),
    resolveLabel(Subject, question.subject),
    resolveLabel(Topic, question.topic),
  ]);

  return {
    ...question,
    board: boardLabel || question.board || "",
    class: classLabel || question.class || "",
    subject: subjectLabel || question.subject || "",
    topic: topicLabel || question.topic || "",
  };
}

function isMcqCorrect(question, answerKeys) {
  const correct = Array.isArray(question.correct)
    ? question.correct.map((x) => String(x))
    : [];
  const userAns = answerKeys.map((x) => String(x));

  if (question.type === "mcq-single") {
    return userAns.length === 1 && correct.length === 1 && userAns[0] === correct[0];
  }

  const cSet = new Set(correct);
  const uSet = new Set(userAns);
  if (cSet.size !== uSet.size) return false;
  for (const c of cSet) {
    if (!uSet.has(c)) return false;
  }
  return true;
}

async function pickQuestionOfTheDay({ userId, board, className, dateKey }) {
  const filter = await buildDailyQuestionFilter({ board, className });

  const count = await Question.countDocuments(filter);
  if (!count) return null;

  const index = hashString(`${userId}:${dateKey}`) % count;
  const question = await Question.findOne(filter)
    .sort({ _id: 1 })
    .skip(index)
    .select("type question prompt options correct subject topic board class")
    .lean();

  return question || null;
}

async function computeCurrentStreak(userId, todayKey) {
  const latest = await DailyChallengeAttempt.findOne({ userId })
    .sort({ dateKey: -1 })
    .select("dateKey isCorrect streakAfter")
    .lean();

  if (!latest) {
    return { streak: 0, broken: false };
  }

  if (latest.dateKey === todayKey) {
    return { streak: latest.streakAfter || 0, broken: false };
  }

  const yesterday = previousDateKey(todayKey);
  if (latest.dateKey === yesterday && latest.isCorrect) {
    return { streak: latest.streakAfter || 0, broken: false };
  }

  return {
    streak: 0,
    broken: Number(latest.streakAfter || 0) > 0,
  };
}

router.get("/today", requireAuth, async (req, res) => {
  try {
    if (String(req.user?.role || "").toLowerCase() !== "student") {
      return res.status(403).json({ message: "Daily challenge is available for students only" });
    }

    const board = String(req.user?.board || "").trim();
    const className = String(req.user?.className || req.user?.class || "").trim();
    if (!board || !className) {
      return res.status(400).json({ message: "Please update board and class in profile" });
    }

    const todayKey = dateKeyFromDate(new Date());
    const existing = await DailyChallengeAttempt.findOne({
      userId: req.user.id,
      dateKey: todayKey,
    }).lean();

    const question = await pickQuestionOfTheDay({
      userId: String(req.user.id),
      board,
      className,
      dateKey: todayKey,
    });

    if (!question) {
      return res.status(404).json({ message: "No daily challenge questions available for your class and board" });
    }

    const streakState = await computeCurrentStreak(req.user.id, todayKey);
    const currentStreak = existing ? Number(existing.streakAfter || 0) : Number(streakState.streak || 0);

    const displayQuestion = await enrichQuestionLabels(question);

    return res.json({
      dateKey: todayKey,
      alreadyAttempted: Boolean(existing),
      isCorrect: existing ? Boolean(existing.isCorrect) : null,
      pointsAwarded: existing ? Number(existing.pointsAwarded || 0) : 0,
      streak: currentStreak,
      streakBroken: !existing && streakState.broken,
      badge: streakBadge(currentStreak),
      question: sanitizeQuestion(displayQuestion),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to load daily challenge" });
  }
});

router.post("/submit", requireAuth, async (req, res) => {
  try {
    if (String(req.user?.role || "").toLowerCase() !== "student") {
      return res.status(403).json({ message: "Daily challenge is available for students only" });
    }

    const board = String(req.user?.board || "").trim();
    const className = String(req.user?.className || req.user?.class || "").trim();
    if (!board || !className) {
      return res.status(400).json({ message: "Please update board and class in profile" });
    }

    const todayKey = dateKeyFromDate(new Date());
    const existing = await DailyChallengeAttempt.findOne({
      userId: req.user.id,
      dateKey: todayKey,
    }).lean();

    if (existing) {
      const existingStreak = Number(existing.streakAfter || 0);
      return res.json({
        alreadyAttempted: true,
        isCorrect: Boolean(existing.isCorrect),
        streak: existingStreak,
        badge: streakBadge(existingStreak),
        pointsAwarded: Number(existing.pointsAwarded || 0),
      });
    }

    const dailyQuestion = await pickQuestionOfTheDay({
      userId: String(req.user.id),
      board,
      className,
      dateKey: todayKey,
    });

    if (!dailyQuestion) {
      return res.status(404).json({ message: "No daily challenge questions available for your class and board" });
    }

    const incomingQuestionId = String(req.body?.questionId || "");
    if (!incomingQuestionId || incomingQuestionId !== String(dailyQuestion._id)) {
      return res.status(400).json({ message: "Invalid daily challenge question" });
    }

    const answerKeys = normalizeAnswer(req.body?.answer).filter(Boolean);
    const isCorrect = isMcqCorrect(dailyQuestion, answerKeys);

    const yesterdayKey = previousDateKey(todayKey);
    const yesterdayAttempt = await DailyChallengeAttempt.findOne({
      userId: req.user.id,
      dateKey: yesterdayKey,
    })
      .select("isCorrect streakAfter")
      .lean();

    const streakAfter = isCorrect
      ? (yesterdayAttempt?.isCorrect ? Number(yesterdayAttempt.streakAfter || 0) + 1 : 1)
      : 0;
    const badgeAfter = streakBadge(streakAfter);
    const pointsAwarded = isCorrect ? DAILY_CHALLENGE_REWARD_POINTS : 0;

    let updatedPoints = null;
    if (pointsAwarded > 0) {
      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { $inc: { points: pointsAwarded } },
        { new: true, select: "points" }
      ).lean();
      updatedPoints = Number(updatedUser?.points || 0);
    }

    const saved = await DailyChallengeAttempt.create({
      userId: req.user.id,
      dateKey: todayKey,
      questionId: dailyQuestion._id,
      questionType: dailyQuestion.type,
      board,
      className,
      subject: dailyQuestion.subject || "",
      topic: dailyQuestion.topic || "",
      userAnswer: answerKeys,
      correctAnswer: Array.isArray(dailyQuestion.correct)
        ? dailyQuestion.correct.map((x) => String(x))
        : [],
      isCorrect,
      pointsAwarded,
      streakAfter,
      badgeAfter,
      submittedAt: new Date(),
    });

    return res.json({
      success: true,
      isCorrect,
      streak: streakAfter,
      badge: badgeAfter,
      pointsAwarded,
      totalPoints: updatedPoints,
      attemptId: saved._id,
      correctAnswer: Array.isArray(dailyQuestion.correct) ? dailyQuestion.correct : [],
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to submit daily challenge" });
  }
});

router.get("/attempts", requireAuth, async (req, res) => {
  try {
    if (String(req.user?.role || "").toLowerCase() !== "student") {
      return res.status(403).json({ message: "Daily challenge is available for students only" });
    }

    const items = await DailyChallengeAttempt.find({ userId: req.user.id })
      .sort({ submittedAt: -1, createdAt: -1 })
      .select("dateKey questionType subject topic isCorrect pointsAwarded streakAfter badgeAfter submittedAt createdAt")
      .lean();

    const subjectIds = [...new Set(items.map((x) => String(x?.subject || "").trim()).filter(isObjectIdLike))];
    const topicIds = [...new Set(items.map((x) => String(x?.topic || "").trim()).filter(isObjectIdLike))];

    const [subjects, topics] = await Promise.all([
      subjectIds.length ? Subject.find({ _id: { $in: subjectIds } }).select("_id name").lean() : [],
      topicIds.length ? Topic.find({ _id: { $in: topicIds } }).select("_id name").lean() : [],
    ]);

    const subjectMap = new Map(subjects.map((s) => [String(s._id), String(s.name || "")]));
    const topicMap = new Map(topics.map((t) => [String(t._id), String(t.name || "")]));

    const enriched = items.map((row) => ({
      ...row,
      subjectName: subjectMap.get(String(row?.subject || "").trim()) || String(row?.subject || ""),
      topicName: topicMap.get(String(row?.topic || "").trim()) || String(row?.topic || ""),
    }));

    return res.json({ items: enriched });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to load daily challenge attempts" });
  }
});

router.get("/stats", requireAuth, async (req, res) => {
  try {
    const todayKey = dateKeyFromDate(new Date());
    const streakState = await computeCurrentStreak(req.user.id, todayKey);
    return res.json({
      streak: Number(streakState.streak || 0),
      badge: streakBadge(Number(streakState.streak || 0)),
      streakBroken: Boolean(streakState.broken),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to load daily challenge stats" });
  }
});

router.get("/history", requireAuth, async (req, res) => {
  try {
    if (String(req.user?.role || "").toLowerCase() !== "student") {
      return res.status(403).json({ message: "Daily challenge is available for students only" });
    }

    const rawDays = Number(req.query?.days || 30);
    const days = Math.min(120, Math.max(7, Number.isFinite(rawDays) ? rawDays : 30));
    const todayKey = dateKeyFromDate(new Date());
    const startKey = offsetDateKey(todayKey, -(days - 1));

    const attempts = await DailyChallengeAttempt.find({
      userId: req.user.id,
      dateKey: { $gte: startKey, $lte: todayKey },
    })
      .sort({ dateKey: 1 })
      .select("dateKey isCorrect submittedAt")
      .lean();

    const byDate = new Map(
      attempts.map((a) => [String(a.dateKey), { isCorrect: Boolean(a.isCorrect), submittedAt: a.submittedAt }])
    );

    const items = [];
    let attemptedCount = 0;
    let correctCount = 0;
    for (let i = 0; i < days; i += 1) {
      const dateKey = offsetDateKey(startKey, i);
      const found = byDate.get(dateKey);
      if (!found) {
        items.push({ dateKey, status: "missed", isAttempted: false, isCorrect: false });
        continue;
      }
      attemptedCount += 1;
      if (found.isCorrect) correctCount += 1;
      items.push({
        dateKey,
        status: found.isCorrect ? "correct" : "wrong",
        isAttempted: true,
        isCorrect: found.isCorrect,
      });
    }

    return res.json({
      days,
      todayKey,
      items,
      summary: {
        attemptedCount,
        correctCount,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to load daily challenge history" });
  }
});

export default router;
