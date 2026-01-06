import mongoose from "mongoose";

const AnswerSchema = new mongoose.Schema(
  {
    qid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    mcq: [{ type: String, trim: true }],
    trueFalse: { type: String, enum: ["true", "false"] },
    matrix: { type: Object, default: {} },
  },
  { _id: false }
);

const AttemptSchema = new mongoose.Schema(
  {
    /* ======================
       COMMON (MCQ + GAME)
       ====================== */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    attemptType: {
      type: String,
      enum: ["mcq", "game"],
      default: "mcq",
    },

    stage: {
      type: String,
      trim: true,
      default: "stage-1",
    },

    score: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    percent: { type: Number, default: 0 },

    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },

    /* ======================
       MCQ / EXAM FIELDS
       ====================== */
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: function () {
        return this.attemptType === "mcq";
      },
    },

    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: function () {
        return this.attemptType === "mcq";
      },
    },

    type: {
      type: String,
      enum: [
        "mcq-single",
        "mcq-multi",
        "true-false",
        "essay-plain",
        "choice-matrix",
        "cloze-drag",
        "cloze-select",
        "cloze-text",
        "match-list",
        "essay-rich",
      ],
      required: function () {
        return this.attemptType === "mcq";
      },
    },

    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],

    answers: [AnswerSchema],

    /* ======================
       GAME FIELDS
       ====================== */
    game: {
      type: {
        type: String,
        enum: ["mind-training"],
      },
      rounds: Number,
      maxScore: Number,
      details: [
        {
          round: Number,
          target: String,
          selected: String,
          correct: Boolean,
          timeTaken: Number,
        },
      ],
    },
  },
  { timestamps: true }
);

const Attempt = mongoose.model("Attempt", AttemptSchema);
export default Attempt;
