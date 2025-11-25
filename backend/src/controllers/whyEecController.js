import WhyEEC from "../models/WhyEEC.js";

export const getWhyEec = async (req, res) => {
  try {
    let doc = await WhyEEC.findOne();

    if (!doc) {
      doc = await WhyEEC.create({
        title: "Why EEC?",
        description:
          "Electronic Educare (EEC) is your one-stop intelligent learning partner...",
        visible: true,
        features: [
          { id: 1, icon: "check", title: "Board-Aligned", subtitle: "CBSE, ICSE & State boards" },
          { id: 2, icon: "timer", title: "Efficient", subtitle: "Adaptive paths save time" },
          { id: 3, icon: "gamepad", title: "Engaging", subtitle: "Gamified learning" },
          { id: 4, icon: "shield", title: "Supportive", subtitle: "Parent view & progress reports" }
        ]
      });
    }

    res.json(doc);
  } catch (e) {
    res.status(500).json({ message: "Failed to load Why EEC section." });
  }
};

export const updateWhyEec = async (req, res) => {
  try {
    const updated = await WhyEEC.findOneAndUpdate({}, req.body, {
      new: true,
      upsert: true
    });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: "Failed to update Why EEC section." });
  }
};
