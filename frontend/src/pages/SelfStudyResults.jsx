import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Trophy, Calendar, BookOpen, TrendingUp, Loader, Eye } from "lucide-react";

const SelfStudyResults = () => {
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchResults();
    fetchStats();
  }, []);

  const fetchResults = async () => {
    try {
      const response = await fetch(`${API}/api/self-study/results`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch results");
      }

      setResults(data);
    } catch (error) {
      console.error("Error fetching results:", error);
      toast.error(error.message || "Failed to fetch results");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API}/api/self-study/stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const viewDetail = (id) => {
    navigate(`/dashboard/self-study/results/${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <Trophy className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Self Study Results</h1>
                <p className="text-gray-600">Track your learning progress</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/dashboard/self-study")}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              New Study Session
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="text-blue-600" size={24} />
                <p className="text-gray-600 text-sm">Total Sessions</p>
              </div>
              <p className="text-3xl font-bold text-gray-800">{stats.totalSessions}</p>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="text-green-600" size={24} />
                <p className="text-gray-600 text-sm">Average Score</p>
              </div>
              <p className="text-3xl font-bold text-gray-800">{stats.averageScore}%</p>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="text-yellow-600" size={24} />
                <p className="text-gray-600 text-sm">Questions Attempted</p>
              </div>
              <p className="text-3xl font-bold text-gray-800">{stats.totalQuestionsAttempted}</p>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="text-purple-600" size={24} />
                <p className="text-gray-600 text-sm">Correct Answers</p>
              </div>
              <p className="text-3xl font-bold text-gray-800">{stats.totalCorrectAnswers}</p>
            </div>
          </div>
        )}

        {/* Results List */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Study Sessions</h2>

          {results.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="mx-auto text-gray-300 mb-4" size={64} />
              <p className="text-gray-500 text-lg mb-4">No study sessions yet</p>
              <button
                onClick={() => navigate("/dashboard/self-study")}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                Start Studying
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((result) => (
                <div
                  key={result._id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition cursor-pointer"
                  onClick={() => viewDetail(result._id)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center ${
                        result.score >= 70
                          ? "bg-green-100 text-green-600"
                          : result.score >= 40
                          ? "bg-yellow-100 text-yellow-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      <span className="text-xl font-bold">{result.score}%</span>
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {result.subject} - {result.topic}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span>
                          {result.correctAnswers}/{result.totalQuestions} correct
                        </span>
                        <span className="px-2 py-1 bg-gray-100 rounded">
                          {result.difficulty}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 rounded">
                          {result.questionType.replace("-", " ")}
                        </span>
                        <span>
                          {new Date(result.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      viewDetail(result._id);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    <Eye size={18} />
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subject-wise Stats */}
        {stats && Object.keys(stats.bySubject).length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Performance by Subject</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(stats.bySubject).map(([subject, data]) => (
                <div key={subject} className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">{subject}</h3>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Sessions: {data.count}</span>
                    <span className="font-bold text-indigo-600">{data.averageScore}% avg</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelfStudyResults;
