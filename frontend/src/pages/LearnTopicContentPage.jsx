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
              className="prose prose-slate prose-sm md:prose-base max-w-none
                prose-headings:font-black prose-headings:text-slate-900
                prose-p:text-slate-600 prose-p:leading-relaxed
                prose-strong:text-slate-800 prose-strong:font-bold
                prose-ul:text-slate-600 prose-ol:text-slate-600
                prose-li:leading-relaxed
                prose-a:text-[--c] prose-a:no-underline hover:prose-a:underline"
              style={{ "--c": color }}
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
              className="prose prose-slate prose-sm md:prose-base max-w-none
                prose-headings:font-black prose-headings:text-slate-900
                prose-p:text-slate-600 prose-p:leading-relaxed
                prose-strong:text-slate-800
                prose-ul:text-slate-600 prose-ol:text-slate-600
                prose-li:leading-relaxed prose-li:marker:text-emerald-500"
              dangerouslySetInnerHTML={{
                __html: getHtmlOrFallback(topic?.learningOutcome, "Learning outcomes are not available yet."),
              }}
            />
          </div>
        </div>

        {/* ── Practice CTA ── */}
        <div
          className="relative overflow-hidden rounded-2xl p-7 md:p-10 text-white"
          style={{ background: `linear-gradient(135deg, #1B1F3B, #2d3561)` }}
        >
          {/* Dot grid */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "22px 22px" }} />

          {/* Big ghost icon */}
          <MIcon
            name={icon}
            className="absolute -bottom-6 -right-6 text-white/8 pointer-events-none"
            style={{ fontSize: "180px" }}
            fill
          />

          <div className="relative flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              {/* Subject icon bubble */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg mb-4"
                style={{ background: color, boxShadow: `0 8px 24px ${color}50` }}
              >
                <MIcon name={icon} className="text-3xl" fill />
              </div>

              <h3
                className="text-2xl md:text-3xl font-black text-white mb-2"
                style={{ fontFamily: "'Balsamiq Sans', cursive" }}
              >
                Ready to Practice?
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed max-w-md">
                Test your understanding of <strong className="text-white">{topic?.name}</strong> with stage-wise questions. Start from Basic and work your way up.
              </p>

              {/* Feature chips */}
              <div className="flex flex-wrap gap-2 mt-4">
                {["Stage 1 — Basic", "10 Questions", "Instant Feedback"].map((f) => (
                  <span key={f} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-bold text-white/80">
                    <MIcon name="check_circle" className="text-sm" fill style={{ color }} />
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA button */}
            <div className="shrink-0">
              <button
                onClick={handlePracticeNow}
                className="inline-flex items-center gap-3 rounded-2xl px-8 py-4 text-base font-black text-[#1B1F3B] shadow-xl hover:brightness-105 hover:scale-105 transition-all duration-200 active:scale-95"
                style={{ background: color, boxShadow: `0 12px 32px ${color}60` }}
              >
                <MIcon name="play_circle" className="text-2xl" fill />
                {isLoggedIn ? "Start Practice" : "Login to Practice"}
              </button>
              {!isLoggedIn && (
                <p className="text-xs text-slate-400 text-center mt-2">Free account required</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
