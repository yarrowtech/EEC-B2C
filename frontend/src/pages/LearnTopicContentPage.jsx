import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getJSON } from "../lib/api";

/* ── Helpers ── */
function decodeEntityTags(value) {
  return String(value || "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
}
function getHtmlOrFallback(html, fallback) {
  const clean = decodeEntityTags(String(html || "").trim());
  return clean ? clean : `<p class="text-slate-400 italic">${fallback}</p>`;
}

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
  return Object.entries(SUBJECT_ICONS).find(([k]) => key.includes(k))?.[1] || "auto_stories";
}
function subjectColor(name, fallbackIndex = 0) {
  const key = String(name || "").toLowerCase().replace(/[^a-z]/g, "");
  const idx = Object.keys(SUBJECT_ICONS).findIndex((k) => key.includes(k));
  return SUBJECT_COLORS[(idx >= 0 ? idx : fallbackIndex) % SUBJECT_COLORS.length];
}

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

// Teacher content comes from a rich-text editor with inline font/size styles;
// normalise it so every topic reads consistently.
const CONTENT_CSS = `
.topic-content { color:#334155; font-size:16px; line-height:1.8; overflow-wrap:anywhere; }
.topic-content * { font-family:inherit !important; max-width:100%; }
.topic-content span, .topic-content font { font-size:inherit !important; background:transparent !important; }
.topic-content > * + * { margin-top:1em; }
.topic-content h1, .topic-content h2, .topic-content h3, .topic-content h4 {
  color:#0f172a; font-weight:800; line-height:1.3; margin-top:1.6em; margin-bottom:.5em; }
.topic-content h1 { font-size:1.6rem; } .topic-content h2 { font-size:1.35rem; }
.topic-content h3 { font-size:1.15rem; } .topic-content h4 { font-size:1rem; }
.topic-content h1:first-child, .topic-content h2:first-child, .topic-content h3:first-child { margin-top:0; }
.topic-content p { margin:0 0 1em; }
.topic-content strong, .topic-content b { color:#0f172a; font-weight:700; }
.topic-content ul, .topic-content ol { padding-left:1.4em; margin:0 0 1em; }
.topic-content ul { list-style:disc; } .topic-content ol { list-style:decimal; }
.topic-content li { margin:.35em 0; padding-left:.2em; }
.topic-content li::marker { color:var(--accent); font-weight:700; }
.topic-content a { color:var(--accent); font-weight:600; text-decoration:underline; }
.topic-content img { height:auto; border-radius:14px; margin:1em auto; display:block; }
.topic-content blockquote { border-left:4px solid var(--accent); background:#f8fafc;
  padding:.75em 1em; border-radius:0 12px 12px 0; color:#475569; }
.topic-content table { width:100%; border-collapse:collapse; display:block; overflow-x:auto; font-size:.95em; }
.topic-content th, .topic-content td { border:1px solid #e2e8f0; padding:.55em .8em; text-align:left; }
.topic-content th { background:#f1f5f9; color:#0f172a; font-weight:700; }
.topic-content hr { border:0; border-top:2px dashed #e2e8f0; margin:1.5em 0; }
`;

