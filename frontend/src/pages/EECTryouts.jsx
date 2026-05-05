import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getJSON } from "../lib/api";

function MIcon({ name, className = "", fill = false, style }) {
  return (
    <span
      className={`material-symbols-outlined select-none leading-none ${className}`}
      style={fill ? { fontVariationSettings: "'FILL' 1", ...style } : style}
    >
      {name}
    </span>
  );
}

const TYPE_META = {
  "mcq-single":   { name: "MCQ Single",    description: "Single-correct objective questions from your syllabus.",        gradient: "from-blue-400 to-indigo-600",      icon: "radio_button_checked",    color: "#3b82f6", tagBg: "bg-blue-50",    tagText: "text-blue-600"  },
  "mcq-multi":    { name: "MCQ Multi",     description: "Multiple-correct objective questions for deeper practice.",     gradient: "from-emerald-400 to-teal-600",    icon: "check_box",               color: "#10b981", tagBg: "bg-teal-50",    tagText: "text-teal-600"  },
  "choice-matrix":{ name: "Choice Matrix", description: "Matrix-style questions to test concept-level mapping.",         gradient: "from-orange-400 to-pink-600",     icon: "grid_view",               color: "#f97316", tagBg: "bg-orange-50",  tagText: "text-orange-600"},
  "true-false":   { name: "True / False",  description: "Fast true/false concept checks.",                               gradientStyle: "linear-gradient(135deg,#d97706,#78350f)", icon: "rule",     color: "#d97706", tagBg: "bg-amber-50",   tagText: "text-amber-700" },
  "cloze-drag":   { name: "Cloze Drag",    description: "Drag and drop terms into the correct blanks.",                  gradient: "from-cyan-500 to-blue-700",       icon: "open_with",               color: "#06b6d4", tagBg: "bg-cyan-50",    tagText: "text-cyan-600"  },
  "cloze-select": { name: "Cloze Select",  description: "Pick correct options to complete each statement.",              gradient: "from-fuchsia-500 to-rose-500",    icon: "arrow_drop_down_circle",  color: "#d946ef", tagBg: "bg-fuchsia-50", tagText: "text-fuchsia-600"},
  "cloze-text":   { name: "Cloze Text",    description: "Type direct answers in fill-in-the-blank prompts.",             gradient: "from-violet-500 to-purple-600",   icon: "edit_note",               color: "#8b5cf6", tagBg: "bg-violet-50",  tagText: "text-violet-600"},
  "match-list":   { name: "Match List",    description: "Match items from two columns accurately.",                      gradient: "from-lime-500 to-green-600",      icon: "hub",                     color: "#84cc16", tagBg: "bg-lime-50",    tagText: "text-lime-700"  },
  "essay-plain":  { name: "Essay Plain",   description: "Practice structured long answers in plain text format.",        gradient: "from-slate-500 to-gray-700",      icon: "description",             color: "#64748b", tagBg: "bg-slate-100",  tagText: "text-slate-600" },
  "essay-rich":   { name: "Essay Rich",    description: "Practice rich-text long answers with formatting.",              gradient: "from-red-400 to-rose-600",        icon: "article",                 color: "#ef4444", tagBg: "bg-rose-50",    tagText: "text-rose-600"  },
};

