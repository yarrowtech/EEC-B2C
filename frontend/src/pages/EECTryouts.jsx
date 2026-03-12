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
  "mcq-single": {
    name: "MCQ Single",
    description: "Single-correct objective questions from your syllabus.",
    gradient: "from-blue-400 to-indigo-600",
    icon: "radio_button_checked",
    tagBg: "bg-blue-100",
    tagText: "text-blue-700",
  },
  "mcq-multi": {
    name: "MCQ Multi",
    description: "Multiple-correct objective questions for deeper practice.",
    gradient: "from-emerald-400 to-teal-600",
    icon: "check_box",
    tagBg: "bg-teal-100",
    tagText: "text-teal-700",
  },
  "choice-matrix": {
    name: "Choice Matrix",
    description: "Matrix-style questions to test concept-level mapping.",
    gradient: "from-orange-400 to-pink-600",
    icon: "grid_view",
    tagBg: "bg-orange-100",
    tagText: "text-orange-700",
  },
  "true-false": {
    name: "True / False",
    description: "Fast true/false concept checks.",
    gradientStyle: "linear-gradient(to bottom right, #d97706, #78350f)",
    icon: "rule",
    tagBg: "bg-amber-100",
    tagText: "text-amber-700",
  },
  "cloze-drag": {
    name: "Cloze Drag",
    description: "Drag and drop terms into the correct blanks.",
    gradient: "from-cyan-500 to-blue-700",
    icon: "open_with",
    tagBg: "bg-cyan-100",
    tagText: "text-cyan-700",
  },
  "cloze-select": {
    name: "Cloze Select",
    description: "Pick correct options to complete each statement.",
    gradient: "from-fuchsia-500 to-rose-500",
    icon: "arrow_drop_down_circle",
    tagBg: "bg-fuchsia-100",
    tagText: "text-fuchsia-700",
  },
  "cloze-text": {
    name: "Cloze Text",
    description: "Type direct answers in fill-in-the-blank prompts.",
    gradient: "from-violet-500 to-purple-600",
    icon: "edit_note",
    tagBg: "bg-violet-100",
    tagText: "text-violet-700",
  },
  "match-list": {
    name: "Match List",
    description: "Match items from two columns accurately.",
    gradient: "from-lime-500 to-green-600",
    icon: "hub",
    tagBg: "bg-lime-100",
    tagText: "text-lime-700",
  },
  "essay-plain": {
    name: "Essay Plain",
    description: "Practice structured long answers in plain text format.",
    gradient: "from-slate-500 to-gray-700",
    icon: "description",
    tagBg: "bg-slate-100",
    tagText: "text-slate-700",
  },
  "essay-rich": {
    name: "Essay Rich",
    description: "Practice rich-text long answers with formatting.",
    gradient: "from-red-400 to-rose-600",
    icon: "article",
    tagBg: "bg-rose-100",
    tagText: "text-rose-700",
  },
};

