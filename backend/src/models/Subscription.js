import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      required: true,
    },
    packageName: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
    },
    paymentMethod: {
      type: String,
      enum: ["razorpay", "wallet", "coins", "free"],
      required: true,
    },
    amountPaid: {
      type: Number,
      required: true,
      default: 0,
    },
    coinsUsed: {
      type: Number,
      default: 0,
    },
    transactionId: {
      type: String,
      default: "",
    },
    // Features unlocked with this subscription
    unlockedStages: {
      type: [Number],
      default: [],
    },
    studyMaterialsAccess: {
      type: String,
      enum: ["none", "limited", "full"],
      default: "none",
    },
  },
  { timestamps: true }
);

// Index for faster queries
subscriptionSchema.index({ user: 1, status: 1 });
subscriptionSchema.index({ endDate: 1 });

export default mongoose.model("Subscription", subscriptionSchema);
