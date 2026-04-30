// backend/src/controllers/officePageController.js
import OfficePage from "../models/officePageModel.js";
import { clearWebsiteBrandingCache } from "../utils/websiteBranding.js";

export const getOfficePage = async (req, res) => {
  try {
    let doc = await OfficePage.findOne();
    if (!doc) {
      doc = await OfficePage.create({
        hero: {
          badge: "Our Office",
          title: "Visit Edify Eight Office",
          subtitle: "We are open Monday to Friday",
          image: "",
        },
        workspace: {
          title: "Our Workspace",
          paragraph: "",
          image: "",
          chips: ["Focus Rooms", "Wellness Corner", "Open Desks"],
        },
        mapEmbedUrl: "",
        mapDirectionsUrl: "",
        address: "",
        phone: "",
        email: "",
        contacts: [
          { id: "address", title: "Office Address", value: "", type: "address" },
          { id: "phone", title: "Contact Number", value: "", type: "phone" },
          { id: "email", title: "Email", value: "", type: "email" },
        ],
        socialLinks: {
          facebook: "",
          instagram: "",
          linkedin: "",
          youtube: "",
        },
      });
    }
    res.json(doc);
  } catch (err) {
    console.error("getOfficePage error:", err);
    res.status(500).json({ message: "Failed to load office page" });
  }
};

export const updateOfficePage = async (req, res) => {
  try {
    const {
      hero,
      workspace,
      mapEmbedUrl,
      mapDirectionsUrl,
      address,
      phone,
      email,
      contacts,
      socialLinks,
    } = req.body;

    const update = {
      ...(hero !== undefined && { hero }),
      ...(workspace !== undefined && { workspace }),
      ...(mapEmbedUrl !== undefined && { mapEmbedUrl }),
      ...(mapDirectionsUrl !== undefined && { mapDirectionsUrl }),
      ...(address !== undefined && { address }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email }),
      ...(contacts !== undefined && { contacts }),
      ...(socialLinks !== undefined && { socialLinks }),
    };

    const doc = await OfficePage.findOneAndUpdate({}, update, {
      new: true,
      upsert: true,
    });

    clearWebsiteBrandingCache();

    res.json(doc);
  } catch (err) {
    console.error("updateOfficePage error:", err);
    res.status(500).json({ message: "Failed to update office page" });
  }
};
