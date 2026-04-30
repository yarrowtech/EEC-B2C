import WebsiteSettings from "../models/WebsiteSettings.js";
import OfficePage from "../models/officePageModel.js";

const DEFAULT_BRANDING = {
  siteName: "Edify Eight",
  siteTagline: "Learn. Practice. Grow.",
  logoUrl: "",
  websiteUrl: process.env.CLIENT_ORIGIN || "",
  primaryColor: "#f59e0b",
  supportEmail: "",
  supportPhone: "",
  socialLinks: {
    facebook: "",
    instagram: "",
    linkedin: "",
    youtube: "",
  },
};

let cache = null;
let cacheExpiresAt = 0;

function normalizeBranding(doc = {}) {
  return {
    siteName: String(doc.siteName || DEFAULT_BRANDING.siteName).trim() || DEFAULT_BRANDING.siteName,
    siteTagline:
      String(doc.siteTagline || DEFAULT_BRANDING.siteTagline).trim() || DEFAULT_BRANDING.siteTagline,
    logoUrl: String(doc.logoUrl || DEFAULT_BRANDING.logoUrl).trim(),
    websiteUrl: String(doc.websiteUrl || DEFAULT_BRANDING.websiteUrl).trim() || DEFAULT_BRANDING.websiteUrl,
    primaryColor:
      String(doc.primaryColor || DEFAULT_BRANDING.primaryColor).trim() || DEFAULT_BRANDING.primaryColor,
    supportEmail: String(doc.supportEmail || DEFAULT_BRANDING.supportEmail).trim(),
    supportPhone: String(doc.supportPhone || DEFAULT_BRANDING.supportPhone).trim(),
    socialLinks: {
      facebook: String(doc.socialLinks?.facebook || DEFAULT_BRANDING.socialLinks.facebook).trim(),
      instagram: String(doc.socialLinks?.instagram || DEFAULT_BRANDING.socialLinks.instagram).trim(),
      linkedin: String(doc.socialLinks?.linkedin || DEFAULT_BRANDING.socialLinks.linkedin).trim(),
      youtube: String(doc.socialLinks?.youtube || DEFAULT_BRANDING.socialLinks.youtube).trim(),
    },
  };
}

export async function getWebsiteBranding() {
  const now = Date.now();
  if (cache && now < cacheExpiresAt) {
    return cache;
  }

  try {
    const [websiteDoc, officeDoc] = await Promise.all([
      WebsiteSettings.findOne().lean(),
      OfficePage.findOne().lean(),
    ]);

    const merged = {
      ...DEFAULT_BRANDING,
      ...(websiteDoc || {}),
      websiteUrl:
        String(websiteDoc?.websiteUrl || DEFAULT_BRANDING.websiteUrl || process.env.CLIENT_ORIGIN || "").trim(),
      socialLinks: officeDoc?.socialLinks || DEFAULT_BRANDING.socialLinks,
    };

    cache = normalizeBranding(merged);
    cacheExpiresAt = now + 5 * 60 * 1000;
    return cache;
  } catch (error) {
    console.error("Failed to load website branding:", error);
    cache = DEFAULT_BRANDING;
    cacheExpiresAt = now + 60 * 1000;
    return cache;
  }
}

export function clearWebsiteBrandingCache() {
  cache = null;
  cacheExpiresAt = 0;
}
