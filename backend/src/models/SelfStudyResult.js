// src/models/SelfStudyResult.js
import mongoose from "mongoose";

const SelfStudyResultSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
    },
    topic: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "moderate", "hard"],
      required: true,
    },
    questionType: {
      type: String,
      enum: ["mcq-single", "mcq-multi", "true-false"],
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    correctAnswers: {
      type: Number,
      required: true,
      default: 0,
    },
    score: {
      type: Number,
      required: true,
      default: 0,
    },
    // Store individual question results
    answers: [
      {
        question: { type: String, required: true },
        userAnswer: [{ type: String }],
        correctAnswer: [{ type: String }],
        isCorrect: { type: Boolean, required: true },
        explanation: { type: String },
      },
    ],
    // Store PDF info
    pdfName: {
      type: String,
    },
    pdfPages: {
      type: Number,
    },
    // Time tracking
    timeSpent: {
      type: Number, // in seconds
      default: 0,
    },
  },
  { timestamps: true }
);

// Index for faster queries
SelfStudyResultSchema.index({ user: 1, createdAt: -1 });
SelfStudyResultSchema.index({ user: 1, subject: 1, topic: 1 });

const SelfStudyResult = mongoose.model("SelfStudyResult", SelfStudyResultSchema);
export default SelfStudyResult;
