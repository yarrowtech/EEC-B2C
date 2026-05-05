import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { getJSON, startExam } from "../lib/api";

const TYPE_META = {
  "mcq-single":    { title: "MCQ — Single Correct",   icon: "radio_button_checked", gradient: "from-blue-500 to-indigo-700",      color: "#3b82f6", gradientStyle: null },
  "mcq-multi":     { title: "MCQ — Multiple Correct",  icon: "check_box",            gradient: "from-emerald-400 to-teal-600",    color: "#10b981", gradientStyle: null },
  "choice-matrix": { title: "Choice Matrix",           icon: "grid_view",            gradient: "from-orange-400 to-pink-600",     color: "#f97316", gradientStyle: null },
  "true-false":    { title: "True / False",            icon: "rule",                 gradient: null,                              color: "#d97706", gradientStyle: "linear-gradient(135deg,#d97706,#78350f)" },
  "cloze-drag":    { title: "Cloze — Drag & Drop",    icon: "open_with",            gradient: "from-cyan-500 to-blue-700",       color: "#06b6d4", gradientStyle: null },
  "cloze-select":  { title: "Cloze — Drop-Down",      icon: "arrow_drop_down_circle", gradient: "from-fuchsia-500 to-rose-500", color: "#d946ef", gradientStyle: null },
  "cloze-text":    { title: "Cloze — Text Input",     icon: "edit_note",            gradient: "from-violet-500 to-purple-600",   color: "#8b5cf6", gradientStyle: null },
  "match-list":    { title: "Match List",              icon: "hub",                  gradient: "from-lime-500 to-green-600",      color: "#84cc16", gradientStyle: null },
  "essay-plain":   { title: "Essay — Plain Text",     icon: "description",          gradient: "from-slate-500 to-gray-700",      color: "#64748b", gradientStyle: null },
  "essay-rich":    { title: "Essay — Rich Text",      icon: "article",              gradient: "from-red-400 to-rose-600",        color: "#ef4444", gradientStyle: null },
};

const SUBJECT_ICONS = {
  math: "calculate", maths: "calculate", mathematics: "calculate",
  science: "science", physics: "bolt", chemistry: "colorize", biology: "genetics",
  english: "menu_book", hindi: "translate", history: "history_edu",
  geography: "travel_explore", evs: "eco", environment: "eco",
  computer: "computer", social: "public", civics: "account_balance",
  economics: "bar_chart",
};
function subjectIcon(name) {
  const key = String(name || "").toLowerCase().replace(/[^a-z]/g, "");
  return Object.entries(SUBJECT_ICONS).find(([k]) => key.includes(k))?.[1] || "auto_stories";
}

const DEFAULT_FREE_TRYOUT_TYPES = ["mcq-single", "mcq-multi", "choice-matrix", "true-false"];

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

function DiffBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold w-16 shrink-0" style={{ color }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-bold text-slate-500 w-6 text-right">{count}</span>
    </div>
  );
}

