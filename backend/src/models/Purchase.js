import mongoose from "mongoose";

const PurchaseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudyMaterial",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["Razorpay", "Wallet"],
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["completed", "failed", "pending"],
      default: "completed",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Purchase", PurchaseSchema);
