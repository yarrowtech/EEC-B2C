import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import {
  getJSON,
  listFlashcards,
  getFlashcardSet,
  myFlashcardAttempts,
  participateFlashcardSet,
} from "../lib/api";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const FLIP_CSS = `
  .fc-scene { perspective: 1200px; }
  .fc-card {
    position: relative;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
    transition: transform 0.55s cubic-bezier(0.4, 0.2, 0.2, 1);
  }
  .fc-card.flipped { transform: rotateY(180deg); }
  .fc-face {
    position: absolute;
    inset: 0;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    border-radius: 1.25rem;
  }
  .fc-face-back { transform: rotateY(180deg); }
  .sheet-enter { transform: translateY(100%); }
  .sheet-enter-done { transform: translateY(0); }
`;

function readUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

const SUBJECT_VISUALS = [
  {
    test: /math|maths|mathematics/,
    src: "/Math.png",
    fallbackIcon: "calculate",
  },
  {
    test: /bio|biology|science|physic|chem/,
    src: "/biology.png",
    fallbackIcon: "biotech",
  },
  {
    test: /geo|geography|evs|environment/,
    src: "/geography.png",
    fallbackIcon: "travel_explore",
  },
  {
    test: /hist|history|social|civic|civics/,
    src: "/history.png",
    fallbackIcon: "history_edu",
  },
  {
    test: /account|accountancy|accounting|economics|commerce/,
    src: "/accountant.png",
    fallbackIcon: "account_balance",
  },
  {
    test: /art|draw|paint|creative|design|computer|code|program/,
    src: "/screen.png",
    fallbackIcon: "palette",
  },
];

function getSubjectVisual(name = "") {
  const n = String(name || "").toLowerCase();
  return SUBJECT_VISUALS.find((item) => item.test.test(n)) || {
    src: "/screen.png",
    fallbackIcon: "style",
  };
}

const FLASHCARD_SUBJECT_THEMES = [
  {
    test: /math/,
    icon: "calculate",
    panelBg: "linear-gradient(135deg, #FDE9C8, #F8D88A)",
    iconColor: "#8a6d1d",
    buttonColor: "#6b6b1a",
    description: "Master numbers with magical puzzles and counting games!",
  },
  {
    test: /sci|physic|chem|bio/,
    icon: "biotech",
    panelBg: "linear-gradient(135deg, #E4D9FB, #C9B7F2)",
    iconColor: "#5b3fc4",
    buttonColor: "#4f3cc9",
    description: "Discover the wonders of nature and the tiny world around us.",
  },
  {
    test: /eng|story|read|lit|hindi|lang/,
    icon: "auto_stories",
    panelBg: "linear-gradient(135deg, #2b2640, #14121f)",
    iconColor: "#e7c555",
    buttonColor: "#b91c1c",
    description: "Jump into amazing tales and learn new words every day!",
  },
  {
    test: /art|draw|paint|craft/,
    icon: "palette",
    panelBg: "linear-gradient(135deg, #FBE4EC, #F6B8CE)",
    iconColor: "#c0267a",
    buttonColor: "#c0267a",
    description: "Unleash creativity with colors and shapes.",
  },
  {
    test: /hist|civic|social/,
    icon: "history_edu",
    panelBg: "linear-gradient(135deg, #F1E6D2, #DFC9A0)",
    iconColor: "#8a6429",
    buttonColor: "#8a6429",
    description: "Meet great leaders and explore past worlds.",
  },
  {
    test: /comput|code|program/,
    icon: "terminal",
    panelBg: "linear-gradient(135deg, #D8F4F0, #A6E6DC)",
    iconColor: "#0f766e",
    buttonColor: "#0f766e",
    description: "Build logic skills through fun interactive games.",
  },
  {
    test: /geo|evs|environ/,
    icon: "travel_explore",
    panelBg: "linear-gradient(135deg, #DCF6E3, #A9E8BC)",
    iconColor: "#15803d",
    buttonColor: "#15803d",
    description: "Explore the world and its wonders.",
  },
];

