import mongoose from "mongoose";

// Grants one writer exclusive access to a board (and optionally a
// narrower class / subject / single chapter within it) at an agreed
// per-chapter rate. Leaving class/subject/topic unset grants the writer
// that whole scope; setting topic narrows the grant to one existing
// chapter only. Within their assigned scope, the writer creates (or, for
// a chapter-level grant, writes) the topics ("chapters") themselves —
// each chapter is payable per Topic (see budgetAmount/paymentStatus on
// Topic). See utils/chapterAssignment.js for how scope access is
// resolved.
const chapterAssignmentSchema = new mongoose.Schema(
  {
    writer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    board: { type: mongoose.Schema.Types.ObjectId, ref: "Board", required: true, index: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", default: null, index: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", default: null, index: true },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: "Topic", default: null, index: true },
    structure: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentStructure", default: null },
    amount: { type: Number, required: true, min: 0 },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model("ChapterAssignment", chapterAssignmentSchema);
