import { createElement, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  FileText,
  GraduationCap,
  Layers,
  Map,
  Sparkles,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const LEARN_PREFERENCES_KEY = "eec:learn-preferences";
const CHAPTER_PALETTE = ["#F59E0B", "#10B981", "#3B82F6", "#D946EF", "#F97316", "#FB7185", "#14B8A6", "#6366F1"];
const HEADING_FONT = { fontFamily: "'Balsamiq Sans', cursive" };

function classNumber(name) {
  const n = String(name || "").match(/\d+/);
  return n ? Number(n[0]) : 999;
}

function readJson(key, fallback = null) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value || fallback;
  } catch {
    return fallback;
  }
}

function findOption(options, value) {
  const rawValue = value && typeof value === "object" ? value._id || value.name : value;
  const needle = String(rawValue || "").trim().toLowerCase();
  if (!needle) return null;
  return options.find((item) => String(item?._id || "").toLowerCase() === needle)
    || options.find((item) => String(item?.name || "").trim().toLowerCase() === needle)
    || options.find((item) => String(item?.name || "").trim().toLowerCase().includes(needle));
}

async function fetchJSON(path) {
  const token = localStorage.getItem("jwt") || "";
  const res = await fetch(`${API}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  const data = await res.json().catch(() => []);
  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`);
  return Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
}

function Card({ icon, title, onClick, index = 0, badge }) {
  const color = CHAPTER_PALETTE[index % CHAPTER_PALETTE.length];
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex min-h-[92px] w-full items-center justify-between gap-4 rounded-2xl border bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md focus:outline-none focus-visible:ring-4 sm:p-5"
      style={{ borderColor: `${color}55`, "--tw-ring-color": `${color}55` }}
    >
      <span className="flex min-w-0 items-center gap-4 pr-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md transition-transform duration-200 group-hover:scale-105" style={{ background: color, boxShadow: `0 8px 18px ${color}33` }}>
          {badge ? <span className="text-lg font-black" style={HEADING_FONT}>{badge}</span> : createElement(icon, { className: "h-6 w-6", strokeWidth: 2.1 })}
        </span>
        <span className="min-w-0 line-clamp-2 text-base font-bold leading-snug text-slate-800 transition-colors group-hover:text-[#1B1F3B]" style={HEADING_FONT}>{title}</span>
      </span>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors" style={{ background: `${color}12`, color }}>
        <ChevronRight className="h-4 w-4" strokeWidth={2.7} />
      </span>
    </button>
  );
}

function chapterNumber(topic, index) {
  const explicit = Number(topic?.chapterNumber || topic?.chapterNo || topic?.order);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  const fromName = String(topic?.name || "").match(/chapter\s*(\d+)/i);
  return fromName ? Number(fromName[1]) : index + 1;
}

function lessonCount(topic) {
  const value = topic?.lessonCount ?? topic?.lessonsCount ?? topic?.lessons;
  if (Array.isArray(value)) return value.length;
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? count : null;
}

function ChapterCard({ topic, index, onClick }) {
  const color = CHAPTER_PALETTE[index % CHAPTER_PALETTE.length];
  const number = chapterNumber(topic, index);
  const lessons = lessonCount(topic);
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex min-h-[92px] items-center justify-between gap-4 rounded-2xl border bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md focus:outline-none focus-visible:ring-4 sm:p-5"
      style={{ borderColor: `${color}55`, "--tw-ring-color": `${color}55` }}
    >
      <span className="flex min-w-0 items-center gap-4 pr-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl font-black text-white shadow-md transition-transform duration-200 group-hover:scale-105" style={{ background: color, boxShadow: `0 8px 18px ${color}33`, ...HEADING_FONT }}>
          {number}
        </span>
        <span className="min-w-0">
          <span className="block line-clamp-2 text-base font-bold leading-snug text-slate-800 transition-colors group-hover:text-[#1B1F3B]" style={HEADING_FONT}>{topic?.name}</span>
          <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500">
            <span className="font-semibold" style={{ color }}>Chapter {number}</span>
            {lessons !== null && <><span>•</span><span>{lessons} {lessons === 1 ? "Lesson" : "Lessons"}</span></>}
          </span>
        </span>
      </span>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors" style={{ background: `${color}12`, color }}>
        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
      </span>
    </button>
  );
}

