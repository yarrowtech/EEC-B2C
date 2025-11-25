import React, { useState } from "react";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { postQuestion } from "../../lib/api";

export default function QuestionsClozeSelect() {
  const { scope } = useQuestionScope();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    text: "Water boils at [[blank1]] °C.",
    blanks: { blank1: { options: ["50","70","100"], correct:"100" } },
    explanation: "",
  });

  async function submit(e){
    e.preventDefault();
    if(!scope.subject||!scope.topic) return alert("Pick Subject & Topic first");
    setBusy(true);
    try{
      const payload = {
        subject: scope.subject, topic: scope.topic, explanation: form.explanation,
        clozeSelect: { text: form.text, blanks: form.blanks }
      };
      const out = await postQuestion("cloze-select", payload);
      alert(`Saved! id=${out.id}`);
    }catch(err){ alert(err.message); } finally{ setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <h1 className="text-xl font-semibold text-slate-800">Cloze — Drop-Down</h1>
      <SubjectTopicPicker />
      <div>
        <label className="block text-sm text-slate-600 mb-1">Text</label>
        <textarea className="w-full rounded-lg border px-3 py-2 bg-white min-h-28"
                  value={form.text} onChange={(e)=>setForm(s=>({...s, text:e.target.value}))}/>
      </div>
      <div className="rounded-lg border p-3 space-y-3 bg-white">
        <div className="font-medium text-slate-700">blank1</div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Options (comma)</label>
            <input className="w-full rounded-lg border px-3 py-2 bg-white"
                   value={(form.blanks.blank1?.options || []).join(",")}
                   onChange={(e)=>setForm(s=>({
                     ...s,
                     blanks:{...s.blanks,
                       blank1:{ ...(s.blanks.blank1||{}),
                         options:e.target.value.split(",").map(x=>x.trim()).filter(Boolean)
                       }
                     }
                   }))}/>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Correct</label>
            <input className="w-full rounded-lg border px-3 py-2 bg-white"
                   value={form.blanks.blank1?.correct || ""}
                   onChange={(e)=>setForm(s=>({
                     ...s, blanks:{...s.blanks, blank1:{ ...(s.blanks.blank1||{}), correct:e.target.value }}
                   }))}/>
          </div>
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
