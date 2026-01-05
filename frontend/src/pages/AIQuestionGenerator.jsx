import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FileText, Upload, Sparkles, Save, Eye, Loader } from "lucide-react";

const AIQuestionGenerator = () => {
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const navigate = useNavigate();

  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    topic: "",
    className: "",
    board: "",
    difficulty: "moderate",
    questionCount: "10",
    questionType: "mcq-single",
  });
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [pdfInfo, setPdfInfo] = useState(null);

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

    if (!formData.subject || !formData.topic || !formData.className || !formData.board) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    const formDataToSend = new FormData();
    formDataToSend.append("pdf", pdfFile);
    formDataToSend.append("subject", formData.subject);
    formDataToSend.append("topic", formData.topic);
    formDataToSend.append("className", formData.className);
    formDataToSend.append("board", formData.board);
    formDataToSend.append("difficulty", formData.difficulty);
    formDataToSend.append("questionCount", formData.questionCount);
    formDataToSend.append("questionType", formData.questionType);
    formDataToSend.append("autoSave", "false");

    try {
      const response = await fetch(`${API}/api/ai-questions/generate-from-pdf`, {
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
      toast.success(data.message);
    } catch (error) {
      console.error("Error generating questions:", error);
      toast.error(error.message || "Failed to generate questions");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuestions = async () => {
    if (generatedQuestions.length === 0) {
      toast.error("No questions to save");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API}/api/ai-questions/save-generated`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
        body: JSON.stringify({ questions: generatedQuestions }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save questions");
      }

      toast.success(data.message);
      setTimeout(() => {
        navigate("/dashboard/questions/list");
      }, 1500);
    } catch (error) {
      console.error("Error saving questions:", error);
      toast.error(error.message || "Failed to save questions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
              <Sparkles className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">AI Question Generator</h1>
              <p className="text-gray-600">Upload PDF study materials and generate questions automatically</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Upload & Settings */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText size={24} className="text-indigo-600" />
              Upload & Configure
            </h2>

            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Upload PDF File *
              </label>
              <div className="relative">
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
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subject *</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Algebra"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Class *</label>
                  <input
                    type="text"
                    name="className"
                    value={formData.className}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., 10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Board *</label>
                  <select
                    name="board"
                    value={formData.board}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select Board</option>
                    <option value="CBSE">CBSE</option>
                    <option value="ICSE">ICSE</option>
                    <option value="State Board">State Board</option>
                    <option value="WB Board">WB Board</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty</label>
                  <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="easy">Easy</option>
                    <option value="moderate">Moderate</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Count</label>
                  <input
                    type="number"
                    name="questionCount"
                    value={formData.questionCount}
                    onChange={handleInputChange}
                    min="1"
                    max="50"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Question Type</label>
                <select
                  name="questionType"
                  value={formData.questionType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="mcq-single">MCQ - Single Correct</option>
                  <option value="mcq-multi">MCQ - Multiple Correct</option>
                  <option value="true-false">True/False</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
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

          {/* Right Panel - Preview */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Eye size={24} className="text-indigo-600" />
              Generated Questions Preview
            </h2>

            {pdfInfo && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  📄 PDF Pages: {pdfInfo.pages} | Text Length: {pdfInfo.textLength} chars
                </p>
              </div>
            )}

            {generatedQuestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Sparkles size={64} className="mb-4 opacity-30" />
                <p className="text-lg">No questions generated yet</p>
                <p className="text-sm">Upload a PDF and click Generate to see questions</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {generatedQuestions.map((q, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition">
                    <p className="font-semibold text-gray-800 mb-2">
                      Q{index + 1}. {q.question}
                    </p>
                    {q.options && q.options.length > 0 && (
                      <div className="ml-4 space-y-1">
                        {q.options.map((opt, i) => (
                          <p
                            key={i}
                            className={`text-sm ${
                              q.correct.includes(opt.key) ? "text-green-600 font-semibold" : "text-gray-600"
                            }`}
                          >
                            {opt.key}. {opt.text} {q.correct.includes(opt.key) && "✓"}
                          </p>
                        ))}
                      </div>
                    )}
                    {q.explanation && (
                      <p className="text-xs text-gray-500 mt-2 italic">💡 {q.explanation}</p>
                    )}
                  </div>
                ))}

                <button
                  onClick={handleSaveQuestions}
                  disabled={loading}
                  className="w-full bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader className="animate-spin" size={20} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      Save All Questions
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIQuestionGenerator;
