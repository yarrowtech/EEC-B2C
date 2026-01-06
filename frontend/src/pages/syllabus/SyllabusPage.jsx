import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, ChevronRight, Loader2, X, FileText, Clock, ListChecks } from "lucide-react";
import { getJSON, startExam } from "../../lib/api";
import { ToastContainer, useToast } from "../../components/Toast";

export default function SyllabusPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [startingExam, setStartingExam] = useState(null);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [questionTypes, setQuestionTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(false);

  useEffect(() => {
    loadSyllabus();
  }, []);

  function getStoredUser() {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }

  function hasBoardAndClass(user) {
    const userBoard = user.boardId || user.board || user.boardName || "";
    const userClass = user.classId || user.class || user.className || "";
    return Boolean(userBoard && userClass);
  }

  async function loadUserProfile() {
    try {
      const profile = await getJSON("/users/profile");
      if (profile?.user) {
        localStorage.setItem("user", JSON.stringify(profile.user));
        return profile.user;
      }
    } catch (err) {
      console.error("Failed to refresh user profile", err);
    }
    return getStoredUser();
  }

  async function loadSyllabus() {
    try {
      setLoading(true);

      // Get user's board and class from localStorage (use boardId and classId if available)
      let user = getStoredUser();
      console.log("User object from localStorage:", user);

      if (!hasBoardAndClass(user)) {
        user = await loadUserProfile();
      }

      // Try boardId first (new users), then board name
      const userBoard = user.boardId || user.board || user.boardName || "";
      // Try classId first (new users), then class name, then className field
      const userClass = user.classId || user.class || user.className || "";

      console.log("userBoard:", userBoard);
      console.log("userClass:", userClass);

      // Validate that user has board and class
      if (!userBoard || !userClass) {
        console.error("User board or class not found");
        toast.error("Please update your profile with board and class information.");
        setSubjects([]);
        setLoading(false);
        return;
      }

      // Fetch subjects filtered by user's board and class
      const url = `/api/subject?board=${userBoard}&class=${userClass}`;
      console.log("Fetching subjects from:", url);

      const subjectsRes = await getJSON(url);

      console.log("Subjects fetched:", subjectsRes);

      // If no subjects found, set empty array
      if (!subjectsRes || subjectsRes.length === 0) {
        setSubjects([]);
        setLoading(false);
        return;
      }

      // Fetch topics for each subject (also filtered by board and class)
      const subjectsWithTopics = await Promise.all(
        subjectsRes.map(async (subject) => {
          try {
            const topics = await getJSON(
              `/api/topic/${subject._id}?board=${userBoard}&class=${userClass}`
            );
            console.log(`Topics for ${subject.name}:`, topics);
            return { ...subject, topics: topics || [] };
          } catch (err) {
            console.error(`Failed to load topics for ${subject.name}`, err);
            return { ...subject, topics: [] };
          }
        })
      );

      setSubjects(subjectsWithTopics);
    } catch (err) {
      console.error("Failed to load syllabus", err);
      toast.error("Failed to load syllabus. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleTopicClick(subject, topic) {
    setSelectedTopic({ subject, topic });
    setShowTypeSelector(true);

    // Fetch available question types and counts
    setLoadingTypes(true);
    setQuestionTypes([]);

    try {
      const user = getStoredUser();
      const userBoard = user.boardId || user.board || user.boardName || "";
      const userClass = user.classId || user.class || user.className || "";
      const response = await getJSON(
        `/api/questions/types?subject=${subject._id}&topic=${topic._id}&class=${userClass}&board=${userBoard}`
      );

      // Response format: [{ type: "mcq-single", count: 15, label: "MCQ - Single Choice" }, ...]
      setQuestionTypes(response.types || []);
    } catch (err) {
      console.error("Failed to fetch question types", err);
      // Fallback: show default types
      setQuestionTypes([
        { type: "all", count: null, label: "All Question Types", icon: "🎯" }
      ]);
    } finally {
      setLoadingTypes(false);
    }
  }

  function handleTypeSelection(type) {
    setSelectedType(type);
    setShowTypeSelector(false);
    setShowConfirmDialog(true);
  }

  function goBackToTypeSelector() {
    setShowConfirmDialog(false);
    setShowTypeSelector(true);
  }

  async function confirmStartExam() {
    if (!selectedTopic || !selectedType) return;

    const { subject, topic } = selectedTopic;
    const user = getStoredUser();
    const userClass = user.classId || user.class || user.className || "";
    const userBoard = user.boardId || user.board || user.boardName || "";

    try {
      setStartingExam(`${subject._id}-${topic._id}`);
      setShowConfirmDialog(false);

      // Start exam with the selected subject, topic, and type
      const data = await startExam({
        subject: subject._id,
        topic: topic._id,
        type: selectedType.type === "all" ? "mcq-single" : selectedType.type,
        limit: 10,
        stage: 1,
        class: userClass,
        board: userBoard
      });

      // Navigate to exam page with state
      navigate(`/dashboard/exams/take/${data.attemptId}`, {
        state: data,
      });
    } catch (err) {
      console.error("Failed to start exam", err);
      toast.error("Failed to start exam. Please try again.");
    } finally {
      setStartingExam(null);
      setSelectedTopic(null);
      setSelectedType(null);
    }
  }

  function cancelTypeSelector() {
    setShowTypeSelector(false);
    setSelectedTopic(null);
    setSelectedType(null);
  }

  function cancelStartExam() {
    setShowConfirmDialog(false);
    setSelectedType(null);
  }

  function toggleSubject(subjectId) {
    setExpandedSubject(expandedSubject === subjectId ? null : subjectId);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userBoardName = user.boardName || user.board || "Your Board";
  const userClassName = user.className || user.class || "Your Class";

  return (
    <>
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      <div className="max-w-6xl mx-auto p-6">
        {/* Enhanced Header Section */}
        <div className="mb-8 bg-gradient-to-r from-orange-50 via-yellow-50 to-orange-50 rounded-2xl p-8 shadow-sm border border-orange-100">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent flex items-center gap-3 mb-3">
                <div className="p-3 bg-white rounded-xl shadow-md">
                  <BookOpen className="w-8 h-8 text-orange-500" />
                </div>
                Syllabus Overview
              </h1>
              <p className="text-gray-600 text-lg">
                Browse subjects and topics. Click on any topic to start an exam.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-white shadow-sm rounded-xl border-2 border-orange-200">
                <div className="text-xs text-gray-500 font-medium">Board</div>
                <div className="text-sm font-bold text-orange-700 flex items-center gap-1">
                  📚 {userBoardName}
                </div>
              </div>
              <div className="px-4 py-2 bg-white shadow-sm rounded-xl border-2 border-yellow-200">
                <div className="text-xs text-gray-500 font-medium">Class</div>
                <div className="text-sm font-bold text-yellow-700 flex items-center gap-1">
                  🎓 {userClassName}
                </div>
              </div>
            </div>
          </div>
        </div>

      {subjects.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <BookOpen className="w-24 h-24 text-orange-200" />
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No Subjects Available</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            No subjects have been added for <span className="font-semibold text-orange-600">{userBoardName}</span> - <span className="font-semibold text-yellow-600">{userClassName}</span> yet. Please contact your administrator to add subjects.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 font-semibold text-white hover:from-orange-600 hover:to-yellow-600 transition-all shadow-md hover:shadow-lg"
          >
            Back to Dashboard
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {subjects.map((subject, subjectIndex) => (
            <div
              key={subject._id}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden"
            >
              {/* Subject Header - Enhanced */}
              <button
                onClick={() => toggleSubject(subject._id)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 transition-all duration-200 rounded-2xl"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-yellow-500 text-white font-bold text-lg shadow-lg">
                    {subjectIndex + 1}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <BookOpen className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {subject.name}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-500">
                          {subject.topics?.length || 0} topic{subject.topics?.length !== 1 ? "s" : ""}
                        </span>
                        {(subject.topics?.length || 0) > 0 && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-semibold">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`p-2 rounded-lg transition-all duration-300 ${
                  expandedSubject === subject._id
                    ? "bg-orange-100 rotate-90"
                    : "bg-gray-100"
                }`}>
                  <ChevronRight className={`w-5 h-5 ${
                    expandedSubject === subject._id
                      ? "text-orange-600"
                      : "text-gray-400"
                  }`} />
                </div>
              </button>

              {/* Topics List - Enhanced */}
              {expandedSubject === subject._id && (
                <div className="border-t-2 border-gray-100 bg-gradient-to-b from-gray-50 to-white p-6">
                  {subject.topics?.length === 0 ? (
                    <div className="text-center py-12 px-4 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl border-2 border-orange-100">
                      <div className="text-6xl mb-4">📖</div>
                      <p className="text-gray-700 font-semibold text-lg mb-2">No topics available for this subject</p>
                      <p className="text-gray-500 text-sm">Topics will appear here once they're added by your instructor.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {subject.topics.map((topic, topicIndex) => (
                        <button
                          key={topic._id}
                          onClick={() => handleTopicClick(subject, topic)}
                          disabled={startingExam === `${subject._id}-${topic._id}`}
                          className="relative flex items-center justify-between p-5 rounded-xl bg-white border-2 border-gray-200 hover:border-orange-400 hover:shadow-lg hover:scale-105 transition-all duration-200 text-left group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-yellow-500 text-white text-sm font-bold flex items-center justify-center shadow">
                              {subjectIndex + 1}.{topicIndex + 1}
                            </div>
                            <span className="font-semibold text-gray-800 group-hover:text-orange-700 line-clamp-2">
                              {topic.name}
                            </span>
                          </div>
                          {startingExam === `${subject._id}-${topic._id}` ? (
                            <Loader2 className="w-5 h-5 animate-spin text-orange-500 ml-2 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all ml-2 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Question Type Selector Modal */}
      {showTypeSelector && selectedTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">Choose Question Type</h3>
                <button
                  onClick={cancelTypeSelector}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-2 text-orange-100">
                {selectedTopic.subject.name} - {selectedTopic.topic.name}
              </p>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto min-h-0">
              {loadingTypes ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                  <span className="ml-3 text-gray-600">Loading question types...</span>
                </div>
              ) : questionTypes.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="text-6xl mb-4">🤔</div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">No Questions Yet</h4>
                  <p className="text-gray-600 mb-6">
                    There are no questions available for this topic right now.
                  </p>
                  <button
                    onClick={cancelTypeSelector}
                    className="px-6 py-2 rounded-xl border-2 border-gray-300 font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Try Another Topic
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {questionTypes.map((qType, index) => (
                    <button
                      key={index}
                      onClick={() => handleTypeSelection(qType)}
                      disabled={qType.count === 0}
                      className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 hover:border-orange-400 hover:bg-orange-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{qType.icon || "📝"}</span>
                        <div>
                          <p className="font-semibold text-gray-900">{qType.label}</p>
                          {qType.count !== null && (
                            <p className="text-sm text-gray-500">
                              {qType.count} question{qType.count !== 1 ? "s" : ""} available
                            </p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && selectedTopic && selectedType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">Start Exam?</h3>
                <button
                  onClick={cancelStartExam}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-2 text-orange-100">
                {selectedTopic.topic.name}
              </p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {selectedType.count || 10} Question{(selectedType.count || 10) !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-gray-500">{selectedType.label}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">No Time Limit</p>
                  <p className="text-sm text-gray-500">Take your time to answer</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <ListChecks className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Subject: {selectedTopic.subject.name}</p>
                  <p className="text-sm text-gray-500">Stage 1 - Basic Level</p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-yellow-800">
                  Make sure you're ready! Once started, give it your best effort.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 flex gap-3">
              <button
                onClick={goBackToTypeSelector}
                className="px-4 py-3 rounded-xl border-2 border-gray-300 font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={cancelStartExam}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmStartExam}
                disabled={startingExam}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 font-semibold text-white hover:from-orange-600 hover:to-yellow-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {startingExam ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Starting...
                  </span>
                ) : (
                  "Start Exam"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
