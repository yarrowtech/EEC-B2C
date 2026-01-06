import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    board: { type: mongoose.Schema.Types.ObjectId, ref: "Board", required: true, index: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Compound index for board + class + name to ensure uniqueness per board/class combination
subjectSchema.index({ board: 1, class: 1, name: 1 }, { unique: true });

export default mongoose.model("Subject", subjectSchema);
