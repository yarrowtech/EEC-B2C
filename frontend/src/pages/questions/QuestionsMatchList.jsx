import React, { useState } from "react";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { postQuestion } from "../../lib/api";

export default function QuestionsMatchList() {
  const { scope } = useQuestionScope();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    prompt: "Match the following:",
    left: ["Lion","Sparrow","Shark"],
    right: ["Mammal","Bird","Fish"],
    pairs: { "0":"0" }, // leftIdx → rightIdx
    explanation: "",
  });

  async function submit(e){
    e.preventDefault();
    if(!scope.subject||!scope.topic) return alert("Pick Subject & Topic first");
    setBusy(true);
    try{
      const payload = {
        subject: scope.subject, topic: scope.topic, explanation: form.explanation,
        matchList: { prompt: form.prompt, left: form.left, right: form.right, pairs: form.pairs }
      };
      const out = await postQuestion("match-list", payload);
      alert(`Saved! id=${out.id}`);
    }catch(err){ alert(err.message); } finally{ setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <h1 className="text-xl font-semibold text-slate-800">Match List</h1>
      <SubjectTopicPicker />

      <div>
        <label className="block text-sm text-slate-600 mb-1">Prompt</label>
        <textarea className="w-full rounded-lg border px-3 py-2 bg-white min-h-24"
                  value={form.prompt} onChange={(e)=>setForm(s=>({...s, prompt:e.target.value}))}/>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="text-sm font-medium text-slate-700">Left</div>
          {form.left.map((v,i)=>(
            <input key={i} className="w-full rounded-lg border px-3 py-2 bg-white"
                   value={v} onChange={(e)=>setForm(s=>{const left=[...s.left]; left[i]=e.target.value; return {...s, left};})}/>
          ))}
          <button type="button" className="rounded-lg border px-3 py-2" onClick={()=>setForm(s=>({...s, left:[...s.left, ""]}))}>+ Add Left</button>
        </div>
        <div className="space-y-2">
          <div className="text-sm font-medium text-slate-700">Right</div>
          {form.right.map((v,i)=>(
            <input key={i} className="w-full rounded-lg border px-3 py-2 bg-white"
                   value={v} onChange={(e)=>setForm(s=>{const right=[...s.right]; right[i]=e.target.value; return {...s, right};})}/>
          ))}
          <button type="button" className="rounded-lg border px-3 py-2" onClick={()=>setForm(s=>({...s, right:[...s.right, ""]}))}>+ Add Right</button>
        </div>
      </div>

      <div className="rounded-lg border p-3 bg-white space-y-2">
        <div className="text-sm font-medium text-slate-700">Correct Pairs (Left → Right index)</div>
        {form.left.map((_, li)=>(
          <div key={li} className="grid sm:grid-cols-2 gap-3">
            <div className="text-sm">Left {li}</div>
            <select className="rounded-lg border px-3 py-2 bg-white"
                    value={form.pairs[String(li)] ?? ""}
                    onChange={(e)=>setForm(s=>({...s, pairs:{...s.pairs, [String(li)]: e.target.value}}))}>
              <option value="">Select right…</option>
              {form.right.map((__, ri)=><option key={ri} value={ri}>{ri}</option>)}
            </select>
          </div>
        ))}
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
