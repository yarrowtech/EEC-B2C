import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, X, Lock } from "lucide-react";
import { getJSON, startExam, myAttempts } from "../../lib/api";
import { ToastContainer, useToast } from "../../components/Toast";

/* ── Helper: Material icon component ── */
function MIcon({ name, className = "", fill = false, style }) {
  const fillStyle = fill ? { fontVariationSettings: "'FILL' 1" } : undefined;
  return (
    <span
      className={`material-symbols-outlined ${fill ? "fill-icon" : ""} ${className}`}
      style={{ ...fillStyle, ...style }}
    >
      {name}
    </span>
  );
}

/* ── Easy / Medium / Hard tab metadata, keyed by numeric stage ── */
const STAGE_LEVEL_META = {
  1: { label: "Stage 1", icon: "sentiment_satisfied" },
  2: { label: "Stage 2", icon: "bolt" },
  3: { label: "Stage 3", icon: "military_tech" },
};

function getStageLevelMeta(stage) {
  return STAGE_LEVEL_META[stage] || { label: `Stage ${stage}`, icon: "school" };
}

/* ── Subject theming: icon, gradient, description & CTA by subject name ── */
function getSubjectTheme(name = "") {
  const n = String(name || "").toLowerCase();
  if (/math/.test(n)) {
    return {
      icon: "calculate",
      grad: ["#FF8A75", "#FF5C5C"],
      description: "Solve magical puzzles and master numbers!",
      cta: "Let's Count!",
    };
  }
  if (/sci|physic|chem|bio/.test(n)) {
    return {
      icon: "science",
      grad: ["#A78BFA", "#6D5BD0"],
      description: "Discover nature's secrets and lab wonders.",
      cta: "Experiment!",
    };
  }
  if (/eng|story|read|hindi|lang/.test(n)) {
    return {
      icon: "auto_stories",
      grad: ["#FBBF45", "#F2A93B"],
      description: "Journey through books and build vocabulary.",
      cta: "Read Now!",
    };
  }
  if (/art|draw|paint|craft/.test(n)) {
    return {
      icon: "palette",
      grad: ["#FF9AA8", "#FF6F86"],
      description: "Unleash creativity with colors and shapes.",
      cta: "Create Art!",
    };
  }
  if (/hist|civic|social/.test(n)) {
    return {
      icon: "fort",
      grad: ["#D8C9A8", "#B8A47C"],
      description: "Meet great leaders and explore past worlds.",
      cta: "Explore History!",
    };
  }
  if (/comput|code|program/.test(n)) {
    return {
      icon: "sports_esports",
      grad: ["#FBBF24", "#F59E0B"],
      description: "Build logic skills through fun interactive games.",
      cta: "Start Coding!",
    };
  }
  if (/geo|evs|environ/.test(n)) {
    return {
      icon: "public",
      grad: ["#34D8B0", "#10B981"],
      description: "Explore the world and its wonders.",
      cta: "Explore Now!",
    };
  }
  return {
    icon: "school",
    grad: ["#94A3B8", "#64748B"],
    description: `Explore ${name} topics and test your knowledge!`,
    cta: "Start Learning!",
  };
}

const TOPIC_NUMBER_THEMES = [
  "from-blue-400 to-indigo-500",
  "from-emerald-400 to-teal-500",
  "from-orange-400 to-pink-500",
  "from-purple-400 to-violet-500",
  "from-cyan-400 to-blue-500",
  "from-rose-400 to-red-500",
];

const CHAPTER_THEMES = [
  { bg: "bg-blue-100", text: "text-blue-600", icon: "pin_drop" },
  { bg: "bg-orange-100", text: "text-orange-600", icon: "category" },
  { bg: "bg-purple-100", text: "text-purple-600", icon: "calculate" },
  { bg: "bg-teal-100", text: "text-teal-600", icon: "biotech" },
  { bg: "bg-rose-100", text: "text-rose-600", icon: "menu_book" },
  { bg: "bg-cyan-100", text: "text-cyan-600", icon: "public" },
  { bg: "bg-amber-100", text: "text-amber-600", icon: "explore" },
];

const buildCacheKey = (board, klass, stage) => `${board || "unknown"}::${klass || "unknown"}::${stage}`;

