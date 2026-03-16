import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },

    // who should receive it
    role: {
      type: String,
      enum: ["student", "teacher", "admin", "all"],
      default: "student",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Optional audience filters (used for targeted student notifications)
    audience: {
      board: { type: String, default: "" },
      class: { type: String, default: "" },
      subject: { type: String, default: "" },
    },
    source: {
      type: String,
      enum: ["manual", "study-material"],
      default: "manual",
    },
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudyMaterial",
      default: null,
    },

    // read tracking per user
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
