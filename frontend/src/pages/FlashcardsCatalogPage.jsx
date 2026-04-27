import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const DEFAULT_BOARDS = ["CBSE", "ICSE", "State Board", "IB"].map((name) => ({
  value: name,
  label: name,
}));
const DEFAULT_CLASSES = [
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
].map((name) => ({ value: name, label: name }));

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

  const totalCards = useMemo(
    () => sets.reduce((sum, row) => sum + Number(row.cardsCount || 0), 0),
    [sets]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [bRes, cRes] = await Promise.all([
          fetch(`${API}/api/boards`),
          fetch(`${API}/api/classes`),
        ]);
        const [bData, cData] = await Promise.all([
          bRes.json().catch(() => []),
          cRes.json().catch(() => []),
        ]);
        const bRows = (Array.isArray(bData) ? bData : [])
          .map((row) => ({ value: String(row?._id || ""), label: String(row?.name || "") }))
          .filter((row) => row.value && row.label);
        const cRows = (Array.isArray(cData) ? cData : [])
          .map((row) => ({ value: String(row?._id || ""), label: String(row?.name || "") }))
          .filter((row) => row.value && row.label);
        if (!mounted) return;
        if (bRows.length) {
          setBoards(bRows);
          setBoard(bRows[0].value);
        }
        if (cRows.length) {
          setClasses(cRows);
          setClassName(cRows[0].value);
        }
      } catch {
        if (!mounted) return;
        setBoards(DEFAULT_BOARDS);
        setClasses(DEFAULT_CLASSES);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function loadSets() {
    setLoading(true);
    setError("");
    setSearched(true);
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
      if (rows.length === 0) setError("No flashcards found for this selection.");
    } catch (e) {
      setSets([]);
      setError(e.message || "Failed to load flashcards");
    } finally {
      setLoading(false);
    }
  }

  function openSet(row) {
    const target = `/dashboard/flashcards?set=${encodeURIComponent(row._id)}`;
    if (!isLoggedIn) {
      sessionStorage.setItem("redirectAfterLogin", target);
      window.dispatchEvent(new Event("eec:open-login"));
      return;
    }
    navigate(target);
  }

  return (
    <section className="min-h-screen bg-[#f8f7f6] py-12">
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="rounded-3xl bg-white border border-slate-200 p-6 md:p-8 shadow-sm">
          <div className="flex flex-col gap-2">
            <p className="inline-flex w-fit items-center gap-2 rounded-full bg-[#e7c555]/20 px-3 py-1 text-xs font-bold tracking-wide text-[#9d7b16]">
              <span className="material-symbols-outlined text-[16px]">style</span>
              Flashcards
            </p>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900">Explore Flashcards</h1>
            <p className="text-slate-600">
              Browse flashcards by board and class. You can view all sets, and open one to practice.
            </p>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
            <select
              value={board}
              onChange={(e) => setBoard(e.target.value)}
              className="h-12 rounded-xl border border-slate-300 bg-white px-4 font-semibold text-slate-700"
            >
              {boards.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
            <select
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="h-12 rounded-xl border border-slate-300 bg-white px-4 font-semibold text-slate-700"
            >
              {classes.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <select
              value={stage}
              onChange={(e) => setStage(Number(e.target.value))}
              className="h-12 rounded-xl border border-slate-300 bg-white px-4 font-semibold text-slate-700"
            >
              <option value={1}>Stage 1</option>
              <option value={2}>Stage 2</option>
              <option value={3}>Stage 3</option>
            </select>
            <button
              type="button"
              onClick={loadSets}
              disabled={loading}
              className="h-12 rounded-xl bg-[#F5C518] px-6 font-bold text-slate-900 hover:bg-[#e5b300] disabled:opacity-70"
            >
              {loading ? "Loading..." : "Find Flashcards"}
            </button>
          </div>

          {searched && !loading && (
            <div className="mt-5 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-blue-100 px-3 py-1 font-semibold text-blue-700">
                Sets: {sets.length}
              </span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700">
                Total Cards: {totalCards}
              </span>
            </div>
          )}
        </div>

        <div className="mt-6">
          {loading && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
              Loading flashcards...
            </div>
          )}
          {!loading && error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-700">
              {error}
            </div>
          )}
          {!loading && !error && searched && sets.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {sets.map((row, index) => {
                const tone =
                  index % 4 === 0
                    ? "from-blue-400 to-indigo-600"
                    : index % 4 === 1
                    ? "from-emerald-400 to-teal-600"
                    : index % 4 === 2
                    ? "from-orange-400 to-pink-600"
                    : "from-violet-400 to-purple-600";
                return (
                  <article key={row._id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                    <div className={`bg-gradient-to-r ${tone} p-5`}>
                      <h3 className="text-xl font-black text-white">{row.title}</h3>
                      <p className="text-white/90 text-sm">
                        {row.subjectName} • {row.topicName}
                      </p>
                    </div>
                    <div className="p-5">
                      <p className="text-sm text-slate-600 min-h-[40px]">
                        {row.description || "Quick revision cards for this topic."}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                          {row.cardsCount || 0} cards
                        </span>
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-700">
                          {row.participantsCount || 0} participants
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => openSet(row)}
                        className="mt-4 rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-bold hover:bg-slate-800"
                      >
                        {isLoggedIn ? "Open Flashcards" : "Login to Open"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

