import React, { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FiSave, FiEdit3, FiChevronLeft } from "react-icons/fi";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { getJSON, updateQuestion } from "../../lib/api";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";

// -----------------------------------------------------------------------------
// QuestionsEdit.redesigned.jsx
// Updated to use MCQ upload styling while keeping existing layout structure.
// Added 'Class' selector to all edit forms (pre-filled from doc.class and sent
// in update payload as `class`).
// -----------------------------------------------------------------------------

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
        setSubject(d.subject || "");
        setTopic(d.topic || "");
      } catch (e) {
        setErr(e.message || "Failed to load");
      }
    })();
  }, [id, setSubject, setTopic]);

  if (err) return <div className="text-red-600">{err}</div>;
  if (!doc) return <div className="text-slate-600">Loading…</div>;

  return (
    <div className="space-y-6 p-6 ">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard/questions/list" className="text-slate-500 hover:text-slate-800 p-2 rounded-md">
            <FiChevronLeft size={20} />
          </Link>
          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 text-indigo-700 shadow">
            <FiEdit3 size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Edit Question</h1>
            <div className="text-sm text-slate-600">
              Type: <span className="font-medium">{doc.type}</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <SubjectTopicPicker />
      </div>

      <div className="space-y-6">
        {doc.type === "mcq-single" && <EditMCQSingle doc={doc} scope={scope} busy={busy} setBusy={setBusy} />}
        {doc.type === "mcq-multi" && <EditMCQMulti doc={doc} scope={scope} setBusy={setBusy} />}
        {doc.type === "true-false" && <EditTrueFalse doc={doc} scope={scope} setBusy={setBusy} />}

        {doc.type === "choice-matrix" && <EditChoiceMatrix doc={doc} scope={scope} setBusy={setBusy} />}
        {doc.type === "cloze-drag" && <EditClozeDrag doc={doc} scope={scope} setBusy={setBusy} />}
        {doc.type === "cloze-select" && <EditClozeSelect doc={doc} scope={scope} setBusy={setBusy} />}
        {doc.type === "cloze-text" && <EditClozeText doc={doc} scope={scope} setBusy={setBusy} />}
        {doc.type === "match-list" && <EditMatchList doc={doc} scope={scope} setBusy={setBusy} />}
        {doc.type === "essay-rich" && <EditEssayRich doc={doc} scope={scope} setBusy={setBusy} />}
        {doc.type === "essay-plain" && <EditEssayPlain doc={doc} scope={scope} busy={busy} setBusy={setBusy} />}
      </div>
    </div>
  );
}

