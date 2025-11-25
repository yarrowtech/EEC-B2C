import FeaturesSection from "../models/Features.js";

export const getFeatures = async (req, res) => {
  try {
    let doc = await FeaturesSection.findOne();

    if (!doc) {
      doc = await FeaturesSection.create({
        title: "What EEC Offers (Features & Modules)",
        subtitle: "Everything learners and parents need — thoughtfully organized...",
        visible: true,
        features: [
          { id: 1, icon: "book", title: "Structured Learning Modules", description: "Each class has..." },
          { id: 2, icon: "pen", title: "Smart Worksheets & Practice Sets", description: "AI-generated practice..." },
          { id: 3, icon: "headphones", title: "Instant AI-Powered Explanations", description: "Stuck on a question..." },
          { id: 4, icon: "graduation", title: "Progressive Learning (Class 1–12)", description: "Seamless academic..." },
          { id: 5, icon: "target", title: "Skill-Based Challenges", description: "Three levels..." },
          { id: 6, icon: "trophy", title: "Weekly Leaderboards & Motivation", description: "Fun rankings..." },
          { id: 7, icon: "brain", title: "Academic Brain Zones", description: "Reasoning, memory..." },
          { id: 8, icon: "speaker", title: "Audio-Based Clarification", description: "Human-style AI..." },
          { id: 9, icon: "dashboard", title: "Parent Dashboard", description: "Clear, real-time view..." }
        ]
      });
    }

    res.json(doc);
  } catch (e) {
    res.status(500).json({ message: "Failed to load features section." });
  }
};

export const updateFeatures = async (req, res) => {
  try {
    const updated = await FeaturesSection.findOneAndUpdate({}, req.body, {
      new: true,
      upsert: true
    });

    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: "Failed to update features section." });
  }
};
