import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getJSON,
  listFlashcards,
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

function SkeletonList() {
  return Array.from({ length: 4 }).map((_, i) => (
    <div key={i} className="rounded-xl border border-slate-100 p-3 animate-pulse space-y-2">
      <div className="h-3.5 bg-slate-100 rounded-full w-3/4" />
      <div className="h-2.5 bg-slate-100 rounded-full w-1/2" />
    </div>
  ));
}

function SetItem({ row, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(row)}
      className={`w-full text-left rounded-xl border p-3 transition-all duration-200 ${
        active
          ? "border-[#e7c555] bg-[#fffae8] shadow-sm"
          : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold text-slate-800 leading-snug">{row.title}</p>
        {active && (
          <span className="material-symbols-outlined text-[#c9a92b] text-base flex-shrink-0">check_circle</span>
        )}
      </div>
      <div className="flex items-center gap-3 mt-1.5">
        <span className="flex items-center gap-1 text-xs text-slate-400">
          <span className="material-symbols-outlined text-[13px]">style</span>
          {row.cardsCount || row.cards?.length || 0} cards
        </span>
        <span className="flex items-center gap-1 text-xs text-slate-400">
          <span className="material-symbols-outlined text-[13px]">group</span>
          {row.participantsCount || 0}
        </span>
      </div>
    </button>
  );
}

export default function FlashcardsPage() {
  const [searchParams] = useSearchParams();
  const selectedSetId = String(searchParams.get("set") || "");
  const user = useMemo(() => readUser(), []);

  const [board, setBoard] = useState(String(user?.board || ""));
  const [className, setClassName] = useState(String(user?.class || user?.className || ""));
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [stage, setStage] = useState(1);

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
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [index, setIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [knownSet, setKnownSet] = useState(new Set());
  const [unknownSet, setUnknownSet] = useState(new Set());
  const [startTs, setStartTs] = useState(Date.now());

  const cards = selected?.cards || [];
  const currentCard = cards[index] || null;
  const isLast = cards.length > 0 && index === cards.length - 1;
  const progressPct = cards.length > 0 ? (index / cards.length) * 100 : 0;

  useEffect(() => { loadBoardsAndClasses(); }, []);

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

  useEffect(() => { loadSets(); }, [board, className, subject, topic, stage]);

  useEffect(() => {
    if (!selectedSetId || sets.length === 0) return;
    const found = sets.find((row) => String(row._id) === selectedSetId);
    if (found) selectSet(found);
  }, [selectedSetId, sets]);

  useEffect(() => {
    if (!selected?._id) { setAttempts([]); return; }
    loadMyAttempts(selected._id);
  }, [selected?._id]);

  // Lock body scroll when drawer is open on mobile
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  async function loadBoardsAndClasses() {
    try {
      const [bRes, cRes] = await Promise.all([fetch(`${API}/api/boards`), fetch(`${API}/api/classes`)]);
      const [bData, cData] = await Promise.all([bRes.json(), cRes.json()]);
      setBoards(Array.isArray(bData) ? bData : []);
      setClasses(Array.isArray(cData) ? cData : []);
    } catch { setBoards([]); setClasses([]); }
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
      const data = await listFlashcards({ board, class: className, subject, topic, stage, limit: 100 });
      const rows = Array.isArray(data?.items) ? data.items : [];
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

  function selectSet(row) {
    setSelected(row);
    setDrawerOpen(false);
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

  const selectStyle = "w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#e7c555]/40 transition";

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{FLIP_CSS}</style>

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Flashcards</h1>
          <p className="text-sm text-slate-500 mt-0.5">Flip, recall, and master concepts card by card</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Desktop: static sets count chip */}
          <div className="hidden lg:flex items-center gap-2 bg-[#e7c555]/10 border border-[#e7c555]/30 rounded-full px-4 py-2">
            <span className="material-symbols-outlined text-[#c9a92b] text-lg">style</span>
            <span className="text-sm font-bold text-slate-700">{sets.length} Sets</span>
          </div>

          {/* Mobile: drawer toggle */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden flex items-center gap-2 bg-[#e7c555] rounded-full px-4 py-2.5 text-sm font-bold text-slate-900 shadow-sm active:brightness-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">style</span>
            Sets
            <span className="bg-slate-900/10 rounded-full px-1.5 py-0.5 text-xs font-black">{sets.length}</span>
          </button>
        </div>
      </div>

      {/* Mobile: active set indicator */}
      {selected && (
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="lg:hidden w-full flex items-center gap-3 bg-[#fffae8] border border-[#e7c555]/40 rounded-2xl px-4 py-3 text-left"
        >
          <span className="material-symbols-outlined text-[#c9a92b] text-[20px] flex-shrink-0">check_circle</span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#c9a92b] mb-0.5">Active Set</p>
            <p className="text-sm font-bold text-slate-800 truncate">{selected.title}</p>
          </div>
          <span className="material-symbols-outlined text-slate-400 text-[18px] flex-shrink-0">swap_vert</span>
        </button>
      )}

      {/* ── Filters ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-slate-400 text-[18px]">tune</span>
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Filters</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          <select value={board} onChange={(e) => { setBoard(e.target.value); setSubject(""); setTopic(""); }} className={selectStyle}>
            <option value="">All Boards</option>
            {boards.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
          <select value={className} onChange={(e) => { setClassName(e.target.value); setSubject(""); setTopic(""); }} className={selectStyle}>
            <option value="">All Classes</option>
            {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select value={subject} onChange={(e) => { setSubject(e.target.value); setTopic(""); }} className={selectStyle}>
            <option value="">All Subjects</option>
            {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
          <select value={topic} onChange={(e) => setTopic(e.target.value)} className={selectStyle}>
            <option value="">All Topics</option>
            {topics.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
          <select value={stage} onChange={(e) => setStage(Number(e.target.value))} className={selectStyle}>
            <option value={1}>Stage 1</option>
            <option value={2}>Stage 2</option>
            <option value={3}>Stage 3</option>
          </select>
        </div>
      </div>

      {/* ── Mobile Bottom Sheet ── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] lg:hidden transition-opacity duration-300 ${
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setDrawerOpen(false)}
      />

      {/* Sheet panel */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out flex flex-col ${
          drawerOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxHeight: "78vh" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-slate-200" />
        </div>

        {/* Sheet header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 flex-shrink-0">
          <div>
            <p className="text-base font-black text-slate-900">Choose a Set</p>
            <p className="text-xs text-slate-400 mt-0.5">{sets.length} sets available</p>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 active:bg-slate-300 transition"
          >
            <span className="material-symbols-outlined text-slate-600 text-[20px]">close</span>
          </button>
        </div>

        {/* Sheet body — scrollable */}
        <div className="overflow-y-auto flex-1 p-3 space-y-2 pb-safe">
          {loading && <SkeletonList />}
          {!loading && sets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <span className="material-symbols-outlined text-slate-200 text-5xl">style</span>
              <p className="text-xs text-slate-400 font-medium">No sets found for this filter</p>
            </div>
          )}
          {sets.map((row) => (
            <SetItem
              key={row._id}
              row={row}
              active={selected?._id === row._id}
              onSelect={selectSet}
            />
          ))}
          {/* Safe area bottom padding for notched phones */}
          <div className="h-4" />
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 items-start">

        {/* Desktop sets list */}
        <div className="hidden lg:block bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <p className="text-sm font-black text-slate-800">Available Sets</p>
            <span className="text-xs font-semibold text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">{sets.length}</span>
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-3 space-y-2">
            {loading && <SkeletonList />}
            {!loading && sets.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                <span className="material-symbols-outlined text-slate-200 text-5xl">style</span>
                <p className="text-xs text-slate-400 font-medium">No sets found for this filter</p>
              </div>
            )}
            {sets.map((row) => (
              <SetItem
                key={row._id}
                row={row}
                active={selected?._id === row._id}
                onSelect={selectSet}
              />
            ))}
          </div>
        </div>

        {/* Practice area */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 md:p-6">
          {!selected ? (
            <div className="flex flex-col items-center justify-center min-h-[340px] text-center gap-4">
              <div className="w-20 h-20 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-slate-200 text-5xl">style</span>
              </div>
              <div>
                <p className="font-bold text-slate-600">No set selected</p>
                <p className="text-sm text-slate-400 mt-0.5 hidden lg:block">Pick a flashcard set from the left panel</p>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="lg:hidden mt-3 flex items-center gap-2 mx-auto rounded-full bg-[#e7c555] px-5 py-2.5 text-sm font-bold text-slate-900"
                >
                  <span className="material-symbols-outlined text-[16px]">style</span>
                  Browse Sets
                </button>
              </div>
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
                  onClick={() => setDrawerOpen(true)}
                  className="lg:hidden flex items-center gap-2 rounded-full border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  <span className="material-symbols-outlined text-sm">style</span>
                  Change Set
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
            <div className="space-y-5">
              {/* Title + restart */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-900 leading-tight">{selected.title}</h2>
                  {selected.description && (
                    <p className="text-sm text-slate-500 mt-0.5">{selected.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => selectSet(selected)}
                  className="flex-shrink-0 flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 rounded-full border border-slate-200 px-3 py-1.5 transition"
                >
                  <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                  Restart
                </button>
              </div>

              {/* Progress */}
              {cards.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1.5">
                    <span>Card {index + 1} / {cards.length}</span>
                    <span className="flex items-center gap-3">
                      <span className="text-emerald-600">{knownSet.size} known</span>
                      <span className="text-amber-500">{unknownSet.size} revisit</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#e7c555] to-[#4ECDC4] transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Flip card */}
              {currentCard && (
                <div
                  className="fc-scene cursor-pointer select-none"
                  style={{ height: 260 }}
                  onClick={() => setShowBack((p) => !p)}
                >
                  <div className={`fc-card ${showBack ? "flipped" : ""}`}>
                    <div className="fc-face fc-face-front bg-gradient-to-br from-[#fffae6] to-[#fff9d6] border-2 border-[#e7c555]/40 flex flex-col items-center justify-center p-8 text-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#e7c555]/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#c9a92b]">lightbulb</span>
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#c9a92b]">Question</p>
                      <p className="text-xl md:text-2xl font-black text-slate-800 leading-snug">{currentCard.front}</p>
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">touch_app</span>
                        Tap to reveal answer
                      </p>
                    </div>
                    <div className="fc-face fc-face-back bg-gradient-to-br from-[#e6faf8] to-[#d8f5f2] border-2 border-[#4ECDC4]/40 flex flex-col items-center justify-center p-8 text-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#4ECDC4]/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#4ECDC4]">check_circle</span>
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#4ECDC4]">Answer</p>
                      <p className="text-xl md:text-2xl font-black text-slate-800 leading-snug">{currentCard.back}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowBack((p) => !p)}
                  className="flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  <span className="material-symbols-outlined text-[16px]">flip</span>
                  {showBack ? "Show Front" : "Flip Card"}
                </button>

                <button
                  type="button"
                  onClick={() => markCard(false)}
                  className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm font-bold text-amber-700 hover:bg-amber-100 transition"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                  Need Revision
                </button>

                <button
                  type="button"
                  onClick={() => markCard(true)}
                  className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-100 transition"
                >
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  I Know This
                </button>

                {isLast && (
                  <button
                    type="button"
                    onClick={submitParticipation}
                    disabled={busy}
                    className="ml-auto flex items-center gap-1.5 rounded-full bg-[#e7c555] px-5 py-2.5 text-sm font-bold text-slate-900 hover:brightness-95 disabled:opacity-50 transition"
                  >
                    {busy ? (
                      <>
                        <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                        Submitting…
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">send</span>
                        Submit
                      </>
                    )}
                  </button>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                  <span className="material-symbols-outlined text-red-500 text-sm">error</span>
                  <p className="text-sm font-semibold text-red-600">{error}</p>
                </div>
              )}

              {attempts.length > 0 && (
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-sm font-bold text-slate-800 mb-2">My Recent Attempts</p>
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
          )}
        </div>
      </div>
    </div>
  );
}
