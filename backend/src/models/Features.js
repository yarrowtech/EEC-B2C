import mongoose from "mongoose";

const FeatureSchema = new mongoose.Schema({
  id: Number,
  icon: String,
  title: String,
  description: String
});

const FeaturesSectionSchema = new mongoose.Schema({
  title: String,
  subtitle: String,
  visible: { type: Boolean, default: true },
  features: [FeatureSchema]
}, { timestamps: true });

const FeaturesSection = mongoose.model("FeaturesSection", FeaturesSectionSchema);
export default FeaturesSection;