const QUIZ_SETS = {
  math: [
    { q: "What is 7 × 8?", options: ["54", "56", "58", "64"], answer: 1 },
    { q: "Which of these is an even number?", options: ["13", "21", "34", "45"], answer: 2 },
    { q: "What is half of 50?", options: ["20", "25", "30", "15"], answer: 1 },
    { q: "How many sides does a triangle have?", options: ["2", "3", "4", "5"], answer: 1 },
    { q: "What is 100 − 37?", options: ["63", "73", "67", "57"], answer: 0 },
  ],
  science: [
    { q: "Which gas do plants take in for photosynthesis?", options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], answer: 2 },
    { q: "Water boils at what temperature at sea level?", options: ["50 °C", "100 °C", "90 °C", "120 °C"], answer: 1 },
    { q: "Which organ pumps blood around the body?", options: ["Lungs", "Brain", "Heart", "Liver"], answer: 2 },
    { q: "What is the closest star to the Earth?", options: ["Moon", "Sun", "Sirius", "Mars"], answer: 1 },
    { q: "Ice is the solid form of which substance?", options: ["Water", "Salt", "Air", "Oil"], answer: 0 },
  ],
  english: [
    { q: "Which word is a noun?", options: ["Run", "Happy", "Table", "Quickly"], answer: 2 },
    { q: "What is the plural of 'child'?", options: ["Childs", "Children", "Childes", "Childrens"], answer: 1 },
    { q: "Choose the correct article: ___ apple", options: ["A", "An", "The", "No article"], answer: 1 },
    { q: "Which word is the opposite of 'hot'?", options: ["Warm", "Cold", "Sunny", "Bright"], answer: 1 },
    { q: "Which of these is a verb?", options: ["Sing", "Blue", "Chair", "Soft"], answer: 0 },
  ],
  social: [
    { q: "What is the capital of India?", options: ["Mumbai", "Kolkata", "New Delhi", "Chennai"], answer: 2 },
    { q: "Which is the largest ocean on Earth?", options: ["Indian", "Atlantic", "Arctic", "Pacific"], answer: 3 },
    { q: "How many continents are there?", options: ["5", "6", "7", "8"], answer: 2 },
    { q: "Which river is known as the 'Ganga' in India?", options: ["Ganges", "Nile", "Amazon", "Thames"], answer: 0 },
    { q: "Who is known as the 'Father of the Nation' in India?", options: ["Nehru", "Mahatma Gandhi", "Bose", "Patel"], answer: 1 },
  ],
  general: [
    { q: "How many days are there in a week?", options: ["5", "6", "7", "8"], answer: 2 },
    { q: "Which planet do we live on?", options: ["Mars", "Earth", "Venus", "Jupiter"], answer: 1 },
    { q: "How many months have 31 days?", options: ["5", "6", "7", "8"], answer: 2 },
    { q: "Which colour do you get by mixing blue and yellow?", options: ["Green", "Purple", "Orange", "Pink"], answer: 0 },
    { q: "What do bees make?", options: ["Milk", "Honey", "Silk", "Wax only"], answer: 1 },
  ],
};

function quizFor(subjectName) {
  const key = String(subjectName || "").toLowerCase();
  if (/math/.test(key)) return QUIZ_SETS.math;
  if (/science|physics|chemistry|biology|evs|environment/.test(key)) return QUIZ_SETS.science;
  if (/english|grammar/.test(key)) return QUIZ_SETS.english;
  if (/social|history|geography|civics|economics/.test(key)) return QUIZ_SETS.social;
  return QUIZ_SETS.general;
}

