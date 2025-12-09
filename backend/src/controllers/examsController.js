import Attempt from "../models/Attempt.js";
import Question from "../models/Question.js";
import User from "../models/User.js";

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
      const correctText = (q.correct?.[0] || "").toLowerCase();

      if (!userText || !correctText) return 0;

      // Remove punctuation
      const cleanUser = userText.replace(/[^a-z0-9 ]/g, "");
      const cleanCorrect = correctText.replace(/[^a-z0-9 ]/g, "");

      // Convert to word sets
      const userWords = new Set(cleanUser.split(/\s+/));
      const correctWords = new Set(cleanCorrect.split(/\s+/));

      // Count matching words
      let match = 0;
      userWords.forEach((w) => {
        if (correctWords.has(w)) match++;
      });

      // Semantic similarity %
      const percent = (match / correctWords.size) * 100;

      // 70% or more = correct
      return percent >= 70 ? 1 : 0;
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
export const startExam = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { stage = "stage-1", subject, topic, type, limit = 10 } = req.body;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!subject || !topic || !type) {
      return res
        .status(400)
        .json({ message: "subject, topic, type are required" });
    }

    // ⭐ Map frontend → backend type
    let qType = type;
    if (type === "cloze-dnd") qType = "cloze-drag";

    // ⭐ User class normalization
    // const userClassRaw = req.user?.class || "";
    // const normalizedClass = userClassRaw.trim();

    const userClassRaw = req.user?.class || "";

    // Accept both formats: "3" or "Class 3"
    const normalizedClass = userClassRaw.startsWith("Class")
      ? userClassRaw.trim() // "Class 3"
      : `Class ${userClassRaw.trim()}`; // convert "3" → "Class 3"

    // ⭐ Match class EXACTLY like stored in DB (e.g., "Class 3")
    // Your DB stores: "Class 3"
    // So we match EXACTLY that.

    // const match = {
    //   type: qType,
    //   class: normalizedClass, // <-- FIXED
    //   // subject: { $regex: new RegExp("^" + subject + "$", "i") },
    //   // topic: { $regex: new RegExp("^" + topic + "$", "i") },
    //   topic: { $regex: topic, $options: "i" },
    //   subject: { $regex: subject, $options: "i" },
    // };
    // Build match object
    const match = {
      type: qType,
      subject: { $regex: subject, $options: "i" },
      topic: { $regex: topic, $options: "i" },
    };

    // Apply class filter ONLY if valid
    if (
      normalizedClass &&
      normalizedClass !== "Class" &&
      normalizedClass !== "Class "
    ) {
      match.class = normalizedClass;
    } else {
      console.log("⚠ User has no valid class → class filter skipped");
    }

    console.log("MATCH USED:", match);

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
          explanation: 1,
          clozeDrag: 1,
          clozeSelect: 1,
        },
      },
    ];

    const questions = await Question.aggregate(pipeline);

    if (!questions.length)
      return res.status(404).json({ message: "No questions found" });

    // ⭐ CLOZE PARSER (unchanged)
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

    // ⭐ FORMAT QUESTIONS (unchanged)
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

      // ⭐ FIX: Cloze-Select was not being returned to frontend
      if (q.type === "cloze-select") {
        return {
          _id: q._id,
          type: q.type,
          clozeSelect: q.clozeSelect, // includes text + blanks
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

    // ⭐ create attempt (unchanged)
    const attempt = await Attempt.create({
      userId,
      stage,
      subject,
      topic,
      type,
      questions: finalQuestions.map((q) => q._id),
      total: finalQuestions.length,
    });

    // ⭐ Response (unchanged)
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
          const correctWords = new Set(
            correctText.split(/\W+/).filter((w) => w.length > 3)
          );
          const userWords = new Set(
            userText.split(/\W+/).filter((w) => w.length > 3)
          );

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
        const blanks = q.clozeSelect?.blanks || {};
        const user = ans.clozeSelect || {};

        let correctCount = 0;
        let total = Object.keys(blanks).length;

        for (const b of Object.keys(blanks)) {
          if ((user[b] || "").trim() === (blanks[b].correct || "").trim()) {
            correctCount++;
          }
        }

        if (correctCount === total) {
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
    const items = await Attempt.find({ userId })
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
      .select("_id name email")
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

    const enriched = items.map((a) => ({
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

    const user = await User.findById(attempt.userId)
      .select("_id name email")
      .lean();

    // fetch questions
    const questions = await Question.find({ _id: { $in: attempt.questions } })
      .select("_id type question options correct")
      .lean();
    const qMap = new Map(questions.map((q) => [String(q._id), q]));

    // map answers
    const items = (attempt.answers || [])
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
