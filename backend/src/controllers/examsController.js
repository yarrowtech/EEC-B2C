import Attempt from "../models/Attempt.js";
import Question from "../models/Question.js";
import User from "../models/User.js";
import Topic from "../models/Topic.js";
import Subject from "../models/Subject.js";
import Package from "../models/Package.js";
import Subscription from "../models/Subscription.js";
import mongoose from "mongoose";

const DEFAULT_FREE_TRYOUT_TYPES = new Set(["mcq-single", "mcq-multi", "choice-matrix", "true-false"]);

function extractEssayTokens(text) {
  const tokens = String(text || "")
    .toLowerCase()
    .split(/\W+/)
    .filter(Boolean);

  return new Set(
    tokens.filter((t) => /^[0-9]+$/.test(t) || t.length >= 3)
  );
}

// utility: scoring for the types we support now
function scoreForQuestion(q, ans) {
  switch (q.type) {
    case "mcq-single": {
      const correct = q.correct || []; // ["A"]
      const chosen = ans?.mcq || [];
      const ok =
        chosen.length === 1 && correct.length === 1 && chosen[0] === correct[0];
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
    case "essay-plain": {
      const userText = (ans.essay || "").toLowerCase();
      const correctText = (q.plainText || "").toLowerCase();

      if (!userText || !correctText) return 0;

      const userWords = extractEssayTokens(userText);
      const correctWords = extractEssayTokens(correctText);

      if (!correctWords.size) return 0;

      let match = 0;
      userWords.forEach((w) => {
        if (correctWords.has(w)) match++;
      });

      // Semantic similarity %
      const percent = (match / correctWords.size) * 100;

      // 70% or more = correct, 30%+ partial credit
      if (percent >= 70) return 1;
      if (percent >= 30) return 0.5;
      return 0;
    }
    default:
      return 0; // extend for other types later
  }
}

function scoreChoiceMatrix(q, ans) {
  const userMatrix = ans.matrix || {};
  const correct = q.choiceMatrix?.correctCells || [];

  let total = correct.length;
  let matched = 0;

  for (let r = 0; r < correct.length; r++) {
    const userVal = userMatrix[r];
    const correctVal = correct[r];

    if (!userVal || !correctVal) continue;

    // Normalize (remove spaces, lowercase)
    const u = String(userVal).trim().toLowerCase();
    const c = String(correctVal).trim().toLowerCase();

    if (u === c) matched++;
  }

  if (matched === total) return { score: 1, detail: "correct" };
  if (matched > 0) return { score: 0.5, detail: "partial" };
  return { score: 0, detail: "wrong" };
}

// POST /api/exams/start
// export const startExam = async (req, res) => {
//   try {
//     const userId = req.user?.id;
//     const { stage = "stage-1", subject, topic, type, limit = 10 } = req.body;

//     if (!userId) return res.status(401).json({ message: "Unauthorized" });
//     if (!subject || !topic || !type) {
//       return res
//         .status(400)
//         .json({ message: "subject, topic, type are required" });
//     }

//     // ⭐ Map frontend → backend type
//     let qType = type;
//     if (type === "cloze-dnd") qType = "cloze-drag";

//     // ⭐ User class normalization
//     // const userClassRaw = req.user?.class || "";
//     // const normalizedClass = userClassRaw.trim();

//     const userClassRaw = req.user?.class || "";

//     // Accept both formats: "3" or "Class 3"
//     const normalizedClass = userClassRaw.startsWith("Class")
//       ? userClassRaw.trim() // "Class 3"
//       : `Class ${userClassRaw.trim()}`; // convert "3" → "Class 3"

//     // ⭐ Match class EXACTLY like stored in DB (e.g., "Class 3")
//     // Your DB stores: "Class 3"
//     // So we match EXACTLY that.

//     // const match = {
//     //   type: qType,
//     //   class: normalizedClass, // <-- FIXED
//     //   // subject: { $regex: new RegExp("^" + subject + "$", "i") },
//     //   // topic: { $regex: new RegExp("^" + topic + "$", "i") },
//     //   topic: { $regex: topic, $options: "i" },
//     //   subject: { $regex: subject, $options: "i" },
//     // };
//     // Build match object
//     const match = {
//       type: qType,
//       subject: { $regex: subject, $options: "i" },
//       topic: { $regex: topic, $options: "i" },
//     };

//     // Apply class filter ONLY if valid
//     if (
//       normalizedClass &&
//       normalizedClass !== "Class" &&
//       normalizedClass !== "Class "
//     ) {
//       match.class = normalizedClass;
//     } else {
//       console.log("⚠ User has no valid class → class filter skipped");
//     }

//     console.log("MATCH USED:", match);

//     const pipeline = [
//       { $match: match },
//       { $sample: { size: Number(limit) } },
//       {
//         $project: {
//           type: 1,
//           subject: 1,
//           topic: 1,
//           question: 1,
//           options: 1,
//           choiceMatrix: 1,
//           matrix: {
//             prompt: "$choiceMatrix.prompt",
//             rows: {
//               $map: {
//                 input: "$choiceMatrix.rows",
//                 as: "row",
//                 in: { title: "$$row" },
//               },
//             },
//             cols: "$choiceMatrix.cols",
//             correctCells: "$choiceMatrix.correctCells",
//             options: {
//               $map: {
//                 input: "$choiceMatrix.cols",
//                 as: "col",
//                 in: { key: "$$col", label: "$$col" },
//               },
//             },
//           },
//           prompt: 1,
//           explanation: 1,
//           clozeDrag: 1,
//           clozeSelect: 1,
//         },
//       },
//     ];

//     const questions = await Question.aggregate(pipeline);

//     if (!questions.length)
//       return res.status(404).json({ message: "No questions found" });

//     // ⭐ CLOZE PARSER (unchanged)
//     function parseCloze(q) {
//       const text = q.clozeDrag?.text || "";
//       const tokens = q.clozeDrag?.tokens || [];
//       const correct = q.clozeDrag?.correctMap || {};

//       const parts = [];
//       const regex = /\[\[(blank\d+)\]\]/g;
//       let last = 0,
//         m;

//       while ((m = regex.exec(text)) !== null) {
//         const before = text.slice(last, m.index);
//         if (before) parts.push({ type: "text", value: before });
//         parts.push({ type: "blank", id: m[1] });
//         last = regex.lastIndex;
//       }

//       const after = text.slice(last);
//       if (after) parts.push({ type: "text", value: after });

//       return { clozeText: parts, options: tokens, correct };
//     }

//     // ⭐ FORMAT QUESTIONS (unchanged)
//     const finalQuestions = questions.map((q) => {
//       if (q.type === "cloze-drag") {
//         const parsed = parseCloze(q);
//         return {
//           _id: q._id,
//           type: q.type,
//           clozeText: parsed.clozeText,
//           options: parsed.options,
//           correct: parsed.correct,
//           explanation: q.explanation,
//         };
//       }

//       // ⭐ FIX: Cloze-Select was not being returned to frontend
//       if (q.type === "cloze-select") {
//         return {
//           _id: q._id,
//           type: q.type,
//           clozeSelect: q.clozeSelect, // includes text + blanks
//           explanation: q.explanation,
//         };
//       }

//       return {
//         _id: q._id,
//         type: q.type,
//         question: q.question,
//         prompt: q.prompt,
//         explanation: q.explanation,
//         choiceMatrix: q.choiceMatrix || {},
//         matrix: q.matrix || {},
//         rows: q.choiceMatrix?.rows || [],
//         cols: q.choiceMatrix?.cols || [],
//         correctCells: q.choiceMatrix?.correctCells || [],
//         options: q.options?.map((o) => ({ key: o.key, text: o.text })) || [],
//       };
//     });

//     // ⭐ create attempt (unchanged)
//     const attempt = await Attempt.create({
//       userId,
//       stage,
//       // subject,
//       // topic,
//       subject: new mongoose.Types.ObjectId(subject),
//       topic: new mongoose.Types.ObjectId(topic),
//       type,
//       questions: finalQuestions.map((q) => q._id),
//       total: finalQuestions.length,
//     });

//     // ⭐ Response (unchanged)
//     res.status(201).json({
//       attemptId: attempt._id,
//       stage,
//       subject,
//       topic,
//       type,
//       total: attempt.total,
//       questions: finalQuestions,
//     });
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ message: "Server error" });
//   }
// };

