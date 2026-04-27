import mongoose from "mongoose";

const flashcardSchema = new mongoose.Schema(
  {
    front: { type: String, required: true, trim: true },
    back: { type: String, required: true, trim: true },
  },
  { _id: true }
);

const flashcardSetSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    board: { type: String, required: true, trim: true },
    class: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true },
    stage: { type: Number, default: 1, min: 1 },
    isActive: { type: Boolean, default: true },
    cards: {
      type: [flashcardSchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "At least one flashcard is required",
      },
    },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    attemptsCount: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

flashcardSetSchema.index({ board: 1, class: 1, subject: 1, topic: 1, stage: 1, isActive: 1 });
flashcardSetSchema.index({ title: "text", description: "text" });

export default mongoose.model("FlashcardSet", flashcardSetSchema);

