import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { getJSON, myAttempts } from "../lib/api";
import { Loader2, SearchX } from "lucide-react";

function MIcon({ name, className = "", fill = false, style }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={fill ? { fontVariationSettings: "'FILL' 1", ...style } : style}
    >
      {name}
    </span>
  );
}

/* ── Decorative vector art per subject category ── */
function MathArt({ color }) {
  return (
    <svg width="170" height="170" viewBox="0 0 170 170" fill="none">
      <rect x="14" y="14" width="46" height="46" rx="8" stroke={color} strokeWidth="3" transform="rotate(-8 37 37)" />
      <circle cx="128" cy="40" r="26" stroke={color} strokeWidth="3" />
      <path d="M70 130 L100 70 L130 130 Z" stroke={color} strokeWidth="3" strokeLinejoin="round" />
      <line x1="20" y1="150" x2="60" y2="150" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <line x1="40" y1="130" x2="40" y2="170" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function ScienceArt({ color }) {
  return (
    <svg width="170" height="170" viewBox="0 0 170 170" fill="none">
      <circle cx="85" cy="85" r="9" fill={color} />
      <ellipse cx="85" cy="85" rx="70" ry="26" stroke={color} strokeWidth="3" transform="rotate(20 85 85)" />
      <ellipse cx="85" cy="85" rx="70" ry="26" stroke={color} strokeWidth="3" transform="rotate(-20 85 85)" />
      <ellipse cx="85" cy="85" rx="70" ry="26" stroke={color} strokeWidth="3" transform="rotate(90 85 85)" />
      <circle cx="148" cy="60" r="4" fill={color} />
      <circle cx="30" cy="115" r="4" fill={color} />
    </svg>
  );
}

function BookArt({ color }) {
  return (
    <svg width="170" height="170" viewBox="0 0 170 170" fill="none">
      <path d="M30 40 C50 30 70 30 85 42 V130 C70 118 50 118 30 128 Z" stroke={color} strokeWidth="3" strokeLinejoin="round" />
      <path d="M140 40 C120 30 100 30 85 42 V130 C100 118 120 118 140 128 Z" stroke={color} strokeWidth="3" strokeLinejoin="round" />
      <path d="M40 58 Q55 50 70 58" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M40 76 Q55 68 70 76" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="135" cy="150" r="3" fill={color} />
      <circle cx="150" cy="138" r="2" fill={color} />
    </svg>
  );
}

const SUBJECT_THEMES = [
  {
    test: /math/,
    icon: "calculate",
    color: "#D97706",
    bg: "#FEF3D7",
    description: "Numbers aren't just digits; they're the language of the universe. Explore geometry and algebra through puzzles!",
    Art: MathArt,
  },
  {
    test: /sci|phys|chem|bio/,
    icon: "science",
    color: "#2563EB",
    bg: "#E3EEFD",
    description: "From microscopic atoms to massive galaxies. Discover the secrets of physics, biology, and chemistry.",
    Art: ScienceArt,
  },
  {
    test: /eng|story|read|lit|hindi|lang/,
    icon: "auto_stories",
    color: "#DB2777",
    bg: "#FCE7EB",
    description: "Unleash your imagination. Learn the art of storytelling, creative writing, and literature from around the globe.",
    Art: BookArt,
  },
  {
    test: /art|draw|paint|craft/,
    icon: "palette",
    color: "#C026D3",
    bg: "#FBE4EC",
    description: "Express yourself with colors, shapes, and creative techniques.",
    Art: BookArt,
  },
  {
    test: /hist|civic|social/,
    icon: "history_edu",
    color: "#A1742C",
    bg: "#F3E6D2",
    description: "Travel back in time and meet the people who shaped our world.",
    Art: BookArt,
  },
  {
    test: /comput|code|program/,
    icon: "terminal",
    color: "#0D9488",
    bg: "#D9F4F2",
    description: "Build logic and creativity through programming and digital tools.",
    Art: ScienceArt,
  },
  {
    test: /geo|evs|environ/,
    icon: "travel_explore",
    color: "#16A34A",
    bg: "#DFF6E5",
    description: "Explore landscapes, climates, and the wonders of planet Earth.",
    Art: ScienceArt,
  },
];

function getSubjectTheme(name = "") {
  const n = String(name || "").toLowerCase();
  const match = SUBJECT_THEMES.find((t) => t.test.test(n));
  if (match) return match;
  return {
    icon: "menu_book",
    color: "#6C63FF",
    bg: "#E8E6FE",
    description: `Explore ${name} and grow your knowledge one lesson at a time.`,
    Art: BookArt,
  };
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

export default function StudyPage() {
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("jwt") || "";

  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [boardLabel, setBoardLabel] = useState("");
  const [classLabel, setClassLabel] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState([]);

  useMemo(() => subjects.length, [subjects]);

  useEffect(() => {
    myAttempts()
      .then(({ items }) => setAttempts(items || []))
      .catch(() => setAttempts([]));
  }, []);

  function getSubjectProgress(subjectId) {
    const matches = attempts.filter(
      (a) => String(a?.subject?._id || a?.subject || "") === String(subjectId)
    );
    if (!matches.length) return 0;
    const avg = matches.reduce((sum, a) => sum + (Number(a?.percent) || 0), 0) / matches.length;
    return Math.round(avg);
  }

  useEffect(() => {
    let mounted = true;

    async function loadStudySubjects() {
      setLoading(true);
      setError("");
      try {
        let user = getStoredUser();
        if (!user?.boardId && !user?.board && !user?.boardName) {
          try {
            const profile = await getJSON("/api/users/profile");
            user = profile?.user || user;
            localStorage.setItem("user", JSON.stringify(user));
          } catch {
            // Keep fallback user if profile request fails.
          }
        }

        const userBoard = String(user.boardId || user.board || user.boardName || "").trim();
        const userClass = String(user.classId || user.class || user.className || "").trim();
        const nextBoardLabel = String(user.boardName || user.board || "Your Board").trim() || "Your Board";
        const nextClassLabel = String(user.className || user.class || "Your Class").trim() || "Your Class";

        if (!userBoard || !userClass) {
          throw new Error("Please update your profile with board and class information.");
        }

        setBoardLabel(nextBoardLabel);
        setClassLabel(nextClassLabel);

        const rows = await getJSON(`/api/subject?board=${encodeURIComponent(userBoard)}&class=${encodeURIComponent(userClass)}`);
        const normalized = (Array.isArray(rows) ? rows : [])
          .map((s) => ({
            _id: s?._id,
            name: String(s?.name || "").trim(),
            topicCount: Number(s?.topicCount || 0),
          }))
          .filter((s) => s._id && s.name)
          .sort((a, b) => a.name.localeCompare(b.name));

        if (!mounted) return;
        setSubjects(normalized);
      } catch (err) {
        if (!mounted) return;
        setSubjects([]);
        setError(String(err?.message || "").trim() || "Failed to load study subjects.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (!token) {
      setLoading(false);
      setError("Please login to view your study subjects.");
      return;
    }

    loadStudySubjects();
    return () => {
      mounted = false;
    };
  }, [API, token]);

  return (
    <div className="min-h-screen bg-[#f8f7f6]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Helmet>
        <title>Study Subjects | Edify Eight</title>
        <meta
          name="description"
          content="Browse your study subjects based on your board and class."
        />
      </Helmet>

      <div className="mx-auto max-w-6xl px-4 py-10">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#4ECDC4]" />
            <p className="text-sm text-slate-500">Loading your study subjects...</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-3">
              <SearchX className="text-rose-400" size={28} />
            </div>
            <p className="font-bold text-rose-600">{error}</p>
          </div>
        )}

        {!loading && !error && subjects.length === 0 && (
          <div className="relative overflow-hidden bg-white rounded-[3rem] shadow-sm p-12 text-center border border-slate-200">
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
                No subjects were found for{" "}
                <span className="font-semibold text-[#e7c555]">{boardLabel || "your board"}</span> —{" "}
                <span className="font-semibold text-[#e7c555]">{classLabel || "your class"}</span>.
              </p>
              <button
                onClick={() => navigate("/dashboard")}
                className="px-6 py-3 rounded-[2rem] bg-[#e7c555] hover:bg-[#d4b44a] font-bold text-slate-900 transition-all shadow-md hover:shadow-lg"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}

        {!loading && !error && subjects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject) => {
              const theme = getSubjectTheme(subject.name);
              const { Art } = theme;
              const progress = getSubjectProgress(subject._id);
              return (
                <div
                  key={subject._id}
                  className="group relative overflow-hidden rounded-3xl p-6 bg-white border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
                >
                  {/* Decorative vector art background */}
                  <div className="pointer-events-none absolute -top-6 -right-6 opacity-[0.10] group-hover:opacity-[0.16] transition-opacity">
                    <Art color={theme.color} />
                  </div>

                  <div className="relative z-10">
                    <div
                      className="inline-flex w-14 h-14 items-center justify-center rounded-2xl mb-5 shadow-sm"
                      style={{ background: theme.bg, color: theme.color }}
                    >
                      <MIcon name={theme.icon} className="text-3xl" fill />
                    </div>

                    <h3 className="text-xl font-black text-slate-900 mb-2">{subject.name}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed mb-5 line-clamp-3">
                      {theme.description}
                    </p>

                    <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                      <span className="text-slate-400 uppercase tracking-wide">Progress</span>
                      <span style={{ color: theme.color }}>{progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-5">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress}%`, backgroundColor: theme.color }}
                      />
                    </div>

                    <button
                      onClick={() => navigate(`/dashboard/study/${subject._id}`)}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-full flex items-center justify-center gap-2 transition-all"
                    >
                      Start Learning
                      <MIcon name="arrow_forward" className="text-[18px]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
