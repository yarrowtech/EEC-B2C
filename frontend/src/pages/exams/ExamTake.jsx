import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getJSON, submitExam } from "../../lib/api";

export default function ExamTake() {
  const { attemptId } = useParams();
  const nav = useNavigate();
  const state = useLocation().state; // {attemptId, questions,total,...} from start
  const [meta, setMeta] = useState(state || null);
  const [answers, setAnswers] = useState({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!meta) {
      // F5 case: fetch attempt meta by id (simple version: refetch questions info from start endpoint is not public)
      // For now, re-fetch via questions ids embedded isn’t available — recommend starting from /exams again if missing state
      (async ()=> {
        try {
          // Minimal fallback: tell them to re-start
          setMeta(null);
        } catch {
          setMeta(null);
        }
      })();
    }
  }, [meta]);

  if (!meta) {
    return (
      <div className="space-y-3">
        <div className="text-slate-700">Exam context missing.</div>
        <button onClick={()=>nav("/dashboard/exams")} className="rounded-lg border px-3 py-2 hover:bg-slate-50">Back to Stage 1</button>
      </div>
    );
  }

  const { questions = [], type, total } = meta;

  function setAns(qid, payload) {
    setAnswers(prev => ({ ...prev, [qid]: { ...(prev[qid]||{}), ...payload } }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      // build answers array to match backend
      const arr = questions.map(q => {
        const a = answers[q._id] || {};
        if (type === "mcq-single")  return { qid: q._id, mcq: a.mcq ? [a.mcq] : [] };
        if (type === "mcq-multi")   return { qid: q._id, mcq: Array.isArray(a.mcq) ? a.mcq : [] };
        if (type === "true-false")  return { qid: q._id, trueFalse: a.trueFalse || "" };
        return { qid: q._id }; // (not used yet)
      });

      const res = await submitExam(attemptId, arr);
      setResult(res); // {score,total,percent}
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Stage 1 — {type}</h1>
          <div className="text-xs text-slate-500">Questions: {total}</div>
        </div>
        {result && (
          <div className="rounded-lg border bg-white px-4 py-2">
            <div className="text-sm font-semibold text-slate-800">Score: {result.score} / {result.total}</div>
            <div className="text-xs text-slate-600">{result.percent}%</div>
          </div>
        )}
      </div>

      {/* RENDER QUESTIONS */}
      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div key={q._id} className="rounded-xl border bg-white p-4">
            <div className="text-sm text-slate-500 mb-1">Q{idx + 1}</div>
            <div className="font-medium text-slate-800">{q.question || "(no text)"}</div>

            {/* Per type renderers */}
            {type === "mcq-single" && (
              <div className="mt-3 grid sm:grid-cols-2 gap-2">
                {q.options.map((o) => (
                  <label key={o.key} className="flex items-center gap-2 border rounded-lg px-3 py-2 hover:bg-slate-50">
                    <input
                      type="radio" name={`q-${q._id}`}
                      checked={(answers[q._id]?.mcq || "") === o.key}
                      onChange={() => setAns(q._id, { mcq: o.key })}
                    />
                    <span className="text-sm">{o.key}) {o.text}</span>
                  </label>
                ))}
              </div>
            )}

            {type === "mcq-multi" && (
              <div className="mt-3 grid sm:grid-cols-2 gap-2">
                {q.options.map((o) => {
                  const sel = new Set(answers[q._id]?.mcq || []);
                  const checked = sel.has(o.key);
                  return (
                    <label key={o.key} className="flex items-center gap-2 border rounded-lg px-3 py-2 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const next = new Set(answers[q._id]?.mcq || []);
                          e.target.checked ? next.add(o.key) : next.delete(o.key);
                          setAns(q._id, { mcq: Array.from(next) });
                        }}
                      />
                      <span className="text-sm">{o.key}) {o.text}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {type === "true-false" && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {["true", "false"].map(v => (
                  <label key={v} className="flex items-center gap-2 border rounded-lg px-3 py-2 hover:bg-slate-50">
                    <input
                      type="radio" name={`q-${q._id}`}
                      checked={(answers[q._id]?.trueFalse || "") === v}
                      onChange={() => setAns(q._id, { trueFalse: v })}
                    />
                    <span className="text-sm capitalize">{v}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button disabled={busy || !!result}
          className="rounded-lg bg-emerald-600 text-white px-4 py-2 hover:bg-emerald-700 disabled:opacity-50">
          {busy ? "Submitting..." : "Submit Exam"}
        </button>
        {result && (
          <button type="button" onClick={()=>window.location.assign("/dashboard/exams")}
                  className="rounded-lg border px-4 py-2 hover:bg-slate-50">
            Back to Stage 1
          </button>
        )}
      </div>
    </form>
  );
}
