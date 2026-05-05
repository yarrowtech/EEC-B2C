import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const DEFAULT_BOARDS = ["CBSE","ICSE","State Board","IB"].map((n) => ({ value: n, label: n }));
const DEFAULT_CLASSES = ["Class 3","Class 4","Class 5","Class 6","Class 7","Class 8","Class 9","Class 10"].map((n) => ({ value: n, label: n }));
const STAGES = [{ value: 1, label: "Stage 1 · Basic" }, { value: 2, label: "Stage 2 · Intermediate" }, { value: 3, label: "Stage 3 · Advanced" }];

const CARD_COLORS = ["#F4736E","#4ECDC4","#6C63FF","#FF9F1C","#22c55e","#3b82f6","#d946ef","#f97316"];

export default function FlashcardsCatalogPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("jwt") || "";
  const isLoggedIn = Boolean(token);

  const [boards, setBoards] = useState(DEFAULT_BOARDS);
  const [classes, setClasses] = useState(DEFAULT_CLASSES);
  const [board, setBoard] = useState("");
  const [className, setClassName] = useState("");
  const [stage, setStage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [sets, setSets] = useState([]);

  const totalCards = useMemo(() => sets.reduce((s, r) => s + Number(r.cardsCount || 0), 0), [sets]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [bRes, cRes] = await Promise.all([fetch(`${API}/api/boards`), fetch(`${API}/api/classes`)]);
        const [bData, cData] = await Promise.all([bRes.json().catch(() => []), cRes.json().catch(() => [])]);
        const bRows = (Array.isArray(bData) ? bData : []).map((r) => ({ value: String(r?._id || ""), label: String(r?.name || "") })).filter((r) => r.value && r.label);
        const cRows = (Array.isArray(cData) ? cData : []).map((r) => ({ value: String(r?._id || ""), label: String(r?.name || "") })).filter((r) => r.value && r.label);
        if (!mounted) return;
        if (bRows.length) { setBoards(bRows); setBoard(bRows[0].value); }
        if (cRows.length) { setClasses(cRows); setClassName(cRows[0].value); }
      } catch {
        if (!mounted) return;
        setBoards(DEFAULT_BOARDS); setClasses(DEFAULT_CLASSES);
      }
    })();
    return () => { mounted = false; };
  }, []);

  async function loadSets() {
    setLoading(true); setError(""); setSearched(true);
    try {
      const params = new URLSearchParams();
      if (board) params.set("board", board);
      if (className) params.set("class", className);
      if (stage) params.set("stage", String(stage));
      params.set("limit", "100");
      const res = await fetch(`${API}/api/flashcards/public?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to load flashcards");
      const rows = Array.isArray(data?.items) ? data.items : [];
      setSets(rows);
      if (rows.length === 0) setError("No flashcard sets found for this selection.");
    } catch (e) { setSets([]); setError(e.message || "Failed to load flashcards"); }
    finally { setLoading(false); }
  }

  function openSet(row) {
    const target = `/dashboard/flashcards?set=${encodeURIComponent(row._id)}`;
    if (!isLoggedIn) { sessionStorage.setItem("redirectAfterLogin", target); window.dispatchEvent(new Event("eec:open-login")); return; }
    navigate(target);
  }

  const boardLabel = boards.find((b) => b.value === board)?.label || "";
  const classLabel = classes.find((c) => c.value === className)?.label || "";

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── Hero ── */}
      <div className="bg-linear-to-br from-[#6C63FF] to-[#2d3561] px-4 py-14 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/20 px-4 py-1.5 text-sm font-bold text-white mb-5">
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>style</span>
            Flashcards
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
            Browse <span style={{ color: "#FFD23F" }}>Flashcard</span> Sets
          </h1>
          <p className="text-white/70 text-lg max-w-xl mb-8">
            Quick-revision cards organised by board, class, and difficulty stage. Swipe through topics and retain more in less time.
          </p>

          {/* Stats strip */}
          {searched && !loading && sets.length > 0 && (
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/20 px-4 py-1.5 text-sm font-bold text-white">
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>style</span>
                {sets.length} Sets
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/20 px-4 py-1.5 text-sm font-bold text-white">
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>layers</span>
                {totalCards} Cards total
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/20 px-4 py-1.5 text-sm font-bold text-white">
                {boardLabel} · {classLabel} · Stage {stage}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Filter pill tabs ── */}
      <div className="border-b border-slate-100 bg-slate-50 overflow-x-auto">
        <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-2">

          {/* Board row */}
          <div className="flex gap-2 flex-nowrap items-center">
            <span className="text-xs font-bold text-slate-400 shrink-0 w-14">Board</span>
            {boards.map((b) => (
              <button key={b.value} onClick={() => setBoard(b.value)}
                className="shrink-0 rounded-full px-4 py-1.5 text-sm font-bold transition-all border"
                style={board === b.value ? { background: "#6C63FF", color: "white", borderColor: "#6C63FF" } : { background: "white", color: "#475569", borderColor: "#e2e8f0" }}>
                {b.label}
              </button>
            ))}
          </div>

          {/* Class row */}
          <div className="flex gap-2 flex-nowrap items-center">
            <span className="text-xs font-bold text-slate-400 shrink-0 w-14">Class</span>
            {classes.map((c) => (
              <button key={c.value} onClick={() => setClassName(c.value)}
                className="shrink-0 rounded-full px-4 py-1.5 text-sm font-bold transition-all border"
                style={className === c.value ? { background: "#F4736E", color: "white", borderColor: "#F4736E" } : { background: "white", color: "#475569", borderColor: "#e2e8f0" }}>
                {c.label}
              </button>
            ))}
          </div>

          {/* Stage row + Find button */}
          <div className="flex gap-2 flex-nowrap items-center">
            <span className="text-xs font-bold text-slate-400 shrink-0 w-14">Stage</span>
            {STAGES.map((s) => (
              <button key={s.value} onClick={() => setStage(s.value)}
                className="shrink-0 rounded-full px-4 py-1.5 text-sm font-bold transition-all border"
                style={stage === s.value ? { background: "#FFD23F", color: "#1B1F3B", borderColor: "#FFD23F" } : { background: "white", color: "#475569", borderColor: "#e2e8f0" }}>
                {s.label}
              </button>
            ))}
            <button
              type="button"
              onClick={loadSets}
              disabled={loading}
              className="ml-auto shrink-0 rounded-full px-6 py-1.5 text-sm font-black text-white disabled:opacity-60 transition"
              style={{ background: "#6C63FF" }}
            >
              {loading ? "Loading…" : "Find Sets →"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Results ── */}
      <div className="mx-auto max-w-6xl px-4 py-10">

        {/* Loading skeleton */}
        {loading && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50 animate-pulse p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-200" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 w-3/4 bg-slate-200 rounded" />
                    <div className="h-3 w-1/2 bg-slate-200 rounded" />
                  </div>
                </div>
                <div className="h-3 w-full bg-slate-200 rounded mb-2" />
                <div className="h-3 w-2/3 bg-slate-200 rounded mb-5" />
                <div className="h-9 w-full bg-slate-200 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-3xl text-violet-400" style={{ fontVariationSettings: "'FILL' 1" }}>style</span>
            </div>
            <p className="font-bold text-slate-600 mb-1">{error}</p>
            <p className="text-sm text-slate-400">Try a different board, class, or stage.</p>
          </div>
        )}

        {/* Empty prompt */}
        {!loading && !error && !searched && (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="w-20 h-20 rounded-3xl bg-[#6C63FF]/10 flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-5xl text-[#6C63FF]" style={{ fontVariationSettings: "'FILL' 1" }}>style</span>
            </div>
            <h2 className="text-xl font-black text-slate-700 mb-2" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>Find flashcard sets</h2>
            <p className="text-slate-400 text-sm max-w-xs mb-5">Select your board, class, and stage above, then tap "Find Sets" to browse available flashcard packs.</p>
            <button onClick={loadSets} className="rounded-full text-white font-bold px-6 py-2.5 text-sm transition hover:brightness-105" style={{ background: "#6C63FF" }}>
              Find Sets →
            </button>
          </div>
        )}

        {/* Quizlet-style card grid */}
        {!loading && !error && searched && sets.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {sets.map((row, index) => {
              const color = CARD_COLORS[index % CARD_COLORS.length];
              return (
                <article
                  key={row._id}
                  className="group flex flex-col rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden cursor-pointer"
                  onClick={() => openSet(row)}
                >
                  {/* Colored left accent strip */}
                  <div className="h-1 w-full" style={{ background: color }} />

                  <div className="flex flex-col flex-1 p-5 gap-3">
                    {/* Icon + Title */}
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white text-sm font-black shadow-sm"
                        style={{ background: color }}
                      >
                        <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>style</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-slate-900 text-base leading-snug line-clamp-2" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
                          {row.title}
                        </h3>
                        {(row.subjectName || row.topicName) && (
                          <p className="text-xs font-semibold text-slate-400 mt-0.5 truncate">
                            {[row.subjectName, row.topicName].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 flex-1">
                      {row.description || "Quick revision cards for this topic."}
                    </p>

                    {/* Stats badges */}
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>layers</span>
                        {row.cardsCount || 0} cards
                      </span>
                      {(row.participantsCount || 0) > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
                          {row.participantsCount}
                        </span>
                      )}
                    </div>

                    {/* CTA */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openSet(row); }}
                      className="w-full rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2 text-white transition-all group-hover:brightness-105"
                      style={{ background: color }}
                    >
                      <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {isLoggedIn ? "play_circle" : "lock"}
                      </span>
                      {isLoggedIn ? "Study Now" : "Login to Study"}
                    </button>
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
