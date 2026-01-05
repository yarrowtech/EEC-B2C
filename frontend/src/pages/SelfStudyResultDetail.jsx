import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, CheckCircle, XCircle, Loader, FileText } from "lucide-react";

const SelfStudyResultDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchResultDetail();
  }, [id]);

  const fetchResultDetail = async () => {
    try {
      const response = await fetch(`${API}/api/self-study/results/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch result");
      }

      setResult(data);
    } catch (error) {
      console.error("Error fetching result:", error);
      toast.error(error.message || "Failed to fetch result");
      navigate("/dashboard/self-study/results");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <button
            onClick={() => navigate("/dashboard/self-study/results")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft size={20} />
            Back to Results
          </button>

          <div className="text-center">
            <div className={`inline-flex p-4 rounded-full mb-4 ${result.score >= 70 ? "bg-green-100" : result.score >= 40 ? "bg-yellow-100" : "bg-red-100"}`}>
              {result.score >= 70 ? (
                <CheckCircle size={48} className="text-green-600" />
              ) : (
                <XCircle size={48} className="text-yellow-600" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Score: {result.score}%</h1>
            <p className="text-gray-600 mb-4">
              {result.correctAnswers} out of {result.totalQuestions} correct answers
            </p>

            <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <FileText size={16} />
                {result.subject} - {result.topic}
              </span>
              <span className="px-3 py-1 bg-gray-100 rounded-full">{result.difficulty}</span>
              <span className="px-3 py-1 bg-gray-100 rounded-full">
                {result.questionType.replace("-", " ")}
              </span>
              <span>{new Date(result.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Questions & Answers */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Review Your Answers</h2>

          <div className="space-y-6">
            {result.answers.map((answer, index) => (
              <div
                key={index}
                className={`p-4 border-2 rounded-lg ${
                  answer.isCorrect
                    ? "border-green-300 bg-green-50"
                    : "border-red-300 bg-red-50"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <p className="font-semibold text-gray-800 flex-1">
                    Q{index + 1}. {answer.question}
                  </p>
                  {answer.isCorrect ? (
                    <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
                  ) : (
                    <XCircle className="text-red-600 flex-shrink-0" size={24} />
                  )}
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700">Your Answer:</span>
                    <span className={answer.isCorrect ? "text-green-600" : "text-red-600"}>
                      {answer.userAnswer.join(", ")}
                    </span>
                  </div>

                  {!answer.isCorrect && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-700">Correct Answer:</span>
                      <span className="text-green-600">
                        {answer.correctAnswer.join(", ")}
                      </span>
                    </div>
                  )}
                </div>

                {answer.explanation && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold text-blue-700">💡 Explanation: </span>
                      {answer.explanation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={() => navigate("/dashboard/self-study")}
            className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
          >
            Study Again
          </button>
          <button
            onClick={() => navigate("/dashboard/self-study/results")}
            className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-700 transition"
          >
            View All Results
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelfStudyResultDetail;
