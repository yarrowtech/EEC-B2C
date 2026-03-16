// src/controllers/questionsController.js
import Question from "../models/Question.js";
import User from "../models/User.js";
import Board from "../models/Board.js";
import Class from "../models/Class.js";
import Subject from "../models/Subject.js";
import Topic from "../models/Topic.js";
import Attempt from "../models/Attempt.js";
import * as XLSX from "xlsx";

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

function normalizeStageValue(stageValue) {
  if (stageValue === null || stageValue === undefined || stageValue === "") {
    return 1;
  }

  if (typeof stageValue === "number" && Number.isFinite(stageValue)) {
    return Math.max(1, Math.trunc(stageValue));
  }

  const raw = String(stageValue).trim().toLowerCase();
  if (!raw) return 1;

  if (/^\d+$/.test(raw)) return Math.max(1, Number(raw));

  const stageMatch = raw.match(/^stage[-\s]*(\d+)$/);
  if (stageMatch) return Math.max(1, Number(stageMatch[1]));

  if (raw === "foundation") return 1;
  if (raw === "intermediate") return 2;
  if (raw === "advanced") return 3;

  return 1;
}

function getLevelFromStage(stageValue) {
  const stage = normalizeStageValue(stageValue);
  if (stage <= 1) return "basic";
  if (stage === 2) return "intermediate";
  return "advanced";
}

function normalizeDifficulty(difficultyValue) {
  const raw = String(difficultyValue || "easy").trim().toLowerCase();
  if (!raw) return "easy";
  if (raw === "medium") return "moderate";
  if (["easy", "moderate", "hard"].includes(raw)) return raw;
  return "easy";
}

function normalizeLevel(levelValue, stageValue) {
  const fallback = getLevelFromStage(stageValue);
  const raw = String(levelValue || fallback).trim().toLowerCase();
  if (["basic", "intermediate", "advanced"].includes(raw)) return raw;
  return fallback;
}

function levelToDifficulty(levelValue) {
  const level = String(levelValue || "").trim().toLowerCase();
  if (level === "basic") return "easy";
  if (level === "intermediate") return "moderate";
  if (level === "advanced") return "hard";
  return null;
}

