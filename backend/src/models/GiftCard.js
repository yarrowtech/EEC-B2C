import mongoose from "mongoose";

const GiftCardSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    provider: {
      type: String,
      required: true,
      default: "Amazon",
    },
    amount: {
      type: Number,
      required: true,
      enum: [100, 250, 500, 1000],
    },
    status: {
      type: String,
      enum: ["available", "redeemed", "expired"],
      default: "available",
    },
    redeemedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    redeemedAt: {
      type: Date,
      default: null,
    },
    redemptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Redemption",
      default: null,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Index for faster queries
GiftCardSchema.index({ status: 1, amount: 1 });

export default mongoose.model("GiftCard", GiftCardSchema);
