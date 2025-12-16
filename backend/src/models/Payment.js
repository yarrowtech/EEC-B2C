// models/Payment.js
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    material: { type: mongoose.Schema.Types.ObjectId, ref: "StudyMaterial" },
    orderId: String,
    paymentId: String,
    amount: Number,
    status: { type: String, enum: ["created", "paid", "failed"] },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
