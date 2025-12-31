import mongoose from "mongoose";

const RedemptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["cash", "giftcard"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    coinsUsed: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    giftCardCode: {
      type: String,
      default: "",
    },
    giftCardProvider: {
      type: String,
      default: "Amazon",
    },
    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Redemption", RedemptionSchema);
