import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

const BADGE_CONFIG = {
  novice:     { icon: "military_tech", color: "text-slate-500",   bg: "bg-slate-100",   label: "Novice"     },
  scout:      { icon: "military_tech", color: "text-green-600",   bg: "bg-green-100",   label: "Scout"      },
  apprentice: { icon: "workspace_premium", color: "text-blue-600",bg: "bg-blue-100",    label: "Apprentice" },
  explorer:   { icon: "explore",      color: "text-indigo-600",   bg: "bg-indigo-100",  label: "Explorer"   },
  champion:   { icon: "trophy",       color: "text-amber-500",    bg: "bg-amber-100",   label: "Champion"   },
  none:       { icon: "military_tech", color: "text-slate-500",   bg: "bg-slate-100",   label: "Novice"     },
};

function normalizeSelected(answer) {
  if (Array.isArray(answer)) return answer.map((x) => String(x));
  return [];
}

function todayLabel() {
  return new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

/* ── Decorative flame SVG ── */
function FlameGraphic() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="opacity-[0.15] absolute right-0 top-0 pointer-events-none select-none">
      <path d="M60 8C60 8 86 32 86 58C86 76 74 86 60 88C46 86 34 76 34 58C34 40 48 26 54 18C51 36 60 44 60 44C60 44 74 32 60 8Z" fill="white"/>
      <path d="M60 50C60 50 70 58 70 68C70 78 66 84 60 86C54 84 50 78 50 68C50 60 56 52 60 50C58 60 62 64 62 64C62 64 66 58 60 50Z" fill="white" opacity="0.7"/>
    </svg>
  );
}

/* ── Loading skeleton ── */
function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-5 bg-slate-100 rounded-full w-1/3" />
      <div className="h-8 bg-slate-100 rounded-xl w-full" />
      <div className="h-5 bg-slate-100 rounded-full w-2/3" />
      <div className="space-y-3 mt-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 bg-slate-100 rounded-2xl w-full" />
        ))}
      </div>
    </div>
  );
}

