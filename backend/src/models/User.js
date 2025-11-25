// src/models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    class: { type: String, trim: true },
    state: { type: String, trim: true },
    referral: { type: String, trim: true },
    role: { type: String, enum: ["admin", "teacher", "student"], default: "student" }, // ✅ NEW
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });
export default mongoose.model("User", userSchema);
