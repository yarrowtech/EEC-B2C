import mongoose from "mongoose";

const DailyChallengeAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    dateKey: {
      type: String,
      required: true,
      index: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    questionType: {
      type: String,
      enum: ["mcq-single", "mcq-multi"],
      required: true,
    },
    board: { type: String, default: "" },
    className: { type: String, default: "" },
    subject: { type: String, default: "" },
    topic: { type: String, default: "" },
    userAnswer: [{ type: String, trim: true }],
    correctAnswer: [{ type: String, trim: true }],
    isCorrect: { type: Boolean, default: false },
    pointsAwarded: { type: Number, default: 0 },
    streakAfter: { type: Number, default: 0 },
    badgeAfter: { type: String, default: "none" },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

DailyChallengeAttemptSchema.index({ userId: 1, dateKey: 1 }, { unique: true });

export default mongoose.model("DailyChallengeAttempt", DailyChallengeAttemptSchema);