export const startExam = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { stage = "stage-1", level, subject, topic, type, limit = 10 } = req.body;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!subject || !topic || !type) {
      return res
        .status(400)
        .json({ message: "subject, topic, type are required" });
    }

    // console.log("REQ.USER FINAL:", req.user);
    // ⭐ Map frontend → backend type
    let qType = type;
    if (type === "cloze-dnd") qType = "cloze-drag";

    // Enforce package-based tryout access for students.
    if (String(req.user?.role || "").toLowerCase() === "student") {
      const userDoc = await User.findById(userId)
        .select("activeSubscription")
        .lean();

      let allowedTryoutTypes = null;

      if (userDoc?.activeSubscription) {
        const subscription = await Subscription.findById(userDoc.activeSubscription)
          .populate("package")
          .lean();
        const packageTypes = subscription?.package?.allowedTryoutTypes;
        if (Array.isArray(packageTypes) && packageTypes.length > 0) {
          allowedTryoutTypes = new Set(packageTypes.map((t) => String(t).trim()));
        }
      }

      if (!allowedTryoutTypes) {
        const basicPackage = await Package.findOne({ name: "Basic", isActive: true })
          .select("allowedTryoutTypes")
          .lean();
        const basicTypes = basicPackage?.allowedTryoutTypes;
        if (Array.isArray(basicTypes) && basicTypes.length > 0) {
          allowedTryoutTypes = new Set(basicTypes.map((t) => String(t).trim()));
        } else {
          allowedTryoutTypes = DEFAULT_FREE_TRYOUT_TYPES;
        }
      }

      if (!allowedTryoutTypes.has(qType)) {
        return res.status(403).json({
          message: "Upgrade your package to unlock this tryout type",
        });
      }
    }

    const normalizeStage = (stageValue) => {
      if (stageValue === null || stageValue === undefined || stageValue === "") {
        return null;
      }

      const stageStr = String(stageValue).trim().toLowerCase();
      if (/^\d+$/.test(stageStr)) return Number(stageStr);

      const stagePattern = stageStr.match(/^stage[-\s]*(\d+)$/);
      if (stagePattern) return Number(stagePattern[1]);

      const stageNameMap = {
        foundation: 1,
        intermediate: 2,
        advanced: 3,
      };
      return stageNameMap[stageStr] || null;
    };

    const normalizeLevel = (levelValue) => {
      const raw = String(levelValue || "").trim().toLowerCase();
      if (["basic", "intermediate", "advanced"].includes(raw)) return raw;
      return null;
    };

    const levelToDifficulty = (levelValue) => {
      if (levelValue === "basic") return "easy";
      if (levelValue === "intermediate") return "moderate";
      if (levelValue === "advanced") return "hard";
      return null;
    };

    async function buildMatchValue(value, modelPath) {
      if (!value) return null;

      if (mongoose.Types.ObjectId.isValid(value)) {
        return { $in: [value, new mongoose.Types.ObjectId(value)] };
      }

      if (modelPath) {
        const Model = (await import(modelPath)).default;
        const doc = await Model.findOne({ name: value });
        if (doc) {
          return { $in: [value, String(doc._id), doc._id] };
        }
      }

      return value;
    }

    const match = {
      type: qType,
      subject: await buildMatchValue(subject),
      topic: await buildMatchValue(topic),
    };

    const stageNumber = normalizeStage(stage);
    if (stageNumber !== null) {
      match.stage = stageNumber;
    }
    const normalizedLevel = normalizeLevel(level);
    if (normalizedLevel) {
      const mappedDifficulty = levelToDifficulty(normalizedLevel);
      match.$or = mappedDifficulty
        ? [{ level: normalizedLevel }, { difficulty: mappedDifficulty }]
        : [{ level: normalizedLevel }];
    }

    const userClassRaw =
      req.body.class || req.user?.className || req.user?.class || "";
    const userBoardRaw = req.body.board || req.user?.board || "";

    const classMatch = await buildMatchValue(
      userClassRaw,
      "../models/Class.js"
    );
    if (classMatch) {
      match.class = classMatch;
    } else {
      console.log("⚠ User has no class → class filter skipped");
    }

    const boardMatch = await buildMatchValue(
      userBoardRaw,
      "../models/Board.js"
    );
    if (boardMatch) {
      match.board = boardMatch;
    } else {
      console.log("⚠ User has no board → board filter skipped");
    }

    // console.log("MATCH USED (with board):", match);

    const pipeline = [
      { $match: match },
      { $sample: { size: Number(limit) } },
      {
        $project: {
          type: 1,
          subject: 1,
          topic: 1,
          question: 1,
          options: 1,
          choiceMatrix: 1,
          matrix: {
            prompt: "$choiceMatrix.prompt",
            rows: {
              $map: {
                input: "$choiceMatrix.rows",
                as: "row",
                in: { title: "$$row" },
              },
            },
            cols: "$choiceMatrix.cols",
            correctCells: "$choiceMatrix.correctCells",
            options: {
              $map: {
                input: "$choiceMatrix.cols",
                as: "col",
                in: { key: "$$col", label: "$$col" },
              },
            },
          },
          prompt: 1,
          plainText: 1,
          richHtml: 1,
          explanation: 1,
          clozeDrag: 1,
          clozeSelect: 1,
          clozeText: 1,
          matchList: 1,
        },
      },
    ];

    const questions = await Question.aggregate(pipeline);

    if (!questions.length)
      return res.status(404).json({ message: "No questions found" });

    // ⭐ CLOZE PARSER (UNCHANGED)
    function parseCloze(q) {
      const text = q.clozeDrag?.text || "";
      const tokens = q.clozeDrag?.tokens || [];
      const correct = q.clozeDrag?.correctMap || {};

      const parts = [];
      const regex = /\[\[(blank\d+)\]\]/g;
      let last = 0,
        m;

      while ((m = regex.exec(text)) !== null) {
        const before = text.slice(last, m.index);
        if (before) parts.push({ type: "text", value: before });
        parts.push({ type: "blank", id: m[1] });
        last = regex.lastIndex;
      }

      const after = text.slice(last);
      if (after) parts.push({ type: "text", value: after });

      return { clozeText: parts, options: tokens, correct };
    }

    // ⭐ FORMAT QUESTIONS (UNCHANGED)
    const finalQuestions = questions.map((q) => {
      if (q.type === "cloze-drag") {
        const parsed = parseCloze(q);
        return {
          _id: q._id,
          type: q.type,
          clozeText: parsed.clozeText,
          options: parsed.options,
          correct: parsed.correct,
          explanation: q.explanation,
        };
      }

      if (q.type === "cloze-select") {
        return {
          _id: q._id,
          type: q.type,
          clozeSelect: q.clozeSelect,
          explanation: q.explanation,
        };
      }

      if (q.type === "cloze-text") {
        return {
          _id: q._id,
          type: q.type,
          clozeText: q.clozeText || {},
          explanation: q.explanation,
        };
      }

      if (q.type === "match-list") {
        return {
          _id: q._id,
          type: q.type,
          matchList: q.matchList || {},
          prompt: q.matchList?.prompt || q.prompt || "",
          explanation: q.explanation,
        };
      }

      if (q.type === "essay-plain") {
        return {
          _id: q._id,
          type: q.type,
          prompt: q.prompt || "",
          plainText: q.plainText || "",
          explanation: q.explanation,
        };
      }

      if (q.type === "essay-rich") {
        return {
          _id: q._id,
          type: q.type,
          prompt: q.prompt || "",
          richHtml: q.richHtml || "",
          explanation: q.explanation,
        };
      }

      return {
        _id: q._id,
        type: q.type,
        question: q.question,
        prompt: q.prompt,
        explanation: q.explanation,
        choiceMatrix: q.choiceMatrix || {},
        matrix: q.matrix || {},
        rows: q.choiceMatrix?.rows || [],
        cols: q.choiceMatrix?.cols || [],
        correctCells: q.choiceMatrix?.correctCells || [],
        options: q.options?.map((o) => ({ key: o.key, text: o.text })) || [],
      };
    });

    // ⭐ create attempt (UNCHANGED)
    const attempt = await Attempt.create({
      userId,
      stage,
      subject: new mongoose.Types.ObjectId(subject),
      topic: new mongoose.Types.ObjectId(topic),
      type,
      questions: finalQuestions.map((q) => q._id),
      total: finalQuestions.length,
    });

    // ⭐ Response (UNCHANGED)
    res.status(201).json({
      attemptId: attempt._id,
      stage,
      subject,
      topic,
      type,
      total: attempt.total,
      questions: finalQuestions,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/exams/submit/:attemptId
// export const submitExam = async (req, res) => {
//   try {
//     const userId = req.user?.id;
//     const { attemptId } = req.params;
//     const { answers = [] } = req.body; // [{ qid, mcq: ["A"] }] or [{ qid, trueFalse: "true" }]

//     const attempt = await Attempt.findById(attemptId);
//     if (!attempt) return res.status(404).json({ message: "Attempt not found" });
//     if (String(attempt.userId) !== String(userId)) {
//       return res.status(403).json({ message: "Forbidden" });
//     }
//     if (attempt.submittedAt) {
//       return res.status(400).json({ message: "Already submitted" });
//     }

//     // fetch the questions for this attempt
//     const qs = await Question.find({ _id: { $in: attempt.questions } });
//     const qMap = new Map(qs.map((q) => [String(q._id), q]));

//     // compute score
//     let score = 0;
//     for (const ans of answers) {
//       const q = qMap.get(String(ans.qid));
//       if (!q) continue;
//       score += scoreForQuestion(q, ans);
//     }
//     const percent = attempt.total
//       ? Math.round((score / attempt.total) * 100)
//       : 0;

//     // save attempt with answers + score
//     attempt.answers = answers;
//     attempt.score = score;
//     attempt.percent = percent;
//     attempt.submittedAt = new Date();
//     await attempt.save();

//     res.json({
//       message: "Submitted",
//       score,
//       total: attempt.total,
//       percent,
//     });
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// export const submitExam = async (req, res) => {
//   try {
//     const userId = req.user?.id;
//     const { attemptId } = req.params;
//     const { answers = [] } = req.body;

//     const attempt = await Attempt.findById(attemptId);
//     if (!attempt) return res.status(404).json({ message: "Attempt not found" });
//     if (String(attempt.userId) !== String(userId)) {
//       return res.status(403).json({ message: "Forbidden" });
//     }
//     if (attempt.submittedAt) {
//       return res.status(400).json({ message: "Already submitted" });
//     }

//     // fetch all questions in this attempt
//     const qs = await Question.find({ _id: { $in: attempt.questions } });
//     const qMap = new Map(qs.map((q) => [String(q._id), q]));

//     let score = 0;
//     const detail = {}; // 👉 per-question evaluation

//     for (const ans of answers) {
//       const q = qMap.get(String(ans.qid));
//       if (!q) continue;

//       // Normal MCQ / True-False scoring
//       const baseScore = scoreForQuestion(q, ans);
//       score += baseScore;

//       // -----------------------------------
//       // ⭐⭐⭐ ESSAY SCORING (similarity based)
//       // -----------------------------------
//       if (q.type === "essay-plain") {
//         const userText = (ans.essay || "").toLowerCase();
//         const correctText = (q.correct?.[0] || "").toLowerCase();

//         if (!userText || !correctText) {
//           detail[q._id] = "wrong";
//           continue;
//         }

//         // clean text
//         const cleanUser = userText.replace(/[^a-z0-9 ]/g, "");
//         const cleanCorrect = correctText.replace(/[^a-z0-9 ]/g, "");

//         // convert to sets
//         const userWords = new Set(cleanUser.split(/\s+/));
//         const correctWords = new Set(cleanCorrect.split(/\s+/));

//         let match = 0;
//         userWords.forEach((w) => {
//           if (correctWords.has(w)) match++;
//         });

//         const similarity = (match / correctWords.size) * 100;

//         // Decide correctness level
//         if (similarity >= 70) {
//           detail[q._id] = "correct";
//           score += 1; // optional: give 1 point
//         } else if (similarity >= 40) {
//           detail[q._id] = "partial";
//           // Optionally award half point
//           // score += 0;
//         } else {
//           detail[q._id] = "wrong";
//         }
//       }
//     }

//     // compute percent
//     // const percent = attempt.total
//     //   ? Math.round((score / attempt.total) * 100)
//     //   : 0;

//     const percent = correctWords.size === 0 ? 0 : (match / correctWords.size) * 100;

//     // save attempt
//     attempt.answers = answers;
//     attempt.score = score;
//     attempt.percent = percent;
//     attempt.submittedAt = new Date();
//     await attempt.save();

//     // return enhanced response
//     res.json({
//       message: "Submitted",
//       score,
//       total: attempt.total,
//       percent,
//       detail, // 👉 frontend will use this to show "Yay correct!"
//     });

//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ message: "Server error" });
//   }
// };

export const submitExam = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { attemptId } = req.params;
    const { answers = [] } = req.body; // [{ qid, mcq, trueFalse, essay, matrix }]

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
    const qMap = new Map(qs.map((q) => [String(q._id), q]));

    let score = 0;
    const detail = {}; // per-question result: correct | partial | wrong
    // let resultDetailMap = resultDetailMap || {};
    let resultDetailMap = {};

    for (const ans of answers) {
      const q = qMap.get(String(ans.qid));
      if (!q) continue;

      const type = q.type;

      // ------ MCQ SINGLE ------
      if (type === "mcq-single") {
        const correctKey = (q.correct?.[0] || "").trim();
        const chosenKey = (ans.mcq?.[0] || "").trim();

        if (chosenKey && correctKey && chosenKey === correctKey) {
          score += 1;
          detail[q._id] = "correct";
        } else {
          detail[q._id] = "wrong";
        }
        continue;
      }

      // ------ MCQ MULTI ------
      if (type === "mcq-multi") {
        const correctSet = new Set(q.correct || []);
        const chosenSet = new Set(ans.mcq || []);

        let matchCount = 0;
        chosenSet.forEach((k) => {
          if (correctSet.has(k)) matchCount++;
        });

        if (
          matchCount === correctSet.size &&
          correctSet.size === chosenSet.size &&
          correctSet.size > 0
        ) {
          score += 1;
          detail[q._id] = "correct";
        } else if (matchCount > 0) {
          detail[q._id] = "partial";
        } else {
          detail[q._id] = "wrong";
        }
        continue;
      }

      // ------ TRUE / FALSE ------
      if (type === "true-false") {
        const correctVal = (q.correct?.[0] || "").toLowerCase().trim();
        const chosenVal = (ans.trueFalse || "").toLowerCase().trim();

        if (chosenVal && correctVal && chosenVal === correctVal) {
          score += 1;
          detail[q._id] = "correct";
        } else {
          detail[q._id] = "wrong";
        }
        continue;
      }

      // ------ ESSAY PLAIN (simple semantic-ish check) ------
      if (type === "essay-plain") {
        const correctText = (q.plainText || "").toLowerCase();
        const userText = (ans.essay || "").toLowerCase();

        if (!correctText || !userText) {
          detail[q._id] = "wrong";
        } else {
          const correctWords = extractEssayTokens(correctText);
          const userWords = extractEssayTokens(userText);

          let overlap = 0;
          correctWords.forEach((w) => {
            if (userWords.has(w)) overlap++;
          });

          const ratio = correctWords.size ? overlap / correctWords.size : 0;

          if (ratio >= 0.7) {
            score += 1;
            detail[q._id] = "correct";
          } else if (ratio >= 0.3) {
            score += 0.5;
            detail[q._id] = "partial";
          } else {
            detail[q._id] = "wrong";
          }
        }
        continue;
      }

      // ------ CHOICE MATRIX ------
      // ------ CHOICE MATRIX (FINAL FIX FOR "row-col" FORMAT) ------
      if (type === "choice-matrix") {
        try {
          const userMatrix = ans.matrix || {};
          const cm = q.choiceMatrix || {};
          const cols = cm.cols || [];
          const rawCorrect = cm.correctCells || [];

          let matched = 0;
          const total = rawCorrect.length;

          const expectedAnswers = rawCorrect.map((cell) => {
            // cell like "2-1"
            const [rowIndex, colIndex] = cell.split("-").map(Number);
            return {
              row: rowIndex,
              col: colIndex,
              label: cols[colIndex]?.toLowerCase().trim() || null,
            };
          });

          for (let i = 0; i < expectedAnswers.length; i++) {
            const exp = expectedAnswers[i];
            const userVal = userMatrix[exp.row];

            if (!userVal) continue;

            const u = userVal.toLowerCase().trim();

            if (u === exp.label) {
              matched++;
            }
          }

          if (matched === total) {
            score += 1;
            detail[q._id] = "correct";
          } else if (matched > 0) {
            score += 0.5;
            detail[q._id] = "partial";
          } else {
            detail[q._id] = "wrong";
          }

          console.log("MATRIX DEBUG:", {
            expectedAnswers,
            userMatrix,
            matched,
            total,
          });
        } catch (err) {
          console.error("CHOICE MATRIX ERROR:", err);
          detail[q._id] = "wrong";
        }

        continue;
      }

      // if (q.type === "cloze-select") {
      //   return {
      //     _id: q._id,
      //     type: q.type,
      //     clozeSelect: q.clozeSelect,
      //     explanation: q.explanation,
      //   };
      // }

      // ------ CLOZE SELECT (evaluate dropdown blanks) ------
      // if (type === "cloze-select") {
      //   try {
      //     const blanks = q.clozeSelect?.blanks || {};
      //     const userAns = ans.clozeSelect || {};

      //     const blankKeys = Object.keys(blanks);
      //     const total = blankKeys.length;
      //     let matched = 0;

      //     for (const b of blankKeys) {
      //       const correct = String(blanks[b]?.correct || "")
      //         .trim()
      //         .toLowerCase();
      //       const chosen = String(userAns[b] || "")
      //         .trim()
      //         .toLowerCase();
      //       if (chosen && correct && chosen === correct) matched++;
      //     }

      //     if (total === 0) {
      //       // no blank data — treat as wrong (data issue)
      //       detail[q._id] = "wrong";
      //     } else if (matched === total) {
      //       score += 1;
      //       detail[q._id] = "correct";
      //     } else if (matched > 0) {
      //       score += 0.5;
      //       detail[q._id] = "partial";
      //     } else {
      //       detail[q._id] = "wrong";
      //     }
      //   } catch (err) {
      //     console.error("CLOZE-SELECT EVAL ERROR:", err);
      //     detail[q._id] = "wrong";
      //   }
      //   continue;
      // }

      if (q.type === "cloze-select") {
        const blanksRaw = q.clozeSelect?.blanks || {};
        let blanks = blanksRaw;

        if (blanksRaw instanceof Map) {
          blanks = Object.fromEntries(blanksRaw);
        } else if (typeof blanksRaw.toObject === "function") {
          blanks = blanksRaw.toObject();
        }

        const user = ans.clozeSelect || {};

        let correctCount = 0;
        const blankKeys = Object.keys(blanks);
        const total = blankKeys.length;

        for (const b of blankKeys) {
          if ((user[b] || "").trim() === (blanks[b]?.correct || "").trim()) {
            correctCount++;
          }
        }

        if (total === 0) {
          detail[q._id] = "wrong";
        } else if (correctCount === total) {
          detail[q._id] = "correct";
          score++;
        } else if (correctCount > 0) {
          detail[q._id] = "partial";
        } else {
          detail[q._id] = "wrong";
        }

        continue;
      }

      // ------ CLOZE DRAG & DROP ------
      // Robust cloze-drag evaluator snippet
      if (q.type === "cloze-drag") {
        // let resultDetailMap = resultDetailMap || {};
        // correct map might be in q.clozeDrag.correctMap or q.correctMap or q.correct
        // FIX: Extract plain JS object from nested Mongoose Map
        let correctMapRaw =
          (q.clozeDrag && q.clozeDrag.correctMap) ||
          q.correctMap ||
          q.correct ||
          {};

        let correctMap = {};

        if (correctMapRaw instanceof Map) {
          correctMap = Object.fromEntries(correctMapRaw);
        } else if (typeof correctMapRaw.toObject === "function") {
          correctMap = correctMapRaw.toObject();
        } else {
          correctMap = correctMapRaw;
        }

        const userCloze = (ans && ans.cloze) || {};

        // Normalise keys: accept "blank1", "blank2", or numeric indexes '0','1'
        // Build canonical map of correctMap with normalised keys: e.g. 'blank1' => value
        const canonicalCorrect = {};
        Object.keys(correctMap).forEach((k) => {
          const kk = String(k).trim();
          // if key looks like '1' convert to blank1
          const normalizedKey = /^(\d+)$/.test(kk)
            ? `blank${Number(kk) + 1}`
            : kk;
          canonicalCorrect[normalizedKey] = String(correctMap[k]).trim();
        });

        // Also canonicalise user answers into same keys
        const canonicalUser = {};
        Object.keys(userCloze).forEach((k) => {
          const kk = String(k).trim();
          const normalizedKey = /^(\d+)$/.test(kk)
            ? `blank${Number(kk) + 1}`
            : kk;
          canonicalUser[normalizedKey] = String(userCloze[k]).trim();
        });

        // Now compare, normalizing case/space
        let total = Object.keys(canonicalCorrect).length;
        let matched = 0;
        const details = {}; // optional per-blank detail

        for (const bKey of Object.keys(canonicalCorrect)) {
          const correctVal = (canonicalCorrect[bKey] || "").trim();
          const userVal = (canonicalUser[bKey] || "").trim();

          const normCorrect = correctVal.toLowerCase();
          const normUser = userVal.toLowerCase();

          // If exact match after lower/trim => correct
          if (normUser && normUser === normCorrect) {
            matched++;
            details[bKey] = "correct";
          } else {
            details[bKey] = "wrong";
          }
        }

        // Logging helpful for debugging (server console)
        console.log(
          "CLOZE EVAL qid=",
          q._id,
          "correctMap=",
          canonicalCorrect,
          "user=",
          canonicalUser,
          "matched=",
          matched,
          "/",
          total
        );

        // Decide status
        if (total === 0) {
          // no correct map found — this is a data issue
          detail[q._id] = "wrong";
        } else if (matched === total) {
          score = (typeof score === "number" ? score : 0) + 1; // or apply question marks
          detail[q._id] = "correct";
        } else if (matched > 0) {
          detail[q._id] = "partial";
        } else {
          detail[q._id] = "wrong";
        }

        // Optionally include per-blank details in result.detailMap for frontend debugging
        if (!resultDetailMap) resultDetailMap = {};
        resultDetailMap[q._id] = details;

        // continue to next question logic
        continue;
      }

      // ------ CLOZE TEXT (typed blanks) ------
      if (q.type === "cloze-text") {
        const answersRaw = q.clozeText?.answers || {};
        let correctAnswers = answersRaw;
        if (answersRaw instanceof Map) {
          correctAnswers = Object.fromEntries(answersRaw);
        } else if (typeof answersRaw.toObject === "function") {
          correctAnswers = answersRaw.toObject();
        }

        const userAnswers = ans.clozeText || ans.cloze || {};
        const keys = Object.keys(correctAnswers);
        const total = keys.length;

        let matched = 0;
        for (const k of keys) {
          const expected = String(correctAnswers[k] || "").trim().toLowerCase();
          const actual = String(userAnswers[k] || "").trim().toLowerCase();
          if (expected && actual && expected === actual) matched++;
        }

        if (total === 0) {
          detail[q._id] = "wrong";
        } else if (matched === total) {
          score += 1;
          detail[q._id] = "correct";
        } else if (matched > 0) {
          detail[q._id] = "partial";
        } else {
          detail[q._id] = "wrong";
        }
        continue;
      }

      // ------ ESSAY RICH ------
      if (type === "essay-rich") {
        const userText = (ans.essay || ans.essayRich?.text || "").toLowerCase();
        const guideText = (q.plainText || q.prompt || "").toLowerCase();

        if (!userText) {
          detail[q._id] = "wrong";
        } else if (!guideText) {
          // No model answer/guidance: accept submission and mark as attempted.
          detail[q._id] = "partial";
        } else {
          const correctWords = extractEssayTokens(guideText);
          const userWords = extractEssayTokens(userText);

          let overlap = 0;
          correctWords.forEach((w) => {
            if (userWords.has(w)) overlap++;
          });

          const ratio = correctWords.size ? overlap / correctWords.size : 0;

          if (ratio >= 0.7) {
            score += 1;
            detail[q._id] = "correct";
          } else if (ratio >= 0.3) {
            score += 0.5;
            detail[q._id] = "partial";
          } else {
            detail[q._id] = "wrong";
          }
        }
        continue;
      }

      // ------ MATCH LIST ------
      if (q.type === "match-list") {
        const pairsRaw = q.matchList?.pairs || {};
        let correctPairs = pairsRaw;

        if (pairsRaw instanceof Map) {
          correctPairs = Object.fromEntries(pairsRaw);
        } else if (typeof pairsRaw.toObject === "function") {
          correctPairs = pairsRaw.toObject();
        }

        const userPairs = ans.matchList || {};
        const keys = Object.keys(correctPairs);
        const total = keys.length;

        let matched = 0;
        for (const k of keys) {
          if (String(userPairs[k] ?? "").trim() === String(correctPairs[k] ?? "").trim()) {
            matched++;
          }
        }

        if (total === 0) {
          detail[q._id] = "wrong";
        } else if (matched === total) {
          score += 1;
          detail[q._id] = "correct";
        } else if (matched > 0) {
          detail[q._id] = "partial";
        } else {
          detail[q._id] = "wrong";
        }

        continue;
      }

      // ------ default / unknown type ------
      detail[q._id] = "wrong";
    }

    const percent = attempt.total
      ? Math.round((score / attempt.total) * 100)
      : 0;

    attempt.answers = answers;
    attempt.score = score;
    attempt.percent = percent;
    attempt.submittedAt = new Date();
    await attempt.save();
    // after attempt saved:
    const user = await User.findById(req.user.id);

    if (user) {
      user.points = (user.points || 0) + attempt.score; // accumulate points
      await user.save();
    }

    res.json({
      message: "Submitted",
      score,
      total: attempt.total,
      percent,
      detail,
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
    // const items = await Attempt.find({ userId })
    //   .sort({ createdAt: -1 })
    //   .limit(50);
    const items = await Attempt.find({ userId })
      .populate("subject", "name")
      .populate("topic", "name")
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

function isAdmin(req) {
  return (
    String(req.user?.role || "").toLowerCase() === "admin" ||
    String(req.user?.role || "").toLowerCase() === "teacher"
  );
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
    const userIds = [...new Set(items.map((a) => String(a.userId)))];
    const users = await User.find({ _id: { $in: userIds } })
      .select("_id name email state class className board")
      .lean();
    const uMap = new Map(users.map((u) => [String(u._id), u]));

    // count attempts per user
    const counts = await Attempt.aggregate([
      {
        $match: {
          userId: { $in: userIds.map((id) => new User({ _id: id })._id) },
        },
      },
      { $group: { _id: "$userId", n: { $sum: 1 } } },
    ]);
    const cMap = new Map(counts.map((c) => [String(c._id), c.n]));
    const subjectIds = [
      ...new Set(
        items
          .map((a) => (a?.subject ? String(a.subject) : ""))
          .filter(Boolean)
      ),
    ];
    const topicIds = [
      ...new Set(
        items
          .map((a) => (a?.topic ? String(a.topic) : ""))
          .filter(Boolean)
      ),
    ];
    const subjectObjectIds = subjectIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    const topicObjectIds = topicIds.filter((id) => mongoose.Types.ObjectId.isValid(id));

    const subjects = await Subject.find({ _id: { $in: subjectObjectIds } })
      .select("_id name")
      .lean();
    const topics = await Topic.find({ _id: { $in: topicObjectIds } })
      .select("_id name")
      .lean();

    const subjectMap = new Map(subjects.map((s) => [String(s._id), s.name]));
    const topicMap = new Map(topics.map((t) => [String(t._id), t.name]));

    const enriched = items.map((a) => ({
      ...a,
      user: uMap.get(String(a.userId)) || null,
      attemptsForUser: cMap.get(String(a.userId)) || 1,
      subjectName: subjectMap.get(String(a.subject || "")) || String(a.subject || ""),
      topicName: topicMap.get(String(a.topic || "")) || String(a.topic || ""),
    }));

    res.json({ items: enriched });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

// export const adminAttemptDetail = async (req, res) => {

//   try {
//     // const isAdmin = String(req.user?.role || "").toLowerCase() === "admin";
//     // if (!isAdmin) return res.status(403).json({ message: "Forbidden" });
//     const role = String(req.user?.role || "").toLowerCase();
//     if (role !== "admin" && role !== "teacher") {
//       return res.status(403).json({ message: "Forbidden" });
//     }

//     const { id } = req.params;
//     const attempt = await Attempt.findById(id).lean();
//     if (!attempt) return res.status(404).json({ message: "Not found" });

//     const user = await User.findById(attempt.userId)
//       .select("_id name email")
//       .lean();

//     // fetch questions
//     const questions = await Question.find({ _id: { $in: attempt.questions } })
//       .select("_id type question options correct")
//       .lean();
//     const qMap = new Map(questions.map((q) => [String(q._id), q]));

//     // map answers
//     const items = (attempt.answers || [])
//       .map((ans) => {
//         const q = qMap.get(String(ans.qid));
//         if (!q) return null;

//         const type = q.type;
//         let studentAnswer = "";
//         let correctAnswer = "";
//         let isCorrect = false;

//         if (type === "mcq-single") {
//           const key = (ans.mcq || [])[0] || "";
//           const opt = (q.options || []).find((o) => o.key === key);
//           const correctKey = (q.correct || [])[0] || "";
//           const correctOpt = (q.options || []).find(
//             (o) => o.key === correctKey
//           );
//           studentAnswer = key ? `${key}) ${opt?.text || ""}` : "—";
//           correctAnswer = correctKey
//             ? `${correctKey}) ${correctOpt?.text || ""}`
//             : "—";
//           isCorrect = !!key && key === correctKey;
//         } else if (type === "mcq-multi") {
//           const keys = new Set(ans.mcq || []);
//           const ck = new Set(q.correct || []);
//           const fmt = (set) =>
//             (q.options || [])
//               .filter((o) => set.has(o.key))
//               .map((o) => `${o.key}) ${o.text || ""}`)
//               .join(", ") || "—";
//           studentAnswer = fmt(keys);
//           correctAnswer = fmt(ck);
//           isCorrect =
//             keys.size === ck.size && [...keys].every((k) => ck.has(k));
//         } else if (type === "true-false") {
//           const key = (ans.trueFalse || "").toLowerCase();
//           const ck = (q.correct?.[0] || "").toLowerCase();
//           studentAnswer = key || "—";
//           correctAnswer = ck || "—";
//           isCorrect = !!key && key === ck;
//         } else {
//           studentAnswer = "—";
//           correctAnswer = "—";
//           isCorrect = false;
//         }

//         return {
//           qid: String(q._id),
//           question: q.question || "(no text)",
//           studentAnswer,
//           correctAnswer,
//           isCorrect,
//         };
//       })
//       .filter(Boolean);

//     res.json({
//       _id: attempt._id,
//       user,
//       subject: attempt.subject,
//       topic: attempt.topic,
//       type: attempt.type,
//       score: attempt.score,
//       total: attempt.total,
//       percent: attempt.percent,
//       submittedAt: attempt.submittedAt,
//       items,
//     });
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// export const getUserResults = async (req, res) => {
//   try {
//     const attempts = await Attempt.find({ userId: req.params.userId })
//       .sort({ createdAt: -1 })
//       .lean();

//     const results = await Promise.all(
//       attempts.map(async (att) => {

//         // populate subject + topic
//         const subjectDoc = await Subject.findById(att.subject).lean();
//         const topicDoc = await Topic.findById(att.topic).lean();

//         // populate QUESTIONS FULL DATA
//         const fullQuestions = await Question.find({
//           _id: { $in: att.questions }
//         })
//           .select("question options correct type")
//           .lean();

//         // attach correct question + user answer
//         const populatedQuestions = fullQuestions.map(q => ({
//           ...q,
//           userAnswer: att.answers.find(a =>
//             String(a.qid) === String(q._id)
//           ) || null
//         }));

//         return {
//           ...att,
//           subjectName: subjectDoc?.name || "Unknown Subject",
//           topicName: topicDoc?.name || "Unknown Topic",

//           questions: populatedQuestions
//         };
//       })
//     );

//     res.json({ success: true, results });

//   } catch (error) {
//     console.error("RESULTS ERROR:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch results",
//     });
//   }
// };

export const adminAttemptDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const attempt = await Attempt.findById(id).lean();
    if (!attempt) return res.status(404).json({ message: "Not found" });

    const user = await User.findById(attempt.userId)
      .select("_id name email")
      .lean();

    const questionIds = Array.isArray(attempt.questions) ? attempt.questions : [];
    const questions = await Question.find({ _id: { $in: questionIds } })
      .select(
        "_id type question prompt plainText options correct choiceMatrix clozeDrag clozeSelect clozeText matchList richHtml"
      )
      .lean();

    const qMap = new Map(questions.map((q) => [String(q._id), q]));

    const items = (Array.isArray(attempt.answers) ? attempt.answers : [])
      .map((ans) => {
        const q = qMap.get(String(ans.qid));
        if (!q) return null;

        const type = q.type;
        let studentAnswer = "";
        let correctAnswer = "";
        let isCorrect = false;

        if (type === "mcq-single") {
          const key = (ans.mcq || [])[0] || "";
          const opt = (q.options || []).find((o) => o.key === key);
          const correctKey = (q.correct || [])[0] || "";
          const correctOpt = (q.options || []).find(
            (o) => o.key === correctKey
          );
          studentAnswer = key ? `${key}) ${opt?.text || ""}` : "—";
          correctAnswer = correctKey
            ? `${correctKey}) ${correctOpt?.text || ""}`
            : "—";
          isCorrect = !!key && key === correctKey;
        } else if (type === "mcq-multi") {
          const keys = new Set(ans.mcq || []);
          const ck = new Set(q.correct || []);
          const fmt = (set) =>
            (q.options || [])
              .filter((o) => set.has(o.key))
              .map((o) => `${o.key}) ${o.text || ""}`)
              .join(", ") || "—";
          studentAnswer = fmt(keys);
          correctAnswer = fmt(ck);
          isCorrect =
            keys.size === ck.size && [...keys].every((k) => ck.has(k));
        } else if (type === "true-false") {
          const key = (ans.trueFalse || "").toLowerCase();
          const ck = (q.correct?.[0] || "").toLowerCase();
          studentAnswer = key || "—";
          correctAnswer = ck || "—";
          isCorrect = !!key && key === ck;
        } else if (type === "essay-plain" || type === "essay-rich") {
          studentAnswer = ans.essay || ans.essayRich?.text || "—";
          correctAnswer = q.plainText || q.prompt || "—";
          isCorrect = false;
        } else if (type === "cloze-select") {
          const userMap = ans.clozeSelect || {};
          const blankMap = q.clozeSelect?.blanks || {};
          const keys = Object.keys(blankMap || {});
          studentAnswer = keys.length
            ? keys.map((k) => `${k}: ${userMap[k] || "—"}`).join(", ")
            : "—";
          correctAnswer = keys.length
            ? keys.map((k) => `${k}: ${blankMap[k]?.correct || "—"}`).join(", ")
            : "—";
          isCorrect = false;
        } else if (type === "cloze-drag") {
          const userMap = ans.cloze || {};
          const correctMap = q.clozeDrag?.correctMap || {};
          const keys = Object.keys(correctMap || {});
          studentAnswer = keys.length
            ? keys.map((k) => `${k}: ${userMap[k] || "—"}`).join(", ")
            : "—";
          correctAnswer = keys.length
            ? keys.map((k) => `${k}: ${correctMap[k] || "—"}`).join(", ")
            : "—";
          isCorrect = false;
        } else if (type === "cloze-text") {
          const userMap = ans.clozeText || {};
          const correctMap = q.clozeText?.answers || {};
          const keys = Object.keys(correctMap || {});
          studentAnswer = keys.length
            ? keys.map((k) => `${k}: ${userMap[k] || "—"}`).join(", ")
            : "—";
          correctAnswer = keys.length
            ? keys.map((k) => `${k}: ${correctMap[k] || "—"}`).join(", ")
            : "—";
          isCorrect = false;
        } else if (type === "match-list") {
          const left = q.matchList?.left || [];
          const right = q.matchList?.right || [];
          const correctPairs = q.matchList?.pairs || {};
          const userPairs = ans.matchList || {};
          const keys = Object.keys(correctPairs || {});
          studentAnswer = keys.length
            ? keys
                .map((k) => `${left[Number(k)] || `Left ${Number(k) + 1}`} -> ${right[Number(userPairs[k])] || "—"}`)
                .join(", ")
            : "—";
          correctAnswer = keys.length
            ? keys
                .map((k) => `${left[Number(k)] || `Left ${Number(k) + 1}`} -> ${right[Number(correctPairs[k])] || "—"}`)
                .join(", ")
            : "—";
          isCorrect = false;
        } else {
          studentAnswer = "—";
          correctAnswer = "—";
          isCorrect = false;
        }

        return {
          qid: String(q._id),
          question:
            q.question ||
            q.prompt ||
            q.choiceMatrix?.prompt ||
            q.matchList?.prompt ||
            q.clozeDrag?.text ||
            q.clozeSelect?.text ||
            q.clozeText?.text ||
            "(no text)",
          studentAnswer,
          correctAnswer,
          isCorrect,
        };
      })
      .filter(Boolean);

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

export const getUserResults = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Prevent CastError
    if (!userId || userId === "undefined") {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing userId",
      });
    }

    let analyticsAccess = "full";
    if (
      String(req.user?.role || "").toLowerCase() === "student" &&
      String(req.user?.id || "") === String(userId)
    ) {
      const userDoc = await User.findById(userId).select("activeSubscription").lean();
      let activePackage = null;

      if (userDoc?.activeSubscription) {
        const subscription = await Subscription.findById(userDoc.activeSubscription)
          .populate("package")
          .lean();
        activePackage = subscription?.package || null;
      }

      if (!activePackage) {
        activePackage = await Package.findOne({ name: "Basic", isActive: true })
          .select("analyticsAccess")
          .lean();
      }

      const resolved = String(activePackage?.analyticsAccess || "none").toLowerCase();
      analyticsAccess = ["none", "basic", "full"].includes(resolved) ? resolved : "none";
    }

    const canViewDetails = analyticsAccess === "full";

    const attempts = await Attempt.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    const results = await Promise.all(
      attempts.map(async (att) => {
        const subjectDoc = await Subject.findById(att.subject).lean();
        const topicDoc = await Topic.findById(att.topic).lean();

        if (!canViewDetails) {
          return {
            _id: att._id,
            stage: att.stage,
            type: att.type,
            score: att.score,
            total: att.total,
            percent: att.percent,
            createdAt: att.createdAt,
            updatedAt: att.updatedAt,
            subjectName: subjectDoc?.name || "Unknown Subject",
            topicName: topicDoc?.name || "Unknown Topic",
            questions: [],
            answers: [],
          };
        }

        const fullQuestions = await Question.find({
          _id: { $in: att.questions },
        })
          .select(
            "question prompt plainText richHtml options correct type choiceMatrix matchList clozeDrag clozeSelect clozeText explanation"
          )
          .lean();

        const populatedQuestions = fullQuestions.map((q) => ({
          ...q,
          userAnswer:
            att.answers.find((a) => String(a.qid) === String(q._id)) || null,
        }));

        return {
          ...att,
          subjectName: subjectDoc?.name || "Unknown Subject",
          topicName: topicDoc?.name || "Unknown Topic",
          questions: populatedQuestions,
        };
      })
    );

    res.json({ success: true, analyticsAccess, results });
  } catch (error) {
    console.error("RESULTS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch results",
    });
  }
};

