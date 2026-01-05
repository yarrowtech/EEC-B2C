// src/services/localAiService.js
/**
 * Local AI Service - Connects to self-hosted Python AI service
 * Replaces Gemini API with local model
 */

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:5001";

/**
 * Generate questions from text using local AI service
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
      questionType = "mcq-single",
    } = options;

    console.log(`Requesting ${questionCount} ${questionType} questions from local AI service...`);

    const response = await fetch(`${AI_SERVICE_URL}/generate-questions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        subject,
        topic,
        className,
        board,
        difficulty,
        questionCount,
        questionType,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "AI service request failed");
    }

    const data = await response.json();

    if (!data.questions || !Array.isArray(data.questions)) {
      throw new Error("Invalid response format from AI service");
    }

    console.log(`Generated ${data.questions.length} questions successfully`);

    return data.questions;
  } catch (error) {
    console.error("Error generating questions with local AI:", error);

    // If AI service is unavailable, throw error with helpful message
    if (error.message.includes("fetch") || error.message.includes("ECONNREFUSED")) {
      throw new Error(
        "AI service is not running. Please start the Python AI service: cd ai-service && python app.py"
      );
    }

    throw new Error(`Failed to generate questions: ${error.message}`);
  }
}

/**
 * Check if AI service is available
 * @returns {Promise<boolean>}
 */
export async function checkAiServiceHealth() {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/health`, {
      method: "GET",
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.status === "ok" && data.model_loaded;
  } catch (error) {
    console.error("AI service health check failed:", error.message);
    return false;
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
    const totalQuestions = results.length;
    const correctAnswers = results.filter((r) => r.isCorrect).length;
    const score = ((correctAnswers / totalQuestions) * 100).toFixed(1);

    // For now, return a simple feedback
    // Can be enhanced to use AI service in the future
    const incorrectQuestions = results.filter((r) => !r.isCorrect);
    const incorrectCount = incorrectQuestions.length;

    let feedback = `Performance Summary:\n\n`;
    feedback += `Score: ${score}%\n`;
    feedback += `Correct Answers: ${correctAnswers}/${totalQuestions}\n\n`;

    if (score >= 80) {
      feedback += `Excellent work! You have a strong understanding of this topic.\n\n`;
    } else if (score >= 60) {
      feedback += `Good effort! With some more practice, you'll master this topic.\n\n`;
    } else {
      feedback += `Keep practicing! Review the material and try again.\n\n`;
    }

    if (incorrectCount > 0) {
      feedback += `Areas to review:\n`;
      incorrectQuestions.slice(0, 3).forEach((q, i) => {
        feedback += `${i + 1}. ${q.question.substring(0, 60)}...\n`;
      });
    }

    feedback += `\nKeep up the good work and continue studying!`;

    return feedback;
  } catch (error) {
    console.error("Error generating feedback:", error);
    return "Thank you for completing the quiz. Keep practicing to improve your skills!";
  }
}
