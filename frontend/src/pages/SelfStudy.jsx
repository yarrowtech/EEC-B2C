import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FileText, Upload, Sparkles, Loader, Play, CheckCircle } from "lucide-react";

const SelfStudy = () => {
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Upload, 2: Answer Questions, 3: Results
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    subject: "",
    topic: "",
    difficulty: "moderate",
    questionCount: "5",
    questionType: "mcq-single",
  });

  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [pdfInfo, setPdfInfo] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
    } else {
      toast.error("Please select a valid PDF file");
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGenerate = async () => {
    if (!pdfFile) {
      toast.error("Please upload a PDF file");
      return;
    }

    if (!formData.subject || !formData.topic) {
      toast.error("Please fill in subject and topic");
      return;
    }

    setLoading(true);
    const formDataToSend = new FormData();
    formDataToSend.append("pdf", pdfFile);
    formDataToSend.append("subject", formData.subject);
    formDataToSend.append("topic", formData.topic);
    formDataToSend.append("difficulty", formData.difficulty);
    formDataToSend.append("questionCount", formData.questionCount);
    formDataToSend.append("questionType", formData.questionType);

    try {
      const response = await fetch(`${API}/api/self-study/generate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate questions");
      }

      setGeneratedQuestions(data.questions);
      setPdfInfo(data.pdfInfo);
      setStartTime(Date.now());
      setStep(2);
      toast.success("Questions generated! Start answering");
    } catch (error) {
      console.error("Error generating questions:", error);
      toast.error(error.message || "Failed to generate questions");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionIndex, selectedOption) => {
    const questionType = formData.questionType;

    if (questionType === "mcq-multi") {
      // Multiple selection
      const currentAnswers = userAnswers[questionIndex] || [];
      const newAnswers = currentAnswers.includes(selectedOption)
        ? currentAnswers.filter((a) => a !== selectedOption)
        : [...currentAnswers, selectedOption];

      setUserAnswers({
        ...userAnswers,
        [questionIndex]: newAnswers,
      });
    } else {
      // Single selection
      setUserAnswers({
        ...userAnswers,
        [questionIndex]: [selectedOption],
      });
    }
  };

  const handleSubmit = async () => {
    const allAnswered = generatedQuestions.every((_, index) => userAnswers[index]?.length > 0);

    if (!allAnswered) {
      toast.error("Please answer all questions");
      return;
    }

    setLoading(true);

    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000); // in seconds

      const answersData = generatedQuestions.map((q, index) => {
        const userAns = userAnswers[index] || [];
        const correctAns = q.correct || [];

        // Check if answer is correct
        const isCorrect =
          userAns.length === correctAns.length &&
          userAns.every((a) => correctAns.includes(a));

        return {
          question: q.question,
          userAnswer: userAns,
          correctAnswer: correctAns,
          isCorrect,
          explanation: q.explanation || "",
        };
      });

      const response = await fetch(`${API}/api/self-study/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
        body: JSON.stringify({
          subject: formData.subject,
          topic: formData.topic,
          difficulty: formData.difficulty,
          questionType: formData.questionType,
          answers: answersData,
          pdfInfo,
          timeSpent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit answers");
      }

      setResult(data.result);
      setStep(3);
      toast.success("Answers submitted successfully!");
    } catch (error) {
      console.error("Error submitting answers:", error);
      toast.error(error.message || "Failed to submit answers");
    } finally {
      setLoading(false);
    }
  };

  const restartStudy = () => {
    setPdfFile(null);
    setFormData({
      subject: "",
      topic: "",
      difficulty: "moderate",
      questionCount: "5",
      questionType: "mcq-single",
    });
    setGeneratedQuestions([]);
    setUserAnswers({});
    setPdfInfo(null);
    setStartTime(null);
    setResult(null);
    setStep(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
              <Sparkles className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Self Study with AI</h1>
              <p className="text-gray-600">Upload your study material and practice with AI-generated questions</p>
            </div>
          </div>
        </div>

        {/* Step 1: Upload & Generate */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Upload Study Material</h2>

            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Upload PDF File *
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
                id="pdf-upload"
              />
              <label
                htmlFor="pdf-upload"
                className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-indigo-300 rounded-xl hover:border-indigo-500 cursor-pointer transition bg-indigo-50"
              >
                <Upload size={24} className="text-indigo-600" />
                <span className="text-gray-700 font-medium">
                  {pdfFile ? pdfFile.name : "Choose PDF file"}
                </span>
              </label>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Subject *</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Mathematics"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Topic *</label>
                  <input
                    type="text"
                    name="topic"
                    value={formData.topic}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Algebra"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty</label>
                  <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="moderate">Moderate</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Questions</label>
                  <select
                    name="questionCount"
                    value={formData.questionCount}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="15">15</option>
                    <option value="20">20</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                  <select
                    name="questionType"
                    value={formData.questionType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="mcq-single">MCQ</option>
                    <option value="mcq-multi">MCQ (Multi)</option>
                    <option value="true-false">True/False</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Generate Questions
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 2: Answer Questions */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Answer the Questions</h2>
              <span className="text-sm text-gray-600">
                {Object.keys(userAnswers).length} / {generatedQuestions.length} answered
              </span>
            </div>

            <div className="space-y-6">
              {generatedQuestions.map((q, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <p className="font-semibold text-gray-800 mb-3">
                    Q{index + 1}. {q.question}
                  </p>

                  {q.options && q.options.length > 0 ? (
                    <div className="space-y-2">
                      {q.options.map((opt) => (
                        <label
                          key={opt.key}
                          className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                            userAnswers[index]?.includes(opt.key)
                              ? "border-indigo-500 bg-indigo-50"
                              : "border-gray-200 hover:border-indigo-300"
                          }`}
                        >
                          <input
                            type={formData.questionType === "mcq-multi" ? "checkbox" : "radio"}
                            name={`question-${index}`}
                            checked={userAnswers[index]?.includes(opt.key) || false}
                            onChange={() => handleAnswerChange(index, opt.key)}
                            className="w-4 h-4 text-indigo-600"
                          />
                          <span className="text-gray-700">{opt.key}. {opt.text}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${userAnswers[index]?.includes("true") ? "border-green-500 bg-green-50" : ""}`}>
                        <input
                          type="radio"
                          name={`question-${index}`}
                          checked={userAnswers[index]?.includes("true")}
                          onChange={() => handleAnswerChange(index, "true")}
                          className="w-4 h-4"
                        />
                        <span>True</span>
                      </label>
                      <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${userAnswers[index]?.includes("false") ? "border-red-500 bg-red-50" : ""}`}>
                        <input
                          type="radio"
                          name={`question-${index}`}
                          checked={userAnswers[index]?.includes("false")}
                          onChange={() => handleAnswerChange(index, "false")}
                          className="w-4 h-4"
                        />
                        <span>False</span>
                      </label>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full mt-6 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  Submit Answers
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 3 && result && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-center mb-6">
              <div className={`inline-flex p-4 rounded-full mb-4 ${result.score >= 70 ? "bg-green-100" : result.score >= 40 ? "bg-yellow-100" : "bg-red-100"}`}>
                <CheckCircle size={48} className={result.score >= 70 ? "text-green-600" : result.score >= 40 ? "text-yellow-600" : "text-red-600"} />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Your Score: {result.score}%</h2>
              <p className="text-gray-600">
                {result.correctAnswers} out of {result.totalQuestions} correct
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-semibold">Subject:</span>
                <span>{result.subject}</span>
              </div>
              <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-semibold">Topic:</span>
                <span>{result.topic}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => navigate("/dashboard/self-study/results")}
                className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
              >
                View All Results
              </button>
              <button
                onClick={restartStudy}
                className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-700 transition"
              >
                Study Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelfStudy;
