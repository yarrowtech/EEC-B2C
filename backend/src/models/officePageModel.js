// backend/src/models/officePageModel.js
import mongoose from "mongoose";

const OfficePageSchema = new mongoose.Schema(
  {
    hero: {
      badge: { type: String, default: "Our Office" },
      title: { type: String, default: "Visit EEC Office" },
      subtitle: { type: String, default: "We are open Monday to Friday" },
      image: { type: String, default: "" }, // Cloudinary URL
    },
    workspace: {
      title: { type: String, default: "Our Workspace" },
      paragraph: { type: String, default: "" },
      image: { type: String, default: "" }, // Cloudinary URL
      chips: { type: [String], default: [] },
    },
    mapEmbedUrl: { type: String, default: "" }, // Google Maps embed iframe URL
    mapDirectionsUrl: { type: String, default: "" }, // Google Maps directions link
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
  },
  { timestamps: true }
);

const OfficePage = mongoose.model("OfficePage", OfficePageSchema);
export default OfficePage;