function SubjectCard({ subject, index, onClick }) {
  const color = CHAPTER_PALETTE[index % CHAPTER_PALETTE.length];
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex min-h-[92px] items-center justify-between gap-4 rounded-2xl border bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md focus:outline-none focus-visible:ring-4 sm:p-5"
      style={{ borderColor: `${color}55`, "--tw-ring-color": `${color}55` }}
    >
      <span className="flex min-w-0 items-center gap-4 pr-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md transition-transform duration-200 group-hover:scale-105" style={{ background: color, boxShadow: `0 8px 18px ${color}33` }}>
          <Layers className="h-6 w-6" strokeWidth={2.1} />
        </span>
        <span className="min-w-0">
          <span className="block line-clamp-2 text-base font-bold leading-snug text-slate-800 transition-colors group-hover:text-[#1B1F3B]" style={HEADING_FONT}>{subject?.name}</span>
          <span className="mt-1 block text-xs font-semibold" style={{ color }}>Subject</span>
        </span>
      </span>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors" style={{ background: `${color}12`, color }}>
        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
      </span>
    </button>
  );
}

function Skeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-[92px] animate-pulse rounded-2xl border-2 border-slate-100 bg-white" />)}
    </div>
  );
}

const STEPS = [
  { label: "Board", icon: Map },
  { label: "Class", icon: GraduationCap },
  { label: "Subject", icon: Layers },
  { label: "Chapter", icon: FileText },
];

