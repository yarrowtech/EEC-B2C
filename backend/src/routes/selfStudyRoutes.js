// src/routes/selfStudyRoutes.js
import express from "express";
import multer from "multer";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
import { generateQuestionsFromText } from "../services/localAiService.js";
import SelfStudyResult from "../models/SelfStudyResult.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Configure multer for PDF upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

/**
 * POST /api/self-study/generate
 * Students upload PDF and generate questions for self-study
 */
router.post(
  "/generate",
  requireAuth,
  upload.single("pdf"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Please upload a PDF file" });
      }

      const {
        subject,
        topic,
        difficulty = "moderate",
        questionCount = "5",
        questionType = "mcq-single",
      } = req.body;

      // Validate required fields
      if (!subject || !topic) {
        return res.status(400).json({
          message: "Subject and topic are required",
        });
      }

      // Extract text from PDF
      const pdfBuffer = req.file.buffer;
      const pdfData = await pdfParse(pdfBuffer);
      const extractedText = pdfData.text;

      if (!extractedText || extractedText.trim().length < 100) {
        return res.status(400).json({
          message: "PDF does not contain enough text content",
        });
      }

      // Generate questions using Gemini AI
      const generatedQuestions = await generateQuestionsFromText(extractedText, {
        subject,
        topic,
        className: req.user.class || "General",
        board: req.user.board || "General",
        difficulty,
        questionCount: parseInt(questionCount) || 5,
        questionType,
      });

      // Return questions for student to answer
      res.json({
        message: `Successfully generated ${generatedQuestions.length} questions`,
        questions: generatedQuestions,
        pdfInfo: {
          name: req.file.originalname,
          pages: pdfData.numpages,
          textLength: extractedText.length,
        },
        metadata: {
          subject,
          topic,
          difficulty,
          questionType,
        },
      });
    } catch (error) {
      console.error("Error generating self-study questions:", error);
      res.status(500).json({
        message: "Failed to generate questions",
        error: error.message,
      });
    }
  }
);

/**
 * POST /api/self-study/submit
 * Submit self-study answers and get results
 */
router.post("/submit", requireAuth, async (req, res) => {
  try {
    const {
      subject,
      topic,
      difficulty,
      questionType,
      answers,
      pdfInfo,
      timeSpent,
    } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: "Invalid answers data" });
    }

    // Calculate score
    const totalQuestions = answers.length;
    const correctAnswers = answers.filter((a) => a.isCorrect).length;
    const score = ((correctAnswers / totalQuestions) * 100).toFixed(2);

    // Save result
    const result = await SelfStudyResult.create({
      user: req.user.id,
      subject,
      topic,
      difficulty,
      questionType,
      totalQuestions,
      correctAnswers,
      score: parseFloat(score),
      answers,
      pdfName: pdfInfo?.name || "Unknown",
      pdfPages: pdfInfo?.pages || 0,
      timeSpent: timeSpent || 0,
    });

    res.json({
      message: "Results saved successfully",
      result: {
        _id: result._id,
        score: result.score,
        correctAnswers: result.correctAnswers,
        totalQuestions: result.totalQuestions,
        subject: result.subject,
        topic: result.topic,
      },
    });
  } catch (error) {
    console.error("Error saving self-study result:", error);
    res.status(500).json({
      message: "Failed to save results",
      error: error.message,
    });
  }
});

/**
 * GET /api/self-study/results
 * Get all self-study results for current user
 */
router.get("/results", requireAuth, async (req, res) => {
  try {
    const results = await SelfStudyResult.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select("-answers") // Don't send full answers in list view
      .lean();

    res.json(results);
  } catch (error) {
    console.error("Error fetching self-study results:", error);
    res.status(500).json({
      message: "Failed to fetch results",
      error: error.message,
    });
  }
});

/**
 * GET /api/self-study/results/:id
 * Get detailed result with all answers
 */
router.get("/results/:id", requireAuth, async (req, res) => {
  try {
    const result = await SelfStudyResult.findOne({
      _id: req.params.id,
      user: req.user.id, // Ensure user can only see their own results
    }).lean();

    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    res.json(result);
  } catch (error) {
    console.error("Error fetching self-study result:", error);
    res.status(500).json({
      message: "Failed to fetch result",
      error: error.message,
    });
  }
});

/**
 * GET /api/self-study/stats
 * Get self-study statistics for current user
 */
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const results = await SelfStudyResult.find({ user: req.user.id }).lean();

    const stats = {
      totalSessions: results.length,
      averageScore: results.length > 0
        ? (results.reduce((sum, r) => sum + r.score, 0) / results.length).toFixed(2)
        : 0,
      totalQuestionsAttempted: results.reduce((sum, r) => sum + r.totalQuestions, 0),
      totalCorrectAnswers: results.reduce((sum, r) => sum + r.correctAnswers, 0),
      totalTimeSpent: results.reduce((sum, r) => sum + (r.timeSpent || 0), 0),
      bySubject: {},
      recentResults: results.slice(0, 5),
    };

    // Group by subject
    results.forEach((r) => {
      if (!stats.bySubject[r.subject]) {
        stats.bySubject[r.subject] = {
          count: 0,
          averageScore: 0,
          totalScore: 0,
        };
      }
      stats.bySubject[r.subject].count++;
      stats.bySubject[r.subject].totalScore += r.score;
      stats.bySubject[r.subject].averageScore = (
        stats.bySubject[r.subject].totalScore / stats.bySubject[r.subject].count
      ).toFixed(2);
    });

    res.json(stats);
  } catch (error) {
    console.error("Error fetching self-study stats:", error);
    res.status(500).json({
      message: "Failed to fetch stats",
      error: error.message,
    });
  }
});

export default router;
