import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getJSON } from "../lib/api";

const DEFAULT_BOARDS = ["CBSE", "ICSE", "State Board", "IB"].map((n) => ({ value: n, label: n }));
const DEFAULT_CLASSES = ["Class 3","Class 4","Class 5","Class 6","Class 7","Class 8","Class 9","Class 10"].map((n) => ({ value: n, label: n }));

const SUBJECT_ICONS = {
  math: "calculate", maths: "calculate", mathematics: "calculate",
  science: "science", physics: "bolt", chemistry: "colorize", biology: "genetics",
  english: "menu_book", hindi: "translate", history: "history_edu",
  geography: "travel_explore", evs: "eco", environment: "eco",
  computer: "computer", social: "public", civics: "account_balance",
  economics: "bar_chart", accounts: "receipt_long",
};
const SUBJECT_COLORS = ["#F4736E","#4ECDC4","#6C63FF","#FF9F1C","#22c55e","#3b82f6","#d946ef","#f97316"];

function subjectIcon(name) {
  const key = String(name || "").toLowerCase().replace(/[^a-z]/g, "");
  return Object.entries(SUBJECT_ICONS).find(([k]) => key.includes(k))?.[1] || "menu_book";
}

function MIcon({ name, className = "", fill = false }) {
  return (
    <span className={`material-symbols-outlined ${className}`} style={fill ? { fontVariationSettings: "'FILL' 1" } : undefined}>{name}</span>
  );
}