function getFlashcardSubjectTheme(name = "") {
  const n = String(name || "").toLowerCase();
  const match = FLASHCARD_SUBJECT_THEMES.find((t) => t.test.test(n));
  if (match) return match;
  return {
    icon: "style",
    panelBg: "linear-gradient(135deg, #E8E6FE, #C9C4F7)",
    iconColor: "#6C63FF",
    buttonColor: "#6C63FF",
    description: `Explore ${name} and grow your knowledge one card at a time.`,
  };
}

function SubjectCard({ subject, onSelect }) {
  const theme = getFlashcardSubjectTheme(subject.name);
  const visual = getSubjectVisual(subject.name);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [subject._id, subject.name]);

  return (
    <div className="group relative overflow-hidden rounded-3xl bg-white border border-slate-100 shadow-sm p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5">
      <div className="rounded-2xl h-40 mb-5 overflow-hidden relative" style={{ background: theme.panelBg }}>
        {!imageError ? (
          <img
            src={visual.src}
            alt={subject.name}
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "64px", color: theme.iconColor, fontVariationSettings: "'FILL' 1" }}
            >
              {visual.fallbackIcon || theme.icon}
            </span>
          </div>
        )}
      </div>
      <h3 className="text-lg font-black text-slate-900 mb-1.5">{subject.name}</h3>
      <p className="text-sm text-slate-500 leading-relaxed mb-5 line-clamp-2">{theme.description}</p>
      <button
        type="button"
        onClick={() => onSelect(subject)}
        className="w-full flex items-center justify-center gap-2 rounded-full py-3 text-sm font-bold text-white transition-all hover:brightness-110"
        style={{ backgroundColor: theme.buttonColor }}
      >
        Select
        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
      </button>
    </div>
  );
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const TOPIC_PICKER_THEMES = [
  { test: /solar|space|planet|astro|universe/, icon: "rocket_launch", bg: "#F2B33D", description: "Explore planets, moons, and stars in our cosmic backyard." },
  { test: /animal|wildlife|kingdom/, icon: "pets", bg: "#F2978C", description: "Discover the amazing diversity of creatures on Earth." },
  { test: /plant|botany|tree|flower/, icon: "eco", bg: "#B7A6F0", description: "Learn how flowers grow and why trees are super important." },
  { test: /weather|climate|cloud/, icon: "cloud", bg: "#7FB7E6", description: "Understand clouds, rain, and the seasons around us." },
  { test: /cell|biology|organism/, icon: "biotech", bg: "#6FAEEA", description: "Peek inside living things and how they work." },
  { test: /human|body|anatomy/, icon: "favorite", bg: "#F08A8A", description: "Learn how your body works from head to toe." },
  { test: /math|number|algebra|geometry/, icon: "calculate", bg: "#F2B33D", description: "Sharpen your number skills with fun practice." },
  { test: /history|civilization|war/, icon: "history_edu", bg: "#C9A86A", description: "Travel back in time to meet legends of the past." },
];

function getTopicPickerTheme(name = "") {
  const n = String(name || "").toLowerCase();
  const match = TOPIC_PICKER_THEMES.find((t) => t.test.test(n));
  if (match) return match;
  const fallback = [
    { icon: "auto_stories", bg: "#8C7AE6", description: `Explore ${name} and learn something new today!` },
    { icon: "lightbulb", bg: "#F2B33D", description: `Explore ${name} and learn something new today!` },
    { icon: "explore", bg: "#4ECDC4", description: `Explore ${name} and learn something new today!` },
  ];
  const idx = Math.abs(n.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % fallback.length;
  return fallback[idx];
}

function TopicTile({ topic, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(topic)}
      className={`relative overflow-hidden rounded-2xl p-5 text-left border-2 transition-all ${
        selected ? "border-[#e7c555] bg-[#fffbe8]" : "border-transparent bg-slate-50 hover:bg-slate-100"
      }`}
    >
      <div className="absolute -right-4 -bottom-4 opacity-[0.08] pointer-events-none">
        <span className="material-symbols-outlined" style={{ fontSize: "120px" }}>
          {topic.theme.icon}
        </span>
      </div>
      <div className="relative z-10">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
          style={{ background: topic.theme.bg }}
        >
          <span
            className="material-symbols-outlined text-white text-xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {topic.theme.icon}
          </span>
        </div>
        <p className="font-black text-slate-900 mb-1">{topic.name}</p>
        <p className="text-xs text-slate-500 leading-snug">{topic.description}</p>
      </div>
    </button>
  );
}

