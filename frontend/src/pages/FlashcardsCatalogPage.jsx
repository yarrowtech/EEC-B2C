import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const DEFAULT_BOARDS = ["CBSE","ICSE","State Board","IB"].map((n) => ({ value: n, label: n }));
const DEFAULT_CLASSES = ["Class 3","Class 4","Class 5","Class 6","Class 7","Class 8","Class 9","Class 10"].map((n) => ({ value: n, label: n }));
const STAGES = [{ value: 1, label: "Stage 1 · Basic" }, { value: 2, label: "Stage 2 · Intermediate" }, { value: 3, label: "Stage 3 · Advanced" }];

const CARD_COLORS = ["#F4736E","#4ECDC4","#6C63FF","#FF9F1C","#22c55e","#3b82f6","#d946ef","#f97316"];

const SUBJECT_ICONS = {
  math:"calculate", maths:"calculate", mathematics:"calculate",
  science:"science", physics:"bolt", chemistry:"colorize", biology:"genetics",
  english:"menu_book", hindi:"translate", history:"history_edu",
  geography:"travel_explore", evs:"eco", environment:"eco",
  computer:"computer", social:"public", civics:"account_balance",
  economics:"bar_chart", accounts:"receipt_long",
};
function subjectIcon(name) {
  const key = String(name || "").toLowerCase().replace(/[^a-z]/g,"");
  return Object.entries(SUBJECT_ICONS).find(([k]) => key.includes(k))?.[1] || "style";
}

function MIcon({ name, className = "", fill = false, style: s }) {
  return (
    <span
      className={`material-symbols-outlined select-none leading-none ${className}`}
      style={fill ? { fontVariationSettings:"'FILL' 1", ...s } : s}
    >{name}</span>
  );
}

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
      <div className="relative overflow-hidden bg-linear-to-br from-[#6C63FF] to-[#2d3561] px-4 py-14 md:py-20">
        {/* Ghost icon */}
        <MIcon name="style" className="absolute -bottom-8 -right-8 text-white/6 pointer-events-none" style={{ fontSize: "280px" }} fill />
        {/* Dot grid */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage:"radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize:"24px 24px" }} />

        <div className="mx-auto max-w-6xl relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/20 px-4 py-1.5 text-sm font-bold text-white mb-5">
            <MIcon name="style" className="text-base" fill />
            Flashcards
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4" style={{ fontFamily:"'Balsamiq Sans', cursive" }}>
            Browse <span style={{ color:"#FFD23F" }}>Flashcard</span> Sets
          </h1>
          <p className="text-white/70 text-lg max-w-xl mb-8">
            Quick-revision cards organised by board, class, and difficulty stage. Swipe through topics and retain more in less time.
          </p>

          {/* Stats strip */}
          {searched && !loading && sets.length > 0 && (
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/20 px-4 py-1.5 text-sm font-bold text-white">
                <MIcon name="style" className="text-base" fill />{sets.length} Sets
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/20 px-4 py-1.5 text-sm font-bold text-white">
                <MIcon name="layers" className="text-base" fill />{totalCards} Cards total
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

        {/* Card grid */}
        {!loading && !error && searched && sets.length > 0 && (
          <>
            <p className="text-sm font-semibold text-slate-400 mb-6">
              <span className="font-black text-slate-900">{sets.length}</span> set{sets.length !== 1 ? "s" : ""} found
            </p>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sets.map((row, index) => {
                const color = CARD_COLORS[index % CARD_COLORS.length];
                const icon  = subjectIcon(row.subjectName);
                const gradientBg = `linear-gradient(135deg, ${color}ee, ${color}88)`;

                return (
                  <article
                    key={row._id}
                    className="group flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer"
                    onClick={() => openSet(row)}
                  >
                    {/* ── Gradient header with large rotating icon ── */}
                    <div
                      className="relative h-36 overflow-hidden p-5 flex flex-col justify-end"
                      style={{ background: gradientBg }}
                    >
                      {/* Dot texture */}
                      <div className="pointer-events-none absolute inset-0 opacity-10"
                        style={{ backgroundImage:"radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize:"18px 18px" }} />

                      {/* Large background icon — rotates on hover */}
                      <MIcon
                        name={icon}
                        className="absolute -bottom-4 -right-4 rotate-12 group-hover:rotate-0 transition-transform duration-500 text-white/20 pointer-events-none"
                        style={{ fontSize:"100px" }}
                        fill
                      />

                      {/* Stacked-card graphic (top-right) */}
                      <div className="absolute top-4 right-4 flex items-center gap-1.5">
                        {/* Mini card stack visual */}
                        {[8, 4, 0].map((offset) => (
                          <div
                            key={offset}
                            className="absolute rounded-lg border-2 border-white/40 bg-white/20"
                            style={{ width:36, height:28, right:offset, top:offset/2 }}
                          />
                        ))}
                        <span className="relative z-10 bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-black px-3 py-1 rounded-full whitespace-nowrap">
                          {row.cardsCount || 0} cards
                        </span>
                      </div>

                      {/* Subject + topic badge (top-left) */}
                      {(row.subjectName || row.topicName) && (
                        <div className="absolute top-4 left-4 bg-black/20 backdrop-blur-sm border border-white/20 text-white/90 text-[11px] font-bold px-2.5 py-1 rounded-full truncate max-w-[55%]">
                          {[row.subjectName, row.topicName].filter(Boolean).join(" · ")}
                        </div>
                      )}

                      {/* Set title */}
                      <h3
                        className="text-white text-xl font-black relative z-10 leading-tight line-clamp-2 drop-shadow-sm"
                        style={{ fontFamily:"'Balsamiq Sans', cursive" }}
                      >
                        {row.title}
                      </h3>
                    </div>

                    {/* ── Card body ── */}
                    <div className="flex flex-col flex-1 p-5 gap-4">
                      <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 flex-1">
                        {row.description || "Quick revision cards for this topic."}
                      </p>

                      {/* Stats row */}
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold" style={{ background: color+"15", color }}>
                          <MIcon name="layers" className="text-sm" fill />
                          {row.cardsCount || 0} cards
                        </span>
                        {(row.participantsCount || 0) > 0 && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                            <MIcon name="group" className="text-sm" fill />
                            {row.participantsCount} studied
                          </span>
                        )}
                      </div>

                      {/* CTA */}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); openSet(row); }}
                        className="w-full rounded-xl py-3 text-sm font-black flex items-center justify-center gap-2 text-white transition-all active:scale-95"
                        style={{ background: color, boxShadow:`0 4px 14px ${color}40` }}
                      >
                        <MIcon name={isLoggedIn ? "play_circle" : "lock"} className="text-base" fill />
                        {isLoggedIn ? "Study Now" : "Login to Study"}
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
