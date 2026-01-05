// src/routes/aiQuestionRoutes.js
import express from "express";
import multer from "multer";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
import { generateQuestionsFromText } from "../services/localAiService.js";
import Question from "../models/Question.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Configure multer for PDF upload (memory storage)
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
 * POST /api/ai-questions/generate-from-pdf
 * Upload PDF and generate questions using AI
 */
router.post(
  "/generate-from-pdf",
  requireAuth,
  upload.single("pdf"),
  async (req, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Only admins can generate questions" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Please upload a PDF file" });
      }

      const {
        subject,
        topic,
        className,
        board,
        difficulty = "moderate",
        questionCount = 10,
        questionType = "mcq-single",
        autoSave = false, // if true, automatically save to database
      } = req.body;

      // Validate required fields
      if (!subject || !topic || !className || !board) {
        return res.status(400).json({
          message: "Subject, topic, class, and board are required",
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
        className,
        board,
        difficulty,
        questionCount: parseInt(questionCount) || 10,
        questionType,
      });

      // Format questions for database
      const formattedQuestions = generatedQuestions.map((q) => ({
        type: questionType,
        subject,
        topic,
        className,
        board,
        difficulty,
        question: q.question,
        options: q.options || [],
        correct: q.correct || [],
        explanation: q.explanation || "",
        createdBy: req.user.id,
        stage: 1,
        level: difficulty === "easy" ? "basic" : difficulty === "hard" ? "advanced" : "intermediate",
      }));

      // Auto-save if requested
      if (autoSave === "true" || autoSave === true) {
        const savedQuestions = await Question.insertMany(formattedQuestions);
        return res.json({
          message: `Successfully generated and saved ${savedQuestions.length} questions`,
          questions: savedQuestions,
          saved: true,
        });
      }

      // Return for review
      res.json({
        message: `Successfully generated ${formattedQuestions.length} questions`,
        questions: formattedQuestions,
        saved: false,
        pdfInfo: {
          pages: pdfData.numpages,
          textLength: extractedText.length,
        },
      });
    } catch (error) {
      console.error("Error generating questions from PDF:", error);
      res.status(500).json({
        message: "Failed to generate questions",
        error: error.message,
      });
    }
  }
);

/**
 * POST /api/ai-questions/save-generated
 * Save AI-generated questions (after review)
 */
router.post("/save-generated", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can save questions" });
    }

    const { questions } = req.body;

    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({ message: "Invalid questions data" });
    }

    // Add createdBy to all questions
    const questionsWithCreator = questions.map((q) => ({
      ...q,
      createdBy: req.user._id,
    }));

    const savedQuestions = await Question.insertMany(questionsWithCreator);

    res.json({
      message: `Successfully saved ${savedQuestions.length} questions`,
      questions: savedQuestions,
    });
  } catch (error) {
    console.error("Error saving generated questions:", error);
    res.status(500).json({
      message: "Failed to save questions",
      error: error.message,
    });
  }
});

/**
 * POST /api/ai-questions/test-connection
 * Test Local AI Service connection
 */
router.post("/test-connection", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const testText = "The capital of India is New Delhi. India uses the Indian Rupee as its currency.";

    const questions = await generateQuestionsFromText(testText, {
      subject: "General Knowledge",
      topic: "India",
      className: "5",
      board: "CBSE",
      difficulty: "easy",
      questionCount: 2,
      questionType: "mcq-single",
    });

    res.json({
      message: "Local AI service connection successful",
      testQuestions: questions,
    });
  } catch (error) {
    console.error("Local AI service test failed:", error);
    res.status(500).json({
      message: "Local AI service connection failed",
      error: error.message,
    });
  }
});

export default router;
