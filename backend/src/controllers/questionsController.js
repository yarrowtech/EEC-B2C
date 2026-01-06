// src/controllers/questionsController.js
import Question from "../models/Question.js";

// Helpers
function isAdminOrTeacher(req) {
  const role = String(req.user?.role || "").toLowerCase();
  return role === "admin" || role === "teacher";
}

function requireAdminOrTeacher(req, res) {
  if (!isAdminOrTeacher(req)) {
    res.status(403).json({ message: "Forbidden" });
    return false;
  }
  return true;
}

/**
 * Validate and normalize payload by type.
 * Returns: { ok: true, doc } OR { ok: false, message }
 */
function shapeByType(type, body, userId) {
  const common = {
    type,
    subject: String(body.subject || "").trim(),
    topic: String(body.topic || "").trim(),
    difficulty: body.difficulty || "easy",
    tags: String(body.tags || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    explanation: body.explanation || "",
    stage: Number(body.stage || 1),
    level: String(body.level || "basic"),
    createdBy: userId,
  };

  switch (type) {
    case "mcq-single": {
      const q = String(body.question || "").trim();
      const options = Array.isArray(body.options) ? body.options : [];
      const correct = String(body.correct || "").trim(); // "A" | "B" | "C" | "D"
      if (!q || options.length !== 4) {
        return { ok: false, message: "question and 4 options are required" };
      }
      const norm = options.map((t, i) => ({
        key: ["A", "B", "C", "D"][i],
        text: String(t || "").trim(),
      }));
      if (!["A", "B", "C", "D"].includes(correct)) {
        return { ok: false, message: "correct must be A/B/C/D" };
      }
      return {
        ok: true,
        doc: { ...common, question: q, options: norm, correct: [correct] },
      };
    }
    case "mcq-multi": {
      const q = String(body.question || "").trim();
      const options = Array.isArray(body.options) ? body.options : [];
      const correct = Array.isArray(body.correct) ? body.correct : [];
      if (!q || options.length !== 4) {
        return { ok: false, message: "question and 4 options are required" };
      }
      const norm = options.map((t, i) => ({
        key: ["A", "B", "C", "D"][i],
        text: String(t || "").trim(),
      }));
      const okKeys = new Set(["A", "B", "C", "D"]);
      for (const k of correct) {
        if (!okKeys.has(k)) {
          return { ok: false, message: "correct must be among A/B/C/D" };
        }
      }
      return {
        ok: true,
        doc: { ...common, question: q, options: norm, correct },
      };
    }
    case "true-false": {
      const statement = String(body.question || body.statement || "").trim();
      const ans = String(body.answer || body.correct || "")
        .trim()
        .toLowerCase();
      if (!statement || !["true", "false"].includes(ans)) {
        return {
          ok: false,
          message: "statement and answer (true/false) required",
        };
      }
      return {
        ok: true,
        doc: { ...common, type, question: statement, correct: [ans] },
      };
    }
    case "choice-matrix": {
      const {
        prompt,
        rows = [],
        cols = [],
        correctCells = [],
      } = body.choiceMatrix || {};
      if (!prompt || !Array.isArray(rows) || !Array.isArray(cols)) {
        return {
          ok: false,
          message: "choiceMatrix: prompt, rows[], cols[] required",
        };
      }
      return {
        ok: true,
        doc: { ...common, choiceMatrix: { prompt, rows, cols, correctCells } },
      };
    }
    case "cloze-drag": {
      const { text, tokens = [], correctMap = {} } = body.clozeDrag || {};
      if (!text || !Array.isArray(tokens)) {
        return { ok: false, message: "clozeDrag: text and tokens[] required" };
      }
      return {
        ok: true,
        doc: { ...common, clozeDrag: { text, tokens, correctMap } },
      };
    }
    case "cloze-select": {
      const { text, blanks = {} } = body.clozeSelect || {};
      if (!text) return { ok: false, message: "clozeSelect: text required" };
      const correctValues = Object.values(blanks)
        .map((b) => b?.correct)
        .filter(Boolean);
      return {
        ok: true,
        doc: { ...common, clozeSelect: { text, blanks }, correct: correctValues },
      };
    }
    case "cloze-text": {
      const { text, answers = {} } = body.clozeText || {};
      if (!text) return { ok: false, message: "clozeText: text required" };
      return { ok: true, doc: { ...common, clozeText: { text, answers } } };
    }
    case "match-list": {
      const {
        prompt,
        left = [],
        right = [],
        pairs = {},
      } = body.matchList || {};
      if (!prompt || !Array.isArray(left) || !Array.isArray(right)) {
        return {
          ok: false,
          message: "matchList: prompt, left[], right[] required",
        };
      }
      return {
        ok: true,
        doc: { ...common, matchList: { prompt, left, right, pairs } },
      };
    }
    case "essay-rich": {
      const prompt = String(body.prompt || "").trim();
      const richHtml = String(body.richHtml || body.html || "").trim();
      if (!prompt) return { ok: false, message: "essay-rich: prompt required" };
      return { ok: true, doc: { ...common, prompt, richHtml } };
    }
    case "essay-plain": {
      const prompt = String(body.prompt || "").trim();
      const plainText = String(body.plainText || body.answer || "").trim();
      if (!prompt)
        return { ok: false, message: "essay-plain: prompt required" };
      return { ok: true, doc: { ...common, prompt, plainText } };
    }
    default:
      return { ok: false, message: "Unknown question type" };
  }
}

// ---------- Controllers ----------

// export const create = async (req, res) => {
//   try {
//     if (!requireAdmin(req, res)) return;
//     const type = String(req.params.type || "").trim();
//     const { ok, doc, message } = shapeByType(type, req.body, req.user.id);
//     if (!ok) return res.status(400).json({ message });

//     doc.class = req.body.class;
//     const saved = await Question.create(doc);
//     res.status(201).json({ message: "Created", id: saved._id });
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ message: "Server error" });
//   }
// };