function normalizeBulkHeader(headerValue) {
  return String(headerValue || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function getBulkCellValue(normalizedRow, aliases = []) {
  for (const alias of aliases) {
    const key = normalizeBulkHeader(alias);
    if (Object.prototype.hasOwnProperty.call(normalizedRow, key)) {
      return normalizedRow[key];
    }
  }
  return "";
}

function parseMcqCorrectKey(rawValue, optionValues = []) {
  const raw = String(rawValue || "")
    .trim()
    .toUpperCase()
    .replace(/^OPTION\s+/i, "");
  if (["A", "B", "C", "D"].includes(raw)) return raw;
  if (["1", "2", "3", "4"].includes(raw)) return ["A", "B", "C", "D"][Number(raw) - 1];

  const originalRaw = String(rawValue || "").trim();
  if (originalRaw && Array.isArray(optionValues) && optionValues.length === 4) {
    const idx = optionValues.findIndex(
      (opt) => String(opt || "").trim().toLowerCase() === originalRaw.toLowerCase()
    );
    if (idx >= 0) return ["A", "B", "C", "D"][idx];
  }

  return "";
}

function parseMcqMultiCorrectKeys(rawValue, optionValues = []) {
  const tokens = String(rawValue || "")
    .split(/[|,;/\n]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const keys = tokens
    .map((token) => parseMcqCorrectKey(token, optionValues))
    .filter(Boolean);

  const unique = [...new Set(keys)];
  const order = { A: 1, B: 2, C: 3, D: 4 };
  return unique.sort((a, b) => (order[a] || 99) - (order[b] || 99));
}

function parseDelimitedList(rawValue) {
  const raw = String(rawValue || "").trim();
  if (!raw) return [];
  const splitter = /[|;\n]+/.test(raw) ? /[|;\n]+/ : /,/;
  return raw
    .split(splitter)
    .map((t) => t.trim())
    .filter(Boolean);
}

function resolveChoiceMatrixIndex(token, values = []) {
  const clean = String(token || "").trim();
  if (!clean) return -1;

  if (/^\d+$/.test(clean)) {
    const oneBased = Number(clean);
    if (oneBased >= 1 && oneBased <= values.length) return oneBased - 1;
  }

  const lower = clean.toLowerCase();
  return values.findIndex((v) => String(v || "").trim().toLowerCase() === lower);
}

function parseChoiceMatrixCorrectCells(rawValue, rows = [], cols = []) {
  const tokens = parseDelimitedList(rawValue);
  const cells = [];

  for (const token of tokens) {
    const directMatch = token.match(/^(\d+)\s*-\s*(\d+)$/);
    if (directMatch) {
      const ri = Number(directMatch[1]);
      const ci = Number(directMatch[2]);
      if (ri >= 0 && ci >= 0 && ri < rows.length && ci < cols.length) {
        cells.push(`${ri}-${ci}`);
      }
      continue;
    }

    const pairMatch = token.match(/^(.+?)\s*[:=]\s*(.+)$/);
    if (pairMatch) {
      const ri = resolveChoiceMatrixIndex(pairMatch[1], rows);
      const ci = resolveChoiceMatrixIndex(pairMatch[2], cols);
      if (ri >= 0 && ci >= 0) {
        cells.push(`${ri}-${ci}`);
      }
    }
  }

  return [...new Set(cells)];
}

function parseTrueFalseAnswer(rawValue) {
  const raw = String(rawValue || "").trim().toLowerCase();
  if (!raw) return "";
  if (["true", "t", "1", "yes", "y"].includes(raw)) return "true";
  if (["false", "f", "0", "no", "n"].includes(raw)) return "false";
  return "";
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
    difficulty: normalizeDifficulty(body.difficulty),
    tags: String(body.tags || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    explanation: body.explanation || "",
    stage: normalizeStageValue(body.stage),
    level: normalizeLevel(body.level, body.stage),
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

export const bulkCreateMcqSingle = async (req, res) => {
  try {
    if (!requireAdminOrTeacher(req, res)) return;

    if (!req.file?.buffer) {
      return res.status(400).json({ message: "Please upload an Excel file" });
    }

    const {
      board = "",
      class: classValue = "",
      subject = "",
      topic = "",
      stage = "",
      level = "",
      difficulty = "",
    } = req.body || {};

    if (!board || !classValue || !subject || !topic || !stage || !difficulty) {
      return res.status(400).json({
        message: "board, class, subject, topic, stage, and difficulty are required",
      });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames?.[0];
    if (!firstSheetName) {
      return res.status(400).json({ message: "Excel file does not contain any sheet" });
    }

    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
      defval: "",
      raw: false,
      blankrows: false,
    });
    if (!rows.length) {
      return res.status(400).json({ message: "Excel file has no data rows" });
    }

    const docs = [];
    const failures = [];

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const normalizedRow = {};
      for (const [k, v] of Object.entries(row)) {
        normalizedRow[normalizeBulkHeader(k)] = String(v ?? "").trim();
      }

      const question = getBulkCellValue(normalizedRow, ["question", "questionText", "question_text"]);
      const optionA = getBulkCellValue(normalizedRow, ["optionA", "option_a", "a"]);
      const optionB = getBulkCellValue(normalizedRow, ["optionB", "option_b", "b"]);
      const optionC = getBulkCellValue(normalizedRow, ["optionC", "option_c", "c"]);
      const optionD = getBulkCellValue(normalizedRow, ["optionD", "option_d", "d"]);
      const correct = parseMcqCorrectKey(
        getBulkCellValue(normalizedRow, ["correct", "correctOption", "correct_answer", "answer"]),
        [optionA, optionB, optionC, optionD]
      );
      const explanation = getBulkCellValue(normalizedRow, ["explanation", "solution"]);
      const tags = getBulkCellValue(normalizedRow, ["tags", "tag"]);

      const rowNumber = i + 2; // header on row 1
      if (!question || !optionA || !optionB || !optionC || !optionD || !correct) {
        failures.push({
          row: rowNumber,
          reason: "question, optionA, optionB, optionC, optionD and correct are required",
        });
        continue;
      }

      const { ok, doc, message } = shapeByType(
        "mcq-single",
        {
          board,
          class: classValue,
          subject,
          topic,
          stage,
          level,
          difficulty,
          question,
          options: [optionA, optionB, optionC, optionD],
          correct,
          explanation,
          tags,
        },
        req.user.id
      );

      if (!ok) {
        failures.push({ row: rowNumber, reason: message || "Invalid row data" });
        continue;
      }

      doc.class = classValue;
      doc.board = board;
      docs.push(doc);
    }

    if (!docs.length) {
      return res.status(400).json({
        message: "No valid rows found in uploaded file",
        inserted: 0,
        failed: failures.length,
        failures: failures.slice(0, 25),
      });
    }

    await Question.insertMany(docs);

    res.status(201).json({
      message: `Uploaded ${docs.length} MCQ single question(s) successfully`,
      inserted: docs.length,
      failed: failures.length,
      failures: failures.slice(0, 25),
    });
  } catch (error) {
    console.error("Bulk MCQ single upload failed:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const bulkCreateMcqMulti = async (req, res) => {
  try {
    if (!requireAdminOrTeacher(req, res)) return;

    if (!req.file?.buffer) {
      return res.status(400).json({ message: "Please upload an Excel file" });
    }

    const {
      board = "",
      class: classValue = "",
      subject = "",
      topic = "",
      stage = "",
      level = "",
      difficulty = "",
    } = req.body || {};

    if (!board || !classValue || !subject || !topic || !stage || !difficulty) {
      return res.status(400).json({
        message: "board, class, subject, topic, stage, and difficulty are required",
      });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames?.[0];
    if (!firstSheetName) {
      return res.status(400).json({ message: "Excel file does not contain any sheet" });
    }

    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
      defval: "",
      raw: false,
      blankrows: false,
    });
    if (!rows.length) {
      return res.status(400).json({ message: "Excel file has no data rows" });
    }

    const docs = [];
    const failures = [];

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const normalizedRow = {};
      for (const [k, v] of Object.entries(row)) {
        normalizedRow[normalizeBulkHeader(k)] = String(v ?? "").trim();
      }

      const question = getBulkCellValue(normalizedRow, ["question", "questionText", "question_text"]);
      const optionA = getBulkCellValue(normalizedRow, ["optionA", "option_a", "a"]);
      const optionB = getBulkCellValue(normalizedRow, ["optionB", "option_b", "b"]);
      const optionC = getBulkCellValue(normalizedRow, ["optionC", "option_c", "c"]);
      const optionD = getBulkCellValue(normalizedRow, ["optionD", "option_d", "d"]);
      const correct = parseMcqMultiCorrectKeys(
        getBulkCellValue(normalizedRow, ["correct", "correctOption", "correct_answer", "answer"]),
        [optionA, optionB, optionC, optionD]
      );
      const explanation = getBulkCellValue(normalizedRow, ["explanation", "solution"]);
      const tags = getBulkCellValue(normalizedRow, ["tags", "tag"]);

      const rowNumber = i + 2; // header on row 1
      if (!question || !optionA || !optionB || !optionC || !optionD || !correct.length) {
        failures.push({
          row: rowNumber,
          reason: "question, optionA, optionB, optionC, optionD and correct are required",
        });
        continue;
      }

      const { ok, doc, message } = shapeByType(
        "mcq-multi",
        {
          board,
          class: classValue,
          subject,
          topic,
          stage,
          level,
          difficulty,
          question,
          options: [optionA, optionB, optionC, optionD],
          correct,
          explanation,
          tags,
        },
        req.user.id
      );

      if (!ok) {
        failures.push({ row: rowNumber, reason: message || "Invalid row data" });
        continue;
      }

      doc.class = classValue;
      doc.board = board;
      docs.push(doc);
    }

    if (!docs.length) {
      return res.status(400).json({
        message: "No valid rows found in uploaded file",
        inserted: 0,
        failed: failures.length,
        failures: failures.slice(0, 25),
      });
    }

    await Question.insertMany(docs);

    res.status(201).json({
      message: `Uploaded ${docs.length} MCQ multi question(s) successfully`,
      inserted: docs.length,
      failed: failures.length,
      failures: failures.slice(0, 25),
    });
  } catch (error) {
    console.error("Bulk MCQ multi upload failed:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const bulkCreateChoiceMatrix = async (req, res) => {
  try {
    if (!requireAdminOrTeacher(req, res)) return;

    if (!req.file?.buffer) {
      return res.status(400).json({ message: "Please upload an Excel file" });
    }

    const {
      board = "",
      class: classValue = "",
      subject = "",
      topic = "",
      stage = "",
      level = "",
      difficulty = "",
    } = req.body || {};

    if (!board || !classValue || !subject || !topic || !stage || !difficulty) {
      return res.status(400).json({
        message: "board, class, subject, topic, stage, and difficulty are required",
      });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames?.[0];
    if (!firstSheetName) {
      return res.status(400).json({ message: "Excel file does not contain any sheet" });
    }

    const rowsData = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
      defval: "",
      raw: false,
      blankrows: false,
    });
    if (!rowsData.length) {
      return res.status(400).json({ message: "Excel file has no data rows" });
    }

    const docs = [];
    const failures = [];

    for (let i = 0; i < rowsData.length; i += 1) {
      const row = rowsData[i];
      const normalizedRow = {};
      for (const [k, v] of Object.entries(row)) {
        normalizedRow[normalizeBulkHeader(k)] = String(v ?? "").trim();
      }

      const prompt = getBulkCellValue(normalizedRow, ["prompt", "question", "questionText", "question_text"]);
      const matrixRows = parseDelimitedList(
        getBulkCellValue(normalizedRow, ["rows", "rowLabels", "statements"])
      );
      const matrixCols = parseDelimitedList(
        getBulkCellValue(normalizedRow, ["cols", "columns", "colLabels", "options"])
      );
      const correctCells = parseChoiceMatrixCorrectCells(
        getBulkCellValue(normalizedRow, ["correctCells", "correct", "answers"]),
        matrixRows,
        matrixCols
      );
      const explanation = getBulkCellValue(normalizedRow, ["explanation", "solution"]);
      const tags = getBulkCellValue(normalizedRow, ["tags", "tag"]);

      const rowNumber = i + 2; // header on row 1
      if (!prompt || !matrixRows.length || !matrixCols.length) {
        failures.push({
          row: rowNumber,
          reason: "prompt, rows and cols are required",
        });
        continue;
      }

      const { ok, doc, message } = shapeByType(
        "choice-matrix",
        {
          board,
          class: classValue,
          subject,
          topic,
          stage,
          level,
          difficulty,
          explanation,
          tags,
          choiceMatrix: {
            prompt,
            rows: matrixRows,
            cols: matrixCols,
            correctCells,
          },
        },
        req.user.id
      );

      if (!ok) {
        failures.push({ row: rowNumber, reason: message || "Invalid row data" });
        continue;
      }

      doc.class = classValue;
      doc.board = board;
      docs.push(doc);
    }

    if (!docs.length) {
      return res.status(400).json({
        message: "No valid rows found in uploaded file",
        inserted: 0,
        failed: failures.length,
        failures: failures.slice(0, 25),
      });
    }

    await Question.insertMany(docs);

    res.status(201).json({
      message: `Uploaded ${docs.length} choice matrix question(s) successfully`,
      inserted: docs.length,
      failed: failures.length,
      failures: failures.slice(0, 25),
    });
  } catch (error) {
    console.error("Bulk choice matrix upload failed:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const bulkCreateTrueFalse = async (req, res) => {
  try {
    if (!requireAdminOrTeacher(req, res)) return;

    if (!req.file?.buffer) {
      return res.status(400).json({ message: "Please upload an Excel file" });
    }

    const {
      board = "",
      class: classValue = "",
      subject = "",
      topic = "",
      stage = "",
      level = "",
      difficulty = "",
    } = req.body || {};

    if (!board || !classValue || !subject || !topic || !stage || !difficulty) {
      return res.status(400).json({
        message: "board, class, subject, topic, stage, and difficulty are required",
      });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames?.[0];
    if (!firstSheetName) {
      return res.status(400).json({ message: "Excel file does not contain any sheet" });
    }

    const rowsData = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
      defval: "",
      raw: false,
      blankrows: false,
    });
    if (!rowsData.length) {
      return res.status(400).json({ message: "Excel file has no data rows" });
    }

    const docs = [];
    const failures = [];

    for (let i = 0; i < rowsData.length; i += 1) {
      const row = rowsData[i];
      const normalizedRow = {};
      for (const [k, v] of Object.entries(row)) {
        normalizedRow[normalizeBulkHeader(k)] = String(v ?? "").trim();
      }

      const statement = getBulkCellValue(normalizedRow, [
        "statement",
        "question",
        "questionText",
        "question_text",
      ]);
      const answer = parseTrueFalseAnswer(
        getBulkCellValue(normalizedRow, ["answer", "correct", "correct_answer"])
      );
      const explanation = getBulkCellValue(normalizedRow, ["explanation", "solution"]);
      const tags = getBulkCellValue(normalizedRow, ["tags", "tag"]);

      const rowNumber = i + 2; // header on row 1
      if (!statement || !answer) {
        failures.push({
          row: rowNumber,
          reason: "statement/question and answer are required",
        });
        continue;
      }

      const { ok, doc, message } = shapeByType(
        "true-false",
        {
          board,
          class: classValue,
          subject,
          topic,
          stage,
          level,
          difficulty,
          question: statement,
          answer,
          explanation,
          tags,
        },
        req.user.id
      );

      if (!ok) {
        failures.push({ row: rowNumber, reason: message || "Invalid row data" });
        continue;
      }

      doc.class = classValue;
      doc.board = board;
      docs.push(doc);
    }

    if (!docs.length) {
      return res.status(400).json({
        message: "No valid rows found in uploaded file",
        inserted: 0,
        failed: failures.length,
        failures: failures.slice(0, 25),
      });
    }

    await Question.insertMany(docs);

    res.status(201).json({
      message: `Uploaded ${docs.length} true/false question(s) successfully`,
      inserted: docs.length,
      failed: failures.length,
      failures: failures.slice(0, 25),
    });
  } catch (error) {
    console.error("Bulk true/false upload failed:", error);
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
      mine,
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

    // Teachers should not see admin-uploaded questions in list view.
    if (req.user?.role === "teacher") {
      const adminUsers = await User.find({ role: { $regex: /^admin$/i } }).select("_id");
      const adminIds = adminUsers.map((u) => u._id);
      if (adminIds.length) {
        filter.createdBy = { $nin: adminIds };
      }
    }

    // Optional "mine" filter for uploader-specific lists (admin/teacher usage).
    if (String(mine || "").toLowerCase() === "1" || String(mine || "").toLowerCase() === "true") {
      filter.createdBy = req.user.id;
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
    if (stage) filter.stage = normalizeStageValue(stage);
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
        .populate("createdBy", "name role email")
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

    const role = String(req.user?.role || "").toLowerCase();
    const isTeacher = role === "teacher";

    let merged;
    if (!isTeacher) {
      merged = { ...existing.toObject(), ...req.body };
    } else {
      // Teachers are allowed to edit only the main question text/prompt.
      const incoming = req.body || {};
      merged = { ...existing.toObject() };

      switch (existing.type) {
        case "mcq-single":
        case "mcq-multi":
        case "true-false": {
          const nextQuestion = String(
            incoming.question ?? incoming.statement ?? merged.question ?? ""
          ).trim();
          if (nextQuestion) merged.question = nextQuestion;
          break;
        }
        case "choice-matrix": {
          const nextPrompt = String(incoming?.choiceMatrix?.prompt ?? "").trim();
          if (nextPrompt) {
            merged.choiceMatrix = {
              ...(merged.choiceMatrix || {}),
              prompt: nextPrompt,
            };
          }
          break;
        }
        case "cloze-drag": {
          const nextText = String(incoming?.clozeDrag?.text ?? "").trim();
          if (nextText) {
            merged.clozeDrag = {
              ...(merged.clozeDrag || {}),
              text: nextText,
            };
          }
          break;
        }
        case "cloze-select": {
          const nextText = String(incoming?.clozeSelect?.text ?? "").trim();
          if (nextText) {
            merged.clozeSelect = {
              ...(merged.clozeSelect || {}),
              text: nextText,
            };
          }
          break;
        }
        case "cloze-text": {
          const nextText = String(incoming?.clozeText?.text ?? "").trim();
          if (nextText) {
            merged.clozeText = {
              ...(merged.clozeText || {}),
              text: nextText,
            };
          }
          break;
        }
        case "match-list": {
          const nextPrompt = String(incoming?.matchList?.prompt ?? "").trim();
          if (nextPrompt) {
            merged.matchList = {
              ...(merged.matchList || {}),
              prompt: nextPrompt,
            };
          }
          break;
        }
        case "essay-rich":
        case "essay-plain": {
          const nextPrompt = String(incoming.prompt ?? "").trim();
          if (nextPrompt) merged.prompt = nextPrompt;
          break;
        }
        default:
          break;
      }
    }

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

export const metaStages = async (req, res) => {
  try {
    const { class: userClass, board } = req.query;

    // Build filter for stages
    const filter = {};

    // Handle board parameter (could be ObjectId or name)
    if (board) {
      const mongoose = await import("mongoose");
      if (mongoose.default.Types.ObjectId.isValid(board) && /^[0-9a-fA-F]{24}$/.test(board)) {
        filter.board = board;
      } else {
        const Board = (await import("../models/Board.js")).default;
        const boardDoc = await Board.findOne({ name: board });
        if (boardDoc) {
          filter.board = boardDoc._id;
        } else {
          return res.json({ stages: [] });
        }
      }
    }

    // Handle class parameter (could be ObjectId or name)
    if (userClass) {
      const mongoose = await import("mongoose");
      if (mongoose.default.Types.ObjectId.isValid(userClass) && /^[0-9a-fA-F]{24}$/.test(userClass)) {
        filter.class = userClass;
      } else {
        const Class = (await import("../models/Class.js")).default;
        const classDoc = await Class.findOne({ name: userClass });
        if (classDoc) {
          filter.class = classDoc._id;
        } else {
          return res.json({ stages: [] });
        }
      }
    }

    const rows = await Question.aggregate([
      ...(Object.keys(filter).length > 0 ? [{ $match: filter }] : []),
      { $group: { _id: "$stage", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const stages = [...new Set(rows.map((r) => Number(r._id)).filter((s) => Number.isFinite(s) && s >= 1))].sort((a, b) => a - b);

    res.json({ stages });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

// Get available question types with counts for a specific subject/topic
export const getQuestionTypes = async (req, res) => {
  try {
    const { subject, topic, class: userClass, board, stage, level } = req.query;

    // Build filter
    const filter = {};
    if (subject) filter.subject = subject;
    if (topic) filter.topic = topic;
    if (stage) filter.stage = normalizeStageValue(stage);
    if (level) {
      const normalizedLevel = normalizeLevel(level, stage);
      const mappedDifficulty = levelToDifficulty(normalizedLevel);
      if (mappedDifficulty) {
        filter.$or = [
          { level: normalizedLevel },
          { difficulty: mappedDifficulty },
        ];
      } else {
        filter.level = normalizedLevel;
      }
    }

    // Handle board parameter (could be ObjectId or name)
    if (board) {
      const mongoose = await import("mongoose");
      if (mongoose.default.Types.ObjectId.isValid(board) && /^[0-9a-fA-F]{24}$/.test(board)) {
        filter.board = { $in: [board, new mongoose.default.Types.ObjectId(board)] };
      } else {
        // It's a board name, look up the ID
        const Board = (await import("../models/Board.js")).default;
        const boardDoc = await Board.findOne({ name: board });
        if (boardDoc) {
          filter.board = { $in: [board, String(boardDoc._id), boardDoc._id] };
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
        filter.class = { $in: [userClass, new mongoose.default.Types.ObjectId(userClass)] };
      } else {
        // It's a class name, look up the ID
        const Class = (await import("../models/Class.js")).default;
        const classDoc = await Class.findOne({ name: userClass });
        if (classDoc) {
          filter.class = { $in: [userClass, String(classDoc._id), classDoc._id] };
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

export const uploadPerformanceAnalytics = async (req, res) => {
  try {
    if (!requireAdminOrTeacher(req, res)) return;

    const role = String(req.user?.role || "").toLowerCase();
    const passPercentRaw = Number(req.query.passPercent);
    const passPercent = Number.isFinite(passPercentRaw)
      ? Math.min(100, Math.max(0, passPercentRaw))
      : 60;

    const teacherFilter =
      role === "teacher"
        ? { _id: req.user.id, role: { $regex: /^teacher$/i } }
        : { role: { $regex: /^teacher$/i } };

    const teachers = await User.find(teacherFilter).select("_id name email role").lean();
    const teacherIds = teachers.map((t) => t._id);

    if (!teacherIds.length) {
      return res.json({
        passPercent,
        scope: role === "teacher" ? "self" : "all-teachers",
        teacherSummaries: [],
        setRows: [],
      });
    }

    const teacherById = new Map(
      teachers.map((t) => [String(t._id), { name: t.name || "Unknown", email: t.email || "" }])
    );

    const [uploadRows, attemptRows, boards, classes, subjects, topics] = await Promise.all([
      Question.aggregate([
        { $match: { createdBy: { $in: teacherIds } } },
        {
          $group: {
            _id: {
              teacherId: "$createdBy",
              board: "$board",
              className: "$class",
              subject: "$subject",
              topic: "$topic",
              type: "$type",
            },
            uploadedQuestions: { $sum: 1 },
            lastUploadedAt: { $max: "$createdAt" },
          },
        },
      ]),
      Attempt.aggregate([
        {
          $match: {
            attemptType: "mcq",
            submittedAt: { $ne: null },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "student",
          },
        },
        { $unwind: "$student" },
        { $match: { "student.role": "student" } },
        { $unwind: "$questions" },
        {
          $lookup: {
            from: "questions",
            localField: "questions",
            foreignField: "_id",
            as: "q",
          },
        },
        { $unwind: "$q" },
        { $match: { "q.createdBy": { $in: teacherIds } } },
        {
          $group: {
            _id: {
              teacherId: "$q.createdBy",
              board: "$q.board",
              className: "$q.class",
              subject: "$q.subject",
              topic: "$q.topic",
              type: "$q.type",
              attemptId: "$_id",
              userId: "$userId",
            },
            percent: { $first: { $ifNull: ["$percent", 0] } },
            questionsAttemptedInAttempt: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: {
              teacherId: "$_id.teacherId",
              board: "$_id.board",
              className: "$_id.className",
              subject: "$_id.subject",
              topic: "$_id.topic",
              type: "$_id.type",
            },
            attemptsCount: { $sum: 1 },
            uniqueStudentIds: { $addToSet: "$_id.userId" },
            successfulAttemptsCount: {
              $sum: {
                $cond: [{ $gte: ["$percent", passPercent] }, 1, 0],
              },
            },
            questionsAttemptedCount: { $sum: "$questionsAttemptedInAttempt" },
          },
        },
        {
          $project: {
            _id: 1,
            attemptsCount: 1,
            successfulAttemptsCount: 1,
            questionsAttemptedCount: 1,
            uniqueStudentsCount: { $size: "$uniqueStudentIds" },
          },
        },
      ]),
      Board.find({}).select("_id name").lean(),
      Class.find({}).select("_id name").lean(),
      Subject.find({}).select("_id name").lean(),
      Topic.find({}).select("_id name").lean(),
    ]);

    const boardNameById = new Map(boards.map((x) => [String(x._id), x.name]));
    const classNameById = new Map(classes.map((x) => [String(x._id), x.name]));
    const subjectNameById = new Map(subjects.map((x) => [String(x._id), x.name]));
    const topicNameById = new Map(topics.map((x) => [String(x._id), x.name]));

    const toLabel = (rawValue, map) => {
      const raw = String(rawValue || "").trim();
      if (!raw) return "";
      return map.get(raw) || raw;
    };

    const keyOf = (idObj) => {
      const id = idObj || {};
      return [
        String(id.teacherId || ""),
        String(id.board || ""),
        String(id.className || ""),
        String(id.subject || ""),
        String(id.topic || ""),
        String(id.type || ""),
      ].join("__");
    };

    const combined = new Map();

    for (const r of uploadRows) {
      const key = keyOf(r._id);
      combined.set(key, {
        teacherId: String(r._id.teacherId || ""),
        board: String(r._id.board || ""),
        className: String(r._id.className || ""),
        subject: String(r._id.subject || ""),
        topic: String(r._id.topic || ""),
        type: String(r._id.type || ""),
        uploadedQuestions: Number(r.uploadedQuestions || 0),
        attemptsCount: 0,
        uniqueStudentsCount: 0,
        successfulAttemptsCount: 0,
        questionsAttemptedCount: 0,
        lastUploadedAt: r.lastUploadedAt || null,
      });
    }

    for (const r of attemptRows) {
      const key = keyOf(r._id);
      const existing = combined.get(key) || {
        teacherId: String(r._id.teacherId || ""),
        board: String(r._id.board || ""),
        className: String(r._id.className || ""),
        subject: String(r._id.subject || ""),
        topic: String(r._id.topic || ""),
        type: String(r._id.type || ""),
        uploadedQuestions: 0,
        attemptsCount: 0,
        uniqueStudentsCount: 0,
        successfulAttemptsCount: 0,
        questionsAttemptedCount: 0,
        lastUploadedAt: null,
      };
      existing.attemptsCount = Number(r.attemptsCount || 0);
      existing.uniqueStudentsCount = Number(r.uniqueStudentsCount || 0);
      existing.successfulAttemptsCount = Number(r.successfulAttemptsCount || 0);
      existing.questionsAttemptedCount = Number(r.questionsAttemptedCount || 0);
      combined.set(key, existing);
    }

    const setRows = Array.from(combined.values())
      .map((row) => {
        const teacher = teacherById.get(row.teacherId) || { name: "Unknown", email: "" };
        const successRate = row.attemptsCount
          ? Math.round((row.successfulAttemptsCount / row.attemptsCount) * 100)
          : 0;
        return {
          ...row,
          teacherName: teacher.name,
          teacherEmail: teacher.email,
          boardLabel: toLabel(row.board, boardNameById),
          classLabel: toLabel(row.className, classNameById),
          subjectLabel: toLabel(row.subject, subjectNameById),
          topicLabel: toLabel(row.topic, topicNameById),
          successRate,
        };
      })
      .sort((a, b) => {
        if (b.attemptsCount !== a.attemptsCount) return b.attemptsCount - a.attemptsCount;
        if (b.uploadedQuestions !== a.uploadedQuestions) return b.uploadedQuestions - a.uploadedQuestions;
        return String(a.teacherName || "").localeCompare(String(b.teacherName || ""));
      });

    const teacherAgg = new Map();
    for (const row of setRows) {
      const id = String(row.teacherId || "");
      if (!id) continue;
      if (!teacherAgg.has(id)) {
        teacherAgg.set(id, {
          teacherId: id,
          teacherName: row.teacherName,
          teacherEmail: row.teacherEmail,
          uploadedQuestions: 0,
          attemptsCount: 0,
          successfulAttemptsCount: 0,
          questionsAttemptedCount: 0,
          uniqueStudentsCount: 0,
        });
      }
      const agg = teacherAgg.get(id);
      agg.uploadedQuestions += Number(row.uploadedQuestions || 0);
      agg.attemptsCount += Number(row.attemptsCount || 0);
      agg.successfulAttemptsCount += Number(row.successfulAttemptsCount || 0);
      agg.questionsAttemptedCount += Number(row.questionsAttemptedCount || 0);
      agg.uniqueStudentsCount += Number(row.uniqueStudentsCount || 0);
    }

    const teacherSummaries = Array.from(teacherAgg.values())
      .map((row) => ({
        ...row,
        successRate: row.attemptsCount
          ? Math.round((row.successfulAttemptsCount / row.attemptsCount) * 100)
          : 0,
      }))
      .sort((a, b) => {
        if (b.attemptsCount !== a.attemptsCount) return b.attemptsCount - a.attemptsCount;
        if (b.uploadedQuestions !== a.uploadedQuestions) return b.uploadedQuestions - a.uploadedQuestions;
        return String(a.teacherName || "").localeCompare(String(b.teacherName || ""));
      });

    res.json({
      passPercent,
      scope: role === "teacher" ? "self" : "all-teachers",
      teacherSummaries,
      setRows,
    });
  } catch (e) {
    console.error("uploadPerformanceAnalytics error", e);
    res.status(500).json({ message: "Failed to load upload performance analytics" });
  }
};

// Public summary for tryouts page (optionally filtered by board/class)
export const getTryoutSummary = async (req, res) => {
  try {
    const { board, class: classValue } = req.query;
    const filter = {};

    if (board) {
      let boardValues = [board];
      try {
        const Board = (await import("../models/Board.js")).default;
        const boardDoc = await Board.findOne({ name: board }).select("_id name");
        if (boardDoc) {
          boardValues = [board, boardDoc.name, String(boardDoc._id)];
        }
      } catch {
        // Ignore lookup failures and continue with raw value.
      }
      filter.board = { $in: [...new Set(boardValues)] };
    }
    if (classValue) {
      let classValues = [classValue];
      try {
        const ClassModel = (await import("../models/Class.js")).default;
        const classDoc = await ClassModel.findOne({ name: classValue }).select("_id name");
        if (classDoc) {
          classValues = [classValue, classDoc.name, String(classDoc._id)];
        }
      } catch {
        // Ignore lookup failures and continue with raw value.
      }
      filter.class = { $in: [...new Set(classValues)] };
    }

    const rows = await Question.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            type: "$type",
            difficulty: "$difficulty",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.type": 1 } },
    ]);

    const byType = {};
    for (const row of rows) {
      const type = String(row?._id?.type || "").trim();
      if (!type) continue;

      if (!byType[type]) {
        byType[type] = { type, total: 0, easy: 0, moderate: 0, hard: 0 };
      }

      const d = String(row?._id?.difficulty || "easy").toLowerCase();
      const count = Number(row?.count || 0);
      byType[type].total += count;
      if (d === "hard") byType[type].hard += count;
      else if (d === "moderate") byType[type].moderate += count;
      else byType[type].easy += count;
    }

    const items = Object.values(byType).sort((a, b) => a.type.localeCompare(b.type));
    res.json({ items });
  } catch (err) {
    console.error("Failed to fetch tryout summary", err);
    res.status(500).json({ message: "Server error" });
  }
};
