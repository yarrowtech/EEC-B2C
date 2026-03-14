import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const BOARD_OPTIONS = [
  { label: "CBSE", value: "CBSE" },
  { label: "ICSE", value: "ICSE" },
  { label: "State", value: "State Board" },
];
const GRADES = [
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
];

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

export default function HeroFilterBar() {
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [activeBoard, setActiveBoard] = useState("CBSE");
  const [activeGrade, setActiveGrade] = useState("Class 6");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [cards, setCards] = useState([]);

  const visibleCards = useMemo(() => cards, [cards]);

  async function handleFindQuest() {
    setLoading(true);
    setSearched(true);
    try {
      const summaryUrl = `${API}/api/questions/tryout-summary?board=${encodeURIComponent(
        activeBoard
      )}&class=${encodeURIComponent(activeGrade)}`;
      const res = await fetch(summaryUrl);
      const data = await res.json();
      const summaryItems = Array.isArray(data?.items) ? data.items : [];

      const nextCards = summaryItems
        .filter((stats) => Number(stats?.total || 0) > 0)
        .map((stats, idx) => {
          const type = String(stats?.type || "");
          const meta = TYPE_META[type] || {};
          const fallbackThemes = Object.values(TYPE_META);
          const theme = meta.name ? meta : fallbackThemes[idx % fallbackThemes.length];

          return {
            id: type,
            type,
            name: theme.name || type,
            description: theme.description || "Question type tryout",
            questions: Number(stats.total || 0),
            time: `${Math.max(10, Math.ceil(Number(stats.total || 0) * 0.8))} Mins`,
            difficulty: {
              label: `E:${Number(stats.easy || 0)} M:${Number(stats.moderate || 0)} H:${Number(
                stats.hard || 0
              )}`,
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

      setCards(nextCards);
    } catch {
      setCards([]);
    } finally {
      setLoading(false);
    }
  }

  function handleCardClick(card) {
    const token = localStorage.getItem("jwt") || "";
    if (!token) {
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

  return (
    <div className="w-full bg-[#FEF4E8] flex justify-center px-4 py-10">
      <div className="w-full max-w-6xl">
        <div className="bg-[#e6e8ec] rounded-[2rem] shadow-[0_10px_0_0_#d5d9e0,0_14px_24px_rgba(15,23,42,0.12)] px-5 py-5 flex flex-wrap items-center gap-4 w-full">
          <div className="flex items-center gap-2 bg-[#d9dde3] p-2 rounded-full">
            {BOARD_OPTIONS.map((board) => (
              <button
                key={board.value}
                onClick={() => setActiveBoard(board.value)}
                className={`px-7 py-3 rounded-full text-sm font-bold transition-all ${
                  activeBoard === board.value
                    ? "bg-[#ff6f70] text-white shadow-[0_4px_8px_rgba(239,83,80,0.45)]"
                    : "text-[#526583] hover:text-slate-800"
                }`}
              >
                {board.label}
              </button>
            ))}
          </div>

          <div className="h-12 w-px bg-[#c7ced8] mx-1 hidden md:block" />

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <select
                value={activeGrade}
                onChange={(e) => setActiveGrade(e.target.value)}
                className="h-12 appearance-none rounded-full border-2 border-[#4ECDC4] bg-[#cdeceb] pl-6 pr-11 font-bold text-[#24496c] focus:outline-none"
              >
                {GRADES.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
              <MIcon
                name="expand_more"
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#24496c]"
              />
            </div>
          </div>

          <button
            onClick={handleFindQuest}
            disabled={loading}
            className="ml-auto bg-[#F5C518] disabled:opacity-70 disabled:cursor-not-allowed text-slate-900 font-black px-8 py-3 rounded-full text-sm whitespace-nowrap hover:brightness-105 active:scale-95 transition-all duration-200 shadow-[0_4px_0_0_#c79204]"
          >
            {loading ? "Finding..." : "Find My Quest →"}
          </button>
        </div>

        <div className="mt-8">
          {loading && (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
              Loading tryouts...
            </div>
          )}

          {!loading && searched && visibleCards.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
              No tryouts found for {activeBoard} - {activeGrade}.
            </div>
          )}

          {!loading && visibleCards.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                      <span
                        className={`${subject.tagBg} ${subject.tagText} text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1`}
                      >
                        <MIcon name="format_list_numbered" className="text-[14px]" />
                        {subject.questions} Questions
                      </span>
                      <span
                        className={`${subject.difficulty.bg} ${subject.difficulty.text} text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1`}
                      >
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
