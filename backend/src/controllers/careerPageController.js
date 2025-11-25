// backend/src/controllers/careerPageController.js
import CareerPage from "../models/careerPageModel.js";

export const getCareerPageSettings = async (req, res) => {
  try {
    let doc = await CareerPage.findOne();

    // if nothing exists yet, create a default doc
    if (!doc) {
      doc = await CareerPage.create({
        whyJoinTitle: "Why Join EEC?",
        whyJoinItems: [
          {
            title: "Growth-focused environment",
            description: "Work with a team that values innovation and impact.",
            icon: "growth",
          },
          {
            title: "Student-first culture",
            description: "Everything we build is for better learning outcomes.",
            icon: "student",
          },
          {
            title: "Collaborative teams",
            description: "Cross-functional teams that learn and grow together.",
            icon: "team",
          },
        ],
        introText:
          "Welcome to EEC, where innovation meets education! We’re always looking for passionate educators, technologists, and creators who want to shape the future of learning.",
        jobSectionTitle: "Current Job Openings",
        jobOpenings: [],
      });
    }

    res.json(doc);
  } catch (err) {
    console.error("getCareerPageSettings error:", err);
    res.status(500).json({ message: "Failed to load career page settings" });
  }
};

export const updateCareerPageSettings = async (req, res) => {
  try {
    const {
      whyJoinTitle,
      whyJoinItems,
      introText,
      jobSectionTitle,
      jobOpenings,
    } = req.body;

    const update = {
      ...(whyJoinTitle !== undefined && { whyJoinTitle }),
      ...(whyJoinItems !== undefined && { whyJoinItems }),
      ...(introText !== undefined && { introText }),
      ...(jobSectionTitle !== undefined && { jobSectionTitle }),
      ...(jobOpenings !== undefined && { jobOpenings }),
    };

    const doc = await CareerPage.findOneAndUpdate({}, update, {
      new: true,
      upsert: true,
    });

    res.json(doc);
  } catch (err) {
    console.error("updateCareerPageSettings error:", err);
    res.status(500).json({ message: "Failed to update career page settings" });
  }
};
