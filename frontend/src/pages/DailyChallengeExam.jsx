import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function normalizeSelected(answer) {
  if (Array.isArray(answer)) return answer.map((x) => String(x));
  return [];
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

  useEffect(() => {
    loadToday();
  }, []);

  const question = data?.question || null;
  const isMulti = String(question?.type || "") === "mcq-multi";
  const canSubmit = useMemo(() => {
    if (!question || busy || result || data?.alreadyAttempted) return false;
    return selected.length > 0;
  }, [question, busy, result, data?.alreadyAttempted, selected.length]);
  const badgeLabel = (result?.badge || "none") === "none" ? "Novice" : String(result?.badge || "Novice");

  function toggleOption(key) {
    const val = String(key);
    if (isMulti) {
      setSelected((prev) => (prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]));
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
        body: JSON.stringify({
          questionId: question._id,
          answer,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Failed to submit daily challenge");
      setResult({
        isCorrect: Boolean(json?.isCorrect),
        streak: Number(json?.streak || 0),
        badge: json?.badge || "none",
        pointsAwarded: Number(json?.pointsAwarded || 0),
      });
      setData((prev) => (prev ? { ...prev, alreadyAttempted: true, isCorrect: Boolean(json?.isCorrect), streak: Number(json?.streak || 0), badge: json?.badge || "none" } : prev));

      if (Number(json?.pointsAwarded || 0) > 0 && Number.isFinite(Number(json?.totalPoints))) {
        try {
          const stored = JSON.parse(localStorage.getItem("user") || "{}");
          const updated = { ...stored, points: Number(json.totalPoints || 0) };
          localStorage.setItem("user", JSON.stringify(updated));
          window.dispatchEvent(new Event("storage"));
        } catch {
          // ignore local storage sync issues
        }
      }
    } catch (e) {
      setError(e.message || "Failed to submit daily challenge");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-3xl mx-auto rounded-2xl border border-slate-200 bg-white shadow-sm p-5 md:p-7 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900">Daily Challenge</h1>
            <p className="text-sm text-slate-500 mt-1">One question daily based on your class and board</p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="px-3 py-2 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            Back
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-slate-600">Loading daily challenge...</div>
        ) : error ? (
          <div className="text-sm text-rose-600">{error}</div>
        ) : !question ? (
          <div className="text-sm text-slate-600">No question available for today.</div>
        ) : (
          <>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs text-slate-500 mb-2">
                {question.board} • {question.class} • {question.subject} • {question.topic}
              </div>
              <h2 className="text-lg font-bold text-slate-900">{question.question}</h2>
              <p className="text-xs text-slate-500 mt-1">Type: {question.type}</p>
            </div>

            <div className="space-y-2">
              {(question.options || []).map((opt) => {
                const selectedNow = selected.includes(String(opt.key));
                return (
                  <label
                    key={opt.key}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors ${
                      selectedNow ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type={isMulti ? "checkbox" : "radio"}
                      name="daily-option"
                      checked={selectedNow}
                      onChange={() => toggleOption(opt.key)}
                    />
                    <span className="font-semibold text-slate-700">{opt.key}.</span>
                    <span className="text-slate-800">{opt.text}</span>
                  </label>
                );
              })}
            </div>

            {result ? (
              <div className={`rounded-xl border p-4 ${result.isCorrect ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
                <p className={`font-bold ${result.isCorrect ? "text-emerald-700" : "text-rose-700"}`}>
                  {result.isCorrect ? "Correct answer! Streak updated." : "Incorrect answer. Streak reset for today."}
                </p>
                <p className="text-sm text-slate-700 mt-1">
                  Current streak: <span className="font-bold">{result.streak}</span> day(s)
                </p>
                <p className="text-sm text-slate-700">
                  Badge: <span className="font-bold capitalize">{badgeLabel}</span>
                </p>
                <p className="text-sm text-slate-700">
                  Daily reward: <span className="font-bold">+{Number(result.pointsAwarded || 0)} pts</span>
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={submitDaily}
                disabled={!canSubmit}
                className={`w-full py-3 rounded-xl text-sm font-bold ${
                  canSubmit
                    ? "bg-amber-400 text-slate-900 hover:bg-amber-500"
                    : "bg-slate-200 text-slate-500 cursor-not-allowed"
                }`}
              >
                {busy ? "Submitting..." : "Submit Daily Answer"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
