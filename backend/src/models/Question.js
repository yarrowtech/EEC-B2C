// src/models/Question.js
import mongoose from "mongoose";

/**
 * One flexible schema that can hold all types.
 * - type: "mcq-single" | "mcq-multi" | "choice-matrix" | "true-false"
 *         "cloze-drag" | "cloze-select" | "cloze-text"
 *         "match-list" | "essay-rich" | "essay-plain"
 *
 * Common meta: subject, topic, difficulty, tags, explanation, createdBy
 */

const OptionSchema = new mongoose.Schema(
  {
    key: { type: String, trim: true }, // e.g., "A", "B", "Bird", etc.
    text: { type: String, trim: true, required: true },
  },
  { _id: false }
);

const ChoiceMatrixSchema = new mongoose.Schema(
  {
    prompt: { type: String, trim: true, required: true },
    rows: [{ type: String, trim: true }], // ["Statement 1", ...]
    cols: [{ type: String, trim: true }], // ["True","False"]
    // correct cells: ["0-1","1-0"] -> `${rowIndex}-${colIndex}`
    correctCells: [{ type: String, trim: true }],
  },
  { _id: false }
);

const ClozeDragSchema = new mongoose.Schema(
  {
    text: { type: String, trim: true, required: true }, // e.g., "... [[blank1]] ..."
    tokens: [{ type: String, trim: true }], // draggable tokens
    // correct map: { blank1: "New Delhi", blank2: "Rupee" }
    correctMap: { type: Map, of: String, default: {} },
  },
  { _id: false }
);

const ClozeSelectSchema = new mongoose.Schema(
  {
    text: { type: String, trim: true, required: true },
    // blanks: { blank1: { options: ["50","70","100"], correct:"100" }, ... }
    blanks: {
      type: Map,
      of: new mongoose.Schema(
        {
          options: [{ type: String, trim: true }],
          correct: { type: String, trim: true },
        },
        { _id: false }
      ),
      default: {},
    },
  },
  { _id: false }
);

const ClozeTextSchema = new mongoose.Schema(
  {
    text: { type: String, trim: true, required: true },
    // answers: { blank1: "H2O" }
    answers: { type: Map, of: String, default: {} },
  },
  { _id: false }
);

const MatchListSchema = new mongoose.Schema(
  {
    prompt: { type: String, trim: true, required: true },
    left: [{ type: String, trim: true }], // e.g., ["Lion","Sparrow","Shark"]
    right: [{ type: String, trim: true }], // e.g., ["Mammal","Bird","Fish"]
    // pairs: {"0":"2","1":"0","2":"1"} (leftIndex -> rightIndex)
    pairs: { type: Map, of: String, default: {} },
  },
  { _id: false }
);

const QuestionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "mcq-single",
        "mcq-multi",
        "choice-matrix",
        "true-false",
        "cloze-drag",
        "cloze-select",
        "cloze-text",
        "match-list",
        "essay-rich",
        "essay-plain",
      ],
    },

    // Common meta
    subject: { type: String, trim: true, required: true },
    topic: { type: String, trim: true, required: true },
    difficulty: {
      type: String,
      enum: ["easy", "moderate", "hard"],
      default: "easy",
    },
    tags: [{ type: String, trim: true }],
    class: {
      type: String,
      required: true,
    },

    // Shared fields
    question: { type: String, trim: true }, // MCQ / TrueFalse / essays
    explanation: { type: String, trim: true },

    // MCQ
    options: { type: [OptionSchema], default: [] }, // for mcq-* (keys for single-correct can be "A"|"B" etc.)
    correct: [{ type: String, trim: true, default: [] }], // ["A"] or ["A","C"] or ["true"]

    // Choice matrix
    choiceMatrix: { type: ChoiceMatrixSchema },

    // Cloze
    clozeDrag: { type: ClozeDragSchema },
    clozeSelect: { type: ClozeSelectSchema },
    clozeText: { type: ClozeTextSchema },

    // Match list
    matchList: { type: MatchListSchema },

    // Essay
    prompt: { type: String, trim: true }, // essay prompt
    richHtml: { type: String, trim: true }, // essay-rich
    plainText: { type: String, trim: true }, // essay-plain
    stage: {
      type: Number,
      enum: [1, 2, 3],
      required: true,
      default: 1,
    },
    level: {
      type: String,
      enum: ["basic", "intermediate", "advanced"],
      default: "basic",
    },

    // Audit
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Question = mongoose.model("Question", QuestionSchema);
export default Question;
