import React, { useState } from "react";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { startExam } from "../../lib/api";
import { useNavigate } from "react-router-dom";

const TYPES = [
  { value: "mcq-single", label: "MCQ — Single Correct" },
  { value: "mcq-multi",  label: "MCQ — Multiple Correct" },
  { value: "true-false", label: "True / False" },
  // extend later for other types
];

export default function ExamsIndex() {
  const { scope } = useQuestionScope();
  const [type, setType] = useState("mcq-single");
  const [limit, setLimit] = useState(10);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function onStart(e) {
    e.preventDefault();
    if (!scope.subject || !scope.topic) return alert("Pick Subject & Topic first");
    setBusy(true);
    try {
      const data = await startExam({
        stage: "stage-1",
        subject: scope.subject,
        topic: scope.topic,
        type,
        limit,
      });
      navigate(`/dashboard/exams/take/${data.attemptId}`, { state: data }); // pass questions via state for fast load
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">Stage 1 — Start Exam</h1>
      <p className="text-slate-600 text-sm">Pick your Subject, Topic and the question type.</p>

      {/* <SubjectTopicPicker /> */}

      {/* <form onSubmit={onStart} className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Type</label>
          <select className="w-full rounded-lg border px-3 py-2 bg-white" value={type} onChange={e=>setType(e.target.value)}>
            {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Number of Questions</label>
          <input type="number" min={1} max={50}
                 className="w-full rounded-lg border px-3 py-2 bg-white"
                 value={limit} onChange={e=>setLimit(Number(e.target.value || 10))}/>
        </div>
        <div className="flex items-end">
          <button disabled={busy}
            className="rounded-lg bg-emerald-600 text-white px-4 py-2 hover:bg-emerald-700 disabled:opacity-50">
            {busy ? "Starting..." : "Start Exam"}
          </button>
        </div>
      </form> */}
    <div className="flex flex-wrap justify-center items-center h-[60vh]">
      <p className="text-3xl text-center font-bold animate-bounce">Sorry we are currently not available at your location</p>
    </div>
    </div>
  );
}
