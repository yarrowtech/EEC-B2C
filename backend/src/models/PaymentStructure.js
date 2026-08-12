import mongoose from "mongoose";

// A reusable rate card admin defines for paying 3rd-party content writers.
// Scope fields are optional and layered: set only board for a board-wide
// rate, board+class for a class-wide rate, or board+class+subject for a
// subject-wide rate. The rate itself is always expressed per chapter.
const paymentStructureSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    board: { type: mongoose.Schema.Types.ObjectId, ref: "Board", default: null },
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", default: null },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", default: null },
    amountPerChapter: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model("PaymentStructure", paymentStructureSchema);
