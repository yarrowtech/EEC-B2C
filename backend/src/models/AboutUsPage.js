import mongoose from "mongoose";

const SectionSchema = new mongoose.Schema({
  id: Number,
  type: String, // "hero", "vision", "brand", "values", "mission", "custom"
  title: String,
  subtitle: String,
  description: String,
  bullets: [String],
  chips: [String],
  image: String,
}, { timestamps: true });

const AboutUsPageSchema = new mongoose.Schema({
  sections: [SectionSchema]
}, { timestamps: true });

const AboutUsPage = mongoose.model("AboutUsPage", AboutUsPageSchema);
export default AboutUsPage;
