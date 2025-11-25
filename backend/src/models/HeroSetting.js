import mongoose from "mongoose";

const FieldSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  label: { type: String, required: true },
  type: { type: String, required: true },
  placeholder: { type: String, default: "" },
  required: { type: Boolean, default: false }
});

const HeroSettingsSchema = new mongoose.Schema({
  heading: { type: String, required: true },
  paragraph: { type: String, required: true },
  formVisible: { type: Boolean, default: true },
  formFields: { type: [FieldSchema], default: [] }
}, { timestamps: true });

const HeroSettings = mongoose.model("HeroSettings", HeroSettingsSchema);

export default HeroSettings;
