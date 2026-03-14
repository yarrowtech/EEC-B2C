import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, BookOpen, ChevronRight, Clock, FileText, ListChecks, Loader2, Sparkles, Trophy, X, Zap } from "lucide-react";
import { getJSON, startExam } from "../../lib/api";
import { ToastContainer, useToast } from "../../components/Toast";

export default function SyllabusTopicContentPage() {
  const { subjectId, topicId } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const stage = Number(searchParams.get("stage") || 1);
  const openPracticeOnLoad = searchParams.get("openPractice") === "1";

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
  const [didAutoOpenPractice, setDidAutoOpenPractice] = useState(false);

  const levelOptions = [
    {
      key: "basic",
      label: "Basic",
      subtitle: "Start simple and build confidence",
      icon: "🌱",
      tone: "from-emerald-500 to-green-500",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-700",
    },
    {
      key: "intermediate",
      label: "Intermediate",
      subtitle: "A bit challenging for practice",
      icon: "🚀",
      tone: "from-orange-500 to-amber-500",
      bg: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-700",
    },
    {
      key: "advanced",
      label: "Advanced",
      subtitle: "Hard questions for top preparation",
      icon: "🏆",
      tone: "from-purple-500 to-indigo-500",
      bg: "bg-purple-50",
      border: "border-purple-200",
      text: "text-purple-700",
    },
  ];

  const selectedTopic = useMemo(() => (subject && topic ? { subject, topic } : null), [subject, topic]);
  const selectedTypeAvailableCount = useMemo(() => {
    if (!selectedType) return 0;
    if (selectedType.type === "all") {
      return questionTypes.reduce((sum, item) => sum + Number(item?.count || 0), 0);
    }
    const match = questionTypes.find((item) => item?.type === selectedType.type);
    return Number(match?.count ?? selectedType.count ?? 0);
  }, [questionTypes, selectedType]);

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

      const subjects = await getJSON(`/api/subject?board=${userBoard}&class=${userClass}`);
      const foundSubject = (subjects || []).find((s) => String(s._id) === String(subjectId));

      if (!foundSubject) {
        toast.error("Subject not found for your class and board.");
        navigate(`/dashboard/syllabus?stage=${stage}`);
        return;
      }

      const topics = await getJSON(
        `/api/topic/${foundSubject._id}?board=${userBoard}&class=${userClass}`
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

  useEffect(() => {
    if (
      !loading &&
      !didAutoOpenPractice &&
      openPracticeOnLoad &&
      subject &&
      topic
    ) {
      setShowLevelSelector(true);
      setDidAutoOpenPractice(true);
    }
  }, [loading, didAutoOpenPractice, openPracticeOnLoad, subject, topic]);

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
      setQuestionTypes((response.types || []).filter((t) => t?.type !== "all"));
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
    const clean = decodeEntityTags(String(html || "").trim());
    return clean ? clean : `<p class="text-gray-400 italic">${fallback}</p>`;
  }

  function decodeEntityTags(value) {
    return String(value || "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&");
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-9 w-9 animate-spin text-amber-500" />
        <p className="text-sm text-gray-500">Loading topic content…</p>
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />

      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-500">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

        <div className="relative mx-auto max-w-5xl px-4 py-8 md:py-10">
          {/* Back button */}
          <button
            onClick={() => navigate(`/dashboard/syllabus?stage=${stage}`)}
            className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/25"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Stage {stage} Syllabus
          </button>

          {/* Breadcrumb chips */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
              <Zap className="h-3 w-3" />
              Stage {stage}
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-white/60" />
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
              <BookOpen className="h-3 w-3" />
              {subject?.name || "Subject"}
            </span>
          </div>

          {/* Topic title */}
          <h1 className="text-2xl font-extrabold leading-tight text-white md:text-4xl">
            {topic?.name || "Topic"}
          </h1>
          <p className="mt-1.5 text-sm text-white/75">Study materials and practice questions</p>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 md:px-6 md:py-8">

        {/* Topic Summary */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/60 px-5 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
              <FileText className="h-4.5 w-4.5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Topic Summary</h2>
              <p className="text-xs text-gray-500">Core concepts and key ideas</p>
            </div>
          </div>
          <div className="px-5 py-5">
            <div
              className="prose prose-sm max-w-none text-gray-700 prose-headings:text-gray-900 prose-strong:text-gray-900 prose-li:text-gray-700"
              dangerouslySetInnerHTML={{
                __html: getHtmlOrFallback(topic?.topicSummary, "Summary is not available yet."),
              }}
            />
          </div>
        </div>

        {/* Learning Outcomes */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/60 px-5 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100">
              <ListChecks className="h-4.5 w-4.5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Learning Outcomes</h2>
              <p className="text-xs text-gray-500">What you will achieve after this topic</p>
            </div>
          </div>
          <div className="px-5 py-5">
            <div
              className="prose prose-sm max-w-none text-gray-700 prose-headings:text-gray-900 prose-strong:text-gray-900 prose-li:text-gray-700"
              dangerouslySetInnerHTML={{
                __html: getHtmlOrFallback(topic?.learningOutcome, "Learning outcomes are not available yet."),
              }}
            />
          </div>
        </div>

        {/* Practice Now CTA */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 shadow-lg md:p-8">
          {/* Background decoration */}
          <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-10 h-32 w-32 rounded-full bg-orange-500/10 blur-2xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-[11px] font-bold text-amber-400">
                <Sparkles className="h-3 w-3" />
                Ready to Test?
              </div>
              <h3 className="text-xl font-bold text-white md:text-2xl">Practice Now</h3>
              <p className="mt-1 max-w-sm text-sm text-gray-400">
                Choose your difficulty level and start practising {topic?.name || "this topic"}.
              </p>

              {/* Level preview chips */}
              <div className="mt-3 flex flex-wrap gap-2">
                {levelOptions.map((lvl) => (
                  <span key={lvl.key} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-gray-300">
                    {lvl.icon} {lvl.label}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowLevelSelector(true)}
              disabled={startingExam}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-500/30 transition hover:from-amber-600 hover:to-orange-600 hover:shadow-amber-500/40 active:scale-[.98] disabled:opacity-60"
            >
              {startingExam ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting…
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Start Practice
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ══ LEVEL SELECTOR MODAL ══ */}
      {showLevelSelector && selectedTopic && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center md:p-4">
          <div
            className="flex w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl md:max-w-2xl md:rounded-3xl"
            style={{ maxHeight: "92vh" }}
          >
            {/* Mobile handle */}
            <div className="flex justify-center pt-3 pb-1 md:hidden">
              <div className="h-1 w-10 rounded-full bg-gray-300" />
            </div>

            {/* Modal header */}
            <div className="relative flex-shrink-0 overflow-hidden bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-5 md:px-6 md:py-6">
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-white md:text-2xl">Choose Your Level</h3>
                  <p className="mt-1 text-sm text-orange-100">
                    {selectedTopic.subject.name} — {selectedTopic.topic.name}
                  </p>
                </div>
                <button
                  onClick={resetFlow}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Level cards */}
            <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {levelOptions.map((level) => (
                  <button
                    key={level.key}
                    onClick={() => handleLevelSelection(level.key)}
                    className={`group flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition hover:shadow-md active:scale-[.98] sm:flex-col sm:items-start md:p-5 ${level.border} hover:border-orange-400`}
                  >
                    <div className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-2xl shadow-md ${level.tone}`}>
                      {level.icon}
                    </div>
                    <div>
                      <p className="text-base font-bold text-gray-900 group-hover:text-orange-700">{level.label}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{level.subtitle}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ QUESTION TYPE SELECTOR MODAL ══ */}
      {showTypeSelector && selectedTopic && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center md:p-4">
          <div
            className="flex w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl md:max-w-lg md:rounded-3xl"
            style={{ maxHeight: "92vh" }}
          >
            <div className="flex justify-center pt-3 pb-1 md:hidden">
              <div className="h-1 w-10 rounded-full bg-gray-300" />
            </div>

            <div className="relative flex-shrink-0 overflow-hidden bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-5 md:px-6">
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-white md:text-2xl">Question Type</h3>
                  <p className="mt-1 text-sm text-orange-100">
                    {selectedTopic.subject.name} — {selectedTopic.topic.name}
                  </p>
                  {selectedLevel && (
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold text-white">
                      {levelOptions.find(l => l.key === selectedLevel)?.icon} {selectedLevel}
                    </span>
                  )}
                </div>
                <button
                  onClick={cancelTypeSelector}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5">
              {loadingTypes ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                  <p className="text-sm text-gray-500">Loading question types…</p>
                </div>
              ) : questionTypes.length === 0 ? (
                <div className="flex flex-col items-center px-4 py-14 text-center">
                  <div className="mb-3 text-5xl">🤔</div>
                  <h4 className="text-lg font-bold text-gray-900">No Questions Yet</h4>
                  <p className="mt-1 text-sm text-gray-500">
                    There are no questions available for this topic at this level.
                  </p>
                  <button
                    onClick={cancelTypeSelector}
                    className="mt-5 rounded-xl border-2 border-gray-200 px-6 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Try Another Level
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {questionTypes.map((qType, index) => (
                    <button
                      key={index}
                      onClick={() => handleTypeSelection(qType)}
                      disabled={qType.count === 0}
                      className="group flex w-full items-center justify-between rounded-xl border-2 border-gray-100 p-4 text-left transition hover:border-amber-300 hover:bg-amber-50/60 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl leading-none">{qType.icon || "📝"}</span>
                        <div>
                          <p className="font-semibold text-gray-900 group-hover:text-amber-800">{qType.label}</p>
                          {qType.count !== null && (
                            <p className="text-xs text-gray-400">
                              {qType.count} question{qType.count !== 1 ? "s" : ""} available
                            </p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-amber-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ CONFIRM START DIALOG ══ */}
      {showConfirmDialog && selectedTopic && selectedType && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center md:p-4">
          <div className="w-full overflow-hidden rounded-t-3xl bg-white shadow-2xl md:max-w-md md:rounded-3xl">
            <div className="flex justify-center pt-3 pb-1 md:hidden">
              <div className="h-1 w-10 rounded-full bg-gray-300" />
            </div>

            <div className="relative overflow-hidden bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-5 md:px-6">
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-white md:text-2xl">Ready to Start?</h3>
                  <p className="mt-1 text-sm text-orange-100">{selectedTopic.topic.name}</p>
                </div>
                <button
                  onClick={resetFlow}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Summary info */}
            <div className="space-y-3 px-5 py-5 md:px-6">
              <div className="flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                  <FileText className="h-4.5 w-4.5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedTypeAvailableCount} Question{selectedTypeAvailableCount !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-gray-500">{selectedType.label}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                  <Clock className="h-4.5 w-4.5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">No Time Limit</p>
                  <p className="text-xs text-gray-500">Take your time to answer</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-purple-50 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-100">
                  <Trophy className="h-4.5 w-4.5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{selectedTopic.subject.name}</p>
                  <p className="text-xs text-gray-500">
                    Stage {stage}{selectedLevel ? ` · ${selectedLevel.charAt(0).toUpperCase() + selectedLevel.slice(1)} level` : ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2.5 bg-gray-50 px-5 pb-8 pt-3 md:px-6 md:pb-6">
              <button
                onClick={goBackToTypeSelector}
                className="flex items-center gap-1.5 rounded-xl border-2 border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                onClick={resetFlow}
                className="flex-1 rounded-xl border-2 border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmStartExam}
                disabled={startingExam}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-bold text-white shadow-md shadow-amber-500/25 transition hover:from-amber-600 hover:to-orange-600 active:scale-[.98] disabled:opacity-60"
              >
                {startingExam ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Starting…</>
                ) : (
                  <><Zap className="h-4 w-4" /> Start</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
