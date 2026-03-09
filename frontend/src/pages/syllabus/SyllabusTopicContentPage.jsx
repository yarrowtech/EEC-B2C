import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BookOpen, ChevronRight, Clock, FileText, ListChecks, Loader2, X } from "lucide-react";
import { getJSON, startExam } from "../../lib/api";
import { ToastContainer, useToast } from "../../components/Toast";

export default function SyllabusTopicContentPage() {
  const { subjectId, topicId } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const stage = Number(searchParams.get("stage") || 1);

  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState(null);
  const [topic, setTopic] = useState(null);
  const [startingExam, setStartingExam] = useState(false);

  const [showLevelSelector, setShowLevelSelector] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [questionTypes, setQuestionTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(false);

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

  const selectedTopic = useMemo(() => (subject && topic ? { subject, topic } : null), [subject, topic]);

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

  async function loadTopicContext() {
    try {
      setLoading(true);
      let user = getStoredUser();
      if (!hasBoardAndClass(user)) user = await loadUserProfile();

      const userBoard = user.boardId || user.board || user.boardName || "";
      const userClass = user.classId || user.class || user.className || "";

      if (!userBoard || !userClass) {
        toast.error("Please update your profile with board and class information.");
        navigate(`/dashboard/syllabus?stage=${stage}`);
        return;
      }

      const stateSubject = location.state?.subject;
      const stateTopic = location.state?.topic;
      if (
        stateSubject?._id === subjectId &&
        stateTopic?._id === topicId
      ) {
        setSubject(stateSubject);
        setTopic(stateTopic);
        return;
      }

      const subjects = await getJSON(`/api/subject?board=${userBoard}&class=${userClass}&stage=${stage}`);
      const foundSubject = (subjects || []).find((s) => String(s._id) === String(subjectId));

      if (!foundSubject) {
        toast.error("Subject not found for your class and board.");
        navigate(`/dashboard/syllabus?stage=${stage}`);
        return;
      }

      const topics = await getJSON(
        `/api/topic/${foundSubject._id}?board=${userBoard}&class=${userClass}&stage=${stage}`
      );
      const foundTopic = (topics || []).find((t) => String(t._id) === String(topicId));

      if (!foundTopic) {
        toast.error("Topic not found for this stage.");
        navigate(`/dashboard/syllabus?stage=${stage}`);
        return;
      }

      setSubject(foundSubject);
      setTopic(foundTopic);
    } catch (err) {
      console.error("Failed to load topic context", err);
      toast.error("Failed to load topic content.");
      navigate(`/dashboard/syllabus?stage=${stage}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTopicContext();
  }, [subjectId, topicId, stage]);

  async function fetchQuestionTypesForLevel(level) {
    if (!subject || !topic) return;
    setLoadingTypes(true);
    setQuestionTypes([]);

    try {
      const user = getStoredUser();
      const userBoard = user.boardId || user.board || user.boardName || "";
      const userClass = user.classId || user.class || user.className || "";
      const response = await getJSON(
        `/api/questions/types?subject=${subject._id}&topic=${topic._id}&class=${userClass}&board=${userBoard}&stage=${stage}&level=${encodeURIComponent(level)}`
      );
      setQuestionTypes(response.types || []);
    } catch (err) {
      console.error("Failed to fetch question types", err);
      setQuestionTypes([]);
    } finally {
      setLoadingTypes(false);
    }
  }

  async function handleLevelSelection(level) {
    setSelectedLevel(level);
    await fetchQuestionTypesForLevel(level);
    setShowLevelSelector(false);
    setShowTypeSelector(true);
  }

  function handleTypeSelection(type) {
    setSelectedType(type);
    setShowTypeSelector(false);
    setShowConfirmDialog(true);
  }

  async function confirmStartExam() {
    if (!subject || !topic || !selectedType || !selectedLevel) return;
    const user = getStoredUser();
    const userClass = user.classId || user.class || user.className || "";
    const userBoard = user.boardId || user.board || user.boardName || "";

    try {
      setStartingExam(true);
      setShowConfirmDialog(false);

      const data = await startExam({
        subject: subject._id,
        topic: topic._id,
        type: selectedType.type === "all" ? "mcq-single" : selectedType.type,
        limit: 10,
        level: selectedLevel,
        stage,
        class: userClass,
        board: userBoard,
      });

      navigate(`/dashboard/exams/take/${data.attemptId}`, {
        state: data,
      });
    } catch (err) {
      console.error("Failed to start exam", err);
      toast.error("Failed to start exam. Please try again.");
      setStartingExam(false);
    }
  }

  function resetFlow() {
    setShowLevelSelector(false);
    setShowTypeSelector(false);
    setShowConfirmDialog(false);
    setSelectedLevel(null);
    setSelectedType(null);
    setQuestionTypes([]);
  }

  function cancelTypeSelector() {
    setShowTypeSelector(false);
    setShowLevelSelector(true);
    setSelectedType(null);
  }

  function goBackToTypeSelector() {
    setShowConfirmDialog(false);
    setShowTypeSelector(true);
  }

  function getHtmlOrFallback(html, fallback) {
    const clean = String(html || "").trim();
    return clean ? clean : `<p class="text-gray-500">${fallback}</p>`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />

      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-5">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-6 shadow-sm">
          <button
            onClick={() => navigate(`/dashboard/syllabus?stage=${stage}`)}
            className="mb-4 text-sm font-semibold text-orange-600 hover:text-orange-700"
          >
            ← Back to Stage {stage} Syllabus
          </button>

          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Stage {stage} • {subject?.name || "-"}
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">{topic?.name || "Topic"}</h1>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
              Content Page
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-6 shadow-sm">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3">Topic Summary</h2>
          <div
            className="prose prose-sm max-w-none text-gray-800"
            dangerouslySetInnerHTML={{
              __html: getHtmlOrFallback(topic?.topicSummary, "Summary is not available yet."),
            }}
          />
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-6 shadow-sm">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3">Learning Outcomes</h2>
          <div
            className="prose prose-sm max-w-none text-gray-800"
            dangerouslySetInnerHTML={{
              __html: getHtmlOrFallback(topic?.learningOutcome, "Learning outcomes are not available yet."),
            }}
          />
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-100 rounded-2xl p-4 md:p-6">
          <h3 className="text-lg font-bold text-gray-900">Practice Now</h3>
          <p className="text-sm text-gray-600 mt-1">
            Ready to practice this topic? Choose your level and question type.
          </p>
          <button
            onClick={() => setShowLevelSelector(true)}
            disabled={startingExam}
            className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-semibold hover:from-orange-600 hover:to-yellow-600 disabled:opacity-60"
          >
            {startingExam ? "Starting..." : "Practice Now"}
          </button>
        </div>
      </div>

      {showLevelSelector && selectedTopic && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full md:max-w-2xl bg-white rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: "90vh" }}>
            <div className="md:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
            <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-5 md:p-6 text-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-xl md:text-2xl font-bold">Choose Level</h3>
                <button onClick={resetFlow} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-1.5 text-orange-100 text-sm">
                {selectedTopic.subject.name} — {selectedTopic.topic.name}
              </p>
            </div>
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

      {showTypeSelector && selectedTopic && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full md:max-w-lg bg-white rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: "90vh" }}>
            <div className="md:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
            <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-5 md:p-6 text-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-xl md:text-2xl font-bold">Question Type</h3>
                <button onClick={cancelTypeSelector} className="p-1 hover:bg-white/20 rounded-full transition-colors">
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
                      className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 hover:border-orange-400 hover:bg-orange-50 active:scale-[0.98] transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
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

      {showConfirmDialog && selectedTopic && selectedType && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full md:max-w-md bg-white rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden">
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
            <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-5 md:p-6 text-white">
              <div className="flex items-center justify-between">
                <h3 className="text-xl md:text-2xl font-bold">Start Exam?</h3>
                <button onClick={resetFlow} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-1.5 text-orange-100 text-sm">{selectedTopic.topic.name}</p>
            </div>
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
                    Stage {stage}
                    {selectedLevel ? ` · Level ${selectedLevel}` : ""}
                  </p>
                </div>
              </div>
            </div>
            <div className="px-5 pt-2 pb-24 md:px-6 md:pb-6 bg-gray-50 flex gap-3">
              <button
                onClick={goBackToTypeSelector}
                className="px-4 py-3 rounded-xl border-2 border-gray-300 font-semibold text-gray-700 hover:bg-gray-100 transition-colors text-sm"
              >
                ← Back
              </button>
              <button
                onClick={resetFlow}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 font-semibold text-gray-700 hover:bg-gray-100 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmStartExam}
                disabled={startingExam}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 font-semibold text-white hover:from-orange-600 hover:to-yellow-600 transition-all shadow-md hover:shadow-lg text-sm disabled:opacity-50"
              >
                {startingExam ? "Starting..." : "Start"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
