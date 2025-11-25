import React, { useState } from "react";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { postQuestion } from "../../lib/api";

export default function QuestionsClozeText() {
  const { scope } = useQuestionScope();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    text: "The chemical formula of water is [[blank1]].",
    answers: { blank1: "H2O" },
    explanation: "",
  });

  async function submit(e){
    e.preventDefault();
    if(!scope.subject||!scope.topic) return alert("Pick Subject & Topic first");
    setBusy(true);
    try{
      const payload = {
        subject: scope.subject, topic: scope.topic, explanation: form.explanation,
        clozeText: { text: form.text, answers: form.answers }
      };
      const out = await postQuestion("cloze-text", payload);
      alert(`Saved! id=${out.id}`);
    }catch(err){ alert(err.message); } finally{ setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <h1 className="text-xl font-semibold text-slate-800">Cloze — Free Text</h1>
      <SubjectTopicPicker />
      <div>
        <label className="block text-sm text-slate-600 mb-1">Text</label>
        <textarea className="w-full rounded-lg border px-3 py-2 bg-white min-h-28"
                  value={form.text} onChange={(e)=>setForm(s=>({...s, text:e.target.value}))}/>
      </div>
      <div>
        <label className="block text-sm text-slate-600 mb-1">Answer for blank1</label>
        <input className="w-full rounded-lg border px-3 py-2 bg-white"
               value={form.answers.blank1 || ""}
               onChange={(e)=>setForm(s=>({...s, answers:{...s.answers, blank1:e.target.value}}))}/>
      </div>
      <div>
        <label className="block text-sm text-slate-600 mb-1">Explanation (optional)</label>
        <textarea className="w-full rounded-lg border px-3 py-2 bg-white min-h-24"
                  value={form.explanation} onChange={(e)=>setForm(s=>({...s, explanation:e.target.value}))}/>
      </div>
      <button disabled={busy} className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 disabled:opacity-50">
        {busy ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
