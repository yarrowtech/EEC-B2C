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
.topic-content { color:#475569; font-size:14px; line-height:1.65; overflow-wrap:anywhere; }
.topic-content * { font-family:inherit !important; max-width:100%; }
.topic-content span, .topic-content font { font-size:inherit !important; background:transparent !important; }
.topic-content > * + * { margin-top:1em; }
.topic-content h1, .topic-content h2, .topic-content h3, .topic-content h4 {
  color:#0f172a; font-weight:800; line-height:1.3; margin-top:1.6em; margin-bottom:.5em; }
.topic-content h1 { font-size:1.35rem; } .topic-content h2 { font-size:1.2rem; }
.topic-content h3 { font-size:1.05rem; } .topic-content h4 { font-size:.95rem; }
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

function QuickQuiz({ questions, color, onPracticeFull, onLogin, isLoggedIn, storageKey }) {
  const savedQuiz = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem(storageKey) || "null") || {};
    } catch {
      return {};
    }
  }, [storageKey]);
  const [started, setStarted] = useState(Boolean(savedQuiz.started));
  const [answers, setAnswers] = useState(savedQuiz.answers || {});
  const [seconds, setSeconds] = useState(Number(savedQuiz.seconds) || 0);
  const answeredCount = Object.keys(answers).length;
  const done = answeredCount === questions.length;
  const score = questions.reduce((s, q, i) => s + (answers[i] === q.answer ? 1 : 0), 0);

  useEffect(() => {
    if (!started || done) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [started, done]);

  useEffect(() => {
    if (!started) return;
    sessionStorage.setItem(storageKey, JSON.stringify({ started, answers, seconds }));
  }, [started, answers, seconds, storageKey]);

  function reset() {
    setAnswers({});
    setSeconds(0);
    setStarted(true);
    sessionStorage.removeItem(storageKey);
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-amber-50/30 px-5 py-3.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FF9800] text-white shadow-sm">
          <MIcon name="quiz" className="text-base" fill />
        </div>
        <div>
          <h2 className="text-base font-bold leading-snug text-slate-900 sm:text-lg" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
            Quick Quiz
          </h2>
          <p className="text-xs text-slate-500">{questions.length} easy questions to warm up</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-xs font-semibold text-slate-500 sm:inline-block">
            {answeredCount}/{questions.length} answered
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums shadow-inner ${
              done ? "bg-emerald-100 text-emerald-700" : "bg-slate-900 text-white"
            }`}
          >
            <MIcon name="timer" className="text-sm text-amber-400" fill />
            {formatClock(seconds)}
          </span>
        </div>
      </div>

      {!started ? (
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <div
            className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ecd7fc] text-purple-700 shadow-sm"
          >
            <MIcon name="bolt" className="text-2xl" fill />
          </div>
          <h3 className="mb-1.5 text-lg font-bold tracking-tight text-slate-900 sm:text-xl" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
            Test yourself in under 2 minutes
          </h3>
          <p className="mb-4 max-w-md text-xs leading-normal text-slate-500 sm:text-sm">
            {questions.length} quick multiple-choice questions. The timer starts when you press Start.
          </p>
          <div className="mb-5 flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-slate-600">
            {[`${questions.length} questions`, "Easy level", isLoggedIn ? "Instant feedback" : "See result after login"].map((f) => (
              <span key={f} className="rounded-full border border-purple-200/60 bg-purple-50 px-2.5 py-0.5 text-purple-800">{f}</span>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[#2B60FF] px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition hover:-translate-y-0.5 hover:bg-[#2454E6] active:translate-y-0"
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

      <div className="space-y-5 p-5">
        {questions.map((q, qi) => {
          const picked = answers[qi];
          const isAnswered = picked !== undefined;
          return (
            <div key={qi}>
              <p className="mb-3 text-sm font-semibold text-slate-800">
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
                  if (isLoggedIn && isAnswered && isCorrect) cls = "border-emerald-400 bg-emerald-50 text-emerald-800";
                  else if (isLoggedIn && isAnswered && isPicked) cls = "border-rose-400 bg-rose-50 text-rose-800";
                  else if (isAnswered) cls = "border-[#4ECDC4] bg-[#4ECDC4]/10 text-slate-700";
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
                      {isLoggedIn && isAnswered && isCorrect && <MIcon name="check_circle" className="text-lg text-emerald-500" fill />}
                      {isLoggedIn && isAnswered && isPicked && !isCorrect && <MIcon name="cancel" className="text-lg text-rose-500" fill />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {done && (
        <div className="border-t border-purple-200 bg-[#ecd7fc] px-5 py-5 text-slate-900">
          {isLoggedIn ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xl font-bold" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
                  {score === questions.length ? "Perfect score! 🎉" : score >= questions.length / 2 ? "Nice work!" : "Good try!"}
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {[["Score", `${score}/${questions.length}`], ["Accuracy", `${Math.round((score / questions.length) * 100)}%`], ["Time taken", formatClock(seconds)]].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-purple-200 bg-white/60 px-4 py-2"><p className="text-[11px] font-bold uppercase tracking-wider text-purple-900/60">{label}</p><p className="text-lg font-black tabular-nums text-slate-900">{value}</p></div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={reset} className="rounded-full border border-purple-300 px-4 py-2.5 text-sm font-bold text-purple-950 hover:bg-white/50">Retry</button>
                <button type="button" onClick={onPracticeFull} className="inline-flex items-center gap-2 rounded-full bg-[#2B60FF] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition hover:-translate-y-0.5 hover:bg-[#2454E6]" ><MIcon name="play_circle" className="text-lg" fill />Practice Full</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-xl font-bold" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>Your answers are ready.</p><p className="mt-1 max-w-lg text-sm leading-relaxed text-purple-950/70">Log in to see your result and continue with full practice. Your answers will stay here.</p></div>
              <button type="button" onClick={onLogin} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2B60FF] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition hover:-translate-y-0.5 hover:bg-[#2454E6]"><MIcon name="lock_open" className="text-lg" fill />Log in to see result</button>
            </div>
          )}
        </div>
      )}
      </>
      )}
      </article>
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

  function handleQuizLogin() {
    sessionStorage.setItem("redirectAfterLogin", `${location.pathname}${location.search}`);
    window.dispatchEvent(new Event("eec:open-login"));
  }

  /* ── Derived visuals ── */
  const icon  = subjectIcon(subject?.name);
  const color = subjectColor(subject?.name);

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
        <button onClick={() => navigate("/learn")} className="rounded-full bg-slate-900 text-white font-bold px-6 py-2.5 text-sm hover:bg-slate-700 transition">
          ← Back to Learn
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{CONTENT_CSS}</style>

      <section className="relative overflow-hidden border-b border-purple-200/60 bg-gradient-to-r from-[#ecd7fc] via-[#f3e8ff] to-[#e9d5ff] text-slate-800">
        <div className="pointer-events-none absolute inset-0 opacity-60" style={{ backgroundImage: "radial-gradient(rgba(124, 58, 237, 0.12) 1.5px, transparent 1.5px)", backgroundSize: "28px 28px" }} />
        <div className="relative mx-auto max-w-5xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex flex-col items-center justify-center space-y-4 text-center">
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-purple-900">
              <button type="button" onClick={() => navigate("/learn")} className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-white/80 px-3 py-1 text-xs font-medium text-purple-900 shadow-sm backdrop-blur-sm transition hover:bg-white">
                <MIcon name="arrow_back" className="text-sm" /> Learn
              </button>
              <MIcon name="chevron_right" className="text-sm text-purple-400" />
              <span className="text-purple-700">{subject?.name}</span>
              <MIcon name="chevron_right" className="text-sm text-purple-400" />
              <span className="max-w-[220px] truncate font-semibold text-purple-950">{topic?.name}</span>
            </div>

            <div className="flex flex-col items-center justify-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>{topic?.name}</h1>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-100/90 px-2.5 py-0.5 text-xs font-semibold text-purple-800"><MIcon name={icon} className="text-sm" fill />{subject?.name}</span>
                {boardLabel && <span className="inline-flex items-center rounded-full border border-purple-200 bg-white/80 px-2.5 py-0.5 text-xs font-semibold text-slate-700">{boardLabel}{classLabel ? ` • ${classLabel}` : ""}</span>}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-purple-800">
              <span className="inline-flex items-center gap-1.5"><MIcon name="schedule" className="text-sm text-purple-600" />{readingTime} min read</span>
              <span className="inline-flex items-center gap-1.5"><MIcon name="description" className="text-sm text-purple-600" />Summary &amp; Outcomes</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CONTENT ══ */}
      <main className="relative z-20 mx-auto flex w-full max-w-5xl flex-1 flex-col space-y-4 px-4 pb-12 -mt-7 sm:px-6 lg:px-8">

        {/* ── Topic Summary card ── */}
        <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200">
          {/* Card header */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-amber-50/30 px-5 py-3.5">
            <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ecd7fc] text-purple-700 shadow-sm"
            >
              <MIcon name="menu_book" className="text-base" fill />
            </div>
            <div>
              <h2 className="text-base font-bold leading-snug text-slate-900 sm:text-lg" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
                Topic Summary
              </h2>
              <p className="text-xs text-slate-500">Overview of key concepts</p>
            </div>
            </div>
            <div className="shrink-0 rounded-full border border-purple-200 bg-[#ecd7fc]/70 px-2.5 py-0.5 text-xs font-medium text-purple-900">
              {readingTime} min read
            </div>
          </div>

          {/* Prose content */}
          <div className="space-y-3.5 p-5">
            <div
              className="topic-content"
              style={{ "--accent": "#7c3aed" }}
              dangerouslySetInnerHTML={{
                __html: getHtmlOrFallback(topic?.topicSummary, "No summary available for this topic yet."),
              }}
            />
          </div>
        </article>

        {/* ── Learning Outcomes card ── */}
        <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-emerald-50/30 px-5 py-3.5">
            <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-sm">
              <MIcon name="check_circle" className="text-base" fill />
            </div>
            <div>
              <h2 className="text-base font-bold leading-snug text-slate-900 sm:text-lg" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
                Learning Outcomes
              </h2>
              <p className="text-xs text-slate-500">What you will be able to do</p>
            </div>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">Target Skills</span>
          </div>

          <div className="p-5">
            <div
              className="topic-content"
              style={{ "--accent": "#10b981" }}
              dangerouslySetInnerHTML={{
                __html: getHtmlOrFallback(topic?.learningOutcome, "Learning outcomes are not available yet."),
              }}
            />
          </div>
        </article>

        {/* ── Quick Quiz ── */}
        <QuickQuiz
          questions={quizQuestions}
          color={color}
          isLoggedIn={isLoggedIn}
          onPracticeFull={handlePracticeNow}
          onLogin={handleQuizLogin}
          storageKey={`eec:quick-quiz:${subjectId}:${topicId}`}
        />

        {/* ── Practice CTA ── */}
        <section className="relative overflow-hidden rounded-2xl border border-purple-200 bg-[#ecd7fc] p-5 text-slate-900 shadow-md sm:p-6">
          <div className="relative z-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3.5 sm:items-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/30">
                <MIcon name={icon} className="text-xl" fill />
              </div>
              <div>
                <div className="mb-0.5 flex items-center gap-2">
                  <h3 className="text-base font-bold tracking-tight sm:text-lg" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>Ready to Practice?</h3>
                  <span className="hidden rounded-full border border-purple-200 bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-purple-900 md:inline-flex">Stage 1 — Basic</span>
                  <span className="hidden rounded-full border border-purple-200 bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-purple-900 md:inline-flex">10 Questions</span>
                </div>
                <p className="max-w-xl text-xs leading-snug text-slate-700">Test your understanding of <strong className="font-bold text-slate-900">{topic?.name}</strong> with stage-wise questions and instant feedback.</p>
              </div>
            </div>
            <div className="flex w-full shrink-0 flex-row items-center justify-between gap-2 border-t border-purple-300/40 pt-3 sm:w-auto sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
              <button type="button" onClick={handlePracticeNow} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2B60FF] px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/25 transition hover:-translate-y-0.5 hover:bg-[#2454E6] sm:text-sm"><MIcon name="play_circle" className="text-base" fill />{isLoggedIn ? "Start Practice" : "Login to Practice"}</button>
              {!isLoggedIn && <span className="text-[11px] font-medium text-purple-900">Free account required</span>}
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
