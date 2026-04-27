import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import FlashcardSet from "../models/FlashcardSet.js";
import FlashcardAttempt from "../models/FlashcardAttempt.js";

const router = Router();

function isAdmin(req) {
  return String(req.user?.role || "").toLowerCase() === "admin";
}

function sanitizeCards(cards = []) {
  return (Array.isArray(cards) ? cards : [])
    .map((card) => ({
      front: String(card?.front || "").trim(),
      back: String(card?.back || "").trim(),
    }))
    .filter((card) => card.front && card.back);
}

function normalizeScopeValue(v) {
  const s = String(v || "").trim();
  return s || undefined;
}

router.get("/", requireAuth, async (req, res) => {
  try {
    const {
      board,
      class: className,
      subject,
      topic,
      stage,
      q,
      admin: adminFlag,
      limit = "50",
      page = "1",
    } = req.query;

    const filter = {};
    const requestIsAdmin = isAdmin(req) && String(adminFlag || "") === "1";

    if (!requestIsAdmin) {
      filter.isActive = true;
    }

    const boardVal = normalizeScopeValue(board) || normalizeScopeValue(req.user?.board);
    const classVal = normalizeScopeValue(className) || normalizeScopeValue(req.user?.class) || normalizeScopeValue(req.user?.className);

    if (boardVal) filter.board = boardVal;
    if (classVal) filter.class = classVal;
    if (normalizeScopeValue(subject)) filter.subject = normalizeScopeValue(subject);
    if (normalizeScopeValue(topic)) filter.topic = normalizeScopeValue(topic);

    const stageNum = Number(stage);
    if (Number.isFinite(stageNum) && stageNum > 0) {
      filter.stage = Math.trunc(stageNum);
    }

    const search = String(q || "").trim();
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(100, Number(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      FlashcardSet.find(filter)
        .sort({ updatedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      FlashcardSet.countDocuments(filter),
    ]);

    const mapped = items.map((row) => ({
      ...row,
      cardsCount: Array.isArray(row.cards) ? row.cards.length : 0,
      participantsCount: Array.isArray(row.participants) ? row.participants.length : Number(row.participantsCount || 0),
    }));

    res.json({
      items: mapped,
      page: pageNum,
      limit: limitNum,
      total,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load flashcards" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const doc = await FlashcardSet.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: "Flashcard set not found" });
    if (!doc.isActive && !isAdmin(req)) {
      return res.status(403).json({ message: "This flashcard set is currently inactive" });
    }

    let myLastAttempt = null;
    if (!isAdmin(req)) {
      myLastAttempt = await FlashcardAttempt.findOne({
        flashcardSet: doc._id,
        user: req.user.id,
      })
        .sort({ createdAt: -1 })
        .lean();
    }

    res.json({
      ...doc,
      participantsCount: Array.isArray(doc.participants) ? doc.participants.length : 0,
      myLastAttempt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load flashcard set" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const {
      title,
      description = "",
      board,
      class: className,
      subject,
      topic,
      stage = 1,
      isActive = true,
      cards = [],
    } = req.body;

    const safeCards = sanitizeCards(cards);
    if (!title || !board || !className || !subject || !topic || safeCards.length === 0) {
      return res.status(400).json({
        message: "Title, board, class, subject, topic, and at least one valid card are required",
      });
    }

    const doc = await FlashcardSet.create({
      title: String(title).trim(),
      description: String(description || "").trim(),
      board: String(board).trim(),
      class: String(className).trim(),
      subject: String(subject).trim(),
      topic: String(topic).trim(),
      stage: Number(stage) > 0 ? Math.trunc(Number(stage)) : 1,
      isActive: Boolean(isActive),
      cards: safeCards,
      createdBy: req.user.id,
    });

    res.json({ message: "Flashcard set created successfully", item: doc });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to create flashcard set" });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const doc = await FlashcardSet.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Flashcard set not found" });

    const {
      title,
      description,
      board,
      class: className,
      subject,
      topic,
      stage,
      isActive,
      cards,
    } = req.body;

    if (typeof title === "string") doc.title = title.trim();
    if (typeof description === "string") doc.description = description.trim();
    if (typeof board === "string" && board.trim()) doc.board = board.trim();
    if (typeof className === "string" && className.trim()) doc.class = className.trim();
    if (typeof subject === "string" && subject.trim()) doc.subject = subject.trim();
    if (typeof topic === "string" && topic.trim()) doc.topic = topic.trim();
    if (Number.isFinite(Number(stage)) && Number(stage) > 0) {
      doc.stage = Math.trunc(Number(stage));
    }
    if (typeof isActive === "boolean") doc.isActive = isActive;

    if (cards !== undefined) {
      const safeCards = sanitizeCards(cards);
      if (safeCards.length === 0) {
        return res.status(400).json({ message: "At least one valid card is required" });
      }
      doc.cards = safeCards;
    }

    await doc.save();
    res.json({ message: "Flashcard set updated successfully", item: doc });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update flashcard set" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ message: "Admin access required" });
    }
    const doc = await FlashcardSet.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Flashcard set not found" });

    await FlashcardAttempt.deleteMany({ flashcardSet: doc._id });
    res.json({ message: "Flashcard set deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to delete flashcard set" });
  }
});

router.post("/:id/participate", requireAuth, async (req, res) => {
  try {
    const doc = await FlashcardSet.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Flashcard set not found" });
    if (!doc.isActive && !isAdmin(req)) {
      return res.status(403).json({ message: "This flashcard set is currently inactive" });
    }

    const knownCardIdsRaw = Array.isArray(req.body?.knownCardIds) ? req.body.knownCardIds : [];
    const unknownCardIdsRaw = Array.isArray(req.body?.unknownCardIds) ? req.body.unknownCardIds : [];
    const durationSec = Math.max(0, Number(req.body?.durationSec || 0));

    const allCardIds = new Set((doc.cards || []).map((card) => String(card._id)));
    const knownSet = new Set(
      knownCardIdsRaw
        .map((id) => String(id))
        .filter((id) => allCardIds.has(id))
    );
    const unknownSet = new Set(
      unknownCardIdsRaw
        .map((id) => String(id))
        .filter((id) => allCardIds.has(id) && !knownSet.has(id))
    );

    const totalCards = Math.max(1, Array.isArray(doc.cards) ? doc.cards.length : 1);
    const knownCount = knownSet.size;
    const unknownCount = unknownSet.size;
    const percent = Math.round((knownCount / totalCards) * 100);

    const attempt = await FlashcardAttempt.create({
      flashcardSet: doc._id,
      user: req.user.id,
      totalCards,
      knownCount,
      unknownCount,
      percent,
      durationSec,
      knownCardIds: Array.from(knownSet),
      unknownCardIds: Array.from(unknownSet),
    });

    await FlashcardSet.updateOne(
      { _id: doc._id },
      {
        $addToSet: { participants: req.user.id },
        $inc: { attemptsCount: 1 },
      }
    );

    res.json({
      message: "Participation saved",
      attempt: {
        _id: attempt._id,
        totalCards,
        knownCount,
        unknownCount,
        percent,
        durationSec,
        createdAt: attempt.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to save participation" });
  }
});

router.get("/:id/my-attempts", requireAuth, async (req, res) => {
  try {
    const rows = await FlashcardAttempt.find({
      flashcardSet: req.params.id,
      user: req.user.id,
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    res.json({ items: rows });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load attempts" });
  }
});

export default router;
