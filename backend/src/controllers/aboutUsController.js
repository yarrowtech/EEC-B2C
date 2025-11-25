import AboutUsPage from "../models/AboutUsPage.js";

export const getAboutUs = async (req, res) => {
  try {
    let page = await AboutUsPage.findOne();

    if (!page) {
      page = await AboutUsPage.create({
        sections: [
          {
            id: 1,
            type: "hero",
            title: "Our Aim: To Provide the Best Solutions",
            subtitle: "High-quality education — all through a digital media platform.",
            image: "/about-hero.jpg"
          },
          {
            id: 2,
            type: "vision",
            title: "Vision Goals",
            description:
              "Our vision is to reach out to every student across different states...",
            bullets: [
              "Personalized progression & holistic growth",
              "Teacher enablement & workload relief",
              "Parent visibility & engagement"
            ],
            image: "/goal1.jpg"
          },
          {
            id: 3,
            type: "brand",
            title: "Brand Identity",
            description:
              "EEC is a digital learning platform designed to deliver high-quality education...",
            chips: [
              "Consistent Visual System",
              "Trust & Accessibility",
              "Mobile-first"
            ],
            image: "/brandvalue.jpg"
          },
          {
            id: 4,
            type: "values",
            title: "Values",
            description:
              "EEC doesn’t just upgrade academic performance — it builds stronger bonds...",
            chips: ["Outcome-oriented", "Inclusive by design", "Privacy-minded", "Low-friction UX"],
            image: "/login1.jpg"
          },
          {
            id: 5,
            type: "mission",
            title: "Mission of EEC",
            description:
              "Our mission is to ensure every learner receives the best assistance possible...",
            image: "/image-1.jpg"
          }
        ]
      });
    }

    res.json(page);
  } catch (err) {
    res.status(500).json({ message: "Failed to load About Us page." });
  }
};

export const updateAboutUs = async (req, res) => {
  try {
    const updated = await AboutUsPage.findOneAndUpdate(
      {},
      { sections: req.body.sections },
      { new: true, upsert: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update About Us page." });
  }
};