function TopicRow({ topic, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(topic)}
      className={`w-full flex items-center gap-3 rounded-2xl p-4 text-left border-2 transition-all ${
        selected ? "border-[#e7c555] bg-[#fffbe8]" : "border-transparent bg-slate-50 hover:bg-slate-100"
      }`}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: topic.theme.bg }}
      >
        <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
          {topic.theme.icon}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-black text-slate-900">{topic.name}</p>
        <p className="text-xs text-slate-500 leading-snug truncate">{topic.description}</p>
      </div>
      <span className="material-symbols-outlined text-slate-300 flex-shrink-0">chevron_right</span>
    </button>
  );
}

export default function FlashcardsPage() {
  const [searchParams] = useSearchParams();
  const selectedSetId = String(searchParams.get("set") || "");
  const user = useMemo(() => readUser(), []);
  const isLoggedIn = Boolean(localStorage.getItem("jwt"));

  const [board, setBoard] = useState(String(user?.boardId || user?.board || ""));
  const [className, setClassName] = useState(String(user?.classId || user?.class || user?.className || ""));
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [stage] = useState("");

  const [boards, setBoards] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);

  const [sets, setSets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [profileReady, setProfileReady] = useState(!isLoggedIn);
  const [profileScope, setProfileScope] = useState({ board: "", className: "" });

  const [index, setIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [knownSet, setKnownSet] = useState(new Set());
  const [unknownSet, setUnknownSet] = useState(new Set());
  const [startTs, setStartTs] = useState(Date.now());
  const [pickedTopicId, setPickedTopicId] = useState("");

  const cards = selected?.cards || [];
  const currentCard = cards[index] || null;
  const isLast = cards.length > 0 && index === cards.length - 1;
  const progressPct = cards.length > 0 ? ((index + 1) / cards.length) * 100 : 0;

  const currentSubjectName = subjects.find((s) => String(s._id) === String(subject))?.name || "Subject";
  const currentTopicName = topics.find((t) => String(t._id) === String(topic))?.name || selected?.title || "Flashcards";
  const flashStageLabel = { 1: "Beginner", 2: "Intermediate", 3: "Advanced" }[Number(selected?.stage) || 1] || "Beginner";
  const pickedTopicTheme = getTopicPickerTheme(currentTopicName);

  const availableSubjects = useMemo(() => {
    if (!subjects.length || !sets.length) return [];
    return subjects.filter((s) =>
      sets.some(
        (row) =>
          String(row.subject || "") === String(s._id) ||
          String(row.subjectName || "").toLowerCase() === String(s.name || "").toLowerCase()
      )
    );
  }, [subjects, sets]);

  const availableTopicsForSubject = useMemo(() => {
    if (!subject || !topics.length || !sets.length) return [];
    return topics
      .filter((t) =>
        sets.some(
          (row) =>
            String(row.topic || "") === String(t._id) ||
            String(row.topicName || "").toLowerCase() === String(t.name || "").toLowerCase()
        )
      )
      .map((t) => {
        const theme = getTopicPickerTheme(t.name);
        return { ...t, theme, description: stripHtml(t.shortDescription) || theme.description };
      });
  }, [subject, topics, sets]);

  useEffect(() => {
    if (!availableTopicsForSubject.length) {
      setPickedTopicId("");
      return;
    }
    if (!availableTopicsForSubject.some((t) => String(t._id) === pickedTopicId)) {
      setPickedTopicId(String(availableTopicsForSubject[0]._id));
    }
  }, [availableTopicsForSubject, pickedTopicId]);

  async function startTopicDeck() {
    const topicObj = availableTopicsForSubject.find((t) => String(t._id) === pickedTopicId);
    if (!topicObj) return;
    const matchedSet = sets.find(
      (row) =>
        String(row.topic || "") === String(topicObj._id) ||
        String(row.topicName || "").toLowerCase() === String(topicObj.name || "").toLowerCase()
    );
    setTopic(String(topicObj._id));
    if (matchedSet) await selectSet(matchedSet);
  }

  useEffect(() => { loadBoardsAndClasses(); }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    (async () => {
      try {
        const profile = await getJSON("/api/users/profile");
        const u = profile?.user || {};
        const nextBoard = String(u?.boardId || u?.board || u?.boardName || "").trim();
        const nextClass = String(u?.classId || u?.class || u?.className || "").trim();
        setProfileScope({ board: nextBoard, className: nextClass });
        if (nextBoard) setBoard(nextBoard);
        if (nextClass) setClassName(nextClass);
      } catch {
        // keep localStorage fallback
      } finally {
        setProfileReady(true);
      }
    })();
  }, [isLoggedIn]);

  useEffect(() => {
    if (!board || boards.length === 0) return;
    const hasExact = boards.some((b) => String(b._id) === String(board));
    if (hasExact) return;
    const byName = boards.find((b) => String(b.name || "").toLowerCase() === String(board).toLowerCase());
    if (byName?._id) setBoard(String(byName._id));
  }, [boards, board]);

  useEffect(() => {
    if (!className || classes.length === 0) return;
    const hasExact = classes.some((c) => String(c._id) === String(className));
    if (hasExact) return;
    const byName = classes.find((c) => String(c.name || "").toLowerCase() === String(className).toLowerCase());
    if (byName?._id) setClassName(String(byName._id));
  }, [classes, className]);

  useEffect(() => {
    if (!board || !className) {
      setSubjects([]); setSubject(""); setTopics([]); setTopic(""); return;
    }
    loadSubjects();
  }, [board, className]);

  useEffect(() => {
    if (!subject) { setTopics([]); setTopic(""); return; }
    loadTopics();
  }, [subject]);

  useEffect(() => {
    if (!profileReady) return;
    if (!board || !className) return;
    loadSets();
  }, [profileReady, board, className, subject, topic, stage]);

  useEffect(() => {
    if (!selectedSetId || sets.length === 0) return;
    const found = sets.find((row) => String(row._id) === selectedSetId);
    if (found) selectSet(found);
  }, [selectedSetId, sets]);

  useEffect(() => {
    if (!selected?._id) { setAttempts([]); return; }
    loadMyAttempts(selected._id);
  }, [selected?._id]);

  useEffect(() => {
    if (!currentCard || result) return;
    function handleKey(e) {
      if (e.code === "Space") {
        e.preventDefault();
        setShowBack((p) => !p);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentCard, result]);

  async function loadBoardsAndClasses() {
    try {
      const [bRes, cRes] = await Promise.all([fetch(`${API}/api/boards`), fetch(`${API}/api/classes`)]);
      const [bData, cData] = await Promise.all([bRes.json(), cRes.json()]);
      const nextBoards = Array.isArray(bData) ? bData : [];
      const nextClasses = Array.isArray(cData) ? cData : [];
      setBoards(nextBoards);
      setClasses(nextClasses);

      if (isLoggedIn) {
        const profileBoard = String(user?.boardId || user?.board || user?.boardName || "").toLowerCase();
        const profileClass = String(user?.classId || user?.class || user?.className || "").toLowerCase();
        const matchBoard = nextBoards.find(
          (b) =>
            String(b?._id || "").toLowerCase() === profileBoard ||
            String(b?.name || "").toLowerCase() === profileBoard
        );
        const matchClass = nextClasses.find(
          (c) =>
            String(c?._id || "").toLowerCase() === profileClass ||
            String(c?.name || "").toLowerCase() === profileClass
        );
        if (matchBoard?._id) setBoard(String(matchBoard._id));
        if (matchClass?._id) setClassName(String(matchClass._id));
      } else {
        if (!board && nextBoards[0]?._id) setBoard(String(nextBoards[0]._id));
        if (!className && nextClasses[0]?._id) setClassName(String(nextClasses[0]._id));
      }
    } catch {
      setBoards([]);
      setClasses([]);
    }
  }

  async function loadSubjects() {
    try {
      const rows = await getJSON(`/api/subject?board=${encodeURIComponent(board)}&class=${encodeURIComponent(className)}`);
      setSubjects(Array.isArray(rows) ? rows : []);
    } catch { setSubjects([]); }
  }

  async function loadTopics() {
    try {
      const rows = await getJSON(`/api/topic/${encodeURIComponent(subject)}?board=${encodeURIComponent(board)}&class=${encodeURIComponent(className)}`);
      setTopics(Array.isArray(rows) ? rows : []);
    } catch { setTopics([]); }
  }

  async function loadSets() {
    setLoading(true); setError("");
    try {
      const effectiveBoard = isLoggedIn ? (profileScope.board || board) : board;
      const effectiveClass = isLoggedIn ? (profileScope.className || className) : className;
      const params = { board: effectiveBoard, class: effectiveClass, subject, topic, limit: 100 };
      if (stage) params.stage = stage;

      let data = await listFlashcards(params);
      let rows = Array.isArray(data?.items) ? data.items : [];

      if (isLoggedIn && rows.length === 0) {
        const boardLabel = boards.find((b) => String(b._id) === String(effectiveBoard))?.name || effectiveBoard;
        const classLabel = classes.find((c) => String(c._id) === String(effectiveClass))?.name || effectiveClass;
        const retryParams = { ...params, board: boardLabel, class: classLabel };
        data = await listFlashcards(retryParams);
        rows = Array.isArray(data?.items) ? data.items : [];
      }

      setSets(rows);
      if (!selected || !rows.some((r) => r._id === selected._id)) setSelected(rows[0] || null);
    } catch (e) {
      setError(e.message || "Failed to load flashcards"); setSets([]); setSelected(null);
    } finally { setLoading(false); }
  }

  async function loadMyAttempts(setId) {
    try {
      const data = await myFlashcardAttempts(setId);
      setAttempts(Array.isArray(data?.items) ? data.items : []);
    } catch { setAttempts([]); }
  }

  async function selectSet(row) {
    let next = row;
    try {
      const full = await getFlashcardSet(row?._id);
      if (full && full._id) {
        next = {
          ...row,
          ...full,
          cardsCount: Array.isArray(full.cards) ? full.cards.length : row.cardsCount,
        };
      }
    } catch {
      // fallback to list payload
    }

    setSelected(next);
    setIndex(0); setShowBack(false);
    setKnownSet(new Set()); setUnknownSet(new Set());
    setStartTs(Date.now()); setResult(null); setError("");
  }

  function markCard(known) {
    if (!currentCard?._id) return;
    const id = String(currentCard._id);
    setResult(null);
    setKnownSet((prev) => { const n = new Set(prev); known ? n.add(id) : n.delete(id); return n; });
    setUnknownSet((prev) => { const n = new Set(prev); !known ? n.add(id) : n.delete(id); return n; });
    if (!isLast) { setIndex((p) => p + 1); setShowBack(false); }
  }

  function goPrev() {
    if (index > 0) { setIndex((p) => p - 1); setShowBack(false); }
  }

  function goNext() {
    if (!isLast) { setIndex((p) => p + 1); setShowBack(false); }
  }

  async function submitParticipation() {
    if (!selected?._id) return;
    setBusy(true); setError("");
    try {
      const durationSec = Math.max(1, Math.round((Date.now() - startTs) / 1000));
      const response = await participateFlashcardSet(selected._id, {
        knownCardIds: Array.from(knownSet),
        unknownCardIds: Array.from(unknownSet),
        durationSec,
      });
      setResult(response?.attempt || null);
      await loadMyAttempts(selected._id);
      await loadSets();
    } catch (e) {
      setError(e.message || "Failed to submit participation");
    } finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Helmet>
        <title>Flashcards for Students by Board and Class | Edify Eight</title>
        <meta
          name="description"
          content="Practice with board and class based flashcards to improve memory and revision speed. Learn topic wise with Edify Eight flashcards."
        />
        <meta
          name="keywords"
          content="student flashcards, online revision flashcards, board wise flashcards, class wise flashcards, Edify Eight"
        />
        <link rel="canonical" href="https://www.edifyeight.com/flashcards" />
        <meta property="og:title" content="Flashcards for Students by Board and Class | Edify Eight" />
        <meta
          property="og:description"
          content="Revise faster using topic-wise flashcards filtered by your board and class."
        />
        <meta property="og:url" content="https://www.edifyeight.com/flashcards" />
        <meta property="og:type" content="website" />
      </Helmet>
      <style>{FLIP_CSS}</style>

      {!subject ? (
        /* ── Subject Picker (landing view) ── */
        <div>
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Choose Your Subject</h1>
              <p className="text-sm text-slate-500 mt-1">Pick an adventure to start your flashcard session!</p>
            </div>
            {/* <div className="flex items-center gap-2.5 flex-shrink-0">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
              </button>
              <div className="hidden sm:flex items-center gap-2">
                <div className="h-9 w-9 rounded-full overflow-hidden border-2 border-[#e7c555]/40 bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    String(user?.name || "U").charAt(0).toUpperCase()
                  )}
                </div>
                <span className="text-sm font-bold text-slate-800">{user?.name || "Explorer"}</span>
              </div>
            </div> */}
          </div>

          {(loading || !profileReady) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-3xl border border-slate-100 bg-white p-5 animate-pulse space-y-4">
                  <div className="h-40 rounded-2xl bg-slate-100" />
                  <div className="h-4 bg-slate-100 rounded-full w-1/2" />
                  <div className="h-3 bg-slate-100 rounded-full w-3/4" />
                  <div className="h-10 bg-slate-100 rounded-full" />
                </div>
              ))}
            </div>
          )}

          {!loading && profileReady && availableSubjects.length === 0 && (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-slate-300 text-3xl">style</span>
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-1">No flashcards available yet</h3>
              <p className="text-sm text-slate-400 max-w-md">
                No flashcard sets have been uploaded for your board and class yet. Check back soon!
              </p>
            </div>
          )}

          {!loading && profileReady && availableSubjects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableSubjects.map((s) => (
                <SubjectCard key={s._id} subject={s} onSelect={(picked) => setSubject(String(picked._id))} />
              ))}
            </div>
          )}
        </div>
      ) : !topic ? (
        /* ── Topic Picker (deck setup view) ── */
        <div className="pb-10">
          <button
            type="button"
            onClick={() => setSubject("")}
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-600 mb-3 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            All Subjects
          </button>

          <h1 className="text-xl md:text-2xl font-black mb-4" style={{ color: "#7a6a23" }}>
            {currentSubjectName} Quest: Setup Your Deck
          </h1>

          <div className="flex items-center justify-between gap-3 mb-4">
            <p className="text-base font-black text-slate-900">Select Your Topic</p>
            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold text-white bg-[#6C63FF] whitespace-nowrap">
              {availableTopicsForSubject.length} Topics Available
            </span>
          </div>

          {(loading || !sets.length) && availableTopicsForSubject.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-slate-50 p-5 h-32 animate-pulse" />
              ))}
            </div>
          ) : availableTopicsForSubject.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <span className="material-symbols-outlined text-slate-300 text-3xl mb-2">style</span>
              <h3 className="text-base font-bold text-slate-700 mb-1">No topics available yet</h3>
              <p className="text-sm text-slate-400 max-w-md">
                No flashcard sets have been uploaded for {currentSubjectName} yet. Check back soon!
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                {availableTopicsForSubject.slice(0, 2).map((t) => (
                  <TopicTile
                    key={t._id}
                    topic={t}
                    selected={String(t._id) === pickedTopicId}
                    onSelect={(picked) => setPickedTopicId(String(picked._id))}
                  />
                ))}
              </div>

              {availableTopicsForSubject.length > 2 && (
                <div className="flex flex-col gap-3 mb-8">
                  {availableTopicsForSubject.slice(2).map((t) => (
                    <TopicRow
                      key={t._id}
                      topic={t}
                      selected={String(t._id) === pickedTopicId}
                      onSelect={(picked) => setPickedTopicId(String(picked._id))}
                    />
                  ))}
                </div>
              )}

              <div className="flex justify-center mt-10">
                <button
                  type="button"
                  onClick={startTopicDeck}
                  disabled={!pickedTopicId}
                  className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-white font-bold shadow-md disabled:opacity-50 transition-all hover:brightness-110"
                  style={{ backgroundColor: "#6b6b1a" }}
                >
                  Start Flashcards
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    play_circle
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
      <>
      {/* ── Quest Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => setTopic("")}
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-600 mb-1 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            Change Topic
          </button>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">{currentTopicName}</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="inline-flex items-center rounded-full bg-[#e7c555] px-2.5 py-1 text-[11px] font-bold text-slate-900">
              {currentSubjectName} Explorer
            </span>
            <span className="text-xs font-semibold text-slate-400">• {flashStageLabel} Level</span>
          </div>
        </div>

        {/* <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 bg-[#e7c555]/15 border border-[#e7c555]/30 rounded-full pl-1.5 pr-3 py-1.5">
            <span className="w-6 h-6 rounded-full bg-[#e7c555] flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[14px] text-slate-900" style={{ fontVariationSettings: "'FILL' 1" }}>
                add
              </span>
            </span>
            <span className="text-xs font-black text-slate-800 whitespace-nowrap">
              {Number(user?.points || 0).toLocaleString()} Points
            </span>
          </div>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
          >
            <span className="material-symbols-outlined text-[18px]">notifications</span>
          </button>
          <div className="h-9 w-9 rounded-full overflow-hidden border-2 border-[#e7c555]/40 bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              String(user?.name || "U").charAt(0).toUpperCase()
            )}
          </div>
        </div> */}
      </div>

      {/* Progress */}
      {cards.length > 0 && (
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1.5">
            <span>Card {index + 1} of {cards.length}</span>
            <span>{Math.floor(progressPct)}% Complete</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-[#ECE3D0] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%`, backgroundColor: "#6b6b1a" }}
            />
          </div>
        </div>
      )}

      {/* ── Deck area ── */}
      <div className="max-w-2xl mx-auto w-full">
        <div className="relative overflow-hidden bg-white border border-slate-200 rounded-3xl shadow-sm p-6 md:p-8">
          {!selected ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-center gap-3">
              <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-slate-200 text-3xl">style</span>
              </div>
              <p className="font-bold text-slate-600">No deck found for this topic</p>
              <button
                type="button"
                onClick={() => setTopic("")}
                className="text-sm font-bold text-[#6C63FF] hover:underline"
              >
                ← Back to Topics
              </button>
            </div>
          ) : result ? (
            /* ── Result screen ── */
            <div className="flex flex-col items-center justify-center min-h-[340px] gap-6 text-center">
              <div className={`w-28 h-28 rounded-full flex items-center justify-center border-4 ${result.percent >= 70 ? "border-emerald-300 bg-emerald-50" : "border-amber-300 bg-amber-50"}`}>
                <span className={`text-3xl font-black ${result.percent >= 70 ? "text-emerald-600" : "text-amber-600"}`}>
                  {result.percent}%
                </span>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">
                  {result.percent >= 70 ? "Great job!" : "Keep practicing!"}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  You knew <span className="font-bold text-slate-700">{result.knownCount}</span> out of{" "}
                  <span className="font-bold text-slate-700">{result.totalCards}</span> cards &nbsp;·&nbsp; {result.durationSec}s
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-2">
                  <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
                  <span className="text-sm font-bold text-emerald-700">{result.knownCount} Known</span>
                </div>
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-2">
                  <span className="material-symbols-outlined text-amber-500 text-sm">refresh</span>
                  <span className="text-sm font-bold text-amber-700">{result.totalCards - result.knownCount} Revisit</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => selectSet(selected)}
                  className="flex items-center gap-2 rounded-full bg-[#e7c555] px-6 py-3 text-sm font-bold text-slate-900 hover:brightness-95 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">restart_alt</span>
                  Practice Again
                </button>
                <button
                  type="button"
                  onClick={() => setTopic("")}
                  className="flex items-center gap-2 rounded-full border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  <span className="material-symbols-outlined text-sm">style</span>
                  Change Topic
                </button>
              </div>

              {attempts.length > 0 && (
                <div className="w-full border-t border-slate-100 pt-4 text-left">
                  <p className="text-sm font-bold text-slate-800 mb-2">Recent Attempts</p>
                  <div className="space-y-1.5">
                    {attempts.slice(0, 5).map((row) => (
                      <div key={row._id} className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                        <span className="text-xs text-slate-500">{new Date(row.createdAt).toLocaleString()}</span>
                        <span className={`text-sm font-black ${row.percent >= 70 ? "text-emerald-600" : "text-amber-500"}`}>{row.percent}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── Practice mode ── */
            <div className="space-y-6">
              {/* Decorative faint topic icon */}
              <span
                className="material-symbols-outlined absolute top-4 right-4 text-slate-100 pointer-events-none select-none"
                style={{ fontSize: "110px" }}
              >
                {pickedTopicTheme.icon}
              </span>

              {/* Flip card */}
              {currentCard && (
                <div className="relative z-10 fc-scene select-none" style={{ height: 340 }}>
                  <div className={`fc-card ${showBack ? "flipped" : ""}`}>
                    <div className="fc-face fc-face-front bg-white flex flex-col items-center justify-center p-6 text-center gap-4">
                      <div className="w-11 h-11 rounded-full flex items-center justify-center bg-[#fdf3d9]">
                        <span
                          className="material-symbols-outlined text-[#c9a92b]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          quiz
                        </span>
                      </div>
                      <p className="text-lg md:text-xl font-black text-slate-900 leading-snug max-w-sm">
                        {currentCard.front}
                      </p>
                      <div
                        className="w-32 h-32 rounded-2xl flex items-center justify-center shadow-inner"
                        style={{ background: `linear-gradient(135deg, ${pickedTopicTheme.bg}, #fff)` }}
                      >
                        <span
                          className="material-symbols-outlined text-white"
                          style={{ fontSize: "56px", fontVariationSettings: "'FILL' 1" }}
                        >
                          {pickedTopicTheme.icon}
                        </span>
                      </div>
                    </div>
                    <div className="fc-face fc-face-back bg-white flex flex-col items-center justify-center p-6 text-center gap-4">
                      <div className="w-11 h-11 rounded-full flex items-center justify-center bg-emerald-50">
                        <span
                          className="material-symbols-outlined text-emerald-500"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          check_circle
                        </span>
                      </div>
                      <p className="text-lg md:text-xl font-black text-slate-900 leading-snug max-w-sm">
                        {currentCard.back}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Flip / mark buttons */}
              <div className="relative z-10 flex flex-col items-center gap-3">
                {!showBack ? (
                  <button
                    type="button"
                    onClick={() => setShowBack(true)}
                    className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-bold text-white bg-[#6C63FF] hover:brightness-110 transition-all shadow-md"
                  >
                    <span className="material-symbols-outlined text-[18px]">flip</span>
                    Flip Card
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => markCard(false)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-5 py-2.5 text-sm font-bold text-amber-700 hover:bg-amber-100 transition"
                    >
                      <span className="material-symbols-outlined text-[16px]">refresh</span>
                      Need Revision
                    </button>
                    <button
                      type="button"
                      onClick={() => markCard(true)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-5 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-100 transition"
                    >
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      I Know This
                    </button>
                  </div>
                )}

                {isLast && showBack && (
                  <button
                    type="button"
                    onClick={submitParticipation}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#e7c555] px-6 py-2.5 text-sm font-bold text-slate-900 hover:brightness-95 disabled:opacity-50 transition"
                  >
                    {busy ? (
                      <>
                        <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                        Submitting…
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">send</span>
                        Submit Deck
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Prev / Next nav */}
              <div className="relative z-10 flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={index === 0}
                  className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                  Previous Card
                </button>
                <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-slate-400">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-bold text-slate-500">
                    SPACE
                  </kbd>
                  to flip
                </span>
                <button
                  type="button"
                  onClick={goNext}
                  disabled={isLast}
                  className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  Next Card
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>

              {error && (
                <div className="relative z-10 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                  <span className="material-symbols-outlined text-red-500 text-sm">error</span>
                  <p className="text-sm font-semibold text-red-600">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </>
      )}
    </div>
  );
}
