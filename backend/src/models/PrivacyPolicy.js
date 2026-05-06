import mongoose from "mongoose";

const ContentItemSchema = new mongoose.Schema(
  { heading: { type: String, default: "" }, text: { type: String, default: "" } },
  { _id: false }
);

const SectionSchema = new mongoose.Schema(
  {
    id:      { type: String, required: true },
    title:   { type: String, default: "" },
    color:   { type: String, default: "#F4736E" },
    content: { type: [ContentItemSchema], default: [] },
  },
  { _id: false }
);

const PrivacyPolicySchema = new mongoose.Schema(
  {
    useDefault:  { type: Boolean, default: true },
    lastUpdated: { type: String, default: "" },
    introText:   { type: String, default: "" },
    sections:    { type: [SectionSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("PrivacyPolicy", PrivacyPolicySchema);
