// models/StudyMaterial.js
import mongoose from "mongoose";

const studyMaterialSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    class: { type: String, required: true },
    board: { type: String, required: true },
    subject: { type: String, required: true },

    pdfUrl: { type: String, required: true },     // Cloudinary secure_url
    pdfPublicId: { type: String, required: true },// for delete later

    isFree: { type: Boolean, default: false },
    price: { type: Number, default: 0 },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("StudyMaterial", studyMaterialSchema);
