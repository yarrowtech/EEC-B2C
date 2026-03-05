import mongoose from "mongoose";

const packageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      enum: ["Basic", "Intermediate", "Premium"],
    },
    displayName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    duration: {
      type: Number, // Duration in days (30, 90, 365, etc.)
      required: true,
      default: 30,
    },
    features: {
      type: [String],
      default: [],
    },
    // Stage access
    unlockedStages: {
      type: [Number],
      default: [1], // Stage 1 is always included
    },
    // Study materials access
    studyMaterialsAccess: {
      type: String,
      enum: ["none", "limited", "full"],
      default: "none",
    },
    // Priority support
    prioritySupport: {
      type: Boolean,
      default: false,
    },
    // Active status
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Package", packageSchema);
