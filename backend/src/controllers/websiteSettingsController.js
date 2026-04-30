import WebsiteSettings from "../models/WebsiteSettings.js";

const DEFAULT_SETTINGS = {
  siteName: "Edify Eight",
  siteTagline: "Learn. Practice. Grow.",
  metaTitle: "Edify Eight",
  metaDescription: "Edify Eight learning platform for students, teachers, and institutions.",
  faviconUrl: "",
  logoUrl: "",
  websiteUrl: "",
  supportEmail: "",
  supportPhone: "",
  primaryColor: "#f59e0b",
};

function normalizeSettings(input = {}) {
  return {
    siteName: String(input.siteName || DEFAULT_SETTINGS.siteName).trim(),
    siteTagline: String(input.siteTagline || DEFAULT_SETTINGS.siteTagline).trim(),
    metaTitle: String(input.metaTitle || DEFAULT_SETTINGS.metaTitle).trim(),
    metaDescription: String(input.metaDescription || DEFAULT_SETTINGS.metaDescription).trim(),
    faviconUrl: String(input.faviconUrl || "").trim(),
    logoUrl: String(input.logoUrl || "").trim(),
    websiteUrl: String(input.websiteUrl || "").trim(),
    supportEmail: String(input.supportEmail || "").trim(),
    supportPhone: String(input.supportPhone || "").trim(),
    primaryColor: String(input.primaryColor || DEFAULT_SETTINGS.primaryColor).trim() || DEFAULT_SETTINGS.primaryColor,
  };
}

export async function getWebsiteSettings(_req, res) {
  try {
    let doc = await WebsiteSettings.findOne();
    if (!doc) {
      doc = await WebsiteSettings.create(DEFAULT_SETTINGS);
    }

    res.json(doc);
  } catch (err) {
    console.error("getWebsiteSettings error:", err);
    res.status(500).json({ message: "Failed to load website settings" });
  }
}

export async function updateWebsiteSettings(req, res) {
  try {
    const payload = normalizeSettings(req.body || {});
    const doc = await WebsiteSettings.findOneAndUpdate({}, payload, {
      new: true,
      upsert: true,
    });

    res.json(doc);
  } catch (err) {
    console.error("updateWebsiteSettings error:", err);
    res.status(500).json({ message: "Failed to update website settings" });
  }
}
