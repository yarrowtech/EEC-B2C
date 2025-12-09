import mongoose from "mongoose";

const AnswerSchema = new mongoose.Schema(
  {
    qid: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    // what student chose (per type)
    mcq: [{ type: String, trim: true }],        // e.g. ["A"] or ["A","C"]
    trueFalse: { type: String, enum: ["true", "false"] },
  },
  { _id: false }
);

const AttemptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    stage: { type: String, trim: true, default: "stage-1" },
    subject: { type: String, trim: true, required: true },
    topic: { type: String, trim: true, required: true },
    type: {
      type: String,
      required: true,
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
        // (extend later: "choice-matrix","cloze-*","match-list","essay-*")
      ],
    },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }], // asked
    answers: [AnswerSchema], // student answers
    score: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    percent: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
  },
  { timestamps: true }
);

const Attempt = mongoose.model("Attempt", AttemptSchema);
export default Attempt;