export const create = async (req, res) => {
  try {
    if (!requireAdminOrTeacher(req, res)) return;

    const type = String(req.params.type || "").trim();
    const { ok, doc, message } = shapeByType(type, req.body, req.user.id);
    if (!ok) return res.status(400).json({ message });

    doc.class = req.body.class;
    doc.board = req.body.board;

    const saved = await Question.create(doc);
    res.status(201).json({ message: "Created", id: saved._id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

// export const list = async (req, res) => {
//   try {
//     // authenticated read
//     const { type, subject, topic, q, page = 1, limit = 20 } = req.query;
//     const filter = {};
//     if (type) filter.type = type;
//     if (subject) filter.subject = subject;
//     if (topic) filter.topic = topic;
//     if (q) {
//       filter.$or = [
//         { question: { $regex: q, $options: "i" } },
//         { prompt: { $regex: q, $options: "i" } },
//         { subject: { $regex: q, $options: "i" } },
//         { topic: { $regex: q, $options: "i" } },
//       ];
//     }
//     const skip = (Number(page) - 1) * Number(limit);
//     const [items, total] = await Promise.all([
//       Question.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
//       Question.countDocuments(filter),
//     ]);
//     res.json({ items, total, page: Number(page), limit: Number(limit) });
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// --- READ: list with filters + pagination ---
export const list = async (req, res) => {
  try {
    const {
      type,
      subject,
      topic,
      stage,
      level,
      board,
      q,
      page = 1,
      limit = 20,
    } = req.query;
    const filter = {};
    // student class filter
    // const userClass = req.user?.class;
    // if (userClass) filter.class = userClass;
    // ⭐ Student class restriction
    // if (req.user?.role === "student" && req.user.class) {
    //   filter.class = req.user.class;
    // }
    if (req.user?.role === "student") {
      if (req.user.class) {
        filter.class = req.user.class;
      }
      if (req.user.board) {
        filter.board = req.user.board; // ✅ AUTO board filter
      }
    }

    // ⭐ Admin class filter (from UI class tabs)
    if (req.query.class) {
      filter.class = req.query.class;
    }
    if (req.query.board) {
      filter.board = req.query.board; // ✅ Admin filter
    }

    if (type) filter.type = type;
    if (subject) filter.subject = subject;
    if (topic) filter.topic = topic;
    if (stage) filter.stage = Number(stage);
    if (level) filter.level = level;
    if (q) {
      filter.$or = [
        { question: { $regex: q, $options: "i" } },
        { prompt: { $regex: q, $options: "i" } },
        { subject: { $regex: q, $options: "i" } },
        { topic: { $regex: q, $options: "i" } },
        { board: { $regex: q, $options: "i" } },
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Question.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Question.countDocuments(filter),
    ]);
    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

// export const getOne = async (req, res) => {
//   try {
//     const doc = await Question.findById(req.params.id);
//     if (!doc) return res.status(404).json({ message: "Not found" });
//     res.json(doc);
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// --- READ: get one by id ---
export const getOne = async (req, res) => {
  try {
    const doc = await Question.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

// export const update = async (req, res) => {
//   try {
//     if (!requireAdmin(req, res)) return;
//     const existing = await Question.findById(req.params.id);
//     if (!existing) return res.status(404).json({ message: "Not found" });

//     // Re-shape with incoming body (type is immutable by design, but you can allow it)
//     const type = existing.type;
//     const { ok, doc, message } = shapeByType(type, { ...existing.toObject(), ...req.body }, req.user.id);
//     if (!ok) return res.status(400).json({ message });

//     await Question.findByIdAndUpdate(req.params.id, doc, { new: true });
//     res.json({ message: "Updated" });
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// --- EDIT: update by id (admin only) ---
// export const update = async (req, res) => {
//   try {
//     if (!requireAdmin(req, res)) return;
//     const existing = await Question.findById(req.params.id);
//     if (!existing) return res.status(404).json({ message: "Not found" });

//     // Merge incoming fields; keep existing type (or allow changing if you want)
//     const merged = { ...existing.toObject(), ...req.body };
//     await Question.findByIdAndUpdate(req.params.id, merged, { new: true });
//     res.json({ message: "Updated" });
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ message: "Server error" });
//   }
// };

export const update = async (req, res) => {
  try {
    if (!requireAdminOrTeacher(req, res)) return;

    const existing = await Question.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Not found" });

    const merged = { ...existing.toObject(), ...req.body };
    const { ok, doc, message } = shapeByType(
      existing.type,
      merged,
      existing.createdBy || req.user.id
    );
    if (!ok) return res.status(400).json({ message });

    doc.class = merged.class || existing.class;
    doc.board = merged.board || existing.board;

    await Question.findByIdAndUpdate(req.params.id, doc, { new: true });

    res.json({ message: "Updated" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

// export const remove = async (req, res) => {
//   try {
//     if (!requireAdmin(req, res)) return;
//     const existing = await Question.findById(req.params.id);
//     if (!existing) return res.status(404).json({ message: "Not found" });
//     await existing.deleteOne();
//     res.json({ message: "Deleted" });
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// --- DELETE: remove by id (admin only) ---
// export const remove = async (req, res) => {
//   try {
//     if (!requireAdmin(req, res)) return;
//     const existing = await Question.findById(req.params.id);
//     if (!existing) return res.status(404).json({ message: "Not found" });
//     await existing.deleteOne();
//     res.json({ message: "Deleted" });
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ message: "Server error" });
//   }
// };

export const remove = async (req, res) => {
  try {
    if (!requireAdminOrTeacher(req, res)) return;

    const existing = await Question.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Not found" });

    await existing.deleteOne();
    res.json({ message: "Deleted" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * For populating dropdowns quickly from DB:
 * GET /api/questions/meta/subjects
 * GET /api/questions/meta/topics?subject=Mathematics
 */
export const metaSubjects = async (_req, res) => {
  try {
    const rows = await Question.aggregate([
      { $group: { _id: "$subject", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    res.json({ subjects: rows.map((r) => r._id).filter(Boolean) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

export const metaTopics = async (req, res) => {
  try {
    const subject = req.query.subject;
    const match = subject ? { subject } : {};
    const rows = await Question.aggregate([
      { $match: match },
      { $group: { _id: "$topic", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    res.json({ topics: rows.map((r) => r._id).filter(Boolean) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

export const metaStages = async (_req, res) => {
  try {
    const rows = await Question.aggregate([
      { $group: { _id: "$stage", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const stages = rows.map((r) => Number(r._id));

    res.json({ stages });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

// Get available question types with counts for a specific subject/topic
export const getQuestionTypes = async (req, res) => {
  try {
    const { subject, topic, class: userClass, board } = req.query;

    // Build filter
    const filter = {};
    if (subject) filter.subject = subject;
    if (topic) filter.topic = topic;

    // Handle board parameter (could be ObjectId or name)
    if (board) {
      const mongoose = await import("mongoose");
      if (mongoose.default.Types.ObjectId.isValid(board) && /^[0-9a-fA-F]{24}$/.test(board)) {
        filter.board = board;
      } else {
        // It's a board name, look up the ID
        const Board = (await import("../models/Board.js")).default;
        const boardDoc = await Board.findOne({ name: board });
        if (boardDoc) {
          filter.board = boardDoc._id;
        } else {
          // Board name not found, return empty types
          return res.json({ types: [] });
        }
      }
    }

    // Handle class parameter (could be ObjectId or name)
    if (userClass) {
      const mongoose = await import("mongoose");
      if (mongoose.default.Types.ObjectId.isValid(userClass) && /^[0-9a-fA-F]{24}$/.test(userClass)) {
        filter.class = userClass;
      } else {
        // It's a class name, look up the ID
        const Class = (await import("../models/Class.js")).default;
        const classDoc = await Class.findOne({ name: userClass });
        if (classDoc) {
          filter.class = classDoc._id;
        } else {
          // Class name not found, return empty types
          return res.json({ types: [] });
        }
      }
    }

    // Get counts by type
    const typeCounts = await Question.aggregate([
      { $match: filter },
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Map to friendly labels with icons
    const typeLabels = {
      "mcq-single": { label: "MCQ - Single Choice", icon: "📝" },
      "mcq-multi": { label: "MCQ - Multiple Choice", icon: "✅" },
      "true-false": { label: "True/False", icon: "✔️" },
      "choice-matrix": { label: "Choice Matrix", icon: "📊" },
      "cloze-drag": { label: "Fill in the Blanks (Drag)", icon: "🔤" },
      "cloze-select": { label: "Fill in the Blanks (Select)", icon: "📋" },
      "cloze-text": { label: "Fill in the Blanks (Type)", icon: "⌨️" },
      "match-list": { label: "Match the Following", icon: "🔗" },
      "essay-plain": { label: "Essay Questions", icon: "✍️" },
      "essay-rich": { label: "Essay Questions (Rich)", icon: "📄" }
    };

    // Format response
    const types = typeCounts
      .filter(t => t.count > 0)
      .map(t => ({
        type: t._id,
        count: t.count,
        label: typeLabels[t._id]?.label || t._id,
        icon: typeLabels[t._id]?.icon || "📝"
      }));

    // Calculate total count for "all" option
    const totalCount = types.reduce((sum, t) => sum + t.count, 0);

    // Add "all" option if there are questions
    if (totalCount > 0) {
      types.unshift({
        type: "all",
        count: totalCount,
        label: "All Types (Recommended)",
        icon: "🎯"
      });
    }

    res.json({ types });
  } catch (err) {
    console.error("Failed to fetch question types", err);
    res.status(500).json({ message: "Server error" });
  }
};
