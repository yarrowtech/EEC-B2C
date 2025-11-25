// backend/src/controllers/officePageController.js
import OfficePage from "../models/officePageModel.js";

export const getOfficePage = async (req, res) => {
  try {
    let doc = await OfficePage.findOne();
    if (!doc) {
      doc = await OfficePage.create({
        hero: {
          badge: "Our Office",
          title: "Visit EEC Office",
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
    } = req.body;

    const update = {
      ...(hero !== undefined && { hero }),
      ...(workspace !== undefined && { workspace }),
      ...(mapEmbedUrl !== undefined && { mapEmbedUrl }),
      ...(mapDirectionsUrl !== undefined && { mapDirectionsUrl }),
      ...(address !== undefined && { address }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email }),
    };

    const doc = await OfficePage.findOneAndUpdate({}, update, {
      new: true,
      upsert: true,
    });

    res.json(doc);
  } catch (err) {
    console.error("updateOfficePage error:", err);
    res.status(500).json({ message: "Failed to update office page" });
  }
};
