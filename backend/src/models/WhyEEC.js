import mongoose from "mongoose";

const FeatureSchema = new mongoose.Schema({
  id: Number,
  icon: String,
  title: String,
  subtitle: String
});

const WhyEECSchema = new mongoose.Schema({
  title: String,
  description: String,
  visible: { type: Boolean, default: true },
  features: [FeatureSchema]
}, { timestamps: true });

const WhyEEC = mongoose.model("WhyEEC", WhyEECSchema);
export default WhyEEC;