export default function DailyChallengeExam() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState([]);
  const [result, setResult] = useState(null);

  async function loadToday() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/daily-challenge/today`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("jwt") || ""}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Failed to load daily challenge");
      setData(json);
      if (json?.alreadyAttempted) {
        setResult({
          isCorrect: Boolean(json?.isCorrect),
          streak: Number(json?.streak || 0),
          badge: json?.badge || "none",
          pointsAwarded: Number(json?.pointsAwarded || 0),
        });
      } else {
        setResult(null);
      }
      setSelected([]);
    } catch (e) {
      setError(e.message || "Failed to load daily challenge");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadToday(); }, []);

  const question = data?.question || null;
  const isMulti = String(question?.type || "") === "mcq-multi";
  const canSubmit = useMemo(() => {
    if (!question || busy || result || data?.alreadyAttempted) return false;
    return selected.length > 0;
  }, [question, busy, result, data?.alreadyAttempted, selected.length]);

  const badge = BADGE_CONFIG[String(result?.badge || "none").toLowerCase()] || BADGE_CONFIG.none;

  function toggleOption(key) {
    const val = String(key);
    if (isMulti) {
      setSelected((prev) => prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]);
      return;
    }
    setSelected([val]);
  }

  async function submitDaily() {
    if (!question || !canSubmit) return;
    setBusy(true);
    setError("");
    try {
      const answer = normalizeSelected(selected);
      const res = await fetch(`${API}/api/daily-challenge/submit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt") || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ questionId: question._id, answer }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Failed to submit daily challenge");
      setResult({
        isCorrect: Boolean(json?.isCorrect),
        streak: Number(json?.streak || 0),
        badge: json?.badge || "none",
        pointsAwarded: Number(json?.pointsAwarded || 0),
      });
      setData((prev) => prev ? {
        ...prev,
        alreadyAttempted: true,
        isCorrect: Boolean(json?.isCorrect),
        streak: Number(json?.streak || 0),
        badge: json?.badge || "none",
      } : prev);

      if (Number(json?.pointsAwarded || 0) > 0 && Number.isFinite(Number(json?.totalPoints))) {
        try {
          const stored = JSON.parse(localStorage.getItem("user") || "{}");
          localStorage.setItem("user", JSON.stringify({ ...stored, points: Number(json.totalPoints || 0) }));
          window.dispatchEvent(new Event("storage"));
        } catch { /* ignore */ }
      }
      try {
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        const userKey = String(stored?._id || stored?.id || stored?.email || "anonymous");
        localStorage.removeItem(`eec:achievements-cache:v1:${userKey}:daily-attempts`);
      } catch { /* ignore */ }
    } catch (e) {
      setError(e.message || "Failed to submit daily challenge");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="min-h-screen p-4 md:p-6"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div className="max-w-2xl mx-auto space-y-4">

        {/* ── Hero header ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#e7c555] via-[#f0d265] to-[#fde68a] p-5 md:p-6 shadow-md">
          {/* Dot-grid texture */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.10]"
            style={{ backgroundImage: "radial-gradient(circle, #1e293b 1.3px, transparent 1.3px)", backgroundSize: "18px 18px" }}
          />
          {/* Blobs */}
          <div className="absolute -top-6 -left-6 w-28 h-28 rounded-full bg-white/20 pointer-events-none" />
          <div className="absolute -bottom-4 right-24 w-16 h-16 rounded-full bg-white/10 pointer-events-none" />
          {/* Flame graphic */}
          <FlameGraphic />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-slate-800 text-[20px]">local_fire_department</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Daily Challenge</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
                Today's Question
              </h1>
              <p className="text-sm text-slate-700 mt-1 opacity-80">{todayLabel()}</p>

              {/* Streak chip */}
              {data?.streak != null && (
                <div className="mt-3 inline-flex items-center gap-1.5 bg-white/50 border border-white/60 rounded-full px-3 py-1.5">
                  <span className="material-symbols-outlined text-orange-500 text-[16px]">local_fire_department</span>
                  <span className="text-xs font-black text-slate-800">{data.streak} day streak</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="flex-shrink-0 flex items-center gap-1.5 rounded-full bg-white/40 border border-white/60 backdrop-blur-sm px-4 py-2 text-sm font-bold text-slate-800 hover:bg-white/60 transition"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Back
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 md:p-6">
          {loading ? (
            <Skeleton />
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-400 text-3xl">error</span>
              </div>
              <p className="text-sm font-semibold text-slate-600">{error}</p>
              <button
                type="button"
                onClick={loadToday}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 transition"
              >
                <span className="material-symbols-outlined text-[15px]">refresh</span>
                Try Again
              </button>
            </div>
          ) : !question ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-slate-300 text-3xl">event_busy</span>
              </div>
              <div>
                <p className="font-bold text-slate-600">No question today</p>
                <p className="text-sm text-slate-400 mt-0.5">Check back tomorrow for a new challenge!</p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#e7c555] px-5 py-2.5 text-sm font-bold text-slate-900 hover:brightness-95 transition"
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <div className="space-y-5">

              {/* Question metadata chips */}
              <div className="flex flex-wrap gap-2">
                {[question.board, question.class, question.subject, question.topic].filter(Boolean).map((tag, i) => (
                  <span key={i} className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                    {tag}
                  </span>
                ))}
                <span className="inline-flex items-center gap-1 rounded-full bg-[#e7c555]/15 border border-[#e7c555]/30 px-3 py-1 text-xs font-bold text-[#c9a92b]">
                  <span className="material-symbols-outlined text-[12px]">{isMulti ? "check_box" : "radio_button_checked"}</span>
                  {isMulti ? "Multi-select" : "Single choice"}
                </span>
              </div>

              {/* Question text */}
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Question</p>
                <p className="text-lg md:text-xl font-black text-slate-900 leading-snug">{question.question}</p>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {(question.options || []).map((opt, idx) => {
                  const letter = OPTION_LETTERS[idx] || String(opt.key);
                  const isSelected = selected.includes(String(opt.key));
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      disabled={!!result || !!data?.alreadyAttempted}
                      onClick={() => toggleOption(opt.key)}
                      className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all duration-200 ${
                        result || data?.alreadyAttempted
                          ? "cursor-default opacity-70"
                          : "cursor-pointer hover:border-[#e7c555]/60 hover:bg-[#fffae8]"
                      } ${
                        isSelected
                          ? "border-[#e7c555] bg-[#fffae8] shadow-sm"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      {/* Letter badge */}
                      <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black transition-all ${
                        isSelected
                          ? "bg-[#e7c555] text-slate-900"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {letter}
                      </span>
                      <span className={`text-sm font-semibold leading-snug ${isSelected ? "text-slate-900" : "text-slate-700"}`}>
                        {opt.text}
                      </span>
                      {isSelected && (
                        <span className="ml-auto material-symbols-outlined text-[#c9a92b] text-[20px] flex-shrink-0">
                          {isMulti ? "check_box" : "radio_button_checked"}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                  <span className="material-symbols-outlined text-red-500 text-sm">error</span>
                  <p className="text-sm font-semibold text-red-600">{error}</p>
                </div>
              )}

              {/* Result card */}
              {result ? (
                <div className={`relative overflow-hidden rounded-2xl border p-5 ${
                  result.isCorrect
                    ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50"
                    : "border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50"
                }`}>
                  {/* Decorative circle */}
                  <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none ${result.isCorrect ? "bg-emerald-200/40" : "bg-rose-200/40"}`} />

                  <div className="relative z-10">
                    {/* Result header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm ${
                        result.isCorrect ? "bg-emerald-100 border border-emerald-200" : "bg-rose-100 border border-rose-200"
                      }`}>
                        <span className={`material-symbols-outlined text-2xl ${result.isCorrect ? "text-emerald-500" : "text-rose-500"}`}>
                          {result.isCorrect ? "check_circle" : "cancel"}
                        </span>
                      </div>
                      <div>
                        <p className={`font-black text-lg ${result.isCorrect ? "text-emerald-800" : "text-rose-800"}`}>
                          {result.isCorrect ? "Correct Answer!" : "Incorrect Answer"}
                        </p>
                        <p className={`text-sm ${result.isCorrect ? "text-emerald-600" : "text-rose-600"}`}>
                          {result.isCorrect ? "Keep the streak going!" : "Don't give up — try again tomorrow"}
                        </p>
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {/* Streak */}
                      <div className="bg-white/70 border border-white rounded-xl p-3 text-center">
                        <span className="material-symbols-outlined text-orange-500 text-2xl">local_fire_department</span>
                        <p className="text-lg font-black text-slate-900 mt-0.5">{result.streak}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Day Streak</p>
                      </div>
                      {/* Points */}
                      <div className="bg-white/70 border border-white rounded-xl p-3 text-center">
                        <span className="material-symbols-outlined text-[#c9a92b] text-2xl">stars</span>
                        <p className="text-lg font-black text-slate-900 mt-0.5">+{Number(result.pointsAwarded || 0)}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Points</p>
                      </div>
                      {/* Badge */}
                      <div className="bg-white/70 border border-white rounded-xl p-3 text-center">
                        <span className={`material-symbols-outlined text-2xl ${badge.color}`}>{badge.icon}</span>
                        <p className="text-sm font-black text-slate-900 mt-0.5 capitalize">{badge.label}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Badge</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate("/dashboard")}
                      className="w-full flex items-center justify-center gap-2 rounded-full bg-slate-900 py-3 text-sm font-bold text-white hover:bg-slate-800 active:scale-[0.98] transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">home</span>
                      Back to Dashboard
                    </button>
                  </div>
                </div>
              ) : (
                /* Submit button */
                <button
                  type="button"
                  onClick={submitDaily}
                  disabled={!canSubmit}
                  className={`w-full flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-black transition-all ${
                    canSubmit
                      ? "bg-[#e7c555] text-slate-900 hover:brightness-95 active:scale-[0.98] shadow-md shadow-[#e7c555]/30"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {busy ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                      Submitting…
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">send</span>
                      Submit Answer
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