function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function QuickQuiz({ questions, color, onPracticeFull, isLoggedIn }) {
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [seconds, setSeconds] = useState(0);
  const answeredCount = Object.keys(answers).length;
  const done = answeredCount === questions.length;
  const score = questions.reduce((s, q, i) => s + (answers[i] === q.answer ? 1 : 0), 0);

  useEffect(() => {
    if (!started || done) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [started, done]);

  function reset() {
    setAnswers({});
    setSeconds(0);
    setStarted(true);
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-slate-100 bg-amber-50/70">
        <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-sm shrink-0">
          <MIcon name="quiz" className="text-xl" fill />
        </div>
        <div>
          <h2 className="font-black text-slate-900 text-base" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
            Quick Quiz
          </h2>
          <p className="text-xs font-semibold text-slate-400">{questions.length} easy questions to warm up</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">
            {answeredCount}/{questions.length} answered
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-black tabular-nums ${
              done ? "bg-emerald-100 text-emerald-700" : "bg-slate-900 text-white"
            }`}
          >
            <MIcon name="timer" className="text-base" fill />
            {formatClock(seconds)}
          </span>
        </div>
      </div>

      {!started ? (
        <div className="flex flex-col items-center px-6 py-10 text-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-lg"
            style={{ background: color, boxShadow: `0 10px 28px ${color}55` }}
          >
            <MIcon name="bolt" className="text-4xl" fill />
          </div>
          <h3 className="mt-4 text-xl font-black text-slate-900" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
            Test yourself in under 2 minutes
          </h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            {questions.length} quick multiple-choice questions. The timer starts when you press Start.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs font-bold text-slate-500">
            {[`${questions.length} questions`, "Easy level", "Instant feedback"].map((f) => (
              <span key={f} className="rounded-full bg-slate-100 px-3 py-1">{f}</span>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl px-8 py-3 text-base font-black text-[#1B1F3B] shadow-lg transition hover:scale-105 active:scale-95"
            style={{ background: color }}
          >
            <MIcon name="play_arrow" className="text-2xl" fill />
            Start Quiz
          </button>
        </div>
      ) : (
      <>
      <div className="h-1.5 bg-slate-100">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${(answeredCount / questions.length) * 100}%`, background: color }}
        />
      </div>

      <div className="px-6 py-6 space-y-6">
        {questions.map((q, qi) => {
          const picked = answers[qi];
          const isAnswered = picked !== undefined;
          return (
            <div key={qi}>
              <p className="font-bold text-slate-800 mb-3">
                <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-black text-white" style={{ background: color }}>
                  {qi + 1}
                </span>
                {q.q}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {q.options.map((opt, oi) => {
                  const isCorrect = oi === q.answer;
                  const isPicked = oi === picked;
                  let cls = "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700";
                  if (isAnswered && isCorrect) cls = "border-emerald-400 bg-emerald-50 text-emerald-800";
                  else if (isAnswered && isPicked) cls = "border-rose-400 bg-rose-50 text-rose-800";
                  else if (isAnswered) cls = "border-slate-100 bg-white text-slate-400";
                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                      className={`flex items-center gap-3 rounded-xl border-2 px-4 py-2.5 text-left text-sm font-semibold transition disabled:cursor-default ${cls}`}
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-500">
                        {String.fromCharCode(65 + oi)}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {isAnswered && isCorrect && <MIcon name="check_circle" className="text-lg text-emerald-500" fill />}
                      {isAnswered && isPicked && !isCorrect && <MIcon name="cancel" className="text-lg text-rose-500" fill />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {done && (
        <div className="border-t border-slate-100 bg-[linear-gradient(135deg,#1B1F3B,#2d3561)] px-6 py-6 text-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xl font-black" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
                {score === questions.length ? "Perfect score! 🎉" : score >= questions.length / 2 ? "Nice work!" : "Good try!"}
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {[
                  ["Score", `${score}/${questions.length}`],
                  ["Accuracy", `${Math.round((score / questions.length) * 100)}%`],
                  ["Time taken", formatClock(seconds)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-white/10 px-4 py-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                    <p className="text-lg font-black tabular-nums">{value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={reset}
                className="rounded-xl border border-white/20 px-4 py-3 text-sm font-bold text-white hover:bg-white/10"
              >
                Retry
              </button>
              <button
                type="button"
                onClick={onPracticeFull}
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-black text-[#1B1F3B] shadow-lg transition hover:scale-105 active:scale-95"
                style={{ background: color }}
              >
                <MIcon name="play_circle" className="text-xl" fill />
                {isLoggedIn ? "Practice Full" : "Login to Practice Full"}
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}

export default function LearnTopicContentPage() {
  const { subjectId, topicId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("jwt") || "";
  const isLoggedIn = Boolean(token);
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState(location.state?.subject || null);
  const [topic, setTopic] = useState(location.state?.topic || null);

  const boardLabel = useMemo(() => location.state?.boardLabel || "", [location.state]);
  const classLabel = useMemo(() => location.state?.classLabel || "", [location.state]);

  /* ── All existing data loading logic — unchanged ── */
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        if (subject?._id === subjectId && topic?._id === topicId) return;
        if (isLoggedIn) {
          const [subjectRows, topicRows] = await Promise.all([
            getJSON("/api/subject"),
            getJSON(`/api/topic/${subjectId}`),
          ]);
          const foundSubject = (Array.isArray(subjectRows) ? subjectRows : []).find((s) => String(s?._id) === String(subjectId));
          const foundTopic = (Array.isArray(topicRows) ? topicRows : []).find((t) => String(t?._id) === String(topicId));
          if (!mounted) return;
          setSubject(foundSubject || null);
          setTopic(foundTopic || null);
          return;
        }
        const [subjectRes, topicRes] = await Promise.all([
          fetch(`${API}/api/subjects`),
          fetch(`${API}/api/subjects/${encodeURIComponent(subjectId)}/topics`),
        ]);
        const [subjectData, topicData] = await Promise.all([subjectRes.json().catch(() => ({})), topicRes.json().catch(() => ({}))]);
        const foundSubject = (Array.isArray(subjectData?.items) ? subjectData.items : []).find((s) => String(s?._id) === String(subjectId));
        const foundTopic = (Array.isArray(topicData?.items) ? topicData.items : []).find((t) => String(t?._id) === String(topicId));
        if (!mounted) return;
        setSubject(foundSubject || null);
        setTopic(foundTopic || null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, [API, isLoggedIn, subjectId, topicId, subject, topic]);

  function handlePracticeNow() {
    const targetPath = `/dashboard/syllabus/topic/${encodeURIComponent(subjectId)}/${encodeURIComponent(topicId)}?stage=1&openPractice=1`;
    if (!isLoggedIn) {
      sessionStorage.setItem("redirectAfterLogin", targetPath);
      window.dispatchEvent(new Event("eec:open-login"));
      return;
    }
    navigate(targetPath);
  }

  /* ── Derived visuals ── */
  const icon  = subjectIcon(subject?.name);
  const color = subjectColor(subject?.name);
  const gradientBg = `linear-gradient(135deg, ${color}ee, ${color}88)`;

  /* ── Rough reading-time estimate ── */
  const readingTime = useMemo(() => {
    const text = String(topic?.topicSummary || "").replace(/<[^>]*>/g, "");
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
  }, [topic]);

  const quizQuestions = useMemo(() => quizFor(subject?.name), [subject?.name]);

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {/* Skeleton hero */}
        <div className="h-52 bg-slate-200 animate-pulse" />
        <div className="mx-auto max-w-4xl px-4 py-8 space-y-5">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50 animate-pulse overflow-hidden">
              <div className="h-14 bg-slate-200" />
              <div className="p-6 space-y-3">
                <div className="h-4 w-full bg-slate-200 rounded" />
                <div className="h-4 w-5/6 bg-slate-200 rounded" />
                <div className="h-4 w-3/4 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── Not found ── */
  if (!subject || !topic) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 px-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center">
          <MIcon name="error" className="text-4xl text-rose-400" fill />
        </div>
        <p className="font-bold text-slate-700 text-lg">Topic not found</p>
        <button onClick={() => navigate("/boards")} className="rounded-full bg-slate-900 text-white font-bold px-6 py-2.5 text-sm hover:bg-slate-700 transition">
          ← Back to Learn
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{CONTENT_CSS}</style>

      {/* ══ HERO ══ */}
      <div className="relative overflow-hidden" style={{ background: gradientBg }}>
        {/* Dot-grid texture */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "22px 22px" }} />

        {/* Large background icon */}
        <MIcon
          name={icon}
          className="absolute -bottom-8 -right-8 text-white/10 pointer-events-none"
          style={{ fontSize: "240px" }}
          fill
        />

        <div className="relative mx-auto max-w-5xl px-4 py-12 md:py-16">

          {/* Breadcrumb */}
          <div className="flex flex-wrap items-center gap-2 mb-6 text-white/70 text-xs font-semibold">
            <button
              onClick={() => navigate("/boards")}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/25 px-3 py-1.5 text-white font-bold hover:bg-white/25 transition text-sm"
            >
              <MIcon name="arrow_back" className="text-sm" />
              Learn
            </button>
            <MIcon name="chevron_right" className="text-base opacity-50" />
            <span className="text-white/80">{subject?.name}</span>
            <MIcon name="chevron_right" className="text-base opacity-50" />
            <span className="text-white/60 truncate max-w-[160px]">{topic?.name}</span>
          </div>

          {/* Subject badge */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 border border-white/25 px-3 py-1 text-sm font-bold text-white backdrop-blur-sm">
              <MIcon name={icon} className="text-base" fill />
              {subject?.name}
            </span>
            {boardLabel && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/20 border border-white/15 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-sm">
                {boardLabel}{classLabel ? ` · ${classLabel}` : ""}
              </span>
            )}
          </div>

          {/* Topic title */}
          <h1
            className="text-3xl md:text-5xl font-black text-white leading-tight mb-3 drop-shadow-sm"
            style={{ fontFamily: "'Balsamiq Sans', cursive" }}
          >
            {topic?.name}
          </h1>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 text-white/70 text-sm font-semibold">
            <span className="inline-flex items-center gap-1.5">
              <MIcon name="schedule" className="text-base" />
              {readingTime} min read
            </span>
            <span className="opacity-40">·</span>
            <span className="inline-flex items-center gap-1.5">
              <MIcon name="menu_book" className="text-base" fill />
              Topic Summary + Learning Outcomes
            </span>
          </div>
        </div>
      </div>

      {/* ══ CONTENT ══ */}
      <div className="mx-auto max-w-4xl px-4 py-8 md:py-10 space-y-6">

        {/* ── Topic Summary card ── */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          {/* Card header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100" style={{ background: color + "10" }}>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
              style={{ background: color }}
            >
              <MIcon name="menu_book" className="text-xl" fill />
            </div>
            <div>
              <h2 className="font-black text-slate-900 text-base" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
                Topic Summary
              </h2>
              <p className="text-xs font-semibold text-slate-400">Overview of key concepts</p>
            </div>
            <div className="ml-auto shrink-0 text-xs font-bold rounded-full px-3 py-1" style={{ background: color + "18", color }}>
              {readingTime} min read
            </div>
          </div>

          {/* Prose content */}
          <div className="px-6 py-6">
            <div
              className="topic-content"
              style={{ "--accent": color }}
              dangerouslySetInnerHTML={{
                __html: getHtmlOrFallback(topic?.topicSummary, "No summary available for this topic yet."),
              }}
            />
          </div>
        </div>

        {/* ── Learning Outcomes card ── */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-emerald-50/60">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-sm shrink-0">
              <MIcon name="checklist" className="text-xl" fill />
            </div>
            <div>
              <h2 className="font-black text-slate-900 text-base" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
                Learning Outcomes
              </h2>
              <p className="text-xs font-semibold text-slate-400">What you will be able to do</p>
            </div>
          </div>

          <div className="px-6 py-6">
            <div
              className="topic-content"
              style={{ "--accent": "#10b981" }}
              dangerouslySetInnerHTML={{
                __html: getHtmlOrFallback(topic?.learningOutcome, "Learning outcomes are not available yet."),
              }}
            />
          </div>
        </div>

        {/* ── Quick Quiz ── */}
        <QuickQuiz
          questions={quizQuestions}
          color={color}
          isLoggedIn={isLoggedIn}
          onPracticeFull={handlePracticeNow}
        />

        {/* ── Practice CTA ── */}
        <div
          className="relative overflow-hidden rounded-2xl p-7 md:p-10 text-white"
          style={{ background: "linear-gradient(135deg, #1B1F3B, #2d3561)" }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "22px 22px" }}
          />
          <MIcon
            name={icon}
            className="absolute -bottom-6 -right-6 text-white/8 pointer-events-none"
            style={{ fontSize: "180px" }}
            fill
          />
          <div className="relative flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg mb-4"
                style={{ background: color, boxShadow: `0 8px 24px ${color}50` }}
              >
                <MIcon name={icon} className="text-3xl" fill />
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-white mb-2" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
                Ready to Practice?
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed max-w-md">
                Test your understanding of <strong className="text-white">{topic?.name}</strong> with stage-wise questions.
                Start from Basic and work your way up.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {["Stage 1 — Basic", "10 Questions", "Instant Feedback"].map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-bold text-white/80"
                  >
                    <MIcon name="check_circle" className="text-sm" fill style={{ color }} />
                    {f}
                  </span>
                ))}
              </div>
            </div>
            <div className="shrink-0">
              <button
                onClick={handlePracticeNow}
                className="inline-flex items-center gap-3 rounded-2xl px-8 py-4 text-base font-black text-[#1B1F3B] shadow-xl hover:brightness-105 hover:scale-105 transition-all duration-200 active:scale-95"
                style={{ background: color, boxShadow: `0 12px 32px ${color}60` }}
              >
                <MIcon name="play_circle" className="text-2xl" fill />
                {isLoggedIn ? "Start Practice" : "Login to Practice"}
              </button>
              {!isLoggedIn && <p className="text-xs text-slate-400 text-center mt-2">Free account required</p>}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