function Stepper({ step, onJump }) {
  return (
    <div className="flex min-w-[380px] items-start">
      {STEPS.map((item, i) => {
        const number = i + 1;
        const done = number < step;
        const active = number === step;
        const Icon = item.icon;
        return (
          <div key={item.label} className="flex min-w-0 flex-1 items-start last:flex-none">
            <button type="button" disabled={!done} onClick={() => onJump(number)} className="flex min-w-[48px] flex-col items-center gap-1.5 disabled:cursor-default" aria-label={`${item.label}${active ? ", current step" : ""}`}>
              <span className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${active ? "scale-105 border-[#FFD23F] bg-[#FFD23F] text-[#1B1F3B] shadow-md shadow-[#FFD23F]/30" : done ? "border-[#4ECDC4] bg-[#4ECDC4] text-white hover:brightness-110" : "border-slate-600 bg-slate-900/40 text-slate-500"}`}>
                {done ? <Check className="h-4 w-4" strokeWidth={3} /> : <Icon className="h-4 w-4" strokeWidth={2.2} />}
              </span>
              <span className={`whitespace-nowrap text-[11px] font-bold ${active ? "text-[#FFD23F]" : done ? "text-slate-300" : "text-slate-500"}`}>{item.label}</span>
            </button>
            {i < STEPS.length - 1 && <span className="mx-1.5 mt-[18px] h-0.5 flex-1 rounded-full bg-slate-600 sm:mx-3"><span className="block h-full rounded-full bg-[#4ECDC4] transition-all duration-300" style={{ width: done ? "100%" : "0%" }} /></span>}
          </div>
        );
      })}
    </div>
  );
}

function Upcoming({ label = "This is coming soon" }) {
  return (
    <div className="col-span-full flex min-h-[220px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500"><Clock3 className="h-7 w-7" /></span>
      <h2 className="mt-4 text-xl font-black text-[#1B1F3B]" style={HEADING_FONT}>Upcoming</h2>
      <p className="mt-1 max-w-sm text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
}

export default function EECLearningBoards() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const boardId = params.get("board") || "";
  const classId = params.get("class") || "";
  const subjectId = params.get("subjectId") || "";
  const subjectHint = (params.get("subject") || "").trim().toLowerCase();

  const [boards, setBoards] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let mounted = true;
    async function loadSetup() {
      try {
        const [boardRows, classRows] = await Promise.all([fetchJSON("/api/boards"), fetchJSON("/api/classes")]);
        if (!mounted) return;
        const sortedClasses = [...classRows]
          .filter((item) => classNumber(item.name) >= 3 && classNumber(item.name) <= 10)
          .sort((a, b) => classNumber(a.name) - classNumber(b.name));
        setBoards(boardRows);
        setClasses(sortedClasses);

      } catch {
        if (mounted) setError("We couldn’t load Learn right now. Please try again.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadSetup();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setSubjects([]);
    if (!boardId || !classId) return;
    setLoading(true);
    setError("");
    fetchJSON(`/api/subject?board=${encodeURIComponent(boardId)}&class=${encodeURIComponent(classId)}`)
      .then((rows) => setSubjects(rows.sort((a, b) => a.name.localeCompare(b.name))))
      .catch(() => setError("We couldn’t load subjects right now. Please try again."))
      .finally(() => setLoading(false));
  }, [boardId, classId]);

  useEffect(() => {
    setTopics([]);
    if (!boardId || !classId || !subjectId) return;
    setLoading(true);
    setError("");
    fetchJSON(`/api/topic/${encodeURIComponent(subjectId)}?board=${encodeURIComponent(boardId)}&class=${encodeURIComponent(classId)}`)
      .then((rows) => setTopics(rows))
      .catch(() => setError("We couldn’t load chapters right now. Please try again."))
      .finally(() => setLoading(false));
  }, [boardId, classId, subjectId]);

  const board = boards.find((item) => String(item._id) === String(boardId));
  const cls = classes.find((item) => String(item._id) === String(classId));
  const subject = subjects.find((item) => String(item._id) === String(subjectId));
  const savedPreferences = readJson(LEARN_PREFERENCES_KEY, {});
  const savedUser = readJson("user", {});
  const preferredBoard = findOption(boards, savedPreferences.boardId || savedUser.boardId || savedUser.board || savedUser.boardName);
  const preferredClass = findOption(classes, savedPreferences.classId || savedUser.classId || savedUser.class || savedUser.className);
  const preferredBoardId = preferredBoard?._id || "";
  const preferredClassId = preferredClass?._id || "";
  const orderedBoards = useMemo(() => {
    if (!preferredBoardId) return boards;
    const preferred = boards.find((item) => String(item._id) === String(preferredBoardId));
    return preferred ? [preferred, ...boards.filter((item) => String(item._id) !== String(preferredBoardId))] : boards;
  }, [boards, preferredBoardId]);
  const orderedClasses = useMemo(() => {
    if (!preferredClassId) return classes;
    const preferred = classes.find((item) => String(item._id) === String(preferredClassId));
    return preferred ? [preferred, ...classes.filter((item) => String(item._id) !== String(preferredClassId))] : classes;
  }, [classes, preferredClassId]);
  const assignedSubjectHint = useMemo(() => {
    const saved = readJson(LEARN_PREFERENCES_KEY, {});
    const user = readJson("user", {});
    const value = params.get("subject") || saved.subjectId || saved.subjectName || user.subjectId || user.subjectName || user.subject;
    const rawValue = value && typeof value === "object" ? value._id || value.name : value;
    return String(rawValue || "").trim().toLowerCase();
  }, [params]);
  const orderedSubjects = useMemo(() => {
    const hint = subjectHint || assignedSubjectHint;
    if (!hint) return subjects;
    const matches = (item) => {
      const name = String(item.name || "").toLowerCase();
      return name.includes(hint) || hint.includes(name);
    };
    return [...subjects.filter(matches), ...subjects.filter((item) => !matches(item))];
  }, [assignedSubjectHint, subjects, subjectHint]);

  const step = !boardId ? 1 : !classId ? 2 : !subjectId ? 3 : 4;
  const heading = {
    1: { title: "What would you like to learn?", text: "Choose your board to find the right lessons for you." },
    2: { title: "Pick your class", text: `Choose a class for ${board?.name || "your board"}.` },
    3: { title: "Choose a subject", text: `${board?.name || "Your board"} · ${cls?.name || "Your class"}` },
    4: { title: "Choose a chapter", text: `${subject?.name || "Subject"} · ${cls?.name || "Your class"}` },
  }[step];

  function savePreferences(nextBoardId, nextClassId) {
    localStorage.setItem(LEARN_PREFERENCES_KEY, JSON.stringify({ boardId: nextBoardId || "", classId: nextClassId || "" }));
  }

  function go(next) {
    const nextParams = new URLSearchParams();
    if (subjectHint) nextParams.set("subject", params.get("subject"));
    Object.entries(next).forEach(([key, value]) => value && nextParams.set(key, value));
    setParams(nextParams);
    savePreferences(next.board || boardId, next.class || (next.board ? "" : classId));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openTopic(topic) {
    navigate(`/learn/topic/${subjectId}/${topic._id}`, { state: { subject, topic, boardLabel: board?.name, classLabel: cls?.name, previewMode: !localStorage.getItem("jwt") } });
  }

  function goBack() {
    const previous = new URLSearchParams(params);
    previous.delete("subjectId");
    if (step <= 3) previous.delete("class");
    if (step <= 2) previous.delete("board");
    setParams(previous);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const items = step === 1 ? orderedBoards : step === 2 ? orderedClasses : step === 3 ? orderedSubjects : topics;
  const contextLabel = {
    1: "Classes 3–10 · Board-wise learning",
    2: board?.name || "Board-wise learning",
    3: `${board?.name || "Board"} · ${cls?.name || "Class"}`,
    4: `${subject?.name || "Subject"} · ${cls?.name || "Class"}`,
  }[step];
  const contextDescription = {
    1: heading.text,
    2: "Select your class to see available subjects.",
  }[step];

  return (
    <main className="min-h-[calc(100vh-9rem)] bg-[#F8F5EE]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <title>Learn by Board and Class | Edify Eight</title>
      <meta name="description" content="Explore calm, focused learning resources for Classes 3 to 10 by board, class, subject, and chapter." />
      <link rel="canonical" href="https://www.edifyeight.com/learn" />

      <section className="relative overflow-hidden bg-gradient-to-b from-[#141b38] to-[#1e264c] px-4 pb-8 pt-5 md:pb-9 md:pt-6">
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#4ECDC4]/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl">
          <div className="flex flex-col items-center gap-4 text-center">
            <div>
              <p className="text-sm font-bold text-[#FFD23F]">{contextLabel}</p>
              <h1 className="mt-1 text-3xl font-black leading-tight text-white md:text-4xl" style={HEADING_FONT}>{heading.title}</h1>
              <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-slate-300 md:text-base">{contextDescription}</p>
            </div>
            <div className="w-full max-w-3xl overflow-x-auto no-scrollbar rounded-2xl border border-slate-700/60 bg-slate-900/60 p-2.5 shadow-inner backdrop-blur-md md:rounded-full md:px-6 md:py-2"><Stepper step={step} onJump={(number) => go(number === 1 ? {} : number === 2 ? { board: boardId } : { board: boardId, class: classId })} /></div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto -mt-5 max-w-6xl px-4 pb-10">
        <div className="rounded-3xl border border-amber-100/90 bg-[#FFFDF9] p-3 shadow-xl shadow-stone-300/40 sm:p-5 md:p-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
              {board && <span className="rounded-full bg-white px-3 py-1.5 text-[#1B1F3B] shadow-sm">{board.name}</span>}
              {cls && <><ChevronRight className="h-3.5 w-3.5 text-slate-300" /><span className="rounded-full bg-white px-3 py-1.5 text-[#1B1F3B] shadow-sm">{cls.name}</span></>}
              {subject && <><ChevronRight className="h-3.5 w-3.5 text-slate-300" /><span className="rounded-full bg-white px-3 py-1.5 text-[#1B1F3B] shadow-sm">{subject.name}</span></>}
            </div>
            {step > 1 && <button type="button" onClick={goBack} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-white hover:text-[#1B1F3B]"><ArrowLeft className="h-3.5 w-3.5" /> Back</button>}
          </div>

          {error ? (
            <div className="rounded-2xl border-2 border-rose-200 bg-white px-5 py-8 text-center"><p className="text-sm font-semibold text-rose-600">{error}</p><button type="button" onClick={() => window.location.reload()} className="mt-4 rounded-full bg-[#1B1F3B] px-4 py-2 text-xs font-bold text-white">Try again</button></div>
          ) : loading ? <Skeleton /> : items.length ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
              {step === 1 && orderedBoards.map((item, i) => <Card key={item._id} index={i} icon={BookOpen} title={item.name} onClick={() => go({ board: item._id })} />)}
              {step === 2 && orderedClasses.map((item, i) => <Card key={item._id} index={i} badge={item.name.replace(/\D/g, "") || undefined} icon={GraduationCap} title={item.name} onClick={() => go({ board: boardId, class: item._id })} />)}
              {step === 3 && orderedSubjects.map((item, i) => <SubjectCard key={item._id} subject={item} index={i} onClick={() => go({ board: boardId, class: classId, subjectId: item._id })} />)}
              {step === 4 && topics.map((item, i) => <ChapterCard key={item._id} topic={item} index={i} onClick={() => openTopic(item)} />)}
            </div>
          ) : <Upcoming label={step === 3 ? "Subjects for this class will appear here soon." : step === 4 ? "Chapters for this subject will appear here soon." : "Learning options will appear here soon."} />}

          {step === 1 && !loading && !error && <div className="mt-4 flex items-center justify-center gap-2 text-center text-xs font-semibold text-slate-500"><Sparkles className="h-4 w-4 text-[#FF9F1C]" /> Choose a board to get started.</div>}
        </div>
      </section>
    </main>
  );
}
