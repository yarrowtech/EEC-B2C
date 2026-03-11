import mongoose from "mongoose";

const CareerApplicationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: "", trim: true },
    jobPosition: { type: String, required: true, trim: true },
    message: { type: String, default: "", trim: true },
    cvUrl: { type: String, required: true },
    cvPublicId: { type: String, default: "" },
    status: {
      type: String,
      enum: ["new", "reviewed", "shortlisted", "rejected", "hired"],
      default: "new",
    },
  },
  { timestamps: true }
);

const CareerApplication = mongoose.model("CareerApplication", CareerApplicationSchema);

export default CareerApplication;
