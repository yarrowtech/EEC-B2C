// backend/src/models/careerPageModel.js
import mongoose from "mongoose";

const WhyJoinItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    icon: { type: String, default: "" },
  },
  { _id: false }
);

const JobOpeningSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    tag: { type: String, default: "Opening" },
    shortDescription: { type: String, default: "" },
    points: { type: [String], default: [] },
    experience: { type: String, default: "" },
    buttonLabel: { type: String, default: "Apply Now" },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    formUrl: { type: String, default: "" },
  },
  { _id: false }
);

const CareerPageSchema = new mongoose.Schema(
  {
    whyJoinTitle: { type: String, default: "Why Join EEC?" },
    whyJoinItems: { type: [WhyJoinItemSchema], default: [] },
    introText: { type: String, default: "" },
    jobSectionTitle: { type: String, default: "Current Job Openings" },
    jobOpenings: { type: [JobOpeningSchema], default: [] },
  },
  { timestamps: true }
);

const CareerPage = mongoose.model("CareerPage", CareerPageSchema);

export default CareerPage;
