import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { getJSON, updateQuestion } from "../../lib/api";

export default function QuestionsEdit() {
  const { id } = useParams();
  const { scope, setSubject, setTopic } = useQuestionScope();
  const [doc, setDoc] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const d = await getJSON(`/api/questions/${id}`);
        setDoc(d);
        // prime subject/topic picker from doc
        setSubject(d.subject || "");
        setTopic(d.topic || "");
      } catch (e) {
        setErr(e.message || "Failed to load");
      }
    })();
  }, [id, setSubject, setTopic]);

  if (err) return <div className="text-red-600">{err}</div>;
  if (!doc) return <div>Loading…</div>;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-slate-800">Edit Question</h1>
      <div className="text-sm text-slate-600">Type: <b>{doc.type}</b></div>
      <SubjectTopicPicker />

      {doc.type === "mcq-single" && <EditMCQSingle doc={doc} scope={scope} setBusy={setBusy} />}
      {doc.type === "mcq-multi"  && <EditMCQMulti  doc={doc} scope={scope} setBusy={setBusy} />}
      {doc.type === "true-false" && <EditTrueFalse doc={doc} scope={scope} setBusy={setBusy} />}

      {doc.type === "choice-matrix" && <EditChoiceMatrix doc={doc} scope={scope} setBusy={setBusy} />}
      {doc.type === "cloze-drag"     && <EditClozeDrag     doc={doc} scope={scope} setBusy={setBusy} />}
      {doc.type === "cloze-select"   && <EditClozeSelect   doc={doc} scope={scope} setBusy={setBusy} />}
      {doc.type === "cloze-text"     && <EditClozeText     doc={doc} scope={scope} setBusy={setBusy} />}
      {doc.type === "match-list"     && <EditMatchList     doc={doc} scope={scope} setBusy={setBusy} />}
      {doc.type === "essay-rich"     && <EditEssayRich     doc={doc} scope={scope} setBusy={setBusy} />}
      {doc.type === "essay-plain"    && <EditEssayPlain    doc={doc} scope={scope} setBusy={setBusy} />}
    </div>
  );
}

