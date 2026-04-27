import mongoose from "mongoose";

const flashcardAttemptSchema = new mongoose.Schema(
  {
    flashcardSet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FlashcardSet",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    totalCards: { type: Number, required: true, min: 1 },
    knownCount: { type: Number, required: true, min: 0 },
    unknownCount: { type: Number, required: true, min: 0 },
    percent: { type: Number, required: true, min: 0, max: 100 },
    durationSec: { type: Number, default: 0, min: 0 },
    knownCardIds: [{ type: mongoose.Schema.Types.ObjectId }],
    unknownCardIds: [{ type: mongoose.Schema.Types.ObjectId }],
  },
  { timestamps: true }
);

flashcardAttemptSchema.index({ flashcardSet: 1, user: 1, createdAt: -1 });

export default mongoose.model("FlashcardAttempt", flashcardAttemptSchema);

