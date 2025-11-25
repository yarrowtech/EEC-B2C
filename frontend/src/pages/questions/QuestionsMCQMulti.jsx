import React, { useState } from "react";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { postQuestion } from "../../lib/api";

export default function QuestionsMCQMulti() {
  const { scope } = useQuestionScope();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    difficulty:"easy", question:"", options:["","","",""],
    correct: {A:false,B:false,C:false,D:false}, explanation:"", tags:""
  });

  const update = (k,v)=>setForm(s=>({...s,[k]:v}));
  const updateOpt=(i,v)=>setForm(s=>{const next=[...s.options]; next[i]=v; return {...s, options: next};});
  const toggle=(k)=>setForm(s=>({...s, correct:{...s.correct, [k]:!s.correct[k]}}));

  async function submit(e){
    e.preventDefault();
    if(!scope.subject||!scope.topic) return alert("Pick Subject & Topic first");
    setBusy(true);
    try{
      const correct = Object.entries(form.correct).filter(([,v])=>v).map(([k])=>k);
      const payload = {
        subject: scope.subject, topic: scope.topic, difficulty: form.difficulty, tags: form.tags,
        question: form.question, options: form.options, correct, explanation: form.explanation
      };
      const out = await postQuestion("mcq-multi", payload);
      alert(`Saved! id=${out.id}`);
      setForm({ difficulty:"easy", question:"", options:["","","",""], correct:{A:false,B:false,C:false,D:false}, explanation:"", tags:"" });
    }catch(err){ alert(err.message); } finally{ setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <h1 className="text-xl font-semibold text-slate-800">MCQ — Multiple Correct</h1>
      <SubjectTopicPicker />

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Difficulty</label>
          <select className="w-full rounded-lg border px-3 py-2 bg-white"
                  value={form.difficulty} onChange={(e)=>update("difficulty", e.target.value)}>
            <option value="easy">Easy</option><option value="moderate">Moderate</option><option value="hard">Hard</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Tags</label>
          <input className="w-full rounded-lg border px-3 py-2 bg-white"
                 value={form.tags} onChange={(e)=>update("tags", e.target.value)} />
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-600 mb-1">Question</label>
        <textarea className="w-full rounded-lg border px-3 py-2 bg-white min-h-24"
                  value={form.question} onChange={(e)=>update("question", e.target.value)} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {["A","B","C","D"].map((L,i)=>(
          <div key={L} className="space-y-2">
            <label className="block text-sm text-slate-600">Option {L}</label>
            <input className="w-full rounded-lg border px-3 py-2 bg-white"
                   value={form.options[i]} onChange={(e)=>updateOpt(i, e.target.value)} />
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.correct[L]} onChange={()=>toggle(L)} />
              Mark as Correct
            </label>
          </div>
        ))}
      </div>

      <div>
        <label className="block text-sm text-slate-600 mb-1">Explanation (optional)</label>
        <textarea className="w-full rounded-lg border px-3 py-2 bg-white min-h-24"
                  value={form.explanation} onChange={(e)=>update("explanation", e.target.value)} />
      </div>

      <button disabled={busy} className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 disabled:opacity-50">
        {busy ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
