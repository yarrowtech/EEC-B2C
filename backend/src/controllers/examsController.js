import Attempt from "../models/Attempt.js";
import Question from "../models/Question.js";
import User from "../models/User.js";

// utility: scoring for the types we support now
function scoreForQuestion(q, ans) {
  switch (q.type) {
    case "mcq-single": {
      const correct = q.correct || []; // ["A"]
      const chosen = ans?.mcq || [];
      const ok = chosen.length === 1 && correct.length === 1 && chosen[0] === correct[0];
      return ok ? 1 : 0;
    }
    case "mcq-multi": {
      const correct = new Set(q.correct || []); // ["A","C"]
      const chosen = new Set(ans?.mcq || []);
      // exact match (order-insensitive)
      if (correct.size !== chosen.size) return 0;
      for (const k of correct) if (!chosen.has(k)) return 0;
      return 1;
    }
    case "true-false": {
      const correct = (q.correct?.[0] || "").toLowerCase(); // "true"|"false"
      const chosen = (ans?.trueFalse || "").toLowerCase();
      return correct && chosen && correct === chosen ? 1 : 0;
    }
    default:
      return 0; // extend for other types later
  }
}

// POST /api/exams/start
export const startExam = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { stage = "stage-1", subject, topic, type, limit = 10 } = req.body;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!subject || !topic || !type) {
      return res.status(400).json({ message: "subject, topic, type are required" });
    }

    // pull random N questions matching filters
    const match = { subject, topic, type };
    const pipeline = [
      { $match: match },
      { $sample: { size: Number(limit) } },
      { $project: { // send minimal data to render the exam
          type: 1, subject: 1, topic: 1, question: 1, options: 1
        } },
    ];
    const questions = await Question.aggregate(pipeline);
    if (!questions.length) return res.status(404).json({ message: "No questions found" });

    // create attempt (answers empty initially)
    const attempt = await Attempt.create({
      userId, stage, subject, topic, type,
      questions: questions.map(q => q._id),
      total: questions.length,
    });

    // return attempt + questions (WITHOUT answers/explanations)
    res.status(201).json({
      attemptId: attempt._id,
      stage, subject, topic, type,
      total: attempt.total,
      questions: questions.map(q => ({
        _id: q._id,
        type: q.type,
        question: q.question,                 // for mcq/true-false
        options: q.options?.map(o => ({ key: o.key, text: o.text })) || [], // mcq options
      })),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/exams/submit/:attemptId
export const submitExam = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { attemptId } = req.params;
    const { answers = [] } = req.body; // [{ qid, mcq: ["A"] }] or [{ qid, trueFalse: "true" }]

    const attempt = await Attempt.findById(attemptId);
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    if (String(attempt.userId) !== String(userId)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (attempt.submittedAt) {
      return res.status(400).json({ message: "Already submitted" });
    }

    // fetch the questions for this attempt
    const qs = await Question.find({ _id: { $in: attempt.questions } });
    const qMap = new Map(qs.map(q => [String(q._id), q]));

    // compute score
    let score = 0;
    for (const ans of answers) {
      const q = qMap.get(String(ans.qid));
      if (!q) continue;
      score += scoreForQuestion(q, ans);
    }
    const percent = attempt.total ? Math.round((score / attempt.total) * 100) : 0;

    // save attempt with answers + score
    attempt.answers = answers;
    attempt.score = score;
    attempt.percent = percent;
    attempt.submittedAt = new Date();
    await attempt.save();

    res.json({
      message: "Submitted",
      score,
      total: attempt.total,
      percent,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/exams/attempts (student’s own attempts)
export const myAttempts = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const items = await Attempt.find({ userId }).sort({ createdAt: -1 }).limit(50);
    res.json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

function isAdmin(req) {
  return String(req.user?.role || "").toLowerCase() === "admin";
}

// GET /api/exams/admin/attempts
export const adminAttempts = async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });

    // latest 100 attempts
    const items = await Attempt.find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // attach user info
    const userIds = [...new Set(items.map(a => String(a.userId)))];
    const users = await User.find({ _id: { $in: userIds } })
      .select("_id name email")
      .lean();
    const uMap = new Map(users.map(u => [String(u._id), u]));

    // count attempts per user
    const counts = await Attempt.aggregate([
      { $match: { userId: { $in: userIds.map(id => new User({_id: id})._id) } } },
      { $group: { _id: "$userId", n: { $sum: 1 } } },
    ]);
    const cMap = new Map(counts.map(c => [String(c._id), c.n]));

    const enriched = items.map(a => ({
      ...a,
      user: uMap.get(String(a.userId)) || null,
      attemptsForUser: cMap.get(String(a.userId)) || 1,
    }));

    res.json({ items: enriched });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

export const adminAttemptDetail = async (req, res) => {
  try {
    const isAdmin = String(req.user?.role || "").toLowerCase() === "admin";
    if (!isAdmin) return res.status(403).json({ message: "Forbidden" });

    const { id } = req.params;
    const attempt = await Attempt.findById(id).lean();
    if (!attempt) return res.status(404).json({ message: "Not found" });

    const user = await User.findById(attempt.userId).select("_id name email").lean();

    // fetch questions
    const questions = await Question.find({ _id: { $in: attempt.questions } })
      .select("_id type question options correct")
      .lean();
    const qMap = new Map(questions.map(q => [String(q._id), q]));

    // map answers
    const items = (attempt.answers || []).map((ans) => {
      const q = qMap.get(String(ans.qid));
      if (!q) return null;

      const type = q.type;
      let studentAnswer = "";
      let correctAnswer = "";
      let isCorrect = false;

      if (type === "mcq-single") {
        const key = (ans.mcq || [])[0] || "";
        const opt = (q.options || []).find(o => o.key === key);
        const correctKey = (q.correct || [])[0] || "";
        const correctOpt = (q.options || []).find(o => o.key === correctKey);
        studentAnswer = key ? `${key}) ${opt?.text || ""}` : "—";
        correctAnswer = correctKey ? `${correctKey}) ${correctOpt?.text || ""}` : "—";
        isCorrect = !!key && key === correctKey;
      } else if (type === "mcq-multi") {
        const keys = new Set(ans.mcq || []);
        const ck = new Set(q.correct || []);
        const fmt = (set) =>
          (q.options || [])
            .filter(o => set.has(o.key))
            .map(o => `${o.key}) ${o.text || ""}`)
            .join(", ") || "—";
        studentAnswer = fmt(keys);
        correctAnswer = fmt(ck);
        isCorrect = keys.size === ck.size && [...keys].every(k => ck.has(k));
      } else if (type === "true-false") {
        const key = (ans.trueFalse || "").toLowerCase();
        const ck = (q.correct?.[0] || "").toLowerCase();
        studentAnswer = key || "—";
        correctAnswer = ck || "—";
        isCorrect = !!key && key === ck;
      } else {
        studentAnswer = "—";
        correctAnswer = "—";
        isCorrect = false;
      }

      return {
        qid: String(q._id),
        question: q.question || "(no text)",
        studentAnswer,
        correctAnswer,
        isCorrect,
      };
    }).filter(Boolean);

    res.json({
      _id: attempt._id,
      user,
      subject: attempt.subject,
      topic: attempt.topic,
      type: attempt.type,
      score: attempt.score,
      total: attempt.total,
      percent: attempt.percent,
      submittedAt: attempt.submittedAt,
      items,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};
