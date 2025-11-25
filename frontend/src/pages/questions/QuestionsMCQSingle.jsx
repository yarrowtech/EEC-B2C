import React, { useState } from "react";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
import { useQuestionScope } from "../../context/QuestionScopeContext";

export default function QuestionsMCQSingle() {
  const { scope } = useQuestionScope();
  const [form, setForm] = useState({
    difficulty: "easy",
    question: "",
    options: ["", "", "", ""],
    correct: "A",
    explanation: "",
    tags: "",
  });
  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  const updateOpt = (i, v) =>
    setForm((s) => { const next=[...s.options]; next[i]=v; return { ...s, options: next }; });
  const submit = (e) => { e.preventDefault(); console.log({ scope, type:"mcq-single", ...form }); alert("Saved locally (static)"); };

  return (
    <form onSubmit={submit} className="space-y-5">
      <h1 className="text-xl font-semibold text-slate-800">MCQ — Single Correct</h1>
      <SubjectTopicPicker />

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Difficulty</label>
          <select className="w-full rounded-lg border px-3 py-2 bg-white" value={form.difficulty}
                  onChange={(e)=>update("difficulty", e.target.value)}>
            <option value="easy">Easy</option><option value="moderate">Moderate</option><option value="hard">Hard</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Tags (comma separated)</label>
          <input className="w-full rounded-lg border px-3 py-2 bg-white" value={form.tags}
                 onChange={(e)=>update("tags", e.target.value)} placeholder="e.g. arithmetic, fractions" />
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-600 mb-1">Question</label>
        <textarea className="w-full rounded-lg border px-3 py-2 bg-white min-h-24"
                  value={form.question} onChange={(e)=>update("question", e.target.value)} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {["A","B","C","D"].map((L,i)=>(
          <div key={L}>
            <label className="block text-sm text-slate-600 mb-1">Option {L}</label>
            <input className="w-full rounded-lg border px-3 py-2 bg-white"
                   value={form.options[i]} onChange={(e)=>updateOpt(i, e.target.value)} />
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Correct Option</label>
          <select className="w-full rounded-lg border px-3 py-2 bg-white" value={form.correct}
                  onChange={(e)=>update("correct", e.target.value)}>
            {["A","B","C","D"].map(x=> <option key={x} value={x}>{x}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Explanation (optional)</label>
          <textarea className="w-full rounded-lg border px-3 py-2 bg-white min-h-24"
                    value={form.explanation} onChange={(e)=>update("explanation", e.target.value)} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700">Save (Static)</button>
        <button type="button" className="rounded-lg border px-4 py-2 hover:bg-slate-50"
                onClick={()=>setForm({ difficulty:"easy", question:"", options:["","","",""], correct:"A", explanation:"", tags:"" })}>
          Reset
        </button>
      </div>
    </form>
  );
}
