import React, { useState } from "react";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { postQuestion } from "../../lib/api";

export default function QuestionsClozeDrag() {
  const { scope } = useQuestionScope();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    text: "The capital of India is [[blank1]]. The currency is [[blank2]].",
    tokens: ["Rupee","New Delhi","Mumbai"],
    correctMap: { "blank1":"New Delhi", "blank2":"Rupee" },
    explanation: "",
  });

  async function submit(e){
    e.preventDefault();
    if(!scope.subject||!scope.topic) return alert("Pick Subject & Topic first");
    setBusy(true);
    try{
      const payload = {
        subject: scope.subject, topic: scope.topic, explanation: form.explanation,
        clozeDrag: { text: form.text, tokens: form.tokens, correctMap: form.correctMap }
      };
      const out = await postQuestion("cloze-drag", payload);
      alert(`Saved! id=${out.id}`);
    }catch(err){ alert(err.message); } finally{ setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <h1 className="text-xl font-semibold text-slate-800">Cloze — Drag & Drop</h1>
      <SubjectTopicPicker />
      <div>
        <label className="block text-sm text-slate-600 mb-1">Text (use [[blank1]] ...)</label>
        <textarea className="w-full rounded-lg border px-3 py-2 bg-white min-h-28"
                  value={form.text} onChange={(e)=>setForm(s=>({...s, text:e.target.value}))}/>
      </div>
      <div>
        <label className="block text-sm text-slate-600 mb-1">Tokens</label>
        <div className="flex flex-wrap gap-2">
          {form.tokens.map((t,i)=>(
            <input key={i} className="rounded-lg border px-3 py-2 bg-white"
                   value={t}
                   onChange={(e)=>setForm(s=>{ const tokens=[...s.tokens]; tokens[i]=e.target.value; return {...s, tokens}; })}/>
          ))}
          <button type="button" className="rounded-lg border px-3 py-2"
                  onClick={()=>setForm(s=>({...s, tokens:[...s.tokens, ""]}))}>+ Add Token</button>
        </div>
      </div>
      <div>
        <label className="block text-sm text-slate-600 mb-1">Correct Mapping</label>
        <div className="space-y-2">
          {["blank1","blank2","blank3"].map((b)=>(
            <div key={b} className="grid sm:grid-cols-2 gap-3">
              <div className="text-sm text-slate-700">{b}</div>
              <select className="rounded-lg border px-3 py-2 bg-white"
                      value={form.correctMap[b] || ""}
                      onChange={(e)=>setForm(s=>({...s, correctMap:{...s.correctMap,[b]:e.target.value}}))}>
                <option value="">Select token…</option>
                {form.tokens.map((t,i)=><option key={i} value={t}>{t}</option>)}
              </select>
            </div>
          ))}
        </div>
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
