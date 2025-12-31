import Attempt from "../models/Attempt.js";
import User from "../models/User.js";

export const saveMindTrainingResult = async (req, res) => {
  try {
    console.log("REQ.USER =>", req.user); // DEBUG

    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { score, rounds, details } = req.body;

    const attempt = await Attempt.create({
      userId,
      attemptType: "game",
      score,
      total: 100,
      percent: Math.round((score / 100) * 100),
      submittedAt: new Date(),
      game: {
        type: "mind-training",
        rounds,
        maxScore: 100,
        details,
      },
    });

    await User.findByIdAndUpdate(userId, {
      $inc: { points: score },
    });

    res.status(201).json({ success: true, attemptId: attempt._id });
  } catch (error) {
    console.error("❌ Game attempt save failed:", error);
    res.status(500).json({ message: "Failed to save game result" });
  }
};