export default function TryoutSubjects() {
  const { tryoutType = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("jwt") || "";

  const [loading, setLoading] = useState(false);
  const [startingId, setStartingId] = useState("");
  const [boardValue, setBoardValue] = useState(location.state?.board || "");
  const [classValue, setClassValue] = useState(location.state?.class || "");
  const [boardLabel, setBoardLabel] = useState(location.state?.boardLabel || "");
  const [classLabel, setClassLabel] = useState(location.state?.classLabel || "");
  const [subjects, setSubjects] = useState([]);
  const [lockedTryout, setLockedTryout] = useState(false);

  const meta = useMemo(() => TYPE_META[tryoutType] || { title: tryoutType, icon: "quiz", gradient: "from-slate-500 to-gray-700", color: "#64748b", gradientStyle: null }, [tryoutType]);

  useEffect(() => {
    let mounted = true;
    async function loadSubjectsForType() {
      if (!token) return;
      setLoading(true);
      try {
        const profile = await getJSON("/api/users/profile");
        const user = profile?.user || {};
        const board = user.boardId || user.board || user.boardName || boardValue;
        const cls = user.classId || user.class || user.className || classValue;
        const boardName = user.boardName || user.board || boardLabel;
        const className = user.className || user.class || classLabel;
        if (!board || !cls) throw new Error("Board/Class missing in profile");

        const [packagesRes, subscriptionRes] = await Promise.all([
          fetch(`${API}/api/packages`),
          fetch(`${API}/api/subscriptions/current`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const [packagesData, subscriptionData] = await Promise.all([packagesRes.json(), subscriptionRes.json()]);
        const packageRows = Array.isArray(packagesData?.packages) ? packagesData.packages : [];
        const basicPackage = packageRows.find((p) => String(p?.name || "").toLowerCase() === "basic");
        const activePackage = subscriptionData?.subscription?.package || null;
        const allowedList =
          Array.isArray(activePackage?.allowedTryoutTypes) && activePackage.allowedTryoutTypes.length > 0
            ? activePackage.allowedTryoutTypes
            : Array.isArray(basicPackage?.allowedTryoutTypes) && basicPackage.allowedTryoutTypes.length > 0
            ? basicPackage.allowedTryoutTypes
            : DEFAULT_FREE_TRYOUT_TYPES;

        const allowed = allowedList.includes(tryoutType);
        if (!allowed) {
          if (!mounted) return;
          setBoardValue(board); setClassValue(cls); setBoardLabel(boardName); setClassLabel(className);
          setLockedTryout(true); setSubjects([]);
          return;
        }

        const [subjectRows, questionRows] = await Promise.all([
          getJSON(`/api/subject?board=${encodeURIComponent(board)}&class=${encodeURIComponent(cls)}`),
          getJSON(`/api/questions?board=${encodeURIComponent(board)}&class=${encodeURIComponent(cls)}&type=${encodeURIComponent(tryoutType)}&page=1&limit=5000`),
        ]);

        const questions = Array.isArray(questionRows?.items) ? questionRows.items : [];
        const bySubject = {};
        for (const q of questions) {
          const key = String(q?.subject || "").trim().toLowerCase();
          if (!key) continue;
          if (!bySubject[key]) bySubject[key] = { total: 0, easy: 0, moderate: 0, hard: 0 };
          bySubject[key].total += 1;
          const d = String(q?.difficulty || "easy").toLowerCase();
          if (d === "hard") bySubject[key].hard += 1;
          else if (d === "moderate") bySubject[key].moderate += 1;
          else bySubject[key].easy += 1;
        }

        const nextSubjects = (Array.isArray(subjectRows) ? subjectRows : [])
          .map((s) => {
            const name = String(s?.name || "").trim();
            const idKey = String(s?._id || "").trim().toLowerCase();
            const byName = bySubject[name.toLowerCase()] || { total: 0, easy: 0, moderate: 0, hard: 0 };
            const byId = idKey ? bySubject[idKey] || { total: 0, easy: 0, moderate: 0, hard: 0 } : { total: 0, easy: 0, moderate: 0, hard: 0 };
            return {
              _id: s?._id, name,
              stats: {
                total: byName.total + byId.total,
                easy: byName.easy + byId.easy,
                moderate: byName.moderate + byId.moderate,
                hard: byName.hard + byId.hard,
              },
            };
          })
          .filter((s) => s.stats.total > 0)
          .sort((a, b) => a.name.localeCompare(b.name));

        if (!mounted) return;
        setBoardValue(board); setClassValue(cls); setBoardLabel(boardName); setClassLabel(className);
        setLockedTryout(false); setSubjects(nextSubjects);
      } catch (e) {
        if (!mounted) return;
        toast.error(e?.message || "Failed to load subjects");
        setSubjects([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadSubjectsForType();
    return () => { mounted = false; };
  }, [token, tryoutType]);

  async function startPractice(subject) {
    if (!token) { window.dispatchEvent(new Event("eec:open-login")); return; }
    if (!subject?._id) { toast.error("Invalid subject"); return; }
    setStartingId(subject._id);
    try {
      const topics = await getJSON(`/api/topic/${subject._id}?board=${encodeURIComponent(boardValue)}&class=${encodeURIComponent(classValue)}&stage=1`);
      const firstTopic = Array.isArray(topics) && topics.length > 0 ? topics[0] : null;
      if (!firstTopic?._id) throw new Error("No topics found for this subject");
      const data = await startExam({ stage: "stage-1", subject: subject._id, topic: firstTopic._id, type: tryoutType, limit: 10, class: classValue, board: boardValue });
      navigate(`/dashboard/exams/take/${data.attemptId}`, { state: data });
    } catch (e) {
      toast.error(e?.message || "Failed to start practice");
    } finally {
      setStartingId("");
    }
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <ToastContainer position="top-right" />

      {/* ── Hero ── */}
      <div
        className={`relative overflow-hidden px-4 py-14 md:py-20 ${meta.gradientStyle ? "" : `bg-linear-to-br ${meta.gradient}`}`}
        style={meta.gradientStyle ? { backgroundImage: meta.gradientStyle } : undefined}
      >
        {/* Large background icon */}
        <MIcon
          name={meta.icon}
          className="absolute -bottom-6 -right-6 text-white/10 pointer-events-none"
          style={{ fontSize: "220px" }}
          fill
        />
        {/* Dot grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "24px 24px" }}
        />

        <div className="mx-auto max-w-6xl relative">
          {/* Breadcrumb */}
          <button
            type="button"
            onClick={() => navigate("/tryouts")}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/25 px-4 py-1.5 text-sm font-bold text-white hover:bg-white/25 transition mb-6"
          >
            <MIcon name="arrow_back" className="text-base" />
            All Tryouts
          </button>

          <div className="flex items-start gap-5">
            {/* Icon bubble */}
            <div className="hidden sm:flex w-16 h-16 rounded-2xl bg-white/20 border border-white/30 items-center justify-center shrink-0">
              <MIcon name={meta.icon} className="text-4xl text-white" fill />
            </div>

            <div>
              <p className="text-white/60 text-sm font-semibold mb-1 uppercase tracking-wider">Practice Tryout</p>
              <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-3" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
                {meta.title}
              </h1>
              <div className="flex flex-wrap gap-2">
                {boardLabel && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/20 px-3 py-1 text-sm font-bold text-white">
                    <MIcon name="school" className="text-sm" /> {boardLabel}
                  </span>
                )}
                {classLabel && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/20 px-3 py-1 text-sm font-bold text-white">
                    <MIcon name="grade" className="text-sm" /> {classLabel}
                  </span>
                )}
                {subjects.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/20 px-3 py-1 text-sm font-bold text-white">
                    <MIcon name="auto_stories" className="text-sm" fill /> {subjects.length} Subjects
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mx-auto max-w-6xl px-4 py-10">

        {/* Not logged in */}
        {!token && (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <MIcon name="lock" className="text-4xl text-slate-400" fill />
            </div>
            <h2 className="text-xl font-black text-slate-700 mb-2">Login Required</h2>
            <p className="text-sm text-slate-400 mb-5">Sign in to access practice questions for this tryout type.</p>
            <button
              onClick={() => window.dispatchEvent(new Event("eec:open-login"))}
              className="rounded-full font-bold px-7 py-3 text-white transition hover:brightness-105"
              style={{ background: meta.color }}
            >
              Sign In Free
            </button>
          </div>
        )}

        {/* Loading skeletons */}
        {token && loading && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50 p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-slate-200 rounded" />
                    <div className="h-3 w-1/2 bg-slate-200 rounded" />
                  </div>
                </div>
                <div className="space-y-2 mb-5">
                  <div className="h-1.5 w-full bg-slate-200 rounded-full" />
                  <div className="h-1.5 w-full bg-slate-200 rounded-full" />
                  <div className="h-1.5 w-full bg-slate-200 rounded-full" />
                </div>
                <div className="h-10 w-full bg-slate-200 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Locked tryout */}
        {token && !loading && lockedTryout && (
          <div className="flex flex-col items-center py-20 text-center">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5 text-white shadow-xl"
              style={{ background: `linear-gradient(135deg, ${meta.color}, ${meta.color}99)` }}
            >
              <MIcon name="lock" className="text-5xl" fill />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
              Premium Tryout
            </h2>
            <p className="text-slate-500 text-sm max-w-xs mb-6">
              <strong>{meta.title}</strong> is available in upgraded subscription plans. Unlock it to access all question types.
            </p>
            <button
              type="button"
              onClick={() => navigate("/dashboard/packages")}
              className="rounded-full font-black px-8 py-3.5 text-white shadow-lg transition hover:brightness-105 hover:scale-105"
              style={{ background: meta.color, boxShadow: `0 8px 24px ${meta.color}50` }}
            >
              View Plans →
            </button>
          </div>
        )}

        {/* No subjects */}
        {token && !loading && !lockedTryout && subjects.length === 0 && (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <MIcon name="search_off" className="text-4xl text-slate-400" fill />
            </div>
            <p className="font-bold text-slate-600 mb-1">No subjects found</p>
            <p className="text-sm text-slate-400">No questions of this type are available for your board and class yet.</p>
          </div>
        )}

        {/* Subject grid */}
        {token && !loading && !lockedTryout && subjects.length > 0 && (
          <>
            <p className="text-sm font-semibold text-slate-400 mb-6">
              Choose a subject to start a 10-question practice session
            </p>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {subjects.map((subject, index) => {
                const icon = subjectIcon(subject.name);
                const cardColors = ["#3b82f6","#10b981","#f97316","#8b5cf6","#06b6d4","#d946ef","#84cc16","#ef4444"];
                const cardColor = cardColors[index % cardColors.length];
                const isStarting = startingId === subject._id;

                return (
                  <article
                    key={subject._id}
                    className="group flex flex-col rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                  >
                    {/* Thin accent strip matching card color */}
                    <div className="h-1 w-full" style={{ background: cardColor }} />

                    <div className="flex flex-col flex-1 p-5 gap-4">
                      {/* Subject header */}
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white shadow-sm"
                          style={{ background: cardColor }}
                        >
                          <MIcon name={icon} className="text-2xl" fill />
                        </div>
                        <div>
                          <h3 className="font-black text-slate-900 text-lg leading-tight" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
                            {subject.name}
                          </h3>
                          <p className="text-xs font-semibold text-slate-400">
                            {subject.stats.total} question{subject.stats.total !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>

                      {/* Difficulty breakdown bars */}
                      <div className="space-y-2 py-1">
                        <DiffBar label="Easy"     count={subject.stats.easy}     total={subject.stats.total} color="#22c55e" />
                        <DiffBar label="Moderate" count={subject.stats.moderate} total={subject.stats.total} color="#f59e0b" />
                        <DiffBar label="Hard"     count={subject.stats.hard}     total={subject.stats.total} color="#ef4444" />
                      </div>

                      {/* Total badge */}
                      <div
                        className="flex items-center justify-between rounded-xl px-3 py-2"
                        style={{ background: cardColor + "12", border: `1px solid ${cardColor}25` }}
                      >
                        <span className="text-xs font-bold text-slate-600">Total questions</span>
                        <span className="text-sm font-black" style={{ color: cardColor }}>{subject.stats.total}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => startPractice(subject)}
                        disabled={isStarting}
                        className="w-full rounded-xl py-3 text-sm font-black flex items-center justify-center gap-2 text-white transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{
                          background: isStarting ? "#94a3b8" : cardColor,
                          boxShadow: isStarting ? "none" : `0 4px 14px ${cardColor}40`,
                        }}
                      >
                        {isStarting ? (
                          <><MIcon name="progress_activity" className="text-base animate-spin" /> Starting…</>
                        ) : (
                          <><MIcon name="play_circle" className="text-base" fill /> Practice Now</>
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
