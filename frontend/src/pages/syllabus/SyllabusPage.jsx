import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, X, FileText, Clock, ListChecks, Lock, ChevronRight } from "lucide-react";
import { getJSON, startExam } from "../../lib/api";
import { ToastContainer, useToast } from "../../components/Toast";

/* ── Helper: Material icon component ── */
function MIcon({ name, className = "", fill = false }) {
  return (
    <span
      className={`material-symbols-outlined ${fill ? "fill-icon" : ""} ${className}`}
      style={fill ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {name}
    </span>
  );
}

/* ── Gradient palette cycling for subject cards ── */
const CARD_THEMES = [
  {
    gradient: "from-blue-400 to-indigo-600",
    icon: "calculate",
    tagBg: "bg-blue-100 dark:bg-blue-900/30",
    tagText: "text-blue-700 dark:text-blue-300",
  },
  {
    gradient: "from-emerald-400 to-teal-600",
    icon: "biotech",
    tagBg: "bg-teal-100 dark:bg-teal-900/30",
    tagText: "text-teal-700 dark:text-teal-300",
  },
  {
    gradient: "from-orange-400 to-pink-600",
    icon: "menu_book",
    tagBg: "bg-orange-100 dark:bg-orange-900/30",
    tagText: "text-orange-700 dark:text-orange-300",
  },
  {
    gradient: "from-amber-600 to-yellow-900",
    gradientStyle: "linear-gradient(to bottom right, #d97706, #78350f)",
    icon: "explore",
    tagBg: "bg-amber-100 dark:bg-amber-900/30",
    tagText: "text-amber-700 dark:text-amber-300",
  },
  {
    gradient: "from-cyan-500 to-blue-700",
    icon: "public",
    tagBg: "bg-cyan-100 dark:bg-cyan-900/30",
    tagText: "text-cyan-700 dark:text-cyan-300",
  },
  {
    gradient: "from-purple-400 to-violet-600",
    icon: "psychology",
    tagBg: "bg-purple-100 dark:bg-purple-900/30",
    tagText: "text-purple-700 dark:text-purple-300",
  },
  {
    gradient: "from-rose-400 to-red-600",
    icon: "science",
    tagBg: "bg-rose-100 dark:bg-rose-900/30",
    tagText: "text-rose-700 dark:text-rose-300",
  },
];

const DIFFICULTY_BADGES = [
  { label: "Easy Peasy", icon: "sentiment_satisfied", bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300" },
  { label: "Challenger", icon: "bolt", bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-600" },
  { label: "Master Mind", icon: "psychology", bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300" },
];

const TOPIC_NUMBER_THEMES = [
  "from-blue-400 to-indigo-500",
  "from-emerald-400 to-teal-500",
  "from-orange-400 to-pink-500",
  "from-purple-400 to-violet-500",
  "from-cyan-400 to-blue-500",
  "from-rose-400 to-red-500",
];

export default function SyllabusPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [showTopicsModal, setShowTopicsModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showTopicDetailsModal, setShowTopicDetailsModal] = useState(false);
  const [selectedTopicForDetails, setSelectedTopicForDetails] = useState(null);
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

  // Handle ESC key to close topic details modal
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && showTopicDetailsModal) {
        closeTopicDetailsModal();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showTopicDetailsModal]);

  useEffect(() => {
    const stageParam = searchParams.get("stage");
    const stage = stageParam ? parseInt(stageParam, 10) : 1;

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
      setUnlockedStages([1]);
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

      let user = getStoredUser();

      if (!hasBoardAndClass(user)) {
        user = await loadUserProfile();
      }

      const userBoard = user.boardId || user.board || user.boardName || "";
      const userClass = user.classId || user.class || user.className || "";

      if (!userBoard || !userClass) {
        console.error("User board or class not found");
        toast.error("Please update your profile with board and class information.");
        setSubjects([]);
        setLoading(false);
        return;
      }

      const url = `/api/subject?board=${userBoard}&class=${userClass}`;
      const subjectsRes = await getJSON(url);

      if (!subjectsRes || subjectsRes.length === 0) {
        setSubjects([]);
        setLoading(false);
        return;
      }

      const subjectsWithTopics = await Promise.all(
        subjectsRes.map(async (subject) => {
          try {
            const topics = await getJSON(
              `/api/topic/${subject._id}?board=${userBoard}&class=${userClass}`
            );
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

  function handleSubjectClick(subject) {
    setSelectedSubject(subject);
    setShowTopicsModal(true);
  }

  function handleTopicClick(subject, topic) {
    setShowTopicsModal(false);
    setSelectedTopic({ subject, topic });
    setShowLevelSelector(true);
  }

  function handleTopicInfoClick(subject, topic, e) {
    e.stopPropagation();
    setSelectedTopicForDetails({ subject, topic });
    setShowTopicDetailsModal(true);
    setShowTopicsModal(false); // Close topics modal when opening details
  }

  function closeTopicDetailsModal() {
    setShowTopicDetailsModal(false);
    const wasFromTopicsModal = selectedSubject !== null;
    setSelectedTopicForDetails(null);
    // Optionally reopen topics modal if it was open before
    if (wasFromTopicsModal) {
      setShowTopicsModal(true);
    }
  }

  function getHtmlOrFallback(html, fallback) {
    const clean = decodeEntityTags(String(html || "").trim());
    return clean ? clean : `<p class="text-slate-400 italic">${fallback}</p>`;
  }

  function decodeEntityTags(value) {
    return String(value || "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&");
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
      setSelectedSubject(null);
      setShowTopicsModal(false);
    }
  }

  function cancelLevelSelector() {
    setShowLevelSelector(false);
    setSelectedTopic(null);
    setSelectedLevel(null);
    setSelectedType(null);
    setQuestionTypes([]);
    // Go back to topics modal
    setShowTopicsModal(true);
  }

  function cancelTypeSelector() {
    setShowTypeSelector(false);
    setSelectedType(null);
    setSelectedLevel(null);
    setQuestionTypes([]);
    setShowLevelSelector(true);
  }

  function cancelStartExam() {
    setShowConfirmDialog(false);
    setSelectedType(null);
    setShowTypeSelector(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <Loader2 className="w-8 h-8 animate-spin text-[#e7c555]" />
      </div>
    );
  }

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userBoardName = user.boardName || user.board || "Your Board";
  const userClassName = user.className || user.class || "Your Class";

  return (
    <>
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />

      <div
        className="min-h-screen bg-[#f8f7f6] dark:bg-[#211d11]"
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        {/* ── Main Content ── */}
        <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 md:px-10 py-8">

          {/* ── Hero Section ── */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#e7c555]/20 to-[#e7c555]/5 rounded-[3rem] p-8 border border-[#e7c555]/20 mb-8">
            {/* Decorative background elements */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#e7c555]/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 left-10 h-40 w-40 rounded-full bg-[#e7c555]/10 blur-2xl" />

            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[#e7c555] font-bold text-sm uppercase tracking-widest">
                <MIcon name="star" className="text-[18px]" />
                Level Up Your Brain
              </div>
              <div className="flex flex-wrap justify-between items-end gap-4">
                <div className="flex flex-col gap-2 max-w-2xl">
                  <h1 className="text-slate-900 dark:text-white text-4xl md:text-5xl font-black leading-tight tracking-tight">
                    Adventure Tryouts!
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">
                    Pick a subject quest, earn badges, and climb the ranks. Are you ready, explorer?
                  </p>
                </div>
                <div className="flex flex-col gap-3 min-w-[240px]">
                  <div className="flex items-center gap-4 bg-[#e7c555]/20 p-4 rounded-[3rem] border border-[#e7c555]/30">
                    <div className="bg-[#e7c555] p-2 rounded-[2rem] text-white">
                      <MIcon name="trophy" fill className="text-2xl" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#e7c555] uppercase">
                        Stage {currentStage}
                      </p>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {currentStage === 1 ? "Explorer" : `Stage ${currentStage} Explorer`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative background icon */}
            <MIcon
              name="rocket_launch"
              className="absolute -bottom-10 -right-10 text-[200px] text-[#e7c555]/10 pointer-events-none"
            />
          </div>

          {/* ── Filters ── */}
          <div className="flex flex-wrap gap-3 mb-10 pb-6 border-b border-slate-200 dark:border-slate-800">
            {/* Board pill */}
            <button className="flex h-11 items-center justify-center gap-x-2 rounded-full bg-[#e7c555] text-slate-900 px-6 font-bold shadow-lg shadow-[#e7c555]/20">
              <MIcon name="school" className="text-[20px]" />
              {userBoardName}
              <MIcon name="expand_more" className="text-[20px]" />
            </button>
            {/* Class pill */}
            <button className="flex h-11 items-center justify-center gap-x-2 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-6 font-bold border border-slate-200 dark:border-slate-700 hover:border-[#e7c555] transition-all">
              <MIcon name="grade" className="text-[20px]" />
              {userClassName}
              <MIcon name="expand_more" className="text-[20px]" />
            </button>
            {/* Separator */}
            <div className="h-11 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2 hidden sm:block" />
            {/* Stage selector pills */}
            {allStages.map((stage) => {
              const isUnlocked = unlockedStages.includes(stage);
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
                  className={`flex h-11 items-center justify-center gap-x-2 rounded-full px-6 font-bold border transition-all ${
                    isActive
                      ? "bg-[#e7c555] text-slate-900 border-transparent shadow-lg shadow-[#e7c555]/20"
                      : isUnlocked
                      ? "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#e7c555]"
                      : "bg-slate-100 dark:bg-slate-800/50 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed"
                  }`}
                >
                  {!isUnlocked && <Lock className="w-3.5 h-3.5" />}
                  Stage {stage}
                  {stage === 1 && <span className="text-xs ml-1 text-emerald-600 font-semibold">(Free)</span>}
                </button>
              );
            })}
          </div>

          {/* ── Subject Cards Grid ── */}
          {subjects.length === 0 ? (
            <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-[3rem] shadow-sm p-12 text-center border border-slate-200 dark:border-slate-800">
              {/* Decorative background */}
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#e7c555]/5 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-[#e7c555]/5 blur-2xl" />

              <div className="relative z-10">
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <MIcon name="auto_stories" className="text-8xl text-slate-200 dark:text-slate-700" />
                    <div className="absolute -top-2 -right-2 w-10 h-10 bg-[#e7c555]/20 rounded-full flex items-center justify-center">
                      <MIcon name="search_off" className="text-[#e7c555] text-xl" />
                    </div>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">No Subjects Available</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                  No subjects have been added for{" "}
                  <span className="font-semibold text-[#e7c555]">{userBoardName}</span> —{" "}
                  <span className="font-semibold text-[#e7c555]">{userClassName}</span> yet. Please contact your administrator.
                </p>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="px-6 py-3 rounded-[2rem] bg-[#e7c555] hover:bg-[#d4b44a] font-bold text-slate-900 transition-all shadow-md hover:shadow-lg"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {subjects.map((subject, subjectIndex) => {
                const theme = CARD_THEMES[subjectIndex % CARD_THEMES.length];
                const topicCount = subject.topics?.length || 0;
                const diffBadge = DIFFICULTY_BADGES[subjectIndex % DIFFICULTY_BADGES.length];

                return (
                  <div
                    key={subject._id}
                    className="flex flex-col bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-[#e7c555]/50 transition-all group"
                  >
                    {/* Card gradient header */}
                    <div
                      className={`h-40 bg-gradient-to-br ${theme.gradient} relative overflow-hidden p-6 flex flex-col justify-end`}
                      style={theme.gradientStyle ? { backgroundImage: theme.gradientStyle } : undefined}
                    >
                      {/* Decorative blobs */}
                      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                      <div className="pointer-events-none absolute -bottom-4 left-4 h-24 w-24 rounded-full bg-white/10 blur-xl" />

                      {/* Time badge */}
                      <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/30">
                        {topicCount} Topic{topicCount !== 1 ? "s" : ""}
                      </div>
                      {/* Background decoration icon */}
                      <MIcon
                        name={theme.icon}
                        className="text-white/20 text-8xl absolute -bottom-4 -right-4 rotate-12 group-hover:rotate-0 transition-transform duration-300"
                      />
                      {/* Subject name */}
                      <h3 className="text-white text-2xl font-black relative z-10">{subject.name}</h3>
                    </div>

                    {/* Card body */}
                    <div className="p-6 flex flex-col gap-4">
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        <span className={`${theme.tagBg} ${theme.tagText} text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1`}>
                          <MIcon name="format_list_numbered" className="text-[14px]" />
                          {topicCount} Topic{topicCount !== 1 ? "s" : ""}
                        </span>
                        <span className={`${diffBadge.bg} ${diffBadge.text} text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1`}>
                          <MIcon name={diffBadge.icon} className="text-[14px]" />
                          {diffBadge.label}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2">
                        {subject.description || `Explore ${subject.name} topics and test your knowledge with fun quests and challenges!`}
                      </p>

                      {/* Start Quest button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (topicCount > 0) {
                            handleSubjectClick(subject);
                          }
                        }}
                        disabled={topicCount === 0}
                        className="w-full bg-[#e7c555] hover:bg-[#d4b44a] text-slate-900 font-bold py-3 rounded-[2rem] flex items-center justify-center gap-2 transition-all group-hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Start Quest <MIcon name="play_circle" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Locked quest placeholder — show if there are locked stages */}
              {allStages.some((s) => !unlockedStages.includes(s)) && (
                <div className="flex flex-col bg-slate-100 dark:bg-slate-800/50 rounded-[3rem] overflow-hidden border border-dashed border-slate-300 dark:border-slate-700 relative group opacity-80">
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-slate-900/10 backdrop-blur-[2px]">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-lg text-[#e7c555] mb-2">
                      <MIcon name="lock" fill className="text-4xl" />
                    </div>
                    <p className="text-slate-900 dark:text-white font-bold">Unlock More Stages</p>
                    <button
                      onClick={() => navigate("/dashboard/packages")}
                      className="mt-2 text-xs text-[#e7c555] font-bold underline"
                    >
                      View Packages
                    </button>
                  </div>
                  <div className="h-40 bg-slate-300 dark:bg-slate-700" />
                  <div className="p-6 flex flex-col gap-4 grayscale">
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded-[1rem]" />
                    <div className="h-10 w-full bg-slate-200 dark:bg-slate-700 rounded-[2rem]" />
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ── TOPICS MODAL (Syllabus View) ──                    */}
      {/* ═══════════════════════════════════════════════════════ */}
      {showTopicsModal && selectedSubject && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#f8f7f6] dark:bg-[#211d11]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {/* Top Header */}
          <header className="flex items-center justify-between px-6 py-4 border-b border-[#e7c555]/10 bg-white/80 dark:bg-[#211d11]/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setShowTopicsModal(false);
                  setSelectedSubject(null);
                }}
                className="p-2 rounded-[2rem] bg-[#e7c555]/20 hover:bg-[#e7c555]/30 transition-colors"
              >
                <MIcon name="arrow_back" />
              </button>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                <span>Syllabus</span>
                <MIcon name="chevron_right" className="text-xs" />
                <span className="text-slate-900 dark:text-slate-100">{selectedSubject.name}</span>
              </div>
            </div>
            <button
              onClick={() => {
                setShowTopicsModal(false);
                setSelectedSubject(null);
              }}
              className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </header>

          <div className="p-6 md:p-10 max-w-5xl mx-auto w-full flex flex-col gap-8">
            {/* Syllabus Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#e7c555]/20 to-[#e7c555]/5 rounded-[3rem] p-8 border border-[#e7c555]/20">
              <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex flex-col gap-2">
                  <span className="bg-[#e7c555]/30 text-[#211d11] dark:text-slate-900 px-3 py-1 rounded-full text-xs font-bold w-fit uppercase">
                    Stage {currentStage} Quest
                  </span>
                  <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                    {selectedSubject.name} Syllabus
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 max-w-md">
                    Master the concepts through structured quests and interactive challenges!
                  </p>
                </div>
                <div className="flex flex-col gap-3 min-w-[240px]">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">Topics Available</span>
                    <span className="text-2xl font-black text-[#e7c555]">{selectedSubject.topics?.length || 0}</span>
                  </div>
                  <div className="w-full h-4 bg-white/50 dark:bg-black/20 rounded-full overflow-hidden p-1">
                    <div className="h-full bg-[#e7c555] rounded-full" style={{ width: '35%' }}></div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-right font-medium">Ready to explore!</p>
                </div>
              </div>
              {/* Decorative background icon */}
              <MIcon
                name="auto_stories"
                className="absolute -bottom-10 -right-10 text-[200px] text-[#e7c555]/10 pointer-events-none"
              />
            </div>

            {/* Topics List */}
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold px-2 flex items-center gap-2 text-slate-900 dark:text-white">
                <MIcon name="map" className="text-[#e7c555]" />
                Adventure Path
              </h2>

              {selectedSubject.topics && selectedSubject.topics.length > 0 ? (
                <details className="group bg-white dark:bg-[#211d11]/40 border border-[#e7c555]/10 rounded-[3rem] overflow-hidden shadow-sm" open>
                  <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-[#e7c555]/5 transition-colors list-none">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-[3rem] bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                        <MIcon name="explore" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">{selectedSubject.name} Topics</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{selectedSubject.topics.length} Quest{selectedSubject.topics.length !== 1 ? 's' : ''} Available</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:block text-right">
                        <div className="text-xs font-bold text-slate-400 dark:text-slate-500">STATUS</div>
                        <div className="text-xs font-bold text-blue-500">READY TO START</div>
                      </div>
                      <MIcon name="expand_more" className="rotate-icon transition-transform text-slate-600 dark:text-slate-400" />
                    </div>
                  </summary>
                  <div className="p-5 border-t border-[#e7c555]/5 bg-slate-50/50 dark:bg-[#211d11]/20 flex flex-col gap-3">
                    {selectedSubject.topics.map((topic, index) => (
                      <div
                        key={topic._id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-[#211d11] rounded-[3rem] border border-[#e7c555]/5 shadow-sm hover:shadow-md transition-all group/item"
                      >
                        <div className="flex items-center gap-4 mb-3 sm:mb-0">
                          <div className="size-8 rounded-full bg-[#e7c555]/20 flex items-center justify-center text-[#e7c555]">
                            <MIcon name="play_arrow" className="text-sm" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 dark:text-white">{topic.name}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTopicInfoClick(selectedSubject, topic, e);
                                }}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                                title="View topic details"
                              >
                                <MIcon name="info" className="text-[14px] text-slate-400" />
                              </button>
                            </div>
                            {topic.description && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                                {topic.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleTopicClick(selectedSubject, topic)}
                          className="px-4 py-2 rounded-full bg-[#e7c555] text-[#211d11] dark:text-slate-900 font-bold text-sm hover:scale-105 transition-transform shadow-md whitespace-nowrap"
                        >
                          Start Learning
                        </button>
                      </div>
                    ))}
                  </div>
                </details>
              ) : (
                <div className="p-8 text-center flex flex-col items-center gap-3 bg-white dark:bg-[#211d11]/40 border border-[#e7c555]/10 rounded-[3rem]">
                  <MIcon name="lock_open" className="text-4xl text-slate-300 dark:text-slate-700" />
                  <p className="text-slate-500 dark:text-slate-400 font-medium">No topics available for this subject yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ── LEVEL SELECTOR (bottom sheet on mobile) ──         */}
      {/* ═══════════════════════════════════════════════════════ */}
      {showLevelSelector && selectedTopic && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 bg-black/50 backdrop-blur-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <div
            className="w-full md:max-w-2xl bg-white rounded-t-[3rem] md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: "90vh" }}
          >
            {/* Drag handle - mobile only */}
            <div className="md:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-[#e7c555] to-[#d4a843] p-5 md:p-6 text-slate-900 flex-shrink-0">
              {/* Decorative blobs */}
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl md:text-2xl font-bold">Choose Level</h3>
                  <button
                    onClick={cancelLevelSelector}
                    className="p-1 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="mt-1.5 text-slate-700/80 text-sm">
                  {selectedTopic.subject.name} — {selectedTopic.topic.name}
                </p>
              </div>
            </div>
            {/* Body */}
            <div className="px-4 pt-4 pb-24 md:p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                {levelOptions.map((level) => (
                  <button
                    key={level.key}
                    onClick={() => handleLevelSelection(level.key)}
                    className="rounded-[3rem] border-2 border-slate-200 hover:border-[#e7c555] hover:shadow-lg active:scale-[0.98] transition-all p-4 md:p-5 text-left flex items-center gap-3 sm:flex-col sm:items-start group"
                  >
                    <div className={`w-12 h-12 rounded-[3rem] bg-gradient-to-br ${level.tone} flex items-center justify-center text-2xl shadow-md flex-shrink-0`}>
                      {level.icon}
                    </div>
                    <div>
                      <h4 className="text-base md:text-lg font-bold text-slate-900 group-hover:text-[#c5a832]">{level.label}</h4>
                      <p className="mt-0.5 text-xs md:text-sm text-slate-600">{level.subtitle}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ── QUESTION TYPE SELECTOR (bottom sheet on mobile) ── */}
      {/* ═══════════════════════════════════════════════════════ */}
      {showTypeSelector && selectedTopic && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 bg-black/50 backdrop-blur-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <div
            className="w-full md:max-w-lg bg-white rounded-t-[3rem] md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: "90vh" }}
          >
            <div className="md:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
            <div className="relative overflow-hidden bg-gradient-to-r from-[#e7c555] to-[#d4a843] p-5 md:p-6 text-slate-900 flex-shrink-0">
              {/* Decorative blobs */}
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl md:text-2xl font-bold">Question Type</h3>
                  <button
                    onClick={cancelTypeSelector}
                    className="p-1 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="mt-1.5 text-slate-700/80 text-sm">
                  {selectedTopic.subject.name} — {selectedTopic.topic.name}
                </p>
                {selectedLevel && (
                  <p className="mt-1 text-xs text-slate-700/60 uppercase tracking-wide">
                    Level: {selectedLevel}
                  </p>
                )}
              </div>
            </div>
            <div className="px-4 pt-4 pb-24 md:p-6 overflow-y-auto flex-1">
              {loadingTypes ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-[#e7c555]" />
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
                    className="px-6 py-2 rounded-[3rem] border-2 border-gray-300 font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
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
                      className="w-full flex items-center justify-between p-4 rounded-[3rem] border-2 border-gray-200 hover:border-[#e7c555] hover:bg-[#e7c555]/5 active:scale-[0.98] transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-white"
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

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ── CONFIRM DIALOG (bottom sheet on mobile) ──         */}
      {/* ═══════════════════════════════════════════════════════ */}
      {showConfirmDialog && selectedTopic && selectedType && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 bg-black/50 backdrop-blur-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <div className="w-full md:max-w-md bg-white rounded-t-[3rem] md:rounded-[3rem] shadow-2xl overflow-hidden">
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-[#e7c555] to-[#d4a843] p-5 md:p-6 text-slate-900">
              {/* Decorative blobs */}
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl md:text-2xl font-bold">Start Exam?</h3>
                  <button
                    onClick={cancelStartExam}
                    className="p-1 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="mt-1.5 text-slate-700/80 text-sm">
                  {selectedTopic.topic.name}
                </p>
              </div>
            </div>
            {/* Body */}
            <div className="px-5 pt-5 pb-6 md:p-6 space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-[2rem] flex-shrink-0">
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
                <div className="p-2 bg-green-100 rounded-[2rem] flex-shrink-0">
                  <Clock className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">No Time Limit</p>
                  <p className="text-sm text-gray-500">Take your time to answer</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-[2rem] flex-shrink-0">
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
              <div className="bg-[#e7c555]/10 border border-[#e7c555]/30 rounded-[3rem] p-3.5">
                <p className="text-sm text-slate-700">
                  Make sure you're ready! Once started, give it your best effort.
                </p>
              </div>
            </div>
            {/* Footer */}
            <div className="px-5 pt-2 pb-24 md:px-6 md:pb-6 bg-gray-50 flex gap-3">
              <button
                onClick={goBackToTypeSelector}
                className="px-4 py-3 rounded-[3rem] border-2 border-gray-300 font-semibold text-gray-700 hover:bg-gray-100 transition-colors text-sm"
              >
                ← Back
              </button>
              <button
                onClick={cancelStartExam}
                className="flex-1 px-4 py-3 rounded-[3rem] border-2 border-gray-300 font-semibold text-gray-700 hover:bg-gray-100 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmStartExam}
                disabled={startingExam}
                className="flex-1 px-4 py-3 rounded-[3rem] bg-[#e7c555] hover:bg-[#d4b44a] font-semibold text-slate-900 active:scale-[0.98] transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ── TOPIC DETAILS MODAL (Syllabus View) ──             */}
      {/* ═══════════════════════════════════════════════════════ */}
      {showTopicDetailsModal && selectedTopicForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <div
            className="w-full max-w-5xl bg-[#f8f7f6] dark:bg-[#211d11] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
          >
            {/* Syllabus Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#e7c555]/20 to-[#e7c555]/5 rounded-t-[3rem] p-8 border border-[#e7c555]/20">
              <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex flex-col gap-2">
                  <span className="bg-[#e7c555]/30 text-[#211d11] dark:text-slate-900 px-3 py-1 rounded-full text-xs font-bold w-fit uppercase">
                    Stage {currentStage} • {selectedTopicForDetails.subject.name}
                  </span>
                  <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                    {selectedTopicForDetails.topic.name}
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 max-w-md">
                    Master the concepts and practice with interactive quizzes!
                  </p>
                </div>
                <button
                  onClick={closeTopicDetailsModal}
                  className="absolute top-4 right-4 p-2 hover:bg-[#e7c555]/20 rounded-full transition-colors z-20"
                >
                  <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
              </div>
              {/* Decorative background icon */}
              <MIcon
                name="functions"
                className="absolute -bottom-10 -right-10 text-[200px] text-[#e7c555]/10 pointer-events-none"
              />
            </div>

            {/* Body - Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10">
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-bold px-2 flex items-center gap-2 text-slate-900 dark:text-white">
                  <MIcon name="map" className="text-[#e7c555]" />
                  Adventure Path
                </h2>

                {/* Topic Summary Section */}
                <details className="group bg-white dark:bg-[#211d11]/40 border border-[#e7c555]/10 rounded-[3rem] overflow-hidden shadow-sm" open>
                  <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-[#e7c555]/5 transition-colors list-none">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-[3rem] bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                        <MIcon name="pin_drop" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">Topic Summary</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Core concepts and key ideas</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:block text-right">
                        <div className="text-xs font-bold text-slate-400">SECTION</div>
                        <div className="text-xs font-bold text-blue-500">OVERVIEW</div>
                      </div>
                      <MIcon name="expand_more" className="rotate-icon transition-transform text-slate-600 dark:text-slate-400" />
                    </div>
                  </summary>
                  <div className="p-5 border-t border-[#e7c555]/5 bg-slate-50/50 dark:bg-[#211d11]/20">
                    <div
                      className="prose prose-sm max-w-none text-slate-700 dark:text-slate-300 prose-headings:text-slate-900 dark:prose-headings:text-white prose-strong:text-slate-900 dark:prose-strong:text-white prose-li:text-slate-700 dark:prose-li:text-slate-300"
                      dangerouslySetInnerHTML={{
                        __html: getHtmlOrFallback(selectedTopicForDetails.topic.topicSummary, "Summary is not available yet."),
                      }}
                    />
                  </div>
                </details>

                {/* Learning Outcomes Section */}
                <details className="group bg-white dark:bg-[#211d11]/40 border border-[#e7c555]/10 rounded-[3rem] overflow-hidden shadow-sm">
                  <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-[#e7c555]/5 transition-colors list-none">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-[3rem] bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                        <MIcon name="category" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">Learning Outcomes</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">What you will achieve</p>
                      </div>
                    </div>
                    <MIcon name="expand_more" className="rotate-icon transition-transform text-slate-600 dark:text-slate-400" />
                  </summary>
                  <div className="p-5 border-t border-[#e7c555]/5 bg-slate-50/50 dark:bg-[#211d11]/20">
                    <div
                      className="prose prose-sm max-w-none text-slate-700 dark:text-slate-300 prose-headings:text-slate-900 dark:prose-headings:text-white prose-strong:text-slate-900 dark:prose-strong:text-white prose-li:text-slate-700 dark:prose-li:text-slate-300"
                      dangerouslySetInnerHTML={{
                        __html: getHtmlOrFallback(selectedTopicForDetails.topic.learningOutcome, "Learning outcomes are not available yet."),
                      }}
                    />
                  </div>
                </details>

                {/* Practice CTA Section */}
                <details className="group bg-white dark:bg-[#211d11]/40 border border-[#e7c555]/10 rounded-[3rem] overflow-hidden shadow-sm">
                  <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-[#e7c555]/5 transition-colors list-none">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-[3rem] bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
                        <MIcon name="calculate" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">Start Practice</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Ready to test your knowledge?</p>
                      </div>
                    </div>
                    <MIcon name="expand_more" className="rotate-icon transition-transform text-slate-600 dark:text-slate-400" />
                  </summary>
                  <div className="p-5 border-t border-[#e7c555]/5 bg-slate-50/50 dark:bg-[#211d11]/20 flex flex-col gap-3">
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-[#211d11] rounded-[3rem] border border-[#e7c555]/5 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="size-8 rounded-full bg-[#e7c555]/20 flex items-center justify-center text-[#e7c555]">
                          <MIcon name="play_arrow" className="text-sm" />
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-white">Begin Quest</span>
                      </div>
                      <button
                        onClick={() => {
                          setShowTopicDetailsModal(false);
                          setSelectedTopic({
                            subject: selectedTopicForDetails.subject,
                            topic: selectedTopicForDetails.topic
                          });
                          setShowLevelSelector(true);
                        }}
                        className="px-4 py-2 rounded-full bg-[#e7c555] text-[#211d11] dark:text-slate-900 font-bold text-sm hover:scale-105 transition-transform shadow-md"
                      >
                        Start Learning
                      </button>
                    </div>
                  </div>
                </details>
              </div>
            </div>

            {/* Footer - Close button */}
            <div className="border-t border-[#e7c555]/10 bg-white dark:bg-[#211d11]/60 p-5 flex justify-between items-center">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Press ESC to close
              </div>
              <button
                onClick={closeTopicDetailsModal}
                className="px-6 py-3 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
