import React, { useState } from "react";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { postQuestion } from "../../lib/api";

export default function QuestionsChoiceMatrix() {
  const { scope } = useQuestionScope();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    prompt: "", rows: ["Statement 1"], cols: ["True","False"],
    correct: {} // `${ri}-${ci}`: boolean
  });

  const toggle = (ri,ci)=> setForm(s=>({ ...s, correct:{...s.correct, [`${ri}-${ci}`]: !s.correct[`${ri}-${ci}`]} }));
  const addRow = () => setForm(s=>({ ...s, rows:[...s.rows, `Statement ${s.rows.length+1}`] }));
  const addCol = () => setForm(s=>({ ...s, cols:[...s.cols, `Choice ${s.cols.length+1}`] }));

  async function submit(e){
    e.preventDefault();
    if(!scope.subject||!scope.topic) return alert("Pick Subject & Topic first");
    setBusy(true);
    try{
      const correctCells = Object.entries(form.correct).filter(([,v])=>v).map(([k])=>k);
      const payload = {
        subject: scope.subject, topic: scope.topic,
        choiceMatrix: { prompt: form.prompt, rows: form.rows, cols: form.cols, correctCells }
      };
      const out = await postQuestion("choice-matrix", payload);
      alert(`Saved! id=${out.id}`);
      setForm({ prompt:"", rows:["Statement 1"], cols:["True","False"], correct:{} });
    }catch(err){ alert(err.message); } finally{ setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <h1 className="text-xl font-semibold text-slate-800">Choice Matrix</h1>
      <SubjectTopicPicker />
      <div>
        <label className="block text-sm text-slate-600 mb-1">Prompt</label>
        <textarea className="w-full rounded-lg border px-3 py-2 bg-white min-h-24"
                  value={form.prompt} onChange={(e)=>setForm(s=>({...s, prompt:e.target.value}))}/>
      </div>

      <div className="flex gap-2">
        <button type="button" className="rounded-lg border px-3 py-2" onClick={addRow}>Add Row</button>
        <button type="button" className="rounded-lg border px-3 py-2" onClick={addCol}>Add Column</button>
      </div>

      <div className="overflow-auto">
        <table className="min-w-[600px] border rounded-lg">
          <thead>
            <tr>
              <th className="border px-3 py-2 text-left">Row \\ Col</th>
              {form.cols.map((c,i)=><th key={i} className="border px-3 py-2">{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {form.rows.map((r,ri)=>(
              <tr key={ri}>
                <td className="border px-3 py-2">
                  <input className="w-full" value={r}
                         onChange={(e)=>setForm(s=>{const rows=[...s.rows]; rows[ri]=e.target.value; return {...s, rows};})}/>
                </td>
                {form.cols.map((c,ci)=>(
                  <td key={ci} className="border px-3 py-2 text-center">
                    <input type="checkbox" checked={!!form.correct[`${ri}-${ci}`]} onChange={()=>toggle(ri,ci)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button disabled={busy} className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 disabled:opacity-50">
        {busy ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
