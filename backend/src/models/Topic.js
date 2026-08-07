import mongoose from "mongoose";

const topicSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true, index: true },
    board: { type: mongoose.Schema.Types.ObjectId, ref: "Board", required: true, index: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true, index: true },
    topicImage: { type: String, default: "" },
    shortDescription: { type: String, default: "" },
    topicSummary: { type: String, default: "" },
    learningOutcome: { type: String, default: "" },
    contentUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "approved" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: "" },
    draftTopicSummary: { type: String, default: "" },
    draftLearningOutcome: { type: String, default: "" },
    draftUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    contentStatus: { type: String, enum: ["approved", "pending", "rejected"], default: "approved" },
    contentReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    contentReviewedAt: { type: Date, default: null },
    contentRejectionReason: { type: String, default: "" },
    submissionId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
  },
  { timestamps: true }
);

// Compound index for board + class + subject + name to ensure uniqueness
topicSchema.index({ board: 1, class: 1, subject: 1, name: 1 }, { unique: true });

export default mongoose.model("Topic", topicSchema);
