import React, { useState } from "react";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { postQuestion } from "../../lib/api";

export default function QuestionsTrueFalse() {
  const { scope } = useQuestionScope();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ statement:"", answer:"true", explanation:"" });

  async function submit(e){
    e.preventDefault();
    if(!scope.subject||!scope.topic) return alert("Pick Subject & Topic first");
    setBusy(true);
    try{
      const payload = {
        subject: scope.subject, topic: scope.topic,
        question: form.statement, answer: form.answer,
        explanation: form.explanation
      };
      const out = await postQuestion("true-false", payload);
      alert(`Saved! id=${out.id}`);
      setForm({ statement:"", answer:"true", explanation:"" });
    }catch(err){ alert(err.message); } finally{ setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <h1 className="text-xl font-semibold text-slate-800">True / False</h1>
      <SubjectTopicPicker />
      <div>
        <label className="block text-sm text-slate-600 mb-1">Statement</label>
        <textarea className="w-full rounded-lg border px-3 py-2 bg-white min-h-24"
                  value={form.statement} onChange={(e)=>setForm(s=>({...s, statement:e.target.value}))}/>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Correct Answer</label>
          <select className="w-full rounded-lg border px-3 py-2 bg-white"
                  value={form.answer} onChange={(e)=>setForm(s=>({...s, answer:e.target.value}))}>
            <option value="true">True</option><option value="false">False</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Explanation (optional)</label>
          <textarea className="w-full rounded-lg border px-3 py-2 bg-white min-h-24"
                    value={form.explanation} onChange={(e)=>setForm(s=>({...s, explanation:e.target.value}))}/>
        </div>
      </div>
      <button disabled={busy} className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 disabled:opacity-50">
        {busy ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
