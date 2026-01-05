// src/services/geminiService.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate questions from text using Google Gemini
 * @param {string} text - Extracted text from PDF
 * @param {object} options - Question generation options
 * @returns {Promise<Array>} - Array of generated questions
 */
export async function generateQuestionsFromText(text, options = {}) {
  try {
    const {
      subject = "General",
      topic = "General",
      className = "10",
      board = "CBSE",
      difficulty = "moderate",
      questionCount = 10,
      questionType = "mcq-single", // mcq-single, mcq-multi, true-false
    } = options;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `You are an expert educator creating ${questionType} questions for students.

Based on the following study material, generate exactly ${questionCount} ${questionType} questions.

Study Material:
${text.substring(0, 15000)}

Requirements:
- Subject: ${subject}
- Topic: ${topic}
- Class: ${className}
- Board: ${board}
- Difficulty: ${difficulty}
- Question Type: ${questionType}

For MCQ Single Choice questions, provide:
- A clear question
- 4 options (A, B, C, D)
- One correct answer
- A brief explanation

For MCQ Multiple Choice questions, provide:
- A clear question
- 4-5 options (A, B, C, D, E)
- Multiple correct answers
- A brief explanation

For True/False questions, provide:
- A clear statement
- Correct answer (true or false)
- A brief explanation

Return the questions in valid JSON format ONLY (no markdown, no extra text):
{
  "questions": [
    {
      "question": "question text here",
      "options": [
        {"key": "A", "text": "option A text"},
        {"key": "B", "text": "option B text"},
        {"key": "C", "text": "option C text"},
        {"key": "D", "text": "option D text"}
      ],
      "correct": ["A"],
      "explanation": "explanation here"
    }
  ]
}

For true-false type, use:
{
  "questions": [
    {
      "question": "statement here",
      "correct": ["true"],
      "explanation": "explanation here"
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();

    // Extract JSON from response (handle if wrapped in markdown code blocks)
    let jsonText = textResponse.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```\n?/g, "");
    }

    const parsed = JSON.parse(jsonText);

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error("Invalid response format from AI");
    }

    return parsed.questions;
  } catch (error) {
    console.error("Error generating questions with Gemini:", error);
    throw new Error(`Failed to generate questions: ${error.message}`);
  }
}

/**
 * Analyze student performance and generate personalized feedback
 * @param {Array} results - Student's exam results
 * @param {string} studyMaterialText - Original study material
 * @returns {Promise<string>} - Personalized feedback
 */
export async function generateStudentFeedback(results, studyMaterialText = "") {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Analyze performance
    const totalQuestions = results.length;
    const correctAnswers = results.filter(r => r.isCorrect).length;
    const incorrectQuestions = results.filter(r => !r.isCorrect).map(r => r.question);

    const prompt = `As an educational expert, provide personalized feedback for a student based on their exam performance.

Performance Summary:
- Total Questions: ${totalQuestions}
- Correct Answers: ${correctAnswers}
- Score: ${((correctAnswers / totalQuestions) * 100).toFixed(1)}%

Questions they got wrong:
${incorrectQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Provide:
1. A brief assessment of their performance
2. Specific topics they need to review
3. 3-5 actionable study recommendations
4. Encouraging message

Keep the feedback concise (200-300 words), constructive, and encouraging.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating feedback with Gemini:", error);
    throw new Error(`Failed to generate feedback: ${error.message}`);
  }
}