export const getClassRank = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).lean();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const userClass = user.class || user.className;
    const userBoard = user.board;

    // 1️⃣ Get all students of same class & board
    const students = await User.find({
      role: "student",
      board: userBoard,
      $or: [{ class: userClass }, { className: userClass }],
    }).select("_id");

    const studentIds = students.map((s) => s._id);

    // 2️⃣ Aggregate average score per student
    const scores = await Attempt.aggregate([
      { $match: { userId: { $in: studentIds } } },
      {
        $group: {
          _id: "$userId",
          avgPercent: {
            $avg: {
              $cond: [
                { $gt: ["$total", 0] },
                { $multiply: [{ $divide: ["$score", "$total"] }, 100] },
                0,
              ],
            },
          },
        },
      },
      { $sort: { avgPercent: -1 } },
    ]);

    const totalStudents = scores.length;

    // 3️⃣ Find rank
    const rankIndex = scores.findIndex(
      (s) => s._id.toString() === userId.toString()
    );

    const rank = rankIndex >= 0 ? rankIndex + 1 : totalStudents;

    res.json({
      success: true,
      rank,
      totalStudents,
    });
  } catch (err) {
    console.error("CLASS RANK ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/exams/leaderboard
export const getLeaderboard = async (req, res) => {
  try {
    const { board, className } = req.query;

    const pipeline = [
      // 1️⃣ Join users correctly
      {
        $lookup: {
          from: "users",
          localField: "userId",   // ✅ FIXED
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },

      // 2️⃣ Only students
      {
        $match: {
          "user.role": "student",
        },
      },

      // 3️⃣ Board filter (on USER)
      ...(board
        ? [
            {
              $match: {
                "user.board": board,
              },
            },
          ]
        : []),

      // 4️⃣ Class filter (support BOTH class & className)
      ...(className
        ? [
            {
              $match: {
                $or: [
                  { "user.class": className },
                  { "user.className": className },
                ],
              },
            },
          ]
        : []),

      // 5️⃣ Group by student
      {
        $group: {
          _id: "$user._id",
          name: { $first: "$user.name" },
          className: {
            $first: {
              $ifNull: ["$user.className", "$user.class"],
            },
          },
          board: { $first: "$user.board" },
          state: { $first: "$user.state" },
          totalScore: { $sum: "$score" },
          avgPercent: { $avg: "$percent" },
          examsAttempted: { $sum: 1 },
        },
      },

      // 6️⃣ Sort leaderboard
      { $sort: { totalScore: -1, avgPercent: -1 } },
    ];

    const leaderboard = await Attempt.aggregate(pipeline);

    res.json({ success: true, leaderboard });
  } catch (err) {
    console.error("LEADERBOARD ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
