import HeroSettings from "../models/HeroSetting.js";

export const getHeroSettings = async (req, res) => {
  try {
    let settings = await HeroSettings.findOne();

    if (!settings) {
      settings = await HeroSettings.create({
        heading: "Personalized learning that adapts to you",
        paragraph:
          "AI-guided study paths, concept videos, and gamified progress — crafted to boost focus, reduce stress, and improve outcomes.",
        formVisible: true,
        formFields: [
          {
            id: Date.now(),
            label: "Enter your name",
            type: "text",
            placeholder: "Enter your name",
            required: true,
          },
        ],
      });
    }

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: "Failed to load hero settings" });
  }
};

export const updateHeroSettings = async (req, res) => {
  try {
    const updated = await HeroSettings.findOneAndUpdate(
      {},
      req.body,
      { new: true, upsert: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to update hero settings" });
  }
};
