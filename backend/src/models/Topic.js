import mongoose from "mongoose";

const topicSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true, index: true },
    board: { type: mongoose.Schema.Types.ObjectId, ref: "Board", required: true, index: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Compound index for board + class + subject + name to ensure uniqueness
topicSchema.index({ board: 1, class: 1, subject: 1, name: 1 }, { unique: true });

export default mongoose.model("Topic", topicSchema);