const DEFAULT_FREE_TRYOUT_TYPES = ["mcq-single", "mcq-multi", "choice-matrix", "true-false"];
export default function EECTryouts() {
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("jwt") || "";
  const isLoggedIn = Boolean(token);

  const [activeBoard, setActiveBoard] = useState("CBSE");
  const [activeGrade, setActiveGrade] = useState("Class 6");
  const [activeBoardQuery, setActiveBoardQuery] = useState("CBSE");
  const [activeGradeQuery, setActiveGradeQuery] = useState("Class 6");
  const [boards, setBoards] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState([]);
  const [allowedTryoutTypesState, setAllowedTryoutTypesState] = useState(new Set(DEFAULT_FREE_TRYOUT_TYPES));

  function normalizeGrade(value) {
    const raw = String(value || "").trim();
    if (!raw) return "Class 6";
    const classMatch = raw.match(/class\s*(\d+)/i);
    if (classMatch) return `Class ${classMatch[1]}`;
    const numberMatch = raw.match(/^(\d+)$/);
    if (numberMatch) return `Class ${numberMatch[1]}`;
    return raw;
  }

  function mapSummaryToCards(summaryItems) {
    return summaryItems
      .filter((stats) => Number(stats?.total || 0) > 0)
      .map((stats, idx) => {
        const type = String(stats?.type || "");
        const meta = TYPE_META[type] || {};
        const fallback = Object.values(TYPE_META)[idx % Object.values(TYPE_META).length];
        const theme = meta.name ? meta : fallback;
        return {
          id: type, type,
          name: theme.name || type,
          description: theme.description || "Question type tryout",
          questions: Number(stats.total || 0),
          time: `${Math.max(10, Math.ceil(Number(stats.total || 0) * 0.8))} min`,
          easy: Number(stats.easy || 0), moderate: Number(stats.moderate || 0), hard: Number(stats.hard || 0),
          gradient: theme.gradient, gradientStyle: theme.gradientStyle,
          icon: theme.icon || "quiz", color: theme.color || "#64748b",
          tagBg: theme.tagBg || "bg-slate-100", tagText: theme.tagText || "text-slate-600",
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async function fetchTryoutSummary(boardValue, classValue) {
    const params = new URLSearchParams();
    if (boardValue) params.set("board", boardValue);
    if (classValue) params.set("class", classValue);
    const summaryUrl = `${API}/api/questions/tryout-summary${params.toString() ? `?${params.toString()}` : ""}`;
    const summaryRes = await fetch(summaryUrl);
    const summaryData = await summaryRes.json();
    return Array.isArray(summaryData?.items) ? summaryData.items : [];
  }

  useEffect(() => {
    let mounted = true;
    async function loadTryoutTypes() {
      setLoading(true);
      try {
        if (isLoggedIn) {
          const profile = await getJSON("/api/users/profile");
          const user = profile?.user || {};
          const boardLabel = user.boardName || user.board || "CBSE";
          const classLabel = normalizeGrade(user.className || user.class || "Class 6");
          const boardValue = user.boardId || user.board || user.boardName || boardLabel;
          const classValue = user.classId || user.class || user.className || classLabel;
          if (!boardValue || !classValue) throw new Error("Please update profile board and class");
          setActiveBoard(boardLabel);
          setActiveGrade(classLabel);
          setActiveBoardQuery(String(boardValue));
          setActiveGradeQuery(String(classValue));
          const [packagesRes, subscriptionRes] = await Promise.all([
            fetch(`${API}/api/packages`),
            fetch(`${API}/api/subscriptions/current`, { headers: { Authorization: `Bearer ${token}` } }),
          ]);
          const [packagesData, subscriptionData] = await Promise.all([packagesRes.json(), subscriptionRes.json()]);
          const packageRows = Array.isArray(packagesData?.packages) ? packagesData.packages : [];
          const basicPackage = packageRows.find((p) => String(p?.name || "").toLowerCase() === "basic");
          const activePackage = subscriptionData?.subscription?.package || null;
          const allowedFromPackage =
            Array.isArray(activePackage?.allowedTryoutTypes) && activePackage.allowedTryoutTypes.length > 0
              ? activePackage.allowedTryoutTypes
              : Array.isArray(basicPackage?.allowedTryoutTypes) && basicPackage.allowedTryoutTypes.length > 0
              ? basicPackage.allowedTryoutTypes
              : DEFAULT_FREE_TRYOUT_TYPES;
          setAllowedTryoutTypesState(new Set(allowedFromPackage.map((t) => String(t).trim())));
          const summaryItems = await fetchTryoutSummary(boardValue, classValue);
          if (!mounted) return;
          setCards(mapSummaryToCards(summaryItems));
        } else {
          setAllowedTryoutTypesState(new Set(DEFAULT_FREE_TRYOUT_TYPES));
          const [boardsRes, classesRes] = await Promise.all([
            fetch(`${API}/api/boards`),
            fetch(`${API}/api/classes`),
          ]);
          const [boardsData, classesData] = await Promise.all([
            boardsRes.json().catch(() => []),
            classesRes.json().catch(() => []),
          ]);
          const boardRows = Array.isArray(boardsData)
            ? boardsData
            : Array.isArray(boardsData?.boards)
            ? boardsData.boards
            : [];
          const classRows = Array.isArray(classesData)
            ? classesData
            : Array.isArray(classesData?.classes)
            ? classesData.classes
            : [];

          const nextBoards = boardRows
            .map((b) => ({
              label: String(b?.name || "").trim(),
              value: String(b?._id || b?.name || "").trim(),
            }))
            .filter((b) => b.label && b.value);
          const nextGrades = classRows
            .map((c) => ({
              label: normalizeGrade(c?.name || ""),
              value: String(c?._id || c?.name || "").trim(),
            }))
            .filter((c) => c.label && c.value);

          if (!mounted) return;
          setBoards(nextBoards);
          setGrades(nextGrades);

          if (nextBoards[0]) {
            setActiveBoard(nextBoards[0].label);
            setActiveBoardQuery(nextBoards[0].value);
          }
          if (nextGrades[0]) {
            setActiveGrade(nextGrades[0].label);
            setActiveGradeQuery(nextGrades[0].value);
          }

          // Guest default: show all available tryout types (unfiltered)
          const summaryItems = await fetchTryoutSummary();
          if (!mounted) return;
          setCards(mapSummaryToCards(summaryItems));
        }
      } catch { if (mounted) setCards([]); }
      finally { if (mounted) setLoading(false); }
    }
    loadTryoutTypes();
    return () => { mounted = false; };
  }, [API, isLoggedIn]);

  const allowedTryoutTypes = useMemo(() => allowedTryoutTypesState, [allowedTryoutTypesState]);

  async function handleGuestFilter() {
    if (isLoggedIn) return;
    setLoading(true);
    try {
      const summaryItems = await fetchTryoutSummary(activeBoardQuery, activeGradeQuery);
      setCards(mapSummaryToCards(summaryItems));
    } catch {
      setCards([]);
    } finally {
      setLoading(false);
    }
  }

  function handleCardClick(card) {
    if (!isLoggedIn) { window.dispatchEvent(new Event("eec:open-login")); return; }
    if (!allowedTryoutTypes.has(card.type)) { navigate("/dashboard/packages"); return; }
    navigate(`/tryouts/${encodeURIComponent(card.type)}`, {
      state: { board: activeBoard, class: activeGrade, boardLabel: activeBoard, classLabel: activeGrade },
    });
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── Hero ── */}
      <div className="bg-linear-to-br from-[#1B1F3B] to-[#2d3561] px-4 py-14 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#FFD23F]/20 border border-[#FFD23F]/30 px-4 py-1.5 text-sm font-bold text-[#FFD23F] mb-5">
            <MIcon name="star" className="text-base" fill />
            Practice Tests
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
            Adventure <span style={{ color: "#FFD23F" }}>Tryouts!</span>
          </h1>
          <p className="text-slate-300 text-lg max-w-xl mb-8">
            Pick a question type, attempt real exam-style questions, earn badges, and climb the leaderboard.
          </p>

          {/* Board + Grade display */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm font-bold text-white">
              <MIcon name="school" className="text-base" />
              {activeBoard}
              {isLoggedIn && <span className="text-white/40 text-xs ml-1">(from profile)</span>}
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm font-bold text-white">
              <MIcon name="grade" className="text-base" />
              {activeGrade}
              {isLoggedIn && <span className="text-white/40 text-xs ml-1">(from profile)</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Board pill tabs (guests only) ── */}
      {!isLoggedIn && (
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 overflow-x-auto">
          <div className="mx-auto max-w-6xl flex gap-2 flex-nowrap">
            <span className="text-xs font-bold text-slate-400 self-center shrink-0 mr-1">Board:</span>
            {boards.map((b) => (
              <button
                key={b.value}
                onClick={() => {
                  setActiveBoard(b.label);
                  setActiveBoardQuery(b.value);
                }}
                className="shrink-0 rounded-full px-4 py-1.5 text-sm font-bold transition-all border"
                style={activeBoardQuery === b.value
                  ? { background: "#1B1F3B", color: "#FFD23F", borderColor: "#1B1F3B" }
                  : { background: "white", color: "#475569", borderColor: "#e2e8f0" }}
              >
                {b.label}
              </button>
            ))}
            <span className="mx-2 border-l border-slate-200 self-stretch" />
            <span className="text-xs font-bold text-slate-400 self-center shrink-0 mr-1">Grade:</span>
            {grades.map((g) => (
              <button
                key={g.value}
                onClick={() => {
                  setActiveGrade(g.label);
                  setActiveGradeQuery(g.value);
                }}
                className="shrink-0 rounded-full px-4 py-1.5 text-sm font-bold transition-all border"
                style={activeGradeQuery === g.value
                  ? { background: "#F4736E", color: "white", borderColor: "#F4736E" }
                  : { background: "white", color: "#475569", borderColor: "#e2e8f0" }}
              >
                {g.label}
              </button>
            ))}
            <button
              onClick={handleGuestFilter}
              className="shrink-0 rounded-full px-5 py-1.5 text-sm font-black bg-[#F5C518] text-slate-900 border border-[#F5C518]"
            >
              Find My Quest
            </button>
          </div>
        </div>
      )}

      {/* ── Card Grid ── */}
      <div className="mx-auto max-w-6xl px-4 py-10">

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50 p-6 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-200" />
                  <div className="h-5 w-32 bg-slate-200 rounded-lg" />
                </div>
                <div className="h-4 w-full bg-slate-200 rounded mb-2" />
                <div className="h-4 w-3/4 bg-slate-200 rounded mb-6" />
                <div className="h-10 w-full bg-slate-200 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {!loading && cards.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <MIcon name="quiz" className="text-4xl text-slate-400" />
            </div>
            <p className="text-lg font-bold text-slate-600 mb-1">No tryouts available</p>
            <p className="text-sm text-slate-400">
              {isLoggedIn ? "No tryouts found for your board and class." : "Sign in to see personalised tryouts."}
            </p>
            {!isLoggedIn && (
              <button
                onClick={() => window.dispatchEvent(new Event("eec:open-login"))}
                className="mt-4 rounded-full bg-[#F4736E] text-white font-bold px-6 py-2.5 text-sm hover:brightness-105 transition"
              >
                Sign In Free
              </button>
            )}
          </div>
        )}

        {!loading && cards.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm font-semibold text-slate-500">
                <span className="font-black text-slate-900">{cards.length}</span> question types available
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cards.map((card) => {
                const isLocked = isLoggedIn && !allowedTryoutTypes.has(card.type);
                return (
                  <article
                    key={card.id}
                    className="group flex flex-col rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                  >
                    {/* ── Gradient header with large rotating icon (HeroFilterBar style) ── */}
                    <div
                      className={`h-40 relative overflow-hidden p-6 flex flex-col justify-end ${card.gradientStyle ? "" : `bg-gradient-to-br ${card.gradient}`}`}
                      style={card.gradientStyle ? { backgroundImage: card.gradientStyle } : undefined}
                    >
                      {/* Time badge */}
                      <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/30">
                        {card.time}
                      </div>

                      {/* Lock badge */}
                      {isLocked && (
                        <div className="absolute top-4 left-4 bg-black/30 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/20 flex items-center gap-1">
                          <MIcon name="lock" className="text-sm" fill /> Locked
                        </div>
                      )}

                      {/* Large background icon — rotates on hover */}
                      <MIcon
                        name={card.icon}
                        className="absolute -bottom-4 -right-4 rotate-12 group-hover:rotate-0 transition-transform duration-500 text-white/20 pointer-events-none"
                        style={{ fontSize: "100px" }}
                        fill
                      />

                      {/* Card title */}
                      <h3 className="text-white text-2xl font-black relative z-10 leading-tight" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
                        {card.name}
                      </h3>
                    </div>

                    {/* ── Card body ── */}
                    <div className="flex flex-col flex-1 p-5 gap-4">
                      {/* Stats badges */}
                      <div className="flex flex-wrap gap-2">
                        <span className={`inline-flex items-center gap-1.5 ${card.tagBg} ${card.tagText} text-xs font-bold px-3 py-1.5 rounded-full`}>
                          <MIcon name="format_list_numbered" className="text-sm" />
                          {card.questions} Questions
                        </span>
                        <span className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-600 text-xs font-bold px-3 py-1.5 rounded-full">
                          <MIcon name="tune" className="text-sm" />
                          E:{card.easy} M:{card.moderate} H:{card.hard}
                        </span>
                      </div>

                      <p className="text-sm text-slate-500 leading-relaxed flex-1">{card.description}</p>

                      <button
                        onClick={() => handleCardClick(card)}
                        className="w-full rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                        style={isLocked
                          ? { background: "#f1f5f9", color: "#64748b" }
                          : { background: card.color, color: "white", boxShadow: `0 4px 14px ${card.color}50` }}
                      >
                        {isLocked
                          ? <><MIcon name="lock" className="text-base" fill /> Unlock Tryout</>
                          : <><MIcon name="play_circle" className="text-base" fill /> Start Quest</>
                        }
                      </button>
                    </div>
                  </article>
                );
              })}

              {/* Unlock card */}
              {!loading && (
                <button
                  type="button"
                  onClick={() => isLoggedIn ? navigate("/dashboard/packages") : window.dispatchEvent(new Event("eec:open-login"))}
                  className="group flex flex-col rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:border-[#FFD23F] hover:bg-[#FFD23F]/5 transition-all duration-300 p-5 items-center justify-center gap-3 min-h-[200px]"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MIcon name="lock_open" className="text-3xl text-[#FFD23F]" fill />
                  </div>
                  <p className="font-black text-slate-700 text-base" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>Unlock All Types</p>
                  <p className="text-xs text-slate-400 text-center">Upgrade to access all 10 question types</p>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