const BOARDS = ["CBSE", "ICSE", "State Board", "IB"];
const GRADES = ["Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];
const DIFFICULTIES = ["All Subjects", "Difficulty: Any"];

export default function EECTryouts() {
  const navigate = useNavigate();
  const token = localStorage.getItem("jwt") || "";
  const isLoggedIn = Boolean(token);

  const [activeBoard, setActiveBoard] = useState("CBSE");
  const [activeGrade, setActiveGrade] = useState("Class 6");
  const [boardOpen, setBoardOpen] = useState(false);
  const [gradeOpen, setGradeOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function loadTryoutTypes() {
      if (!isLoggedIn) {
        setCards([]);
        return;
      }

      setLoading(true);
      try {
        const profile = await getJSON("/api/users/profile");
        const user = profile?.user || {};

        const boardLabel = user.boardName || user.board || BOARDS[0];
        const classLabel = user.className || user.class || GRADES[3];
        const boardValue = user.boardId || user.board || user.boardName || boardLabel;
        const classValue = user.classId || user.class || user.className || classLabel;

        if (!boardValue || !classValue) {
          throw new Error("Please update profile board and class");
        }

        const questionData = await getJSON(
          `/api/questions?board=${encodeURIComponent(boardValue)}&class=${encodeURIComponent(
            classValue
          )}&page=1&limit=5000`
        );
        const questionItems = Array.isArray(questionData?.items) ? questionData.items : [];

        const byType = {};
        for (const q of questionItems) {
          const type = String(q?.type || "").trim();
          if (!type) continue;
          if (!byType[type]) byType[type] = { total: 0, easy: 0, moderate: 0, hard: 0 };
          byType[type].total += 1;

          const d = String(q?.difficulty || "easy").toLowerCase();
          if (d === "hard") byType[type].hard += 1;
          else if (d === "moderate") byType[type].moderate += 1;
          else byType[type].easy += 1;
        }

        const nextCards = Object.entries(byType)
          .filter(([, stats]) => stats.total > 0)
          .map(([type, stats], idx) => {
            const meta = TYPE_META[type] || {};
            const fallbackThemes = Object.values(TYPE_META);
            const theme = meta.name ? meta : fallbackThemes[idx % fallbackThemes.length];

            return {
              id: type,
              type,
              name: theme.name || type,
              description: theme.description || "Question type tryout",
              questions: stats.total,
              time: `${Math.max(10, Math.ceil(stats.total * 0.8))} Mins`,
              difficulty: {
                label: `E:${stats.easy} M:${stats.moderate} H:${stats.hard}`,
                icon: "tune",
                bg: "bg-violet-100",
                text: "text-violet-700",
              },
              gradient: theme.gradient,
              gradientStyle: theme.gradientStyle,
              icon: theme.icon || "quiz",
              tagBg: theme.tagBg || "bg-slate-100",
              tagText: theme.tagText || "text-slate-700",
            };
          })
          .sort((a, b) => a.name.localeCompare(b.name));

        if (!mounted) return;
        setActiveBoard(boardLabel);
        setActiveGrade(classLabel);
        setCards(nextCards);
      } catch {
        if (mounted) setCards([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadTryoutTypes();
    return () => {
      mounted = false;
    };
  }, [isLoggedIn]);

  const visibleCards = useMemo(() => cards, [cards]);

  function handleCardClick(card) {
    if (!isLoggedIn) {
      window.dispatchEvent(new Event("eec:open-login"));
      return;
    }
    navigate(`/tryouts/${encodeURIComponent(card.type)}`, {
      state: {
        board: activeBoard,
        class: activeGrade,
        boardLabel: activeBoard,
        classLabel: activeGrade,
      },
    });
  }

  function handleStartQuest() {
    if (visibleCards.length > 0) {
      handleCardClick(visibleCards[0]);
      return;
    }
    if (!isLoggedIn) {
      window.dispatchEvent(new Event("eec:open-login"));
    }
  }

  return (
    <div
      className="min-h-screen bg-[#f8f7f6]"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
      `}</style>

      <main className="max-w-[1200px] mx-auto w-full px-4 md:px-10 py-10">
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center gap-2 text-[#e7c555] font-bold text-sm uppercase tracking-widest">
            <MIcon name="star" className="text-[18px]" fill />
            Level Up Your Brain
          </div>

          <div className="flex flex-wrap justify-between items-end gap-4">
            <div className="flex flex-col gap-2 max-w-2xl">
              <h1 className="text-slate-900 text-4xl md:text-5xl font-black leading-tight tracking-tight">
                Adventure Tryouts!
              </h1>
              <p className="text-slate-600 text-lg font-medium">
                Pick a subject quest, earn badges, and climb the ranks. Are you ready, explorer?
              </p>
            </div>

            <div className="flex items-center gap-4 bg-[#e7c555]/20 p-4 rounded-2xl border border-[#e7c555]/30">
              <div className="bg-[#e7c555] p-2 rounded-xl">
                <MIcon name="trophy" className="text-slate-900" fill />
              </div>
              <div>
                <p className="text-xs font-bold text-[#b89a2a] uppercase tracking-wider">Current Rank</p>
                <p className="font-bold text-slate-900">Star Explorer</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-10 pb-6 border-b border-slate-200">
          <div className="relative">
            <button
              onClick={() => {
                if (isLoggedIn) return;
                setBoardOpen((o) => !o);
                setGradeOpen(false);
              }}
              className="flex h-11 items-center gap-2 rounded-full bg-[#e7c555] text-slate-900 px-6 font-bold shadow-lg shadow-[#e7c555]/30 hover:bg-[#d4b44a] transition-colors"
            >
              <MIcon name="school" className="text-[20px]" />
              {activeBoard}
              <MIcon name="expand_more" className="text-[20px]" />
            </button>
            {boardOpen && (
              <div className="absolute top-13 left-0 z-30 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 min-w-[150px]">
                {BOARDS.map((b) => (
                  <button
                    key={b}
                    onClick={() => {
                      setActiveBoard(b);
                      setBoardOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      activeBoard === b ? "bg-[#e7c555]/20 text-slate-900" : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                if (isLoggedIn) return;
                setGradeOpen((o) => !o);
                setBoardOpen(false);
              }}
              className="flex h-11 items-center gap-2 rounded-full bg-white text-slate-700 px-6 font-bold border border-slate-200 hover:border-[#e7c555] transition-all"
            >
              <MIcon name="grade" className="text-[20px]" />
              {activeGrade}
              <MIcon name="expand_more" className="text-[20px]" />
            </button>
            {gradeOpen && (
              <div className="absolute top-13 left-0 z-30 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 min-w-[150px] max-h-56 overflow-y-auto">
                {GRADES.map((g) => (
                  <button
                    key={g}
                    onClick={() => {
                      setActiveGrade(g);
                      setGradeOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      activeGrade === g ? "bg-[#e7c555]/20 text-slate-900" : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-11 w-[1px] bg-slate-200 mx-2 hidden sm:block" />

          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              className="flex h-11 items-center gap-2 rounded-full bg-white text-slate-700 px-6 font-bold border border-slate-200 hover:border-[#e7c555] transition-all"
            >
              {d}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {!isLoggedIn && (
            <div className="col-span-full rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
              Please login to view tryouts.
            </div>
          )}

          {isLoggedIn && loading && (
            <div className="col-span-full rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
              Loading tryouts from database...
            </div>
          )}

          {isLoggedIn && !loading && visibleCards.length === 0 && (
            <div className="col-span-full rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
              No tryouts found for your board and class.
            </div>
          )}

          {visibleCards.map((subject) => (
            <div
              key={subject.id}
              className="flex flex-col bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:border-[#e7c555]/50 transition-all duration-300 group"
            >
              <div
                className={`h-40 relative overflow-hidden p-6 flex flex-col justify-end ${
                  subject.gradientStyle ? "" : `bg-gradient-to-br ${subject.gradient}`
                }`}
                style={subject.gradientStyle ? { backgroundImage: subject.gradientStyle } : undefined}
              >
                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/30">
                  {subject.time}
                </div>
                <MIcon
                  name={subject.icon}
                  className="absolute -bottom-4 -right-4 rotate-12 group-hover:rotate-0 transition-transform duration-300 text-white/20"
                  style={{ fontSize: "96px" }}
                />
                <h3 className="text-white text-2xl font-black relative z-10">{subject.name}</h3>
              </div>

              <div className="p-6 flex flex-col gap-4 flex-1">
                <div className="flex flex-wrap gap-2">
                  <span className={`${subject.tagBg} ${subject.tagText} text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1`}>
                    <MIcon name="format_list_numbered" className="text-[14px]" />
                    {subject.questions} Questions
                  </span>
                  <span className={`${subject.difficulty.bg} ${subject.difficulty.text} text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1`}>
                    <MIcon name={subject.difficulty.icon} className="text-[14px]" />
                    {subject.difficulty.label}
                  </span>
                </div>
                <p className="text-slate-600 text-sm line-clamp-2 flex-1">{subject.description}</p>
                <button
                  onClick={() => handleCardClick(subject)}
                  className="w-full bg-[#e7c555] hover:bg-[#d4b44a] text-slate-900 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all group-hover:scale-[1.02]"
                >
                  Start Quest
                  <MIcon name="play_circle" />
                </button>
              </div>
            </div>
          ))}

          {isLoggedIn && !loading && (
            <div className="flex flex-col bg-slate-100 rounded-xl overflow-hidden border border-dashed border-slate-300 relative group opacity-80">
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-slate-900/10 backdrop-blur-[2px]">
                <div className="bg-white p-4 rounded-full shadow-lg text-[#e7c555] mb-2">
                  <MIcon name="lock" className="text-4xl" fill />
                </div>
                <p className="text-slate-900 font-bold">Unlocks at Level 5</p>
              </div>
              <div className="h-40 bg-slate-300" />
              <div className="p-6 flex flex-col gap-4 grayscale">
                <div className="h-4 w-32 bg-slate-200 rounded" />
                <div className="h-10 w-full bg-slate-200 rounded-lg" />
              </div>
            </div>
          )}
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={handleStartQuest}
            className="bg-white text-slate-900 border border-slate-200 font-bold px-8 py-3 rounded-full hover:bg-slate-50 transition-colors shadow-sm inline-flex items-center gap-2"
          >
            Load More Quests
            <MIcon name="expand_more" />
          </button>
        </div>
      </main>
    </div>
  );
}