export default function EECLearningBoards() {
  const navigate = useNavigate();
  const token = localStorage.getItem("jwt") || "";
  const isLoggedIn = Boolean(token);
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [boardOptions, setBoardOptions] = useState(DEFAULT_BOARDS);
  const [classOptions, setClassOptions] = useState(DEFAULT_CLASSES);
  const [board, setBoard] = useState(DEFAULT_BOARDS[0]?.value || "CBSE");
  const [grade, setGrade] = useState(DEFAULT_CLASSES[3]?.value || "Class 6");
  const [loading, setLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [topicsBySubject, setTopicsBySubject] = useState({});
  const [topicLoadingBySubject, setTopicLoadingBySubject] = useState({});
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [unlockingSubject, setUnlockingSubject] = useState("");
  const [expandedSubjects, setExpandedSubjects] = useState({});

  const subjectCount = useMemo(() => subjects.length, [subjects]);
  const topicCount = useMemo(() => Object.values(topicsBySubject).reduce((s, l) => s + (Array.isArray(l) ? l.length : 0), 0), [topicsBySubject]);
  const boardLabel = boardOptions.find((b) => String(b.value) === String(board))?.label || String(board);
  const classLabel = classOptions.find((c) => String(c.value) === String(grade))?.label || String(grade);

  useEffect(() => {
    let mounted = true;
    setMetaLoading(true);
    (async () => {
      try {
        const [bRes, cRes] = await Promise.all([
          fetch(`${API}/api/boards`),
          fetch(`${API}/api/classes`),
        ]);
        const [bData, cData] = await Promise.all([bRes.json().catch(() => []), cRes.json().catch(() => [])]);
        const boards = (Array.isArray(bData) ? bData : []).map((b) => ({ value: String(b?._id || "").trim(), label: String(b?.name || "").trim() })).filter((b) => b.value && b.label);
        const classes = (Array.isArray(cData) ? cData : []).map((c) => ({ value: String(c?._id || "").trim(), label: String(c?.name || "").trim() })).filter((c) => c.value && c.label);
        if (!mounted) return;
        if (boards.length) { setBoardOptions(boards); setBoard(boards[0].value); }
        if (classes.length) { setClassOptions(classes); setGrade(classes[0].value); }
      } catch {
        if (!mounted) return;
        setBoardOptions(DEFAULT_BOARDS); setClassOptions(DEFAULT_CLASSES);
      } finally { if (mounted) setMetaLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  async function handleFindContent() {
    setLoading(true); setSearched(true); setError("");
    setTopicsBySubject({}); setTopicLoadingBySubject({}); setExpandedSubjects({});
    try {
      const rows = isLoggedIn
        ? await getJSON(`/api/subject?board=${encodeURIComponent(board)}&class=${encodeURIComponent(grade)}`)
        : await (async () => {
            const res = await fetch(`${API}/api/subjects`);
            const data = await res.json().catch(() => ({}));
            return Array.isArray(data?.items) ? data.items : [];
          })();
      const normalized = rows.map((s) => ({ _id: s?._id, name: String(s?.name || "").trim() })).filter((s) => s._id && s.name).sort((a, b) => a.name.localeCompare(b.name));
      setSubjects(normalized);
      if (!isLoggedIn && normalized.length > 0) {
        const entries = await Promise.all(normalized.map(async (s) => {
          try {
            const res = await fetch(`${API}/api/subjects/${encodeURIComponent(s._id)}/topics`);
            const data = await res.json().catch(() => ({}));
            const rows = Array.isArray(data?.items) ? data.items : [];
            return [s._id, rows.map((t) => ({ _id: t?._id, name: String(t?.name || "").trim(), topicSummary: String(t?.topicSummary || ""), learningOutcome: String(t?.learningOutcome || "") })).filter((t) => t._id && t.name).sort((a, b) => a.name.localeCompare(b.name))];
          } catch { return [s._id, []]; }
        }));
        setTopicsBySubject(Object.fromEntries(entries));
        const expanded = {};
        normalized.forEach((s) => { expanded[s._id] = true; });
        setExpandedSubjects(expanded);
      }
      if (normalized.length === 0) setError(isLoggedIn ? `No subjects found for ${boardLabel} - ${classLabel}.` : "No subjects found.");
    } catch (e) {
      setSubjects([]);
      setError(String(e?.message || "").toLowerCase().includes("401") ? "Please login first to view study contents." : "Failed to load study contents. Please try again.");
    } finally { setLoading(false); }
  }

  async function loadTopicsForSubject(subjectId) {
    if (!subjectId || topicLoadingBySubject[subjectId] || topicsBySubject[subjectId]) return;
    setTopicLoadingBySubject((p) => ({ ...p, [subjectId]: true }));
    try {
      const rows = isLoggedIn
        ? await getJSON(`/api/topic/${encodeURIComponent(subjectId)}?board=${encodeURIComponent(board)}&class=${encodeURIComponent(grade)}`)
        : await (async () => {
            const res = await fetch(`${API}/api/subjects/${encodeURIComponent(subjectId)}/topics`);
            const data = await res.json().catch(() => ({}));
            return Array.isArray(data?.items) ? data.items : [];
          })();
      const normalized = rows.map((t) => ({ _id: t?._id, name: String(t?.name || "").trim(), topicSummary: String(t?.topicSummary || ""), learningOutcome: String(t?.learningOutcome || "") })).filter((t) => t._id && t.name).sort((a, b) => a.name.localeCompare(b.name));
      setTopicsBySubject((p) => ({ ...p, [subjectId]: normalized }));
      setExpandedSubjects((p) => ({ ...p, [subjectId]: true }));
    } catch { setTopicsBySubject((p) => ({ ...p, [subjectId]: [] })); }
    finally { setTopicLoadingBySubject((p) => ({ ...p, [subjectId]: false })); }
  }

  function toggleExpand(id) { setExpandedSubjects((p) => ({ ...p, [id]: !p[id] })); }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── Hero ── */}
      <div className="bg-linear-to-br from-[#1B1F3B] to-[#2d3561] px-4 py-14 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#4ECDC4]/20 border border-[#4ECDC4]/30 px-4 py-1.5 text-sm font-bold text-[#4ECDC4] mb-5">
            <MIcon name="menu_book" className="text-base" fill />
            Learn
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
            Explore <span style={{ color: "#4ECDC4" }}>Study Topics</span>
          </h1>
          <p className="text-slate-300 text-lg max-w-xl mb-8">
            Pick your board and class, then dive into subjects and topics — read summaries, understand learning outcomes, and prepare smarter.
          </p>

          {/* Inline filter + CTA */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
            <select
              value={board}
              onChange={(e) => setBoard(e.target.value)}
              disabled={metaLoading}
              className="flex-1 h-12 rounded-xl border-0 bg-white/10 text-white font-semibold px-4 focus:outline-none focus:ring-2 focus:ring-[#4ECDC4]/50 backdrop-blur"
            >
              {boardOptions.map((o) => <option key={o.value} value={o.value} className="text-slate-900">{o.label}</option>)}
            </select>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              disabled={metaLoading}
              className="flex-1 h-12 rounded-xl border-0 bg-white/10 text-white font-semibold px-4 focus:outline-none focus:ring-2 focus:ring-[#4ECDC4]/50 backdrop-blur"
            >
              {classOptions.map((o) => <option key={o.value} value={o.value} className="text-slate-900">{o.label}</option>)}
            </select>
            <button
              type="button"
              onClick={handleFindContent}
              disabled={loading || metaLoading}
              className="h-12 rounded-xl bg-[#4ECDC4] text-[#1B1F3B] font-black px-7 hover:brightness-105 disabled:opacity-60 transition whitespace-nowrap"
            >
              {loading ? "Loading…" : metaLoading ? "Preparing…" : "Find Topics →"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Board / Grade pill tabs ── */}
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 overflow-x-auto">
        <div className="mx-auto max-w-6xl flex gap-2 flex-nowrap">
          <span className="text-xs font-bold text-slate-400 self-center shrink-0 mr-1">Board:</span>
          {boardOptions.map((b) => (
            <button key={b.value} onClick={() => setBoard(b.value)}
              className="shrink-0 rounded-full px-4 py-1.5 text-sm font-bold transition-all border"
              style={board === b.value ? { background: "#4ECDC4", color: "white", borderColor: "#4ECDC4" } : { background: "white", color: "#475569", borderColor: "#e2e8f0" }}>
              {b.label}
            </button>
          ))}
          <span className="mx-2 border-l border-slate-200 self-stretch" />
          <span className="text-xs font-bold text-slate-400 self-center shrink-0 mr-1">Grade:</span>
          {classOptions.map((c) => (
            <button key={c.value} onClick={() => setGrade(c.value)}
              className="shrink-0 rounded-full px-4 py-1.5 text-sm font-bold transition-all border"
              style={grade === c.value ? { background: "#F4736E", color: "white", borderColor: "#F4736E" } : { background: "white", color: "#475569", borderColor: "#e2e8f0" }}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Results ── */}
      <div className="mx-auto max-w-6xl px-4 py-10">

        {/* Stats */}
        {searched && !loading && !error && subjects.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#4ECDC4]/10 border border-[#4ECDC4]/20 px-4 py-1.5 text-sm font-bold text-[#2a9d8f]">
              <MIcon name="auto_stories" className="text-base" fill /> {subjectCount} Subjects
            </span>
            {topicCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#6C63FF]/10 border border-[#6C63FF]/20 px-4 py-1.5 text-sm font-bold text-[#6C63FF]">
                <MIcon name="topic" className="text-base" fill /> {topicCount} Topics
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-4 py-1.5 text-sm font-semibold text-slate-500">
              {boardLabel} · {classLabel}
            </span>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="grid gap-5 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50 animate-pulse overflow-hidden">
                <div className="h-20 bg-slate-200" />
                <div className="p-5 space-y-2">
                  <div className="h-4 w-3/4 bg-slate-200 rounded" />
                  <div className="h-4 w-1/2 bg-slate-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-3">
              <MIcon name="error" className="text-3xl text-rose-400" fill />
            </div>
            <p className="font-bold text-rose-600">{error}</p>
          </div>
        )}

        {/* Empty prompt */}
        {!loading && !error && !searched && (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="w-20 h-20 rounded-3xl bg-[#4ECDC4]/10 flex items-center justify-center mb-5">
              <MIcon name="travel_explore" className="text-5xl text-[#4ECDC4]" fill />
            </div>
            <h2 className="text-xl font-black text-slate-700 mb-2" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>Ready to explore?</h2>
            <p className="text-slate-400 text-sm max-w-xs">Choose your board and class above, then tap "Find Topics" to see all subjects and topics.</p>
          </div>
        )}

        {/* Subject grid — BBC Bitesize style */}
        {!loading && !error && searched && subjects.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2">
            {subjects.map((subject, index) => {
              const color = SUBJECT_COLORS[index % SUBJECT_COLORS.length];
              const icon = subjectIcon(subject.name);
              const topics = topicsBySubject[subject._id];
              const topicsLoading = Boolean(topicLoadingBySubject[subject._id]);
              const isExpanded = Boolean(expandedSubjects[subject._id]);
              const guestVisible = Array.isArray(topics) ? topics.slice(0, 5) : [];
              const lockedCount = Array.isArray(topics) ? Math.max(0, topics.length - 5) : 0;

              return (
                <article key={subject._id} className="rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">

                  {/* Subject header */}
                  <div className="flex items-center gap-4 p-5 border-b border-slate-50">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white shadow-sm" style={{ background: color }}>
                      <MIcon name={icon} className="text-2xl" fill />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-slate-900 text-lg leading-tight" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>{subject.name}</h3>
                      <p className="text-xs font-semibold text-slate-400">{isLoggedIn ? `${boardLabel} · ${classLabel}` : "Preview Mode"}</p>
                    </div>
                    {Array.isArray(topics) && topics.length > 0 && (
                      <button
                        onClick={() => toggleExpand(subject._id)}
                        className="shrink-0 rounded-full px-3 py-1 text-xs font-bold border transition-all"
                        style={{ borderColor: color + "40", color, background: color + "10" }}
                      >
                        {isExpanded ? "Hide" : `${topics.length} topics`}
                      </button>
                    )}
                  </div>

                  {/* Topics area */}
                  <div className="p-5">
                    {/* Logged-in: show/load topics button */}
                    {isLoggedIn && !topics && (
                      <button
                        type="button"
                        onClick={() => loadTopicsForSubject(subject._id)}
                        disabled={topicsLoading}
                        className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 transition disabled:opacity-60"
                        style={{ borderColor: color + "40" }}
                      >
                        <MIcon name={topicsLoading ? "progress_activity" : "expand_more"} className="text-base" />
                        {topicsLoading ? "Loading topics…" : "Show Topics"}
                      </button>
                    )}

                    {/* Topics list */}
                    {Array.isArray(topics) && isExpanded && (
                      topics.length === 0
                        ? <p className="text-sm text-slate-400 italic">No topics available for this subject.</p>
                        : (
                          <div className="space-y-1.5">
                            {(isLoggedIn ? topics : guestVisible).map((topic, ti) => (
                              <button
                                key={topic._id}
                                type="button"
                                onClick={() => navigate(`/learn/topic/${subject._id}/${topic._id}`, {
                                  state: { subject, topic, boardLabel, classLabel, previewMode: !isLoggedIn },
                                })}
                                className="w-full flex items-center gap-3 text-left rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-all group"
                                style={{ background: ti % 2 === 0 ? "#f8fafc" : "white" }}
                              >
                                <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black text-white" style={{ background: color }}>
                                  {ti + 1}
                                </span>
                                <span className="flex-1 truncate">{topic.name}</span>
                                <MIcon name="chevron_right" className="text-base text-slate-300 group-hover:text-slate-500 transition-colors" />
                              </button>
                            ))}

                            {/* Locked topics for guests */}
                            {!isLoggedIn && lockedCount > 0 && (
                              <div className="relative mt-1">
                                <div className="space-y-1.5 pointer-events-none select-none blur-[3px]">
                                  {topics.slice(5, 8).map((t) => (
                                    <div key={`lk-${t._id}`} className="rounded-xl px-3 py-2.5 bg-slate-50 text-sm text-slate-400">{t.name}</div>
                                  ))}
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setUnlockingSubject(subject._id);
                                      window.dispatchEvent(new Event("eec:open-login"));
                                      setTimeout(() => setUnlockingSubject(""), 1200);
                                    }}
                                    className="rounded-full text-white text-xs font-black px-5 py-2 shadow-lg transition"
                                    style={{ background: color }}
                                  >
                                    {unlockingSubject === subject._id ? "Opening login…" : `Login to unlock ${lockedCount} more`}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                    )}

                    {/* Collapsed topics count */}
                    {Array.isArray(topics) && !isExpanded && topics.length > 0 && (
                      <p className="text-sm text-slate-400">
                        {topics.length} topic{topics.length !== 1 ? "s" : ""} — tap to expand
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