export default function SyllabusPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [subjectsCache, setSubjectsCache] = useState({});
  const [subjectTopicsLoading, setSubjectTopicsLoading] = useState(null);
  const [userProfile, setUserProfile] = useState(() => getStoredUser());
  const [showTopicsModal, setShowTopicsModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showTopicDetailsModal, setShowTopicDetailsModal] = useState(false);
  const [selectedTopicForDetails, setSelectedTopicForDetails] = useState(null);
  const [startingExam, setStartingExam] = useState(null);
  const [showAdventureSetup, setShowAdventureSetup] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedQuestionTypeType, setSelectedQuestionTypeType] = useState("");
  const [selectedLimit, setSelectedLimit] = useState(25);
  const [questionTypes, setQuestionTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [currentStage, setCurrentStage] = useState(1);
  const [unlockedStages, setUnlockedStages] = useState([1]);
  const [allStages, setAllStages] = useState([1]);
  const [levelAccess, setLevelAccess] = useState({
    freeLevels: ["basic"],
    allowedLevels: ["basic"],
    levelPackagesMap: {},
  });
  const [attempts, setAttempts] = useState([]);
  const [dailyBadge, setDailyBadge] = useState("none");

  const levelOptions = [
    {
      key: "basic",
      label: "Easy",
      subtitle: "A gentle stroll through facts.",
      stars: 1,
    },
    {
      key: "intermediate",
      label: "Intermediate",
      subtitle: "Balanced challenge for explorers.",
      stars: 2,
    },
    {
      key: "advanced",
      label: "Advanced",
      subtitle: "Master-level brain power needed!",
      stars: 3,
    },
  ];

  /* Best-available question type for the selected level (highest question count). */
  const selectedQuestionType = useMemo(() => {
    if (!questionTypes.length) return null;
    return (
      questionTypes.find((item) => item?.type === selectedQuestionTypeType) ||
      questionTypes[0] ||
      null
    );
  }, [questionTypes, selectedQuestionTypeType]);
  const resolvedQuestionCount = Number(selectedQuestionType?.count || 0);
  const maxQuestionLimit = Math.max(1, resolvedQuestionCount || selectedLimit || 1);
  const finalQuestionLimit = Math.min(selectedLimit, maxQuestionLimit);
  const estDurationMins = Math.max(5, Math.round(finalQuestionLimit * 0.5));
  const levelXpMultiplier = { basic: 1, intermediate: 1.5, advanced: 2 };
  const potentialXp = Math.round(finalQuestionLimit * 10 * (levelXpMultiplier[selectedLevel] || 1));

  useEffect(() => {
    if (!resolvedQuestionCount) return;
    setSelectedLimit((current) => Math.min(current || resolvedQuestionCount, resolvedQuestionCount));
  }, [resolvedQuestionCount, selectedQuestionTypeType]);

  useEffect(() => {
    fetchUnlockedStages();
    fetchAllStages();
    fetchLevelAccess();
    fetchMyAttempts();
    fetchDailyBadge();
  }, []);

  async function fetchMyAttempts() {
    try {
      const { items } = await myAttempts();
      setAttempts(items || []);
    } catch {
      setAttempts([]);
    }
  }

  async function fetchDailyBadge() {
    try {
      const token = localStorage.getItem("jwt");
      const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${API}/api/daily-challenge/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setDailyBadge(String(data?.badge || "none").toLowerCase());
    } catch {
      setDailyBadge("none");
    }
  }

  function getSubjectProgress(subjectId) {
    const matches = attempts.filter((a) => {
      const sameSubject = String(a?.subject?._id || a?.subject || "") === String(subjectId);
      const stageNum = Number(String(a?.stage ?? "").match(/\d+/)?.[0] ?? a?.stage);
      return sameSubject && stageNum === currentStage;
    });
    if (!matches.length) return 0;
    const avg = matches.reduce((sum, a) => sum + (Number(a?.percent) || 0), 0) / matches.length;
    return Math.round(avg);
  }

  async function fetchLevelAccess() {
    try {
      const data = await getJSON("/api/questions/level-access");
      setLevelAccess({
        freeLevels: Array.isArray(data?.freeLevels) && data.freeLevels.length > 0 ? data.freeLevels : ["basic"],
        allowedLevels: Array.isArray(data?.allowedLevels) && data.allowedLevels.length > 0 ? data.allowedLevels : ["basic"],
        levelPackagesMap: data?.levelPackagesMap || {},
      });
    } catch (err) {
      setLevelAccess({
        freeLevels: ["basic"],
        allowedLevels: ["basic"],
        levelPackagesMap: {},
      });
    }
  }

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

  useEffect(() => {
    setShowTopicsModal(false);
    setSelectedSubject(null);
    setShowTopicDetailsModal(false);
    setSelectedTopicForDetails(null);
    setShowAdventureSetup(false);
    setSelectedTopic(null);
    setSelectedLevel(null);
    setQuestionTypes([]);
    setSubjectTopicsLoading(null);
  }, [currentStage]);

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
        setUserProfile(profile.user);
        return profile.user;
      }
    } catch (err) {
      console.error("Failed to refresh user profile", err);
    }
    const fallback = getStoredUser();
    setUserProfile(fallback);
    return fallback;
  }

  async function ensureUserContext() {
    let user = getStoredUser();
    if (hasBoardAndClass(user)) {
      setUserProfile(user);
      return user;
    }
    return await loadUserProfile();
  }

  async function loadSyllabus(stage = 1) {
    let usedCache = false;
    try {
      const user = await ensureUserContext();

      const userBoard = user.boardId || user.board || user.boardName || "";
      const userClass = user.classId || user.class || user.className || "";

      if (!userBoard || !userClass) {
        console.error("User board or class not found");
        toast.error("Please update your profile with board and class information.");
        setSubjects([]);
        setLoading(false);
        return;
      }

      const cacheKey = buildCacheKey(userBoard, userClass, stage);
      const cachedSubjects = subjectsCache[cacheKey];

      if (cachedSubjects) {
        usedCache = true;
        setSubjects(cachedSubjects);
        setLoading(false);
        return;
      }

      setLoading(true);

      const url = `/api/subject?board=${userBoard}&class=${userClass}`;
      const subjectsRes = await getJSON(url);

      if (!subjectsRes || subjectsRes.length === 0) {
        setSubjects([]);
        setSubjectsCache((prev) => ({ ...prev, [cacheKey]: [] }));
        return;
      }

      const topicCountEntries = await Promise.all(
        subjectsRes.map(async (subject) => {
          try {
            const topics = await getJSON(
              `/api/topic/${subject._id}?board=${userBoard}&class=${userClass}&stage=${stage}`
            );
            const count = Array.isArray(topics) ? topics.length : 0;
            return [String(subject._id), count];
          } catch {
            return [String(subject._id), 0];
          }
        })
      );
      const topicCountMap = new Map(topicCountEntries);

      const normalizedSubjects = subjectsRes.map((subject) => {
        const hasTopics = Array.isArray(subject.topics) && subject.topics.length > 0;
        return {
          ...subject,
          topicCount: topicCountMap.get(String(subject._id)) ?? 0,
          topics: hasTopics ? [...subject.topics] : [],
          topicsLoaded: hasTopics,
          topicsAttempted: hasTopics,
        };
      });

      setSubjects(normalizedSubjects);
      setSubjectsCache((prev) => ({ ...prev, [cacheKey]: normalizedSubjects }));
    } catch (err) {
      console.error("Failed to load syllabus", err);
      toast.error("Failed to load syllabus. Please try again.");
    } finally {
      if (!usedCache) {
        setLoading(false);
      }
    }
  }

  function updateSubjectEntry(cacheKey, subjectId, patch) {
    const activeUser = hasBoardAndClass(userProfile) ? userProfile : getStoredUser();
    const activeBoard = activeUser.boardId || activeUser.board || activeUser.boardName || "";
    const activeClass = activeUser.classId || activeUser.class || activeUser.className || "";
    const activeCacheKey = buildCacheKey(activeBoard, activeClass, currentStage);

    if (cacheKey === activeCacheKey) {
      setSubjects((prev) =>
        prev.map((item) => (item._id === subjectId ? { ...item, ...patch } : item))
      );
      setSelectedSubject((prev) => (prev?._id === subjectId ? { ...prev, ...patch } : prev));
    }

    if (cacheKey) {
      setSubjectsCache((prev) => {
        const stageSubjects = prev[cacheKey];
        if (!stageSubjects) return prev;
        return {
          ...prev,
          [cacheKey]: stageSubjects.map((item) =>
            item._id === subjectId ? { ...item, ...patch } : item
          ),
        };
      });
    }
  }

  async function fetchSubjectTopics(subject, stage) {
    if (!subject?._id) return null;

    const resolvedUser = hasBoardAndClass(userProfile) ? userProfile : await ensureUserContext();
    const userBoard = resolvedUser.boardId || resolvedUser.board || resolvedUser.boardName || "";
    const userClass = resolvedUser.classId || resolvedUser.class || resolvedUser.className || "";

    if (!userBoard || !userClass) {
      toast.error("Please update your profile with board and class information.");
      return null;
    }

    const cacheKey = buildCacheKey(userBoard, userClass, stage);

    if (subjectTopicsLoading === subject._id) {
      return null;
    }

    setSubjectTopicsLoading(subject._id);

    try {
      const topics = await getJSON(
        `/api/topic/${subject._id}?board=${userBoard}&class=${userClass}`
      );
      const normalizedTopics = Array.isArray(topics) ? topics : [];
      updateSubjectEntry(cacheKey, subject._id, {
        topics: normalizedTopics,
        topicsLoaded: true,
        topicsAttempted: true,
      });
      return normalizedTopics;
    } catch (err) {
      console.error(`Failed to load topics for ${subject.name}`, err);
      updateSubjectEntry(cacheKey, subject._id, { topicsAttempted: true });
      toast.error(`Failed to load ${subject.name} topics. Please try again.`);
      return null;
    } finally {
      setSubjectTopicsLoading((current) => (current === subject._id ? null : current));
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
      const nextTypes = (response.types || [])
        .filter((t) => t?.type !== "all")
        .sort((a, b) => Number(b?.count || 0) - Number(a?.count || 0));
      setQuestionTypes(nextTypes);
      setSelectedQuestionTypeType((current) => {
        if (current && nextTypes.some((item) => item?.type === current)) return current;
        return nextTypes[0]?.type || "";
      });
      return true;
    } catch (err) {
      console.error("Failed to fetch question types", err);
      if (String(err?.message || "").toLowerCase().includes("unlock")) {
        toast.error(err.message);
        navigate("/dashboard/packages");
      }
      setQuestionTypes([]);
      return false;
    } finally {
      setLoadingTypes(false);
    }
  }

  async function handleSubjectClick(subject) {
    const subjectData = subjects.find((item) => item._id === subject._id) || subject;
    setSelectedSubject(subjectData);
    setShowTopicsModal(true);

    if (!subjectData.topicsLoaded) {
      await fetchSubjectTopics(subjectData, currentStage);
    }
  }

  function pickDefaultLevel() {
    const allowedLevelSet = new Set(levelAccess.allowedLevels || []);
    return levelOptions.find((lvl) => allowedLevelSet.has(lvl.key))?.key || "basic";
  }

  function openAdventureSetup(subject, topic) {
    setShowTopicsModal(false);
    setSelectedTopic({ subject, topic });
    setSelectedLimit(25);
    setSelectedQuestionTypeType("");
    const defaultLevel = pickDefaultLevel();
    setSelectedLevel(defaultLevel);
    setShowAdventureSetup(true);
    fetchQuestionTypesForLevel(subject, topic, defaultLevel);
  }

  function handleTopicClick(subject, topic) {
    openAdventureSetup(subject, topic);
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

  async function handleAdventureLevelChange(level) {
    if (!selectedTopic || level === selectedLevel) return;
    const allowedLevelSet = new Set(levelAccess.allowedLevels || []);
    if (!allowedLevelSet.has(level)) {
      toast.error(`The ${level} level is locked in your current package.`);
      navigate("/dashboard/packages");
      return;
    }
    setSelectedLevel(level);
    await fetchQuestionTypesForLevel(selectedTopic.subject, selectedTopic.topic, level);
  }

  async function confirmAdventureStart() {
    if (!selectedTopic || !selectedLevel) return;

    const { subject, topic } = selectedTopic;
    const user = getStoredUser();
    const userClass = user.classId || user.class || user.className || "";
    const userBoard = user.boardId || user.board || user.boardName || "";
    const typeToUse = selectedQuestionType?.type || "mcq-single";

    try {
      setStartingExam(`${subject._id}-${topic._id}`);

      const data = await startExam({
        subject: subject._id,
        topic: topic._id,
        type: typeToUse,
        limit: finalQuestionLimit,
        level: selectedLevel,
        stage: currentStage,
        class: userClass,
        board: userBoard
      });

      navigate(`/dashboard/exams/take/${data.attemptId}`, {
        state: { ...data, subjectName: subject.name, topicName: topic.name, estPotentialXp: potentialXp },
      });
    } catch (err) {
      console.error("Failed to start exam", err);
      toast.error(err.message || "Failed to start exam. Please try again.");
    } finally {
      setStartingExam(null);
      setShowAdventureSetup(false);
      setSelectedTopic(null);
      setSelectedLevel(null);
      setQuestionTypes([]);
      setSelectedSubject(null);
      setShowTopicsModal(false);
    }
  }

  function closeAdventureSetup() {
    setShowAdventureSetup(false);
    setSelectedTopic(null);
    setSelectedLevel(null);
    setQuestionTypes([]);
    // Go back to topics modal
    setShowTopicsModal(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <Loader2 className="w-8 h-8 animate-spin text-[#e7c555]" />
      </div>
    );
  }

  const resolvedUserProfile =
    userProfile && Object.keys(userProfile).length ? userProfile : getStoredUser();
  const userBoardName = resolvedUserProfile.boardName || resolvedUserProfile.board || "Your Board";
  const userClassName = resolvedUserProfile.className || resolvedUserProfile.class || "Your Class";

  return (
    <>
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />

      <div
        className="min-h-screen bg-[#f8f7f6]"
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        {/* ── Main Content ── */}
        <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 md:px-10 py-8">

          {/* ── Hero Header ── */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-slate-900 text-3xl md:text-4xl font-black leading-tight tracking-tight">
                Pick an Adventure! <span>🚀</span>
              </h1>
              <p className="text-slate-500 text-sm mt-1 font-medium">
                Grade {userClassName} Explorer • Choose your subject to start learning
              </p>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2.5 shadow-sm">
                <span className="text-lg">🛡️</span>
                <div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Daily Badge</div>
                  <div className="text-sm font-black text-slate-800">
                    {dailyBadge === "none" ? "Novice" : `${dailyBadge.charAt(0).toUpperCase()}${dailyBadge.slice(1)}`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2.5 shadow-sm">
                <span className="text-lg">🪙</span>
                <div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Points</div>
                  <div className="text-sm font-black text-slate-800">
                    {Number(resolvedUserProfile.points || 0).toLocaleString()} pts
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
              >
                <MIcon name="notifications" className="text-[20px]" />
              </button>
            </div>
          </div>

          {/* ── Level Selector ── */}
          <div className="flex flex-wrap items-center gap-3 mb-10 border-2 border-white rounded-3xl px-4 py-3 bg-orange-300/5 shadow-inner">
            <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-700">
              <MIcon name="tune" className="text-[18px] text-slate-400" />
              Set your level:
            </span>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 p-1.5 shadow-inner">
              {allStages.map((stage) => {
                const isUnlocked = unlockedStages.includes(stage);
                const isActive = currentStage === stage;
                const meta = getStageLevelMeta(stage);
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
                    className={`flex h-9 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-bold transition-all ${
                      isActive
                        ? "bg-[#3f3a23] text-[#e7c555] shadow-md"
                        : isUnlocked
                        ? "text-slate-500 hover:text-slate-800"
                        : "text-slate-300 cursor-not-allowed"
                    }`}
                  >
                    {!isUnlocked && <Lock className="w-3 h-3" />}
                    <MIcon name={meta.icon} className="text-[16px]" />
                    {meta.label}
                  </button>
                );
              })}
            </div>
            <div className="relative group">
              <button
                type="button"
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <MIcon name="info" className="text-[14px]" />
              </button>
              <div className="pointer-events-none absolute left-0 top-7 z-20 w-56 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600 shadow-lg opacity-0 transition-opacity group-hover:opacity-100">
                Adjusting difficulty changes the challenge level.
              </div>
            </div>
          </div>

          {/* ── Subject Cards Grid ── */}
          {subjects.length === 0 ? (
            <div className="relative overflow-hidden bg-white rounded-[3rem] shadow-sm p-12 text-center border border-slate-200">
              {/* Decorative background */}
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#e7c555]/5 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-[#e7c555]/5 blur-2xl" />

              <div className="relative z-10">
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <MIcon name="auto_stories" className="text-8xl text-slate-200" />
                    <div className="absolute -top-2 -right-2 w-10 h-10 bg-[#e7c555]/20 rounded-full flex items-center justify-center">
                      <MIcon name="search_off" className="text-[#e7c555] text-xl" />
                    </div>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">No Subjects Available</h3>
                <p className="text-slate-600 mb-6 max-w-md mx-auto">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((subject) => {
                const theme = getSubjectTheme(subject.name);
                const topicCount = subject.topicsLoaded
                  ? subject.topics.length
                  : typeof subject.topicCount === "number"
                  ? subject.topicCount
                  : null;
                const isComingSoon = topicCount === 0;
                const progress = getSubjectProgress(subject._id);

                return (
                  <div
                    key={subject._id}
                    className={`relative overflow-hidden rounded-3xl p-6 shadow-sm transition-all duration-300 ${
                      isComingSoon ? "bg-slate-100" : "shadow-md hover:shadow-xl hover:-translate-y-0.5"
                    }`}
                    style={
                      isComingSoon
                        ? undefined
                        : { backgroundImage: `linear-gradient(to bottom right, ${theme.grad[0]}, ${theme.grad[1]})` }
                    }
                  >
                    {!isComingSoon && (
                      <>
                        {/* Dot-grid texture */}
                        <div
                          className="absolute inset-0 pointer-events-none opacity-[0.12]"
                          style={{
                            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                            backgroundSize: "16px 16px",
                          }}
                        />
                        {/* Large faint decorative icon */}
                        <MIcon
                          name={theme.icon}
                          className="absolute -top-2 -right-1 text-white/15 pointer-events-none select-none"
                          style={{ fontSize: "140px" }}
                        />
                      </>
                    )}

                    <div className="relative z-10">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-sm ${
                          isComingSoon ? "bg-slate-300 text-slate-500" : "bg-white/25 text-white"
                        }`}
                      >
                        <MIcon name={isComingSoon ? "hourglass_empty" : theme.icon} className="text-2xl" />
                      </div>

                      <h3 className={`text-xl font-black mb-1.5 ${isComingSoon ? "text-slate-500" : "text-slate-900"}`}>
                        {subject.name}
                      </h3>
                      <p className={`text-sm mb-4 line-clamp-2 ${isComingSoon ? "text-slate-400" : "text-slate-800/70"}`}>
                        {isComingSoon
                          ? "New quests for this level are on the way. Check back soon!"
                          : theme.description}
                      </p>

                      {isComingSoon ? (
                        <div className="flex items-center justify-center gap-1.5 rounded-full border border-dashed border-slate-300 py-3 text-sm font-bold text-slate-400">
                          <MIcon name="schedule" className="text-[16px]" />
                          Coming Soon
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between text-xs font-bold text-slate-900/70 mb-1.5">
                            <span>Journey Progress</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/40 overflow-hidden mb-4">
                            <div
                              className="h-full rounded-full bg-slate-900/80"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSubjectClick(subject);
                            }}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-full flex items-center justify-center gap-2 transition-all"
                          >
                            {theme.cta}
                            <MIcon name="arrow_forward" className="text-[18px]" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Locked quest placeholder — show if there are locked stages */}
              {allStages.some((s) => !unlockedStages.includes(s)) && (
                <div className="flex flex-col bg-slate-100 rounded-[3rem] overflow-hidden border border-dashed border-slate-300 relative group opacity-80">
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-slate-900/10 backdrop-blur-[2px]">
                    <div className="bg-white p-4 rounded-full shadow-lg text-[#e7c555] mb-2">
                      <MIcon name="lock" fill className="text-4xl" />
                    </div>
                    <p className="text-slate-900 font-bold">Unlock More Stages</p>
                    <button
                      onClick={() => navigate("/dashboard/packages")}
                      className="mt-2 text-xs text-[#e7c555] font-bold underline"
                    >
                      View Packages
                    </button>
                  </div>
                  <div className="h-40 bg-slate-300" />
                  <div className="p-6 flex flex-col gap-4 grayscale">
                    <div className="h-4 w-32 bg-slate-200 rounded-[1rem]" />
                    <div className="h-10 w-full bg-slate-200 rounded-[2rem]" />
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
        <div className="fixed inset-x-0 top-0 bottom-16 md:bottom-0 z-50 overflow-y-auto bg-[#f8f7f6]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {/* Top Header */}
          <header className="flex items-center justify-between px-6 py-4 border-b border-[#e7c555]/10 bg-white/80 backdrop-blur-md sticky top-0 z-10">
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
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <span>Syllabus</span>
                <MIcon name="chevron_right" className="text-xs" />
                <span className="text-slate-900">{selectedSubject.name}</span>
              </div>
            </div>
            <button
              onClick={() => {
                setShowTopicsModal(false);
                setSelectedSubject(null);
              }}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </header>

          <div className="p-6 md:p-10 max-w-5xl mx-auto w-full flex flex-col gap-8">
            {/* Syllabus Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#e7c555]/20 to-[#e7c555]/5 rounded-[3rem] p-8 border border-[#e7c555]/20">
              <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex flex-col gap-2">
                  <span className="bg-[#e7c555]/30 text-slate-900 px-3 py-1 rounded-full text-xs font-bold w-fit uppercase">
                    Stage {currentStage} Quest
                  </span>
                  <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
                    {selectedSubject.name} Syllabus
                  </h1>
                  <p className="text-slate-600 max-w-md">
                    Master the concepts through structured quests and interactive challenges!
                  </p>
                </div>
                <div className="flex flex-col gap-3 min-w-[240px]">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-slate-900">Topics Available</span>
                    <span className="text-2xl font-black text-[#e7c555]">
                      {selectedSubject.topicsLoaded ? selectedSubject.topics.length : "--"}
                    </span>
                  </div>
                  <div className="w-full h-4 bg-white/50 rounded-full overflow-hidden p-1">
                    <div className="h-full bg-[#e7c555] rounded-full" style={{ width: '35%' }}></div>
                  </div>
                  <p className="text-xs text-slate-500 text-right font-medium">Ready to explore!</p>
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
              <h2 className="text-xl font-bold px-2 flex items-center gap-2 text-slate-900">
                <MIcon name="map" className="text-[#e7c555]" />
                Adventure Path
              </h2>

              {subjectTopicsLoading === selectedSubject._id ? (
                <div className="flex flex-col items-center justify-center py-12 bg-white border border-dashed border-[#e7c555]/40 rounded-[3rem] text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin text-[#e7c555] mb-3" />
                  <p className="font-semibold">Fetching topics...</p>
                </div>
              ) : selectedSubject.topicsLoaded && selectedSubject.topics && selectedSubject.topics.length > 0 ? (
                <details className="group bg-white border border-[#e7c555]/10 rounded-[3rem] overflow-hidden shadow-sm" open>
                  <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-[#e7c555]/5 transition-colors list-none">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-[3rem] bg-blue-100 flex items-center justify-center text-blue-600">
                        <MIcon name="explore" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">{selectedSubject.name} Topics</h3>
                        <p className="text-sm text-slate-500">
                          {selectedSubject.topics.length} Quest{selectedSubject.topics.length !== 1 ? 's' : ''} Available
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:block text-right">
                        <div className="text-xs font-bold text-slate-400">STATUS</div>
                        <div className="text-xs font-bold text-blue-500">READY TO START</div>
                      </div>
                      <MIcon name="expand_more" className="rotate-icon transition-transform text-slate-600" />
                    </div>
                  </summary>
                  <div className="p-5 border-t border-[#e7c555]/5 bg-slate-50/50 flex flex-col gap-3">
                    {selectedSubject.topics.map((topic, index) => (
                      <div
                        key={topic._id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-[3rem] border border-[#e7c555]/5 shadow-sm hover:shadow-md transition-all group/item"
                      >
                        <div className="flex items-center gap-4 mb-3 sm:mb-0">
                          <div className="size-8 rounded-full bg-[#e7c555]/20 flex items-center justify-center text-[#e7c555]">
                            <MIcon name="play_arrow" className="text-sm" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTopicInfoClick(selectedSubject, topic, e);
                                }}
                                className="font-semibold text-slate-900 hover:underline text-left"
                              >
                                {topic.name}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTopicInfoClick(selectedSubject, topic, e);
                                }}
                                className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                                title="View topic details"
                              >
                                <MIcon name="info" className="text-[14px] text-slate-400" />
                              </button>
                            </div>
                            {topic.description && (
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                {topic.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleTopicClick(selectedSubject, topic)}
                          className="px-4 py-2 rounded-full bg-[#e7c555] text-slate-900 font-bold text-sm hover:scale-105 transition-transform shadow-md whitespace-nowrap"
                        >
                          Start Learning
                        </button>
                      </div>
                    ))}
                  </div>
                </details>
              ) : selectedSubject.topicsLoaded ? (
                <div className="p-8 text-center flex flex-col items-center gap-3 bg-white border border-[#e7c555]/10 rounded-[3rem]">
                  <MIcon name="lock_open" className="text-4xl text-slate-300" />
                  <p className="text-slate-500 font-medium">No topics available for this subject yet.</p>
                </div>
              ) : (
                <div className="p-8 text-center flex flex-col items-center gap-3 bg-white border border-[#e7c555]/10 rounded-[3rem]">
                  <MIcon name="error" className="text-4xl text-[#e7c555]" />
                  <p className="text-slate-600 font-medium">Unable to load topics. Please try again.</p>
                  <button
                    onClick={() => fetchSubjectTopics(selectedSubject, currentStage)}
                    className="mt-2 inline-flex items-center justify-center gap-2 px-6 py-2 rounded-full bg-[#e7c555] text-slate-900 font-semibold hover:bg-[#d4b44a] transition-all"
                  >
                    <MIcon name="refresh" className="text-base" />
                    Retry
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ── ADVENTURE SETUP (level + type + length + start) ── */}
      {/* ═══════════════════════════════════════════════════════ */}
      {showAdventureSetup && selectedTopic && (
        <div className="fixed inset-x-0 top-0 bottom-16 md:bottom-0 z-50 overflow-y-auto bg-[#f8f7f6]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {/* Top Header */}
          <header className="flex items-center justify-between gap-3 px-6 py-4 border-b border-[#e7c555]/10 bg-white/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-4 min-w-0">
              <button
                onClick={closeAdventureSetup}
                className="p-2 rounded-[2rem] bg-[#e7c555]/20 hover:bg-[#e7c555]/30 transition-colors flex-shrink-0"
              >
                <MIcon name="arrow_back" />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg font-black text-slate-900 flex items-center gap-1.5 truncate">
                  <MIcon name="menu_book" className="text-[20px] text-[#e7c555]" />
                  Adventure Setup
                </h1>
                <p className="text-xs text-slate-500 truncate">
                  Prepare your journey into {selectedTopic.topic.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
              >
                <MIcon name="notifications" className="text-[18px]" />
              </button>
              <div className="hidden sm:flex items-center gap-2">
                <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-[#e7c555]/40 bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                  {resolvedUserProfile.avatar ? (
                    <img src={resolvedUserProfile.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    String(resolvedUserProfile.name || "U").charAt(0).toUpperCase()
                  )}
                </div>
                <span className="text-sm font-bold text-slate-800">{resolvedUserProfile.name || "Explorer"}</span>
              </div>
            </div>
          </header>

          <div className="p-6 md:p-8 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── Left column ── */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Choose Difficulty */}
              <div className="relative bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <MIcon name="military_tech" className="text-[20px] text-[#e7c555]" />
                    Choose Difficulty
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wide text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                    Recommended for you
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {levelOptions.map((level) => {
                    const allowedLevelSet = new Set(levelAccess.allowedLevels || []);
                    const isAllowed = allowedLevelSet.has(level.key);
                    const isActive = selectedLevel === level.key;
                    return (
                      <button
                        key={level.key}
                        onClick={() => handleAdventureLevelChange(level.key)}
                        className={`rounded-2xl p-4 text-left transition-all ${
                          isActive
                            ? "bg-[#3f3a23] shadow-md"
                            : isAllowed
                            ? "bg-[#f8f3ea] hover:bg-[#f1e7d2]"
                            : "bg-slate-100 opacity-70"
                        }`}
                      >
                        <div className="flex items-center gap-0.5 mb-2">
                          {[1, 2, 3].map((i) => (
                            <MIcon
                              key={i}
                              name="star"
                              fill={i <= level.stars}
                              className={`text-[14px] ${isActive ? "text-[#e7c555]" : "text-amber-500"}`}
                            />
                          ))}
                          {!isAllowed && <Lock className={`w-3 h-3 ml-1 ${isActive ? "text-[#e7c555]" : "text-slate-400"}`} />}
                        </div>
                        <p className={`font-black ${isActive ? "text-[#e7c555]" : "text-slate-900"}`}>{level.label}</p>
                        <p className={`text-xs mt-0.5 ${isActive ? "text-[#e7c555]/70" : "text-slate-500"}`}>
                          {level.subtitle}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Tryout Type */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
                  <div className="flex items-center gap-2 font-bold text-slate-800 mb-4">
                    <MIcon name="sync_alt" className="text-[20px] text-[#e7c555]" />
                    Tryout Type
                  </div>
                  {loadingTypes ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                      Loading available tryouts...
                    </div>
                  ) : questionTypes.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {questionTypes.map((type) => {
                        const active = selectedQuestionType?.type === type.type;
                        return (
                          <button
                            key={type.type}
                            onClick={() => setSelectedQuestionTypeType(type.type)}
                            className={`rounded-2xl border-2 p-4 text-left flex items-center gap-3 transition-all ${
                              active ? "border-indigo-400 bg-indigo-50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <span
                              className={`inline-flex h-4 w-4 rounded-full border-2 flex-shrink-0 ${
                                active ? "border-indigo-500 bg-indigo-500" : "border-slate-300"
                              }`}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-sm text-slate-900">{type.label}</p>
                                <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                                  {type.count} available
                                </span>
                              </div>
                              <p className="text-xs text-slate-500">
                                {type.type === "mcq-single"
                                  ? "Single-correct tryout"
                                  : type.type === "mcq-multi"
                                  ? "Multiple-correct tryout"
                                  : type.type === "choice-matrix"
                                  ? "Matrix-style challenge"
                                  : type.type === "true-false"
                                  ? "True / False challenge"
                                  : "Tryout available at this level"}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                      No tryouts available for this level yet.
                    </div>
                  )}
                </div>

                {/* Quest Length */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
                  <div className="flex items-center gap-2 font-bold text-slate-800 mb-4">
                    <MIcon name="route" className="text-[20px] text-[#e7c555]" />
                    Quest Length
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-col items-center gap-1 text-slate-400">
                      <MIcon name="directions_walk" className="text-[20px]" />
                      <span className="text-[10px] font-bold">Short Trip</span>
                    </div>
                    <span className="inline-flex flex-col items-center justify-center rounded-2xl bg-amber-100 text-amber-800 px-4 py-1.5 font-black">
                      <span className="text-lg leading-none">{finalQuestionLimit}</span>
                      <span className="text-[9px] font-bold uppercase tracking-wide">Questions</span>
                    </span>
                    <div className="flex flex-col items-center gap-1 text-slate-400">
                      <MIcon name="directions_run" className="text-[20px]" />
                      <span className="text-[10px] font-bold">Big Quest</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={maxQuestionLimit}
                    step={1}
                    value={finalQuestionLimit}
                    onChange={(e) => setSelectedLimit(Number(e.target.value))}
                    className="w-full accent-[#e7c555]"
                  />
                  {loadingTypes ? (
                    <p className="text-[11px] text-slate-400 mt-2">Checking available questions…</p>
                  ) : resolvedQuestionCount > 0 && resolvedQuestionCount < selectedLimit ? (
                    <p className="text-[11px] text-slate-400 mt-2">
                      Only {resolvedQuestionCount} question{resolvedQuestionCount !== 1 ? "s" : ""} available at this level.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            {/* ── Right column: Adventure Pass ── */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden sticky top-24">
                {/* Pass header image */}
                <div className="relative h-40 bg-gradient-to-br from-[#3f3a23] via-[#5b4a23] to-[#1f1c10] flex items-end p-5 overflow-hidden">
                  <MIcon
                    name="forest"
                    className="absolute -bottom-6 -right-6 text-white/10 pointer-events-none select-none"
                    style={{ fontSize: "140px" }}
                  />
                  <div className="relative z-10">
                    <span className="inline-flex items-center gap-1 bg-[#e7c555] text-[#211d11] text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full mb-2">
                      <MIcon name="confirmation_number" className="text-[12px]" />
                      Adventure Pass
                    </span>
                    <p className="text-white font-black text-lg leading-tight">{selectedTopic.topic.name}</p>
                  </div>
                </div>

                <div className="p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Explorer</span>
                    <span className="text-sm font-black text-slate-900">{resolvedUserProfile.name || "Explorer"}</span>
                  </div>

                  <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                        <MIcon name="military_tech" className="text-[14px]" />
                        Difficulty
                      </span>
                      <span className="text-sm font-bold text-slate-800">
                        {levelOptions.find((l) => l.key === selectedLevel)?.label || "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                        <MIcon name="bolt" className="text-[14px]" />
                        Type
                      </span>
                      <span className="text-sm font-bold text-indigo-600">
                        {selectedQuestionType?.label || "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                        <MIcon name="schedule" className="text-[14px]" />
                        Est. Duration
                      </span>
                      <span className="text-sm font-bold text-rose-500">{estDurationMins} Mins</span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#e7c555]/10 border border-[#e7c555]/30 px-4 py-3 flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#e7c555] text-[#211d11]">
                      <MIcon name="monetization_on" className="text-[18px]" />
                    </span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Potential Earnings</p>
                      <p className="text-sm font-black text-slate-900">{potentialXp} XP</p>
                    </div>
                  </div>

                  <button
                    onClick={confirmAdventureStart}
                    disabled={Boolean(startingExam) || (!loadingTypes && questionTypes.length === 0) || !selectedQuestionType}
                    className="w-full rounded-2xl bg-[#e7c555] hover:bg-[#d4b44a] text-slate-900 font-black py-3.5 flex flex-col items-center justify-center gap-0.5 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {startingExam ? (
                      <span className="flex items-center justify-center gap-2 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Starting...
                      </span>
                    ) : (
                      <>
                        <span className="text-sm tracking-wide">START ADVENTURE</span>
                        <span className="text-[10px] font-bold opacity-70">READY? 🚀</span>
                      </>
                    )}
                  </button>

                  <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                    <Lock className="w-3 h-3" />
                    Progress is saved automatically
                  </p>
                </div>
              </div>
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
            className="w-full max-w-5xl bg-[#f8f7f6] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
          >
            {/* Syllabus Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#e7c555]/20 to-[#e7c555]/5 rounded-t-[3rem] p-8 border border-[#e7c555]/20 flex-shrink-0">
              <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex flex-col gap-2">
                  <span className="bg-[#e7c555]/30 text-slate-900 px-3 py-1 rounded-full text-xs font-bold w-fit uppercase">
                    Stage {currentStage} • {selectedTopicForDetails.subject.name}
                  </span>
                  <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
                    {selectedTopicForDetails.topic.name}
                  </h1>
                  <p className="text-slate-600 max-w-md">
                    Master the concepts and practice with interactive quizzes!
                  </p>
                </div>
                <button
                  onClick={closeTopicDetailsModal}
                  className="absolute top-4 right-4 p-2 hover:bg-[#e7c555]/20 rounded-full transition-colors z-20"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>
              {/* Decorative background icon */}
              <MIcon
                name="functions"
                className="absolute -bottom-10 -right-10 text-[200px] text-[#e7c555]/10 pointer-events-none"
              />
            </div>

            {/* Body - Scrollable Content */}
            <div className="min-h-0 flex-1 overflow-y-auto p-6 md:p-10">
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-bold px-2 flex items-center gap-2 text-slate-900">
                  <MIcon name="map" className="text-[#e7c555]" />
                  Adventure Path
                </h2>

                {/* Topic Summary Section */}
                <details className="group bg-white border border-[#e7c555]/10 rounded-[3rem] overflow-hidden shadow-sm" open>
                  <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-[#e7c555]/5 transition-colors list-none">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-[3rem] bg-blue-100 flex items-center justify-center text-blue-600">
                        <MIcon name="pin_drop" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">Topic Summary</h3>
                        <p className="text-sm text-slate-500">Core concepts and key ideas</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:block text-right">
                        <div className="text-xs font-bold text-slate-400">SECTION</div>
                        <div className="text-xs font-bold text-blue-500">OVERVIEW</div>
                      </div>
                      <MIcon name="expand_more" className="rotate-icon transition-transform text-slate-600" />
                    </div>
                  </summary>
                  <div className="p-5 border-t border-[#e7c555]/5 bg-slate-50/50">
                    <div
                      className="prose prose-sm max-w-none text-slate-700 prose-headings:text-slate-900 prose-strong:text-slate-900 prose-li:text-slate-700"
                      dangerouslySetInnerHTML={{
                        __html: getHtmlOrFallback(selectedTopicForDetails.topic.topicSummary, "Summary is not available yet."),
                      }}
                    />
                  </div>
                </details>

                {/* Learning Outcomes Section */}
                <details className="group bg-white border border-[#e7c555]/10 rounded-[3rem] overflow-hidden shadow-sm">
                  <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-[#e7c555]/5 transition-colors list-none">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-[3rem] bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <MIcon name="category" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">Learning Outcomes</h3>
                        <p className="text-sm text-slate-500">What you will achieve</p>
                      </div>
                    </div>
                    <MIcon name="expand_more" className="rotate-icon transition-transform text-slate-600" />
                  </summary>
                  <div className="p-5 border-t border-[#e7c555]/5 bg-slate-50/50">
                    <div
                      className="prose prose-sm max-w-none text-slate-700 prose-headings:text-slate-900 prose-strong:text-slate-900 prose-li:text-slate-700"
                      dangerouslySetInnerHTML={{
                        __html: getHtmlOrFallback(selectedTopicForDetails.topic.learningOutcome, "Learning outcomes are not available yet."),
                      }}
                    />
                  </div>
                </details>

                {/* Practice CTA Section */}
                <details className="group bg-white border border-[#e7c555]/10 rounded-[3rem] overflow-hidden shadow-sm">
                  <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-[#e7c555]/5 transition-colors list-none">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-[3rem] bg-purple-100 flex items-center justify-center text-purple-600">
                        <MIcon name="calculate" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">Start Practice</h3>
                        <p className="text-sm text-slate-500">Ready to test your knowledge?</p>
                      </div>
                    </div>
                    <MIcon name="expand_more" className="rotate-icon transition-transform text-slate-600" />
                  </summary>
                  <div className="p-5 border-t border-[#e7c555]/5 bg-slate-50/50 flex flex-col gap-3">
                    <div className="flex items-center justify-between p-4 bg-white rounded-[3rem] border border-[#e7c555]/5 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="size-8 rounded-full bg-[#e7c555]/20 flex items-center justify-center text-[#e7c555]">
                          <MIcon name="play_arrow" className="text-sm" />
                        </div>
                        <span className="font-semibold text-slate-900">Begin Quest</span>
                      </div>
                      <button
                        onClick={() => {
                          setShowTopicDetailsModal(false);
                          openAdventureSetup(selectedTopicForDetails.subject, selectedTopicForDetails.topic);
                        }}
                        className="px-4 py-2 rounded-full bg-[#e7c555] text-slate-900 font-bold text-sm hover:scale-105 transition-transform shadow-md"
                      >
                        Start Learning
                      </button>
                    </div>
                  </div>
                </details>
              </div>
            </div>

            {/* Footer - Close button */}
            <div className="border-t border-[#e7c555]/10 bg-white/60 p-5 flex justify-between items-center flex-shrink-0">
              <div className="text-sm text-slate-500">
                Press ESC to close
              </div>
              <button
                onClick={closeTopicDetailsModal}
                className="px-6 py-3 rounded-full bg-white border-2 border-slate-200 font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
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
