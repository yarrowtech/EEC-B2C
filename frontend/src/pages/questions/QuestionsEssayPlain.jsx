import React, { useState } from "react";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { postQuestion } from "../../lib/api";

export default function QuestionsEssayPlain() {
  const { scope } = useQuestionScope();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ prompt:"Explain Newton's First Law.", plainText:"" });

  async function submit(e){
    e.preventDefault();
    if(!scope.subject||!scope.topic) return alert("Pick Subject & Topic first");
    setBusy(true);
    try{
      const payload = { subject: scope.subject, topic: scope.topic, prompt: form.prompt, plainText: form.plainText };
      const out = await postQuestion("essay-plain", payload);
      alert(`Saved! id=${out.id}`);
      setForm({ prompt:"", plainText:"" });
    }catch(err){ alert(err.message); } finally{ setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <h1 className="text-xl font-semibold text-slate-800">Essay — Plain Text</h1>
      <SubjectTopicPicker />
      <div>
        <label className="block text-sm text-slate-600 mb-1">Prompt</label>
        <input className="w-full rounded-lg border px-3 py-2 bg-white"
               value={form.prompt} onChange={(e)=>setForm(s=>({...s, prompt:e.target.value}))}/>
      </div>
      <div>
        <label className="block text-sm text-slate-600 mb-1">Answer</label>
        <textarea className="w-full rounded-lg border px-3 py-2 bg-white min-h-40"
                  value={form.plainText} onChange={(e)=>setForm(s=>({...s, plainText:e.target.value}))}/>
      </div>
      <button disabled={busy} className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 disabled:opacity-50">
        {busy ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
