import mongoose from "mongoose";

const WebsiteSettingsSchema = new mongoose.Schema(
  {
    siteName: { type: String, default: "Edify Eight" },
    siteTagline: { type: String, default: "Learn. Practice. Grow." },
    metaTitle: { type: String, default: "Edify Eight" },
    metaDescription: {
      type: String,
      default: "Edify Eight learning platform for students, teachers, and institutions.",
    },
    faviconUrl: { type: String, default: "" },
    logoUrl: { type: String, default: "" },
    websiteUrl: { type: String, default: "" },
    supportEmail: { type: String, default: "" },
    supportPhone: { type: String, default: "" },
    primaryColor: { type: String, default: "#f59e0b" },
  },
  { timestamps: true }
);

const WebsiteSettings = mongoose.model("WebsiteSettings", WebsiteSettingsSchema);

export default WebsiteSettings;