/* ---------- MCQ Single ---------- */
function EditMCQSingle({ doc, scope, setBusy }) {
  const [form, setForm] = useState({
    question: doc.question || "",
    options: (doc.options || []).map(o => o.text).slice(0,4).concat(Array(4).fill("")).slice(0,4),
    correct: (doc.correct?.[0] || "A"),
    difficulty: doc.difficulty || "easy",
    tags: (doc.tags || []).join(","),
    explanation: doc.explanation || "",
  });
  const update = (k,v)=>setForm(s=>({...s,[k]:v}));
  const updateOpt=(i,v)=>setForm(s=>{const n=[...s.options]; n[i]=v; return {...s, options:n};});

  async function save(e){
    e.preventDefault(); setBusy(true);
    try{
      await updateQuestion(doc._id, {
        type: "mcq-single",
        subject: scope.subject, topic: scope.topic,
        question: form.question, options: form.options, correct: form.correct,
        difficulty: form.difficulty, tags: form.tags, explanation: form.explanation,
      });
      alert("Updated!");
    }catch(err){ alert(err.message); } finally{ setBusy(false); }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Difficulty</label>
          <select className="w-full rounded-lg border px-3 py-2 bg-white" value={form.difficulty} onChange={e=>update("difficulty", e.target.value)}>
            <option value="easy">Easy</option><option value="moderate">Moderate</option><option value="hard">Hard</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Tags</label>
          <input className="w-full rounded-lg border px-3 py-2 bg-white" value={form.tags} onChange={e=>update("tags", e.target.value)} />
        </div>
      </div>
      <div>
        <label className="block text-sm text-slate-600 mb-1">Question</label>
        <textarea className="w-full rounded-lg border px-3 py-2 bg-white min-h-24" value={form.question} onChange={e=>update("question", e.target.value)} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {["A","B","C","D"].map((L,i)=>(
          <div key={L}>
            <label className="block text-sm text-slate-600 mb-1">Option {L}</label>
            <input className="w-full rounded-lg border px-3 py-2 bg-white" value={form.options[i]} onChange={e=>updateOpt(i, e.target.value)} />
          </div>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Correct</label>
          <select className="w-full rounded-lg border px-3 py-2 bg-white" value={form.correct} onChange={e=>update("correct", e.target.value)}>
            {["A","B","C","D"].map(x=><option key={x} value={x}>{x}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Explanation</label>
          <textarea className="w-full rounded-lg border px-3 py-2 bg-white min-h-24" value={form.explanation} onChange={e=>update("explanation", e.target.value)} />
        </div>
      </div>
      <button className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700">Save</button>
    </form>
  );
}

/* ---------- MCQ Multi ---------- */
function EditMCQMulti({ doc, scope, setBusy }) {
  const startOptions = (doc.options || []).map(o=>o.text).slice(0,4).concat(Array(4).fill("")).slice(0,4);
  const startCorrect = ["A","B","C","D"].reduce((acc,k,i)=>({ ...acc, [k]: (doc.correct || []).includes(k) }),{A:false,B:false,C:false,D:false});
  const [form, setForm] = useState({
    question: doc.question || "",
    options: startOptions,
    correct: startCorrect,
    difficulty: doc.difficulty || "easy",
    tags: (doc.tags || []).join(","),
    explanation: doc.explanation || "",
  });
  const update = (k,v)=>setForm(s=>({...s,[k]:v}));
  const updateOpt=(i,v)=>setForm(s=>{const n=[...s.options]; n[i]=v; return {...s, options:n};});
  const toggle=(k)=>setForm(s=>({...s, correct:{...s.correct, [k]:!s.correct[k]}}));

  async function save(e){
    e.preventDefault(); setBusy(true);
    try{
      const correct = Object.entries(form.correct).filter(([,v])=>v).map(([k])=>k);
      await updateQuestion(doc._id, {
        type: "mcq-multi",
        subject: scope.subject, topic: scope.topic,
        question: form.question, options: form.options, correct,
        difficulty: form.difficulty, tags: form.tags, explanation: form.explanation,
      });
      alert("Updated!");
    }catch(err){ alert(err.message); } finally{ setBusy(false); }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Difficulty</label>
          <select className="w-full rounded-lg border px-3 py-2 bg-white" value={form.difficulty} onChange={e=>update("difficulty", e.target.value)}>
            <option value="easy">Easy</option><option value="moderate">Moderate</option><option value="hard">Hard</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Tags</label>
          <input className="w-full rounded-lg border px-3 py-2 bg-white" value={form.tags} onChange={e=>update("tags", e.target.value)} />
        </div>
      </div>
      <div>
        <label className="block text-sm text-slate-600 mb-1">Question</label>
        <textarea className="w-full rounded-lg border px-3 py-2 bg-white min-h-24" value={form.question} onChange={e=>update("question", e.target.value)} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {["A","B","C","D"].map((L,i)=>(
          <div key={L} className="space-y-2">
            <label className="block text-sm text-slate-600">Option {L}</label>
            <input className="w-full rounded-lg border px-3 py-2 bg-white" value={form.options[i]} onChange={e=>updateOpt(i, e.target.value)} />
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.correct[L]} onChange={()=>toggle(L)} />
              Mark as Correct
            </label>
          </div>
        ))}
      </div>
      <div>
        <label className="block text-sm text-slate-600 mb-1">Explanation</label>
        <textarea className="w-full rounded-lg border px-3 py-2 bg-white min-h-24" value={form.explanation} onChange={e=>update("explanation", e.target.value)} />
      </div>
      <button className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700">Save</button>
    </form>
  );
}

/* ---------- True / False ---------- */
function EditTrueFalse({ doc, scope, setBusy }) {
  const [form, setForm] = useState({
    statement: doc.question || "",
    answer: (doc.correct?.[0] || "true"),
    explanation: doc.explanation || "",
    difficulty: doc.difficulty || "easy",
    tags: (doc.tags || []).join(","),
  });

  async function save(e){
    e.preventDefault(); setBusy(true);
    try{
      await updateQuestion(doc._id, {
        type: "true-false",
        subject: scope.subject, topic: scope.topic,
        statement: form.statement, answer: form.answer,
        difficulty: form.difficulty, tags: form.tags, explanation: form.explanation,
      });
      alert("Updated!");
    }catch(err){ alert(err.message); } finally{ setBusy(false); }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Difficulty</label>
          <select className="w-full rounded-lg border px-3 py-2 bg-white"
                  value={form.difficulty} onChange={e=>setForm(s=>({...s, difficulty:e.target.value}))}>
            <option value="easy">Easy</option><option value="moderate">Moderate</option><option value="hard">Hard</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Tags</label>
          <input className="w-full rounded-lg border px-3 py-2 bg-white"
                 value={form.tags} onChange={e=>setForm(s=>({...s, tags:e.target.value}))}/>
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-600 mb-1">Statement</label>
        <textarea className="w-full rounded-lg border px-3 py-2 bg-white min-h-24"
                  value={form.statement} onChange={e=>setForm(s=>({...s, statement:e.target.value}))}/>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Answer</label>
          <select className="w-full rounded-lg border px-3 py-2 bg-white"
                  value={form.answer} onChange={e=>setForm(s=>({...s, answer:e.target.value}))}>
            <option value="true">True</option><option value="false">False</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Explanation (optional)</label>
          <textarea className="w-full rounded-lg border px-3 py-2 bg-white min-h-24"
                    value={form.explanation} onChange={e=>setForm(s=>({...s, explanation:e.target.value}))}/>
        </div>
      </div>

      <button className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700">Save</button>
    </form>
  );
}

/* ---------- Choice Matrix ---------- */
function EditChoiceMatrix({ doc, scope, setBusy }) {
  const cm = doc.choiceMatrix || {};
  const [form, setForm] = useState({
    prompt: cm.prompt || "",
    rows: cm.rows || ["Statement 1"],
    cols: cm.cols || ["True", "False"],
    correct: Object.fromEntries((cm.correctCells || []).map(k => [k, true])),
    explanation: doc.explanation || "",
  });
  const toggle = (ri,ci)=> setForm(s=>({ ...s, correct:{...s.correct, [`${ri}-${ci}`]: !s.correct[`${ri}-${ci}`]} }));
  const addRow = () => setForm(s=>({ ...s, rows:[...s.rows, `Statement ${s.rows.length+1}`]}));
  const addCol = () => setForm(s=>({ ...s, cols:[...s.cols, `Choice ${s.cols.length+1}`]}));

  async function save(e){
    e.preventDefault(); setBusy(true);
    try{
      const correctCells = Object.entries(form.correct).filter(([,v])=>v).map(([k])=>k);
      await updateQuestion(doc._id, {
        type: "choice-matrix",
        subject: scope.subject, topic: scope.topic,
        choiceMatrix: { prompt: form.prompt, rows: form.rows, cols: form.cols, correctCells },
        explanation: form.explanation,
      });
      alert("Updated!");
    }catch(err){ alert(err.message); } finally{ setBusy(false); }
  }

  return (
    <form onSubmit={save} className="space-y-4">
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
      <div>
        <label className="block text-sm text-slate-600 mb-1">Explanation (optional)</label>
        <textarea className="w-full rounded-lg border px-3 py-2 bg-white min-h-24"
                  value={form.explanation} onChange={(e)=>setForm(s=>({...s, explanation:e.target.value}))}/>
      </div>
      <button className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700">Save</button>
    </form>
  );
}

/* ---------- Cloze Drag ---------- */
function EditClozeDrag({ doc, scope, setBusy }) {
  const cd = doc.clozeDrag || {};
  const [form, setForm] = useState({
    text: cd.text || "",
    tokens: cd.tokens || [],
    correctMap: cd.correctMap || {},
    explanation: doc.explanation || "",
  });

  async function save(e){
    e.preventDefault(); setBusy(true);
    try{
      await updateQuestion(doc._id, {
        type: "cloze-drag",
        subject: scope.subject, topic: scope.topic, explanation: form.explanation,
        clozeDrag: { text: form.text, tokens: form.tokens, correctMap: form.correctMap },
      });
      alert("Updated!");
    }catch(err){ alert(err.message); } finally{ setBusy(false); }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div>
        <label className="block text-sm text-slate-600 mb-1">Text</label>
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
      <div className="rounded-lg border p-3 bg-white space-y-2">
        <div className="text-sm font-medium text-slate-700">Correct Mapping</div>
        {Object.keys(form.correctMap).concat(["blank1","blank2"]).filter((v,i,a)=>a.indexOf(v)===i).map((b)=>(
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
      <div>
        <label className="block text-sm text-slate-600 mb-1">Explanation</label>
        <textarea className="w-full rounded-lg border px-3 py-2 bg-white min-h-24"
                  value={form.explanation} onChange={(e)=>setForm(s=>({...s, explanation:e.target.value}))}/>
      </div>
      <button className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700">Save</button>
    </form>
  );
}

/* ---------- Cloze Select ---------- */
function EditClozeSelect({ doc, scope, setBusy }) {
  const cs = doc.clozeSelect || {};
  const [form, setForm] = useState({
    text: cs.text || "",
    blanks: cs.blanks || { blank1: { options: ["50","70","100"], correct:"100" } },
    explanation: doc.explanation || "",
  });

  async function save(e){
    e.preventDefault(); setBusy(true);
    try{
      await updateQuestion(doc._id, {
        type: "cloze-select",
        subject: scope.subject, topic: scope.topic, explanation: form.explanation,
        clozeSelect: { text: form.text, blanks: form.blanks },
      });
      alert("Updated!");
    }catch(err){ alert(err.message); } finally{ setBusy(false); }
  }

  return (
    <form onSubmit={save} className="space-y-4">
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
                     ...s, blanks:{...s.blanks,
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
        <label className="block text-sm text-slate-600 mb-1">Explanation</label>
        <textarea className="w-full rounded-lg border px-3 py-2 bg-white min-h-24"
                  value={form.explanation} onChange={(e)=>setForm(s=>({...s, explanation:e.target.value}))}/>
      </div>
      <button className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700">Save</button>
    </form>
  );
}

/* ---------- Cloze Text ---------- */
function EditClozeText({ doc, scope, setBusy }) {
  const ct = doc.clozeText || {};
  const [form, setForm] = useState({
    text: ct.text || "",
    answers: ct.answers || { blank1: "" },
    explanation: doc.explanation || "",
  });

  async function save(e){
    e.preventDefault(); setBusy(true);
    try{
      await updateQuestion(doc._id, {
        type: "cloze-text",
        subject: scope.subject, topic: scope.topic, explanation: form.explanation,
        clozeText: { text: form.text, answers: form.answers },
      });
      alert("Updated!");
    }catch(err){ alert(err.message); } finally{ setBusy(false); }
  }

  return (
    <form onSubmit={save} className="space-y-4">
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
        <label className="block text-sm text-slate-600 mb-1">Explanation</label>
        <textarea className="w-full rounded-lg border px-3 py-2 bg-white min-h-24"
                  value={form.explanation} onChange={(e)=>setForm(s=>({...s, explanation:e.target.value}))}/>
      </div>
      <button className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700">Save</button>
    </form>
  );
}

/* ---------- Match List ---------- */
function EditMatchList({ doc, scope, setBusy }) {
  const ml = doc.matchList || {};
  const [form, setForm] = useState({
    prompt: ml.prompt || "",
    left: ml.left || [],
    right: ml.right || [],
    pairs: ml.pairs || {},
    explanation: doc.explanation || "",
  });

  async function save(e){
    e.preventDefault(); setBusy(true);
    try{
      await updateQuestion(doc._id, {
        type: "match-list",
        subject: scope.subject, topic: scope.topic, explanation: form.explanation,
        matchList: { prompt: form.prompt, left: form.left, right: form.right, pairs: form.pairs },
      });
      alert("Updated!");
    }catch(err){ alert(err.message); } finally{ setBusy(false); }
  }

  return (
    <form onSubmit={save} className="space-y-4">
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
        <div className="text-sm font-medium text-slate-700">Pairs (Left → Right index)</div>
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
        <label className="block text-sm text-slate-600 mb-1">Explanation</label>
        <textarea className="w-full rounded-lg border px-3 py-2 bg-white min-h-24"
                  value={form.explanation} onChange={(e)=>setForm(s=>({...s, explanation:e.target.value}))}/>
      </div>
      <button className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700">Save</button>
    </form>
  );
}

/* ---------- Essay Rich ---------- */
function EditEssayRich({ doc, scope, setBusy }) {
  const [prompt, setPrompt] = useState(doc.prompt || "");
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = doc.richHtml || "";
  }, [doc.richHtml]);

  async function save(e){
    e.preventDefault(); setBusy(true);
    try{
      const html = editorRef.current?.innerHTML || "";
      await updateQuestion(doc._id, {
        type: "essay-rich",
        subject: scope.subject, topic: scope.topic,
        prompt, richHtml: html,
      });
      alert("Updated!");
    }catch(err){ alert(err.message); } finally{ setBusy(false); }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div>
        <label className="block text-sm text-slate-600 mb-1">Prompt</label>
        <input className="w-full rounded-lg border px-3 py-2 bg-white" value={prompt} onChange={(e)=>setPrompt(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm text-slate-600 mb-1">Answer (rich text)</label>
        <div ref={editorRef} className="min-h-40 rounded-lg border bg-white p-3" contentEditable suppressContentEditableWarning />
      </div>
      <button className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700">Save</button>
    </form>
  );
}

/* ---------- Essay Plain ---------- */
function EditEssayPlain({ doc, scope, setBusy }) {
  const [form, setForm] = useState({
    prompt: doc.prompt || "",
    plainText: doc.plainText || "",
  });

  async function save(e){
    e.preventDefault(); setBusy(true);
    try{
      await updateQuestion(doc._id, {
        type: "essay-plain",
        subject: scope.subject, topic: scope.topic,
        prompt: form.prompt, plainText: form.plainText,
      });
      alert("Updated!");
    }catch(err){ alert(err.message); } finally{ setBusy(false); }
  }

  return (
    <form onSubmit={save} className="space-y-4">
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
      <button className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700">Save</button>
    </form>
  );
}
