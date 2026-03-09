import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BookOpen, ChevronRight, Loader2, X, FileText, Clock, ListChecks, Lock } from "lucide-react";
import { getJSON, startExam } from "../../lib/api";
import { ToastContainer, useToast } from "../../components/Toast";

export default function SyllabusPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [startingExam, setStartingExam] = useState(null);
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [questionTypes, setQuestionTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [currentStage, setCurrentStage] = useState(1);
  const [unlockedStages, setUnlockedStages] = useState([1]);
  const [allStages, setAllStages] = useState([1]);

  const levelOptions = [
    {
      key: "basic",
      label: "Basic",
      subtitle: "Start simple and build confidence",
      icon: "🌱",
      tone: "from-emerald-500 to-green-500",
    },
    {
      key: "intermediate",
      label: "Intermediate",
      subtitle: "A bit challenging for practice",
      icon: "🚀",
      tone: "from-orange-500 to-amber-500",
    },
    {
      key: "advanced",
      label: "Advanced",
      subtitle: "Hard questions for top preparation",
      icon: "🏆",
      tone: "from-purple-500 to-indigo-500",
    },
  ];

  useEffect(() => {
    fetchUnlockedStages();
    fetchAllStages();
  }, []);

  useEffect(() => {
    // Get stage from URL query parameter, default to 1
    const stageParam = searchParams.get("stage");
    const stage = stageParam ? parseInt(stageParam, 10) : 1;

    // Check if stage is unlocked
    if (!unlockedStages.includes(stage)) {
      toast.error(`Stage ${stage} is locked! Redirecting to Stage 1.`);
      navigate("/dashboard/syllabus?stage=1");
      return;
    }

    setCurrentStage(stage);
    loadSyllabus(stage);
  }, [searchParams, unlockedStages]);

  async function fetchAllStages() {
    try {
      const token = localStorage.getItem("jwt");
      const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${API}/api/questions/stages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const sorted = [...new Set([1, ...(data.stages || [])])]
        .map((s) => Number(s))
        .filter((s) => Number.isFinite(s) && s >= 1)
        .sort((a, b) => a - b);
      setAllStages(sorted);
    } catch (err) {
      setAllStages([1, 2, 3]);
    }
  }

  async function fetchUnlockedStages() {
    try {
      const token = localStorage.getItem("jwt");
      const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

      const res = await fetch(`${API}/api/users/unlocked-stages`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setUnlockedStages(data.unlockedStages || [1]);
      }
    } catch (err) {
      console.error("Failed to fetch unlocked stages", err);
      setUnlockedStages([1]); // Default to Stage 1 only
    }
  }

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

  async function loadSyllabus(stage = 1) {
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
      console.log("currentStage:", stage);

      // Validate that user has board and class
      if (!userBoard || !userClass) {
        console.error("User board or class not found");
        toast.error("Please update your profile with board and class information.");
        setSubjects([]);
        setLoading(false);
        return;
      }

      // Fetch all uploaded subjects for user's board/class (do not filter by question availability)
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

      // Fetch all uploaded topics for each subject (do not filter by question availability)
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

  async function fetchQuestionTypesForLevel(subject, topic, level) {
    setLoadingTypes(true);
    setQuestionTypes([]);

    try {
      const user = getStoredUser();
      const userBoard = user.boardId || user.board || user.boardName || "";
      const userClass = user.classId || user.class || user.className || "";
      const response = await getJSON(
        `/api/questions/types?subject=${subject._id}&topic=${topic._id}&class=${userClass}&board=${userBoard}&stage=${currentStage}&level=${encodeURIComponent(level)}`
      );
      setQuestionTypes((response.types || []).filter((t) => t?.type !== "all"));
    } catch (err) {
      console.error("Failed to fetch question types", err);
      setQuestionTypes([]);
    } finally {
      setLoadingTypes(false);
    }
  }

  function handleTopicClick(subject, topic) {
    navigate(`/dashboard/syllabus/topic/${subject._id}/${topic._id}?stage=${currentStage}`, {
      state: { subject, topic },
    });
  }

  async function handleLevelSelection(level) {
    if (!selectedTopic) return;
    setSelectedLevel(level);
    await fetchQuestionTypesForLevel(selectedTopic.subject, selectedTopic.topic, level);
    setShowLevelSelector(false);
    setShowTypeSelector(true);
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
    if (!selectedTopic || !selectedType || !selectedLevel) return;

    const { subject, topic } = selectedTopic;
    const user = getStoredUser();
    const userClass = user.classId || user.class || user.className || "";
    const userBoard = user.boardId || user.board || user.boardName || "";

    try {
      setStartingExam(`${subject._id}-${topic._id}`);
      setShowConfirmDialog(false);

      // Start exam with the selected subject, topic, type, and current stage
      const data = await startExam({
        subject: subject._id,
        topic: topic._id,
        type: selectedType.type === "all" ? "mcq-single" : selectedType.type,
        limit: 10,
        level: selectedLevel,
        stage: currentStage,
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
      setSelectedLevel(null);
      setSelectedType(null);
    }
  }

  function cancelLevelSelector() {
    setShowLevelSelector(false);
    setSelectedTopic(null);
    setSelectedLevel(null);
    setSelectedType(null);
    setQuestionTypes([]);
  }

  function cancelTypeSelector() {
    setShowTypeSelector(false);
    setSelectedType(null);
    setShowLevelSelector(true);
  }

  function cancelStartExam() {
    setShowConfirmDialog(false);
    setSelectedType(null);
    setShowTypeSelector(true);
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

      <div className="max-w-6xl mx-auto pb-24 md:pb-0">

        {/* ── MOBILE HEADER ── */}
        <div className="md:hidden bg-white border-b border-orange-100 px-4 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-orange-500" />
              Attempt Exam
            </h1>
            <div className="px-2.5 py-1 bg-orange-100 rounded-full text-xs font-bold text-orange-700">
              Stage {currentStage}{currentStage === 1 ? " · Free" : ""}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
            <span>📚 {userBoardName}</span>
            <span>·</span>
            <span>🎓 {userClassName}</span>
          </div>
        </div>

        {/* ── DESKTOP HEADER ── */}
        <div className="hidden md:block p-6">
          <div className="mb-8 bg-gradient-to-r from-orange-50 via-yellow-50 to-orange-50 rounded-2xl p-8 shadow-sm border border-orange-100">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex-1">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent flex items-center gap-3 mb-3">
                  <div className="p-3 bg-white rounded-xl shadow-md">
                    <BookOpen className="w-8 h-8 text-orange-500" />
                  </div>
                  Syllabus Overview - Stage {currentStage}
                </h1>
                <p className="text-gray-600 text-lg">
                  Browse subjects and topics for Stage {currentStage}. Pick a topic, then choose level and question type.{" "}
                  {currentStage === 1 ? "✨ Stage 1 is completely free!" : ""}
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
                <div className="px-4 py-2 bg-white shadow-sm rounded-xl border-2 border-purple-200">
                  <div className="text-xs text-gray-500 font-medium">Current Stage</div>
                  <div className="text-sm font-bold text-purple-700 flex items-center gap-1">
                    🎯 Stage {currentStage}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── MOBILE STAGE SELECTOR ── */}
        <div className="md:hidden overflow-x-auto bg-white border-b border-gray-100" style={{ scrollbarWidth: "none" }}>
          <div className="flex gap-2.5 px-4 py-3 min-w-max">
            {allStages.map((stage) => {
              const isUnlocked = unlockedStages.includes(stage);
              const isFree = stage === 1;
              const isActive = currentStage === stage;

              return (
                <button
                  key={stage}
                  onClick={() => {
                    if (!isUnlocked) {
                      navigate("/dashboard/packages");
                    } else {
                      navigate(`/dashboard/syllabus?stage=${stage}`);
                    }
                  }}
                  className={`flex-shrink-0 flex flex-col items-center gap-1 px-4 py-2.5 rounded-2xl border-2 transition-all active:scale-95 ${
                    isActive
                      ? "bg-gradient-to-br from-orange-500 to-yellow-500 border-transparent text-white shadow-md"
                      : isUnlocked
                      ? "bg-white border-orange-200 text-orange-700"
                      : "bg-gray-50 border-gray-200 text-gray-400"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {!isUnlocked && <Lock className="w-3 h-3" />}
                    <span className="text-sm font-bold">Stage {stage}</span>
                  </div>
                  <span className={`text-xs font-medium ${
                    isActive
                      ? "text-orange-100"
                      : isFree
                      ? "text-emerald-600"
                      : isUnlocked
                      ? "text-indigo-600"
                      : "text-gray-400"
                  }`}>
                    {isFree ? "Free" : isUnlocked ? "✓ Unlocked" : "Locked"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="p-3 md:p-6">
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
                No subjects have been added for{" "}
                <span className="font-semibold text-orange-600">{userBoardName}</span> -{" "}
                <span className="font-semibold text-yellow-600">{userClassName}</span> yet. Please contact your administrator to add subjects.
              </p>
              <button
                onClick={() => navigate("/dashboard")}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 font-semibold text-white hover:from-orange-600 hover:to-yellow-600 transition-all shadow-md hover:shadow-lg"
              >
                Back to Dashboard
              </button>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-5">
              {subjects.map((subject, subjectIndex) => (
                <div
                  key={subject._id}
                  className="bg-white rounded-2xl shadow-sm md:shadow-md border border-gray-100 overflow-hidden"
                >
                  {/* Subject Header */}
                  <button
                    onClick={() => toggleSubject(subject._id)}
                    className="w-full flex items-center justify-between p-4 md:p-6 text-left hover:bg-orange-50/50 active:bg-orange-50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-orange-400 to-yellow-500 text-white font-bold text-base md:text-lg shadow-md flex-shrink-0">
                        {subjectIndex + 1}
                      </div>
                      <div>
                        <h2 className="text-base md:text-xl font-bold text-gray-900 text-left">
                          {subject.name}
                        </h2>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs md:text-sm text-gray-500">
                            {subject.topics?.length || 0} topic{subject.topics?.length !== 1 ? "s" : ""}
                          </span>
                          {(subject.topics?.length || 0) > 0 && (
                            <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-semibold">
                              Active
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={`p-1.5 md:p-2 rounded-lg flex-shrink-0 transition-all duration-200 ${
                      expandedSubject === subject._id ? "bg-orange-100" : "bg-gray-100"
                    }`}>
                      <ChevronRight className={`w-4 h-4 md:w-5 md:h-5 transition-transform duration-200 ${
                        expandedSubject === subject._id ? "rotate-90 text-orange-600" : "text-gray-400"
                      }`} />
                    </div>
                  </button>

                  {/* Topics List */}
                  {expandedSubject === subject._id && (
                    <div className="border-t border-gray-100 bg-gray-50/50 p-3 md:p-6">
                      {subject.topics?.length === 0 ? (
                        <div className="text-center py-8 px-4 bg-orange-50 rounded-xl border border-orange-100">
                          <div className="text-4xl mb-3">📖</div>
                          <p className="text-gray-700 font-semibold mb-1">No topics yet</p>
                          <p className="text-gray-500 text-sm">Topics will appear here once they're added by your instructor.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
                          {subject.topics.map((topic, topicIndex) => (
                            <button
                              key={topic._id}
                              onClick={() => handleTopicClick(subject, topic)}
                              disabled={startingExam === `${subject._id}-${topic._id}`}
                              className="rounded-2xl bg-white border-2 border-gray-100 hover:border-orange-400 hover:shadow-lg active:scale-[0.98] transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                            >
                              <div className="relative h-36 w-full bg-gray-100">
                                {topic.topicImage ? (
                                  <img
                                    src={topic.topicImage}
                                    alt={topic.name}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="h-full w-full bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center">
                                    <BookOpen className="w-10 h-10 text-orange-400" />
                                  </div>
                                )}
                                <div className="absolute top-2 left-2">
                                  {/* <span className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-black/60 text-white text-[11px] font-semibold">
                                    {subjectIndex + 1}.{topicIndex + 1}
                                  </span> */}
                                </div>
                              </div>

                              <div className="p-4">
                                <div className="flex items-start justify-between gap-2">
                                  <h3 className="text-sm md:text-base font-semibold text-gray-900 group-hover:text-orange-700 line-clamp-2">
                                    {topic.name}
                                  </h3>
                                  {startingExam === `${subject._id}-${topic._id}` ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-orange-500 mt-0.5 flex-shrink-0" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 mt-0.5 flex-shrink-0" />
                                  )}
                                </div>
                                <p className="mt-2 text-xs md:text-sm text-gray-600 line-clamp-3 min-h-[3.25rem]">
                                  {topic.shortDescription?.trim() || "No description available for this topic yet."}
                                </p>
                              </div>
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
        </div>
      </div>

      {/* ── LEVEL SELECTOR (bottom sheet on mobile) ── */}
      {showLevelSelector && selectedTopic && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 bg-black/50 backdrop-blur-sm">
          <div
            className="w-full md:max-w-2xl bg-white rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: "90vh" }}
          >
            {/* Drag handle - mobile only */}
            <div className="md:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-5 md:p-6 text-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-xl md:text-2xl font-bold">Choose Level</h3>
                <button
                  onClick={cancelLevelSelector}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-1.5 text-orange-100 text-sm">
                {selectedTopic.subject.name} — {selectedTopic.topic.name}
              </p>
            </div>
            {/* Body */}
            <div className="px-4 pt-4 pb-24 md:p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                {levelOptions.map((level) => (
                  <button
                    key={level.key}
                    onClick={() => handleLevelSelection(level.key)}
                    className="rounded-2xl border-2 border-slate-200 hover:border-orange-400 hover:shadow-lg active:scale-[0.98] transition-all p-4 md:p-5 text-left flex items-center gap-3 sm:flex-col sm:items-start group"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${level.tone} flex items-center justify-center text-2xl shadow-md flex-shrink-0`}>
                      {level.icon}
                    </div>
                    <div>
                      <h4 className="text-base md:text-lg font-bold text-slate-900 group-hover:text-orange-700">{level.label}</h4>
                      <p className="mt-0.5 text-xs md:text-sm text-slate-600">{level.subtitle}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── QUESTION TYPE SELECTOR (bottom sheet on mobile) ── */}
      {showTypeSelector && selectedTopic && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 bg-black/50 backdrop-blur-sm">
          <div
            className="w-full md:max-w-lg bg-white rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: "90vh" }}
          >
            {/* Drag handle - mobile only */}
            <div className="md:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-5 md:p-6 text-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-xl md:text-2xl font-bold">Question Type</h3>
                <button
                  onClick={cancelTypeSelector}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-1.5 text-orange-100 text-sm">
                {selectedTopic.subject.name} — {selectedTopic.topic.name}
              </p>
              {selectedLevel && (
                <p className="mt-1 text-xs text-orange-200 uppercase tracking-wide">
                  Level: {selectedLevel}
                </p>
              )}
            </div>
            {/* Body */}
            <div className="px-4 pt-4 pb-24 md:p-6 overflow-y-auto flex-1">
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
                    Choose Another Level
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {questionTypes.map((qType, index) => (
                    <button
                      key={index}
                      onClick={() => handleTypeSelection(qType)}
                      disabled={qType.count === 0}
                      className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 hover:border-orange-400 hover:bg-orange-50 active:scale-[0.98] transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{qType.icon || "📝"}</span>
                        <div>
                          <p className="font-semibold text-gray-900">{qType.label}</p>
                          {qType.count !== null && (
                            <p className="text-xs text-gray-500">
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

      {/* ── CONFIRM DIALOG (bottom sheet on mobile) ── */}
      {showConfirmDialog && selectedTopic && selectedType && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full md:max-w-md bg-white rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden">
            {/* Drag handle - mobile only */}
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-5 md:p-6 text-white">
              <div className="flex items-center justify-between">
                <h3 className="text-xl md:text-2xl font-bold">Start Exam?</h3>
                <button
                  onClick={cancelStartExam}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-1.5 text-orange-100 text-sm">
                {selectedTopic.topic.name}
              </p>
            </div>
            {/* Body */}
            <div className="px-5 pt-5 pb-6 md:p-6 space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {selectedType.count || 10} Question{(selectedType.count || 10) !== 1 ? "s" : ""}
                  </p>
                  <p className="text-sm text-gray-500">{selectedType.label}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                  <Clock className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">No Time Limit</p>
                  <p className="text-sm text-gray-500">Take your time to answer</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                  <ListChecks className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Subject: {selectedTopic.subject.name}</p>
                  <p className="text-sm text-gray-500">
                    Stage {currentStage}{currentStage === 1 ? " — Free" : ""}
                    {selectedLevel ? ` · Level ${selectedLevel}` : ""}
                  </p>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3.5">
                <p className="text-sm text-yellow-800">
                  Make sure you're ready! Once started, give it your best effort.
                </p>
              </div>
            </div>
            {/* Footer */}
            <div className="px-5 pt-2 pb-24 md:px-6 md:pb-6 bg-gray-50 flex gap-3">
              <button
                onClick={goBackToTypeSelector}
                className="px-4 py-3 rounded-xl border-2 border-gray-300 font-semibold text-gray-700 hover:bg-gray-100 transition-colors text-sm"
              >
                ← Back
              </button>
              <button
                onClick={cancelStartExam}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 font-semibold text-gray-700 hover:bg-gray-100 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmStartExam}
                disabled={startingExam}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 font-semibold text-white hover:from-orange-600 hover:to-yellow-600 active:scale-[0.98] transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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
    </>
  );
}