// ----------------------------- Shared UI pieces ------------------------------
function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl bg-white/60 backdrop-blur-lg shadow p-6 ${className}`}>
      {children}
    </div>
  );
}

function FieldLabel({ children }) {
  return <label className="block text-sm font-medium text-slate-700 mb-2">{children}</label>;
}

function SaveButton({ busy }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="flex items-center gap-2 rounded-xl px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow hover:shadow-xl transition disabled:opacity-50"
    >
      <FiSave /> {busy ? "Saving..." : "Save"}
    </button>
  );
}

// Utility: shared class select component used inside forms
function ClassSelect({ value, onChange }) {
  return (
    <div>
      <FieldLabel>Select Class</FieldLabel>
      <select
        className="w-full rounded-xl px-4 py-3 bg-white shadow-sm focus:ring-2 focus:ring-purple-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select Class</option>
        <option value="Class 1">Class 1</option>
        <option value="Class 2">Class 2</option>
        <option value="Class 3">Class 3</option>
        <option value="Class 4">Class 4</option>
        <option value="Class 5">Class 5</option>
        <option value="Class 6">Class 6</option>
        <option value="Class 7">Class 7</option>
        <option value="Class 8">Class 8</option>
        <option value="Class 9">Class 9</option>
        <option value="Class 10">Class 10</option>
        <option value="Class 11">Class 11</option>
        <option value="Class 12">Class 12</option>
      </select>
    </div>
  );
}

// -------------------------- MCQ Single (Edit) -------------------------------
function EditMCQSingle({ doc, scope, busy, setBusy }) {
  const [form, setForm] = useState(() => ({
    question: doc.question || "",
    options: (doc.options || []).map((o) => o.text).slice(0, 4).concat(new Array(4).fill("")).slice(0, 4),
    correct: (doc.correct && doc.correct[0]) || "A",
    difficulty: doc.difficulty || "easy",
    tags: (doc.tags || []).join(","),
    explanation: doc.explanation || "",
    className: doc.class || doc.className || "",
  }));

  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  const updateOpt = (i, v) => setForm((s) => { const n = [...s.options]; n[i] = v; return { ...s, options: n }; });

  async function save(e) {
    e.preventDefault(); setBusy(true);
    try {
      await updateQuestion(doc._id, {
        type: "mcq-single",
        subject: scope.subject, topic: scope.topic,
        class: form.className,
        question: form.question, options: form.options, correct: form.correct,
        difficulty: form.difficulty, tags: form.tags, explanation: form.explanation,
      });
      alert("Updated!");
    } catch (err) { alert(err.message); } finally { setBusy(false); }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <Card>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <FieldLabel>Difficulty</FieldLabel>
            <select
              value={form.difficulty}
              onChange={(e) => update("difficulty", e.target.value)}
              className="w-full rounded-xl px-4 py-2 bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="easy">Easy</option>
              <option value="moderate">Moderate</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div>
            <FieldLabel>Tags (comma)</FieldLabel>
            <input
              value={form.tags}
              onChange={(e) => update("tags", e.target.value)}
              className="w-full rounded-xl px-4 py-2 bg-white shadow-sm focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <ClassSelect value={form.className} onChange={(v) => update("className", v)} />
          </div>
        </div>

        <div>
          <FieldLabel>Question</FieldLabel>
          <textarea
            value={form.question}
            onChange={(e) => update("question", e.target.value)}
            className="w-full rounded-xl px-4 py-3 bg-white shadow-sm min-h-28 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {['A', 'B', 'C', 'D'].map((L, i) => (
            <div key={L}>
              <FieldLabel>Option {L}</FieldLabel>
              <input
                value={form.options[i]}
                onChange={(e) => updateOpt(i, e.target.value)}
                className="w-full rounded-xl px-4 py-2 bg-white shadow-sm focus:ring-2 focus:ring-blue-400"
              />
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Correct</FieldLabel>
            <select
              value={form.correct}
              onChange={(e) => update("correct", e.target.value)}
              className="w-full rounded-xl px-4 py-2 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500"
            >
              {['A', 'B', 'C', 'D'].map(x => <option key={x} value={x}>{x}</option>)}
            </select>
          </div>

          <div>
            <FieldLabel>Explanation</FieldLabel>
            <textarea
              value={form.explanation}
              onChange={(e) => update("explanation", e.target.value)}
              className="w-full rounded-xl px-4 py-3 bg-white shadow-sm min-h-24 focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <SaveButton busy={busy} />
        </div>
      </Card>
    </form>
  );
}

// -------------------------- MCQ Multi (Edit) -------------------------------
function EditMCQMulti({ doc, scope, setBusy }) {
  const startOptions = (doc.options || []).map(o => o.text).slice(0, 4).concat(new Array(4).fill("")).slice(0, 4);
  const startCorrect = ['A', 'B', 'C', 'D'].reduce((acc, k) => ({ ...acc, [k]: (doc.correct || []).includes(k) }), { A: false, B: false, C: false, D: false });

  const [form, setForm] = useState({
    question: doc.question || "",
    options: startOptions,
    correct: startCorrect,
    difficulty: doc.difficulty || "easy",
    tags: (doc.tags || []).join(','),
    explanation: doc.explanation || "",
    className: doc.class || doc.className || "",
  });

  const update = (k, v) => setForm(s => ({ ...s, [k]: v }));
  const updateOpt = (i, v) => setForm(s => { const n = [...s.options]; n[i] = v; return { ...s, options: n }; });
  const toggle = (k) => setForm(s => ({ ...s, correct: { ...s.correct, [k]: !s.correct[k] } }));

  async function save(e) {
    e.preventDefault(); setBusy(true);
    try {
      const correct = Object.entries(form.correct).filter(([, v]) => v).map(([k]) => k);
      await updateQuestion(doc._id, {
        type: 'mcq-multi',
        subject: scope.subject, topic: scope.topic,
        class: form.className,
        question: form.question, options: form.options, correct,
        difficulty: form.difficulty, tags: form.tags, explanation: form.explanation,
      });
      alert('Updated!');
    } catch (err) { alert(err.message); } finally { setBusy(false); }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <Card>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <FieldLabel>Difficulty</FieldLabel>
            <select value={form.difficulty} onChange={(e) => update('difficulty', e.target.value)} className="w-full rounded-xl border px-4 py-2 bg-white shadow-sm focus:ring-2 focus:ring-blue-500">
              <option value="easy">Easy</option>
              <option value="moderate">Moderate</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <FieldLabel>Tags</FieldLabel>
            <input value={form.tags} onChange={(e) => update('tags', e.target.value)} className="w-full rounded-xl border px-4 py-2 bg-white shadow-sm focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <ClassSelect value={form.className} onChange={(v) => update('className', v)} />
          </div>
        </div>

        <div>
          <FieldLabel>Question</FieldLabel>
          <textarea value={form.question} onChange={(e) => update('question', e.target.value)} className="w-full rounded-xl border px-4 py-3 bg-white shadow-sm min-h-28 focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {['A', 'B', 'C', 'D'].map((L, i) => (
            <div key={L} className="space-y-2">
              <FieldLabel>Option {L}</FieldLabel>
              <input value={form.options[i]} onChange={(e) => updateOpt(i, e.target.value)} className="w-full rounded-xl border px-4 py-2 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500" />
              <label className="inline-flex items-center gap-2 text-sm mt-1">
                <input type="checkbox" checked={form.correct[L]} onChange={() => toggle(L)} className="peer hidden" />
                <div className="w-5 h-5 rounded-md border-2 border-slate-300 peer-checked:border-green-500 peer-checked:bg-green-500 transition" />
                Mark as Correct
              </label>
            </div>
          ))}
        </div>

        <div>
          <FieldLabel>Explanation</FieldLabel>
          <textarea value={form.explanation} onChange={(e) => update('explanation', e.target.value)} className="w-full rounded-xl border px-4 py-3 bg-white shadow-sm min-h-24 focus:ring-2 focus:ring-purple-500" />
        </div>

        <div className="flex justify-end"><SaveButton busy={undefined} /></div>
      </Card>
    </form>
  );
}

// -------------------------- True / False (Edit) ----------------------------
function EditTrueFalse({ doc, scope, setBusy }) {
  const [form, setForm] = useState({
    statement: doc.question || "",
    answer: (doc.correct && doc.correct[0]) || 'true',
    explanation: doc.explanation || '',
    difficulty: doc.difficulty || 'easy',
    tags: (doc.tags || []).join(','),
    className: doc.class || doc.className || '',
  });

  async function save(e) {
    e.preventDefault(); setBusy(true);
    try {
      await updateQuestion(doc._id, {
        type: 'true-false',
        subject: scope.subject, topic: scope.topic,
        class: form.className,
        statement: form.statement, answer: form.answer,
        difficulty: form.difficulty, tags: form.tags, explanation: form.explanation,
      });
      alert('Updated!');
    } catch (err) { alert(err.message); } finally { setBusy(false); }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <Card>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <FieldLabel>Difficulty</FieldLabel>
            <select value={form.difficulty} onChange={(e) => setForm(s => ({ ...s, difficulty: e.target.value }))} className="w-full rounded-xl border px-4 py-2 bg-white shadow-sm focus:ring-2 focus:ring-blue-500">
              <option value="easy">Easy</option>
              <option value="moderate">Moderate</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div>
            <FieldLabel>Tags</FieldLabel>
            <input value={form.tags} onChange={(e) => setForm(s => ({ ...s, tags: e.target.value }))} className="w-full rounded-xl border px-4 py-2 bg-white shadow-sm focus:ring-2 focus:ring-green-500" />
          </div>

          <div>
            <ClassSelect value={form.className} onChange={(v) => setForm(s => ({ ...s, className: v }))} />
          </div>
        </div>

        <div>
          <FieldLabel>Statement</FieldLabel>
          <textarea value={form.statement} onChange={(e) => setForm(s => ({ ...s, statement: e.target.value }))} className="w-full rounded-xl border px-4 py-3 bg-white shadow-sm min-h-28 focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Answer</FieldLabel>
            <select value={form.answer} onChange={(e) => setForm(s => ({ ...s, answer: e.target.value }))} className="w-full rounded-xl border px-4 py-2 bg-white shadow-sm focus:ring-2 focus:ring-green-500">
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          </div>

          <div>
            <FieldLabel>Explanation (optional)</FieldLabel>
            <textarea value={form.explanation} onChange={(e) => setForm(s => ({ ...s, explanation: e.target.value }))} className="w-full rounded-xl border px-4 py-3 bg-white shadow-sm min-h-24 focus:ring-2 focus:ring-purple-500" />
          </div>
        </div>

        <div className="flex justify-end"><SaveButton busy={undefined} /></div>
      </Card>
    </form>
  );
}

// -------------------------- Choice Matrix (Edit) ---------------------------
function EditChoiceMatrix({ doc, scope, setBusy }) {
  const cm = doc.choiceMatrix || {};
  const [form, setForm] = useState({
    prompt: cm.prompt || '',
    rows: cm.rows || ['Statement 1'],
    cols: cm.cols || ['True', 'False'],
    correct: Object.fromEntries((cm.correctCells || []).map(k => [k, true])),
    explanation: doc.explanation || '',
    className: doc.class || doc.className || '',
  });

  const toggle = (ri, ci) => setForm(s => ({ ...s, correct: { ...s.correct, [`${ri}-${ci}`]: !s.correct[`${ri}-${ci}`] } }));
  const addRow = () => setForm(s => ({ ...s, rows: [...s.rows, `Statement ${s.rows.length + 1}`] }));
  const addCol = () => setForm(s => ({ ...s, cols: [...s.cols, `Choice ${s.cols.length + 1}`] }));

  async function save(e) {
    e.preventDefault(); setBusy(true);
    try {
      const correctCells = Object.entries(form.correct).filter(([, v]) => v).map(([k]) => k);
      await updateQuestion(doc._id, {
        type: 'choice-matrix',
        subject: scope.subject, topic: scope.topic,
        class: form.className,
        choiceMatrix: { prompt: form.prompt, rows: form.rows, cols: form.cols, correctCells },
        explanation: form.explanation,
      });
      alert('Updated!');
    } catch (err) { alert(err.message); } finally { setBusy(false); }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <Card>
        <div className="grid sm:grid-cols-3 gap-4 mb-2">
          <div>
            <FieldLabel>Prompt</FieldLabel>
            <textarea value={form.prompt} onChange={(e) => setForm(s => ({ ...s, prompt: e.target.value }))} className="w-full rounded-xl border px-4 py-3 bg-white shadow-sm min-h-24 focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex items-start">
            <div className="space-y-2">
              <button type="button" onClick={addRow} className="rounded-xl px-4 py-2 bg-blue-100 text-blue-700">Add Row</button>
              <button type="button" onClick={addCol} className="rounded-xl px-4 py-2 bg-purple-100 text-purple-700">Add Column</button>
            </div>
          </div>
          <div>
            <ClassSelect value={form.className} onChange={(v) => setForm(s => ({ ...s, className: v }))} />
          </div>
        </div>

        <div className="overflow-auto rounded-xl border bg-white p-3">
          <table className="min-w-[700px] w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="p-3 text-left">Row / Col</th>
                {form.cols.map((c, i) => <th key={i} className="p-3 text-center">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {form.rows.map((r, ri) => (
                <tr key={ri} className="odd:bg-slate-50/40">
                  <td className="p-2">
                    <input value={r} onChange={(e) => setForm(s => { const rows = [...s.rows]; rows[ri] = e.target.value; return { ...s, rows }; })} className="w-full rounded-xl border px-3 py-2" />
                  </td>
                  {form.cols.map((c, ci) => (
                    <td key={ci} className="p-3 text-center">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="hidden peer" checked={!!form.correct[`${ri}-${ci}`]} onChange={() => toggle(ri, ci)} />
                        <div className="w-5 h-5 rounded-md border-2 border-slate-300 peer-checked:border-green-500 peer-checked:bg-green-500 transition" />
                      </label>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <FieldLabel>Explanation (optional)</FieldLabel>
          <textarea value={form.explanation} onChange={(e) => setForm(s => ({ ...s, explanation: e.target.value }))} className="w-full rounded-xl border px-4 py-3 bg-white shadow-sm min-h-24 focus:ring-2 focus:ring-purple-500" />
        </div>

        <div className="flex justify-end"><SaveButton busy={undefined} /></div>
      </Card>
    </form>
  );
}

// -------------------------- Cloze Drag (Edit) ------------------------------
function EditClozeDrag({ doc, scope, setBusy }) {
  const cd = doc.clozeDrag || {};
  const [form, setForm] = useState({ text: cd.text || '', tokens: cd.tokens || [], correctMap: cd.correctMap || {}, explanation: doc.explanation || '', className: doc.class || doc.className || '' });

  const updateToken = (i, val) => setForm(s => { const tokens = [...s.tokens]; tokens[i] = val; return { ...s, tokens }; });

  async function save(e) {
    e.preventDefault(); setBusy(true);
    try {
      // Main update call
      await updateQuestion(doc._id, {
        type: 'cloze-drag',
        subject: scope.subject, topic: scope.topic, explanation: form.explanation,
        class: form.className,
        clozeDrag: { text: form.text, tokens: form.tokens, correctMap: form.correctMap }
      });
      alert('Updated!');
    } catch (err) { alert(err.message); } finally { setBusy(false); }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <Card>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <FieldLabel>Text (use [[blank1]] syntax)</FieldLabel>
            <textarea value={form.text} onChange={(e) => setForm(s => ({ ...s, text: e.target.value }))} className="w-full rounded-xl border px-4 py-3 bg-white shadow-sm min-h-28 focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <FieldLabel>Tokens</FieldLabel>
            <div className="flex flex-wrap gap-3">
              {form.tokens.map((t, i) => (
                <input key={i} value={t} onChange={(e) => updateToken(i, e.target.value)} className="rounded-xl border px-4 py-2 bg-white shadow-sm" />
              ))}
              <button type="button" onClick={() => setForm(s => ({ ...s, tokens: [...s.tokens, ''] }))} className="rounded-xl px-4 py-2 bg-purple-100 text-purple-700">+ Add Token</button>
            </div>
          </div>
          <div>
            <ClassSelect value={form.className} onChange={(v) => setForm(s => ({ ...s, className: v }))} />
          </div>
        </div>

        <div>
          <FieldLabel>Correct Mapping</FieldLabel>
          <div className="space-y-3">
            {Array.from(new Set(Object.keys(form.correctMap).concat(['blank1', 'blank2']))).map(b => (
              <div key={b} className="grid sm:grid-cols-2 gap-3 items-center">
                <div className="font-medium text-slate-700">{b}</div>
                <select value={form.correctMap[b] || ''} onChange={(e) => setForm(s => ({ ...s, correctMap: { ...s.correctMap, [b]: e.target.value } }))} className="rounded-xl border px-4 py-2 bg-white shadow-sm">
                  <option value="">Select token…</option>
                  {form.tokens.map((t, i) => <option key={i} value={t}>{t}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div>
          <FieldLabel>Explanation</FieldLabel>
          <textarea value={form.explanation} onChange={(e) => setForm(s => ({ ...s, explanation: e.target.value }))} className="w-full rounded-xl border px-4 py-3 bg-white shadow-sm min-h-24 focus:ring-2 focus:ring-purple-500" />
        </div>

        <div className="flex justify-end"><SaveButton busy={undefined} /></div>
      </Card>
    </form>
  );
}

// -------------------------- Cloze Select (Edit) ----------------------------
function EditClozeSelect({ doc, scope, setBusy }) {
  const cs = doc.clozeSelect || {};
  const [form, setForm] = useState({ text: cs.text || '', blanks: cs.blanks || { blank1: { options: ['50', '70', '100'], correct: '100' } }, explanation: doc.explanation || '', className: doc.class || doc.className || '' });

  async function save(e) {
    e.preventDefault(); setBusy(true);
    try {
      await updateQuestion(doc._id, {
        type: 'cloze-select',
        subject: scope.subject, topic: scope.topic, explanation: form.explanation,
        class: form.className,
        clozeSelect: { text: form.text, blanks: form.blanks }
      });
      alert('Updated!');
    } catch (err) { alert(err.message); } finally { setBusy(false); }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <Card>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <FieldLabel>Text</FieldLabel>
            <textarea value={form.text} onChange={(e) => setForm(s => ({ ...s, text: e.target.value }))} className="w-full rounded-xl border px-4 py-3 bg-white shadow-sm min-h-28 focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <FieldLabel>Blanks Editor</FieldLabel>
            <div className="rounded-xl border p-4 bg-white shadow-sm space-y-3">
              {Object.keys(form.blanks).map(key => (
                <div key={key} className="space-y-2">
                  <div className="font-medium text-slate-700">{key}</div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input value={(form.blanks[key].options || []).join(',')} onChange={(e) => setForm(s => ({ ...s, blanks: { ...s.blanks, [key]: { ...(s.blanks[key] || {}), options: e.target.value.split(',').map(x => x.trim()).filter(Boolean) } } }))} className="rounded-xl border px-4 py-2 bg-white shadow-sm" />
                    <input value={form.blanks[key].correct || ''} onChange={(e) => setForm(s => ({ ...s, blanks: { ...s.blanks, [key]: { ...(s.blanks[key] || {}), correct: e.target.value } } }))} className="rounded-xl border px-4 py-2 bg-white shadow-sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <ClassSelect value={form.className} onChange={(v) => setForm(s => ({ ...s, className: v }))} />
          </div>
        </div>

        <div>
          <FieldLabel>Explanation</FieldLabel>
          <textarea value={form.explanation} onChange={(e) => setForm(s => ({ ...s, explanation: e.target.value }))} className="w-full rounded-xl border px-4 py-3 bg-white shadow-sm min-h-24 focus:ring-2 focus:ring-purple-500" />
        </div>

        <div className="flex justify-end"><SaveButton busy={undefined} /></div>
      </Card>
    </form>
  );
}

// -------------------------- Cloze Text (Edit) ------------------------------
function EditClozeText({ doc, scope, setBusy }) {
  const ct = doc.clozeText || {};
  const [form, setForm] = useState({ text: ct.text || '', answers: ct.answers || { blank1: '' }, explanation: doc.explanation || '', className: doc.class || doc.className || '' });

  async function save(e) {
    e.preventDefault(); setBusy(true);
    try {
      await updateQuestion(doc._id, {
        type: 'cloze-text',
        subject: scope.subject, topic: scope.topic, explanation: form.explanation,
        class: form.className,
        clozeText: { text: form.text, answers: form.answers }
      });
      alert('Updated!');
    } catch (err) { alert(err.message); } finally { setBusy(false); }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <Card>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <FieldLabel>Text</FieldLabel>
            <textarea value={form.text} onChange={(e) => setForm(s => ({ ...s, text: e.target.value }))} className="w-full rounded-xl border px-4 py-3 bg-white shadow-sm min-h-28 focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <FieldLabel>Answers</FieldLabel>
            <input value={form.answers.blank1 || ''} onChange={(e) => setForm(s => ({ ...s, answers: { ...s.answers, blank1: e.target.value } }))} className="w-full rounded-xl border px-4 py-2 bg-white shadow-sm" />
          </div>
          <div>
            <ClassSelect value={form.className} onChange={(v) => setForm(s => ({ ...s, className: v }))} />
          </div>
        </div>

        <div>
          <FieldLabel>Explanation</FieldLabel>
          <textarea value={form.explanation} onChange={(e) => setForm(s => ({ ...s, explanation: e.target.value }))} className="w-full rounded-xl border px-4 py-3 bg-white shadow-sm min-h-24 focus:ring-2 focus:ring-purple-500" />
        </div>

        <div className="flex justify-end"><SaveButton busy={undefined} /></div>
      </Card>
    </form>
  );
}

// -------------------------- Match List (Edit) ------------------------------
function EditMatchList({ doc, scope, setBusy }) {
  const ml = doc.matchList || {};
  const [form, setForm] = useState({ prompt: ml.prompt || '', left: ml.left || [], right: ml.right || [], pairs: ml.pairs || {}, explanation: doc.explanation || '', className: doc.class || doc.className || '' });

  const updateLeft = (i, val) => setForm(s => { const left = [...s.left]; left[i] = val; return { ...s, left }; });
  const updateRight = (i, val) => setForm(s => { const right = [...s.right]; right[i] = val; return { ...s, right }; });

  async function save(e) {
    e.preventDefault(); setBusy(true);
    try {
      await updateQuestion(doc._id, {
        type: 'match-list',
        subject: scope.subject, topic: scope.topic, explanation: form.explanation,
        class: form.className,
        matchList: { prompt: form.prompt, left: form.left, right: form.right, pairs: form.pairs }
      });
      alert('Updated!');
    } catch (err) { alert(err.message); } finally { setBusy(false); }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <Card>
        <div className="grid sm:grid-cols-3 gap-6">
          <div>
            <div className="font-semibold text-slate-800 mb-2">Prompt</div>
            <textarea value={form.prompt} onChange={(e) => setForm(s => ({ ...s, prompt: e.target.value }))} className="w-full rounded-xl border px-4 py-3 bg-white shadow-sm min-h-24 focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <div className="font-semibold text-slate-800 mb-2">Left</div>
            {form.left.map((v, i) => (
              <input key={i} value={v} onChange={(e) => updateLeft(i, e.target.value)} className="w-full rounded-xl border px-4 py-2 mb-2 bg-white shadow-sm" />
            ))}
            <button type="button" onClick={() => setForm(s => ({ ...s, left: [...s.left, ''] }))} className="rounded-xl px-4 py-2 bg-blue-100 text-blue-700">+ Add Left</button>
          </div>

          <div>
            <div className="font-semibold text-slate-800 mb-2">Right</div>
            {form.right.map((v, i) => (
              <input key={i} value={v} onChange={(e) => updateRight(i, e.target.value)} className="w-full rounded-xl border px-4 py-2 mb-2 bg-white shadow-sm" />
            ))}
            <button type="button" onClick={() => setForm(s => ({ ...s, right: [...s.right, ''] }))} className="rounded-xl px-4 py-2 bg-purple-100 text-purple-700">+ Add Right</button>

            <div className="mt-4">
              <ClassSelect value={form.className} onChange={(v) => setForm(s => ({ ...s, className: v }))} />
            </div>
          </div>
        </div>

        <div>
          <div className="font-medium text-slate-700 mb-3">Pairs (Left → Right index)</div>
          <div className="space-y-3">
            {form.left.map((_, li) => (
              <div key={li} className="grid sm:grid-cols-2 gap-3 items-center">
                <div>Left {li}</div>
                <select value={form.pairs[String(li)] ?? ''} onChange={(e) => setForm(s => ({ ...s, pairs: { ...s.pairs, [String(li)]: e.target.value } }))} className="rounded-xl border px-4 py-2 bg-white shadow-sm">
                  <option value="">Select right…</option>
                  {form.right.map((__, ri) => <option key={ri} value={ri}>{ri}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div>
          <FieldLabel>Explanation (optional)</FieldLabel>
          <textarea value={form.explanation} onChange={(e) => setForm(s => ({ ...s, explanation: e.target.value }))} className="w-full rounded-xl border px-4 py-3 bg-white shadow-sm min-h-24 focus:ring-2 focus:ring-purple-500" />
        </div>

        <div className="flex justify-end"><SaveButton busy={undefined} /></div>
      </Card>
    </form>
  );
}

// -------------------------- Essay Rich (Edit) ------------------------------
function EditEssayRich({ doc, scope, setBusy }) {
  const [prompt, setPrompt] = useState(doc.prompt || '');
  const editorRef = useRef(null);
  const [className, setClassName] = useState(doc.class || doc.className || "");

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = doc.richHtml || '';
  }, [doc.richHtml]);

  const applyCmd = (cmd) => document.execCommand(cmd, false, null);

  async function save(e) {
    e.preventDefault(); setBusy(true);
    try {
      const html = editorRef.current?.innerHTML || '';
      await updateQuestion(doc._id, { type: 'essay-rich', subject: scope.subject, topic: scope.topic, prompt, richHtml: html, class: className });
      alert('Updated!');
    } catch (err) { alert(err.message); } finally { setBusy(false); }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <Card>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <FieldLabel>Prompt</FieldLabel>
            <input value={prompt} onChange={(e) => setPrompt(e.target.value)} className="w-full rounded-xl border px-4 py-2 bg-white shadow-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <FieldLabel>Answer (rich text)</FieldLabel>
            <div className="flex items-center gap-2 mb-3">
              <button type="button" onClick={() => applyCmd('bold')} className="rounded-md p-2 bg-white border">B</button>
              <button type="button" onClick={() => applyCmd('italic')} className="rounded-md p-2 bg-white border">I</button>
              <button type="button" onClick={() => applyCmd('underline')} className="rounded-md p-2 bg-white border">U</button>
            </div>
          </div>
          <div>
            <ClassSelect value={className} onChange={(v) => setClassName(v)} />
          </div>
        </div>

        <div>
          <div ref={editorRef} contentEditable suppressContentEditableWarning className="min-h-40 rounded-xl border px-4 py-3 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div className="flex justify-end"><SaveButton busy={undefined} /></div>
      </Card>
    </form>
  );
}

// -------------------------- Essay Plain (Edit) -----------------------------
function EditEssayPlain({ doc, scope, busy, setBusy }) {
  const [form, setForm] = useState({ prompt: doc.prompt || '', plainText: doc.plainText || '', className: doc.class || doc.className || '' });

  async function save(e) {
    e.preventDefault(); setBusy(true);
    try {
      await updateQuestion(doc._id, { type: 'essay-plain', subject: scope.subject, topic: scope.topic, prompt: form.prompt, plainText: form.plainText, class: form.className });
      alert('Updated!');
    } catch (err) { alert(err.message); } finally { setBusy(false); }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <Card>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <FieldLabel>Prompt</FieldLabel>
            <input value={form.prompt} onChange={(e) => setForm(s => ({ ...s, prompt: e.target.value }))} className="w-full rounded-xl px-4 py-2 bg-white shadow-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <FieldLabel>Answer (plain text)</FieldLabel>
            <textarea value={form.plainText} onChange={(e) => setForm(s => ({ ...s, plainText: e.target.value }))} className="w-full rounded-xl px-4 py-3 bg-white shadow-sm min-h-40 focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <ClassSelect value={form.className} onChange={(v) => setForm(s => ({ ...s, className: v }))} />
          </div>
        </div>

        <div className="flex justify-end"><SaveButton busy={busy} /></div>
      </Card>
    </form>
  );
}
