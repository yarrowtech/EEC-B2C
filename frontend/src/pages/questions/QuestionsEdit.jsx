import React, { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FiSave, FiEdit3, FiChevronLeft } from "react-icons/fi";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { getJSON, updateQuestion } from "../../lib/api";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

export default function QuestionsEdit() {
  const { id } = useParams();
  const {
    scope,
    setBoard,
    setClass,
    setSubject,
    setTopic,
    setStage,
    setDifficulty,
  } = useQuestionScope();

  const [doc, setDoc] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const d = await getJSON(`/api/questions/${id}`);
        setDoc(d);
        // Set scope from document
        setBoard(d.board || "");
        setClass(d.class || "");
        setSubject(d.subject || "");
        setTopic(d.topic || "");

        // Map stage number to name
        const stageNames = { 1: "Foundation", 2: "Intermediate", 3: "Advanced" };
        setStage(stageNames[d.stage] || "");

        // Capitalize difficulty
        setDifficulty(d.difficulty ? d.difficulty.charAt(0).toUpperCase() + d.difficulty.slice(1) : "");
      } catch (e) {
        setErr(e.message || "Failed to load");
      }
    })();
  }, [id]);

  if (err) return <div className="text-red-600 p-6">{err}</div>;
  if (!doc) return <div className="text-slate-600 p-6">Loading question...</div>;

  return (
    <>
      <ToastContainer position="bottom-right" />
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard/questions/list"
            className="text-slate-500 hover:text-slate-800 p-2 rounded-lg hover:bg-slate-100 transition"
          >
            <FiChevronLeft size={24} />
          </Link>
          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
            <FiEdit3 size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Edit Question</h1>
            <div className="text-sm text-slate-600 mt-1">
              Type: <span className="font-semibold">{doc.type}</span> | ID: <span className="font-mono text-xs">{doc._id}</span>
            </div>
          </div>
        </div>

        {/* Hierarchy Editor */}
        <HierarchyEditor doc={doc} scope={scope} />

        {/* Question Type Specific Editor */}
        <div className="space-y-6">
          {doc.type === "mcq-single" && <EditMCQSingle doc={doc} scope={scope} busy={busy} setBusy={setBusy} />}
          {doc.type === "mcq-multi" && <EditMCQMulti doc={doc} scope={scope} busy={busy} setBusy={setBusy} />}
          {doc.type === "true-false" && <EditTrueFalse doc={doc} scope={scope} busy={busy} setBusy={setBusy} />}
          {doc.type === "choice-matrix" && <EditChoiceMatrix doc={doc} scope={scope} busy={busy} setBusy={setBusy} />}
          {doc.type === "cloze-drag" && <EditClozeDrag doc={doc} scope={scope} busy={busy} setBusy={setBusy} />}
          {doc.type === "cloze-select" && <EditClozeSelect doc={doc} scope={scope} busy={busy} setBusy={setBusy} />}
          {doc.type === "cloze-text" && <EditClozeText doc={doc} scope={scope} busy={busy} setBusy={setBusy} />}
          {doc.type === "match-list" && <EditMatchList doc={doc} scope={scope} busy={busy} setBusy={setBusy} />}
          {doc.type === "essay-rich" && <EditEssayRich doc={doc} scope={scope} busy={busy} setBusy={setBusy} />}
          {doc.type === "essay-plain" && <EditEssayPlain doc={doc} scope={scope} busy={busy} setBusy={setBusy} />}
        </div>
      </div>
    </>
  );
}

// Hierarchy Editor Component
function HierarchyEditor({ doc, scope }) {
  const {
    setBoard,
    setClass,
    setSubject,
    setTopic,
    setStage,
    setDifficulty,
  } = useQuestionScope();

  const [boards, setBoards] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);

  const STAGES = ["Foundation", "Intermediate", "Advanced"];
  const DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard"];

  useEffect(() => {
    loadBoards();
    loadClasses();
  }, []);

  useEffect(() => {
    if (scope.board && scope.class) {
      loadSubjects(scope.board, scope.class);
    }
  }, [scope.board, scope.class]);

  useEffect(() => {
    if (scope.subject && scope.board && scope.class) {
      loadTopics(scope.subject, scope.board, scope.class);
    }
  }, [scope.subject, scope.board, scope.class]);

  const loadBoards = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/boards`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
      });
      setBoards(res.data);
    } catch (err) {
      console.error("Failed to load boards:", err);
    }
  };

  const loadClasses = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/classes`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
      });
      setClasses(res.data);
    } catch (err) {
      console.error("Failed to load classes:", err);
    }
  };

  const loadSubjects = async (boardId, classId) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/subject?board=${boardId}&class=${classId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
        }
      );
      setSubjects(res.data);
    } catch (err) {
      console.error("Failed to load subjects:", err);
    }
  };

  const loadTopics = async (subjectId, boardId, classId) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/topic/${subjectId}?board=${boardId}&class=${classId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
        }
      );
      setTopics(res.data);
    } catch (err) {
      console.error("Failed to load topics:", err);
    }
  };

  const topicsWithSelected = topics;

  return (
    <div className="bg-white shadow-xl rounded-2xl p-6 border border-slate-200">
      <h3 className="text-lg font-bold text-slate-800 mb-4">Question Hierarchy</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Board */}
        <div>
          <label className="font-semibold text-slate-700 mb-2 block text-sm">Board</label>
          <select
            className="w-full rounded-xl px-4 py-2 bg-slate-50 border border-slate-300 shadow-sm
                     focus:ring-2 focus:ring-blue-500 outline-none"
            value={scope.board}
            onChange={(e) => setBoard(e.target.value)}
          >
            <option value="">Select Board</option>
            {boards.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Class */}
        <div>
          <label className="font-semibold text-slate-700 mb-2 block text-sm">Class</label>
          <select
            className="w-full rounded-xl px-4 py-2 bg-slate-50 border border-slate-300 shadow-sm
                     focus:ring-2 focus:ring-blue-500 outline-none"
            value={scope.class}
            onChange={(e) => setClass(e.target.value)}
          >
            <option value="">Select Class</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subject */}
        <div>
          <label className="font-semibold text-slate-700 mb-2 block text-sm">Subject</label>
          <select
            className="w-full rounded-xl px-4 py-2 bg-slate-50 border border-slate-300 shadow-sm
                     focus:ring-2 focus:ring-purple-500 outline-none"
            value={scope.subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            <option value="">Select Subject</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Topic */}
        <div>
          <label className="font-semibold text-slate-700 mb-2 block text-sm">Topic</label>
          <select
            className="w-full rounded-xl px-4 py-2 bg-slate-50 border border-slate-300 shadow-sm
                     focus:ring-2 focus:ring-purple-500 outline-none"
            value={scope.topic}
            onChange={(e) => setTopic(e.target.value)}
          >
            <option value="">Select Topic</option>
            {topicsWithSelected.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Stage */}
        <div>
          <label className="font-semibold text-slate-700 mb-2 block text-sm">Stage</label>
          <select
            className="w-full rounded-xl px-4 py-2 bg-slate-50 border border-slate-300 shadow-sm
                     focus:ring-2 focus:ring-indigo-500 outline-none"
            value={scope.stage}
            onChange={(e) => setStage(e.target.value)}
          >
            <option value="">Select Stage</option>
            {STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty */}
        <div>
          <label className="font-semibold text-slate-700 mb-2 block text-sm">Difficulty</label>
          <select
            className="w-full rounded-xl px-4 py-2 bg-slate-50 border border-slate-300 shadow-sm
                     focus:ring-2 focus:ring-orange-500 outline-none"
            value={scope.difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="">Select Difficulty</option>
            {DIFFICULTY_LEVELS.map((diff) => (
              <option key={diff} value={diff}>
                {diff}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// Shared UI components
function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl bg-white shadow-xl border border-slate-200 p-6 ${className}`}>
      {children}
    </div>
  );
}

function FieldLabel({ children }) {
  return <label className="block text-sm font-semibold text-slate-700 mb-2">{children}</label>;
}

function SaveButton({ busy }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="flex items-center gap-2 rounded-xl px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600
               text-white font-bold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700
               active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <FiSave size={18} /> {busy ? "Saving..." : "Save Changes"}
    </button>
  );
}

// MCQ Single Edit Component
function EditMCQSingle({ doc, scope, busy, setBusy }) {
  const [form, setForm] = useState(() => ({
    question: doc.question || "",
    options: (doc.options || []).map((o) => o.text).slice(0, 4).concat(new Array(4).fill("")).slice(0, 4),
    correct: (doc.correct && doc.correct[0]) || "A",
    tags: (doc.tags || []).join(","),
    explanation: doc.explanation || "",
  }));

  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  const updateOpt = (i, v) => setForm((s) => { const n = [...s.options]; n[i] = v; return { ...s, options: n }; });

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      // Map stage names to numbers
      const stageMap = {
        "Foundation": 1,
        "Intermediate": 2,
        "Advanced": 3
      };

      // Map stage to level
      const levelMap = {
        "Foundation": "basic",
        "Intermediate": "intermediate",
        "Advanced": "advanced"
      };

      await updateQuestion(doc._id, {
        type: "mcq-single",
        board: scope.board,
        class: scope.class,
        subject: scope.subject,
        topic: scope.topic,
        stage: stageMap[scope.stage] || 1,
        level: levelMap[scope.stage] || "basic",
        difficulty: scope.difficulty.toLowerCase(),
        question: form.question,
        options: form.options,
        correct: form.correct,
        tags: form.tags,
        explanation: form.explanation,
      });
      toast.success("Question updated successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to update question");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-slate-800 mb-4">Question Content</h3>

        {/* Question Text */}
        <div className="mb-6">
          <FieldLabel>Question Text</FieldLabel>
          <textarea
            value={form.question}
            onChange={(e) => update("question", e.target.value)}
            className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-300 min-h-32
                     focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            placeholder="Enter your question here..."
          />
        </div>

        {/* Options */}
        <div className="mb-6">
          <FieldLabel>Answer Options</FieldLabel>
          <div className="grid sm:grid-cols-2 gap-4">
            {['A', 'B', 'C', 'D'].map((L, i) => (
              <div key={L}>
                <label className="text-sm font-medium text-slate-600 mb-1 block">Option {L}</label>
                <input
                  value={form.options[i]}
                  onChange={(e) => updateOpt(i, e.target.value)}
                  className="w-full rounded-xl px-4 py-2 bg-slate-50 border border-slate-300
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder={`Enter option ${L}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Correct Answer & Tags */}
        <div className="grid sm:grid-cols-2 gap-6 mb-6">
          <div>
            <FieldLabel>Correct Answer</FieldLabel>
            <select
              value={form.correct}
              onChange={(e) => update("correct", e.target.value)}
              className="w-full rounded-xl px-4 py-2 bg-slate-50 border border-slate-300
                       focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            >
              {['A', 'B', 'C', 'D'].map(x => (
                <option key={x} value={x}>Option {x}</option>
              ))}
            </select>
          </div>

          <div>
            <FieldLabel>Tags (comma separated)</FieldLabel>
            <input
              value={form.tags}
              onChange={(e) => update("tags", e.target.value)}
              className="w-full rounded-xl px-4 py-2 bg-slate-50 border border-slate-300
                       focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              placeholder="algebra, physics, grammar..."
            />
          </div>
        </div>

        {/* Explanation */}
        <div className="mb-6">
          <FieldLabel>Explanation (optional)</FieldLabel>
          <textarea
            value={form.explanation}
            onChange={(e) => update("explanation", e.target.value)}
            className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-300 min-h-24
                     focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            placeholder="Explain why this is the correct answer..."
          />
        </div>

        <div className="flex justify-end">
          <SaveButton busy={busy} />
        </div>
      </Card>
    </form>
  );
}

function EditMCQMulti({ doc, scope, busy, setBusy }) {
  const [form, setForm] = useState(() => ({
    question: doc.question || "",
    options: (doc.options || []).map((o) => o.text).slice(0, 4).concat(new Array(4).fill("")).slice(0, 4),
    correct: {
      A: (doc.correct || []).includes("A"),
      B: (doc.correct || []).includes("B"),
      C: (doc.correct || []).includes("C"),
      D: (doc.correct || []).includes("D"),
    },
    tags: (doc.tags || []).join(","),
    explanation: doc.explanation || "",
  }));

  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  const updateOpt = (i, v) =>
    setForm((s) => {
      const next = [...s.options];
      next[i] = v;
      return { ...s, options: next };
    });
  const toggle = (k) =>
    setForm((s) => ({
      ...s,
      correct: { ...s.correct, [k]: !s.correct[k] },
    }));

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const correct = Object.entries(form.correct)
        .filter(([, v]) => v)
        .map(([k]) => k);

      const stageMap = {
        "Foundation": 1,
        "Intermediate": 2,
        "Advanced": 3
      };

      const levelMap = {
        "Foundation": "basic",
        "Intermediate": "intermediate",
        "Advanced": "advanced"
      };

      await updateQuestion(doc._id, {
        type: "mcq-multi",
        board: scope.board,
        class: scope.class,
        subject: scope.subject,
        topic: scope.topic,
        stage: stageMap[scope.stage] || 1,
        level: levelMap[scope.stage] || "basic",
        difficulty: scope.difficulty.toLowerCase(),
        question: form.question,
        options: form.options,
        correct,
        tags: form.tags,
        explanation: form.explanation,
      });
      toast.success("Question updated successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to update question");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-slate-800 mb-4">Question Content</h3>

        <div className="mb-6">
          <FieldLabel>Question Text</FieldLabel>
          <textarea
            value={form.question}
            onChange={(e) => update("question", e.target.value)}
            className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-300 min-h-32
                     focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            placeholder="Enter your question here..."
          />
        </div>

        <div className="mb-6">
          <FieldLabel>Answer Options</FieldLabel>
          <div className="grid sm:grid-cols-2 gap-4">
            {["A", "B", "C", "D"].map((L, i) => (
              <div key={L} className="space-y-2">
                <label className="text-sm font-medium text-slate-600 mb-1 block">Option {L}</label>
                <input
                  value={form.options[i]}
                  onChange={(e) => updateOpt(i, e.target.value)}
                  className="w-full rounded-xl px-4 py-2 bg-slate-50 border border-slate-300
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder={`Enter option ${L}`}
                />

                <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    className="hidden peer"
                    checked={form.correct[L]}
                    onChange={() => toggle(L)}
                  />
                  <div
                    className="w-5 h-5 rounded-md border-2 border-slate-400 
                    peer-checked:border-green-500 peer-checked:bg-green-500 transition-all"
                  ></div>
                  Mark as Correct
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mb-6">
          <div>
            <FieldLabel>Tags (comma separated)</FieldLabel>
            <input
              value={form.tags}
              onChange={(e) => update("tags", e.target.value)}
              className="w-full rounded-xl px-4 py-2 bg-slate-50 border border-slate-300
                       focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              placeholder="algebra, physics, grammar..."
            />
          </div>
        </div>

        <div className="mb-6">
          <FieldLabel>Explanation (optional)</FieldLabel>
          <textarea
            value={form.explanation}
            onChange={(e) => update("explanation", e.target.value)}
            className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-300 min-h-24
                     focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            placeholder="Explain why this is the correct answer..."
          />
        </div>

        <div className="flex justify-end">
          <SaveButton busy={busy} />
        </div>
      </Card>
    </form>
  );
}

function EditTrueFalse({ doc }) {
  return <Card><div className="text-center text-slate-600 p-6">True/False editing coming soon...</div></Card>;
}

function EditChoiceMatrix({ doc, scope, busy, setBusy }) {
  const [form, setForm] = useState(() => ({
    prompt: doc.choiceMatrix?.prompt || "",
    rows: doc.choiceMatrix?.rows || ["Statement 1"],
    cols: doc.choiceMatrix?.cols || ["True", "False"],
    correct: (doc.choiceMatrix?.correctCells || []).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {}),
  }));

  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  const toggle = (ri, ci) =>
    setForm((s) => ({
      ...s,
      correct: { ...s.correct, [`${ri}-${ci}`]: !s.correct[`${ri}-${ci}`] },
    }));
  const addRow = () =>
    setForm((s) => ({
      ...s,
      rows: [...s.rows, `Statement ${s.rows.length + 1}`],
    }));
  const addCol = () =>
    setForm((s) => ({
      ...s,
      cols: [...s.cols, `Choice ${s.cols.length + 1}`],
    }));

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const correctCells = Object.entries(form.correct)
        .filter(([, v]) => v)
        .map(([k]) => k);

      const stageMap = {
        "Foundation": 1,
        "Intermediate": 2,
        "Advanced": 3
      };

      const levelMap = {
        "Foundation": "basic",
        "Intermediate": "intermediate",
        "Advanced": "advanced"
      };

      await updateQuestion(doc._id, {
        type: "choice-matrix",
        board: scope.board,
        class: scope.class,
        subject: scope.subject,
        topic: scope.topic,
        stage: stageMap[scope.stage] || 1,
        level: levelMap[scope.stage] || "basic",
        difficulty: scope.difficulty.toLowerCase(),
        choiceMatrix: {
          prompt: form.prompt,
          rows: form.rows,
          cols: form.cols,
          correctCells,
        },
      });
      toast.success("Question updated successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to update question");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-slate-800 mb-4">Question Content</h3>

        <div className="mb-6">
          <FieldLabel>Prompt</FieldLabel>
          <textarea
            value={form.prompt}
            onChange={(e) => update("prompt", e.target.value)}
            className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-300 min-h-28
                     focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            placeholder="Enter the main question prompt..."
          />
        </div>

        <div className="flex gap-3 mb-6">
          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-all shadow active:scale-95"
          >
            Add Row
          </button>
          <button
            type="button"
            onClick={addCol}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white transition-all shadow active:scale-95"
          >
            Add Column
          </button>
        </div>

        <div className="overflow-auto rounded-2xl bg-white/60 backdrop-blur-lg shadow p-4">
          <table className="min-w-[700px] border-collapse w-full text-sm">
            <thead>
              <tr className="bg-slate-100/60 backdrop-blur">
                <th className="border border-slate-400 px-4 py-3 text-left font-semibold text-slate-700">
                  Row / Column
                </th>
                {form.cols.map((c, i) => (
                  <th key={i} className="border border-slate-400 px-4 py-3 text-center font-semibold text-slate-700">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {form.rows.map((r, ri) => (
                <tr key={ri} className="odd:bg-slate-50/30">
                  <td className="border border-slate-400 px-3 py-2">
                    <input
                      className="w-full rounded-lg border border-slate-400 px-3 py-2 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500"
                      value={r}
                      onChange={(e) =>
                        setForm((s) => {
                          const rows = [...s.rows];
                          rows[ri] = e.target.value;
                          return { ...s, rows };
                        })
                      }
                    />
                  </td>
                  {form.cols.map((c, ci) => (
                    <td key={ci} className="border border-slate-400 px-3 py-2 text-center">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="hidden peer"
                          checked={!!form.correct[`${ri}-${ci}`]}
                          onChange={() => toggle(ri, ci)}
                        />
                        <div className="
                        w-5 h-5 rounded-md border-2 border-slate-400 
                        peer-checked:border-green-500 peer-checked:bg-green-500
                        transition-all
                      "></div>
                      </label>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mt-6">
          <SaveButton busy={busy} />
        </div>
      </Card>
    </form>
  );
}

function EditClozeDrag({ doc, scope, busy, setBusy }) {
  const [form, setForm] = useState(() => ({
    text: doc.clozeDrag?.text || "",
    tokens: doc.clozeDrag?.tokens || [],
    correctMap: doc.clozeDrag?.correctMap || {},
    explanation: doc.explanation || "",
  }));

  const updateToken = (i, val) =>
    setForm((s) => {
      const tokens = [...s.tokens];
      tokens[i] = val;
      return { ...s, tokens };
    });

  async function save(e) {
    e.preventDefault();

    if (!scope.board || !scope.class || !scope.subject || !scope.topic ||
        !scope.stage || !scope.difficulty) {
      return toast.warn("Please complete all fields in the parameter selector above");
    }

    if (!form.text.trim()) {
      return toast.warn("Please enter the cloze text");
    }

    if (form.tokens.some((t) => !t.trim())) {
      return toast.warn("Please fill all tokens");
    }

    setBusy(true);
    try {
      const stageMap = {
        "Foundation": 1,
        "Intermediate": 2,
        "Advanced": 3
      };

      const levelMap = {
        "Foundation": "basic",
        "Intermediate": "intermediate",
        "Advanced": "advanced"
      };

      await updateQuestion(doc._id, {
        type: "cloze-drag",
        board: scope.board,
        class: scope.class,
        subject: scope.subject,
        topic: scope.topic,
        stage: stageMap[scope.stage] || 1,
        level: levelMap[scope.stage] || "basic",
        difficulty: scope.difficulty.toLowerCase(),
        explanation: form.explanation,
        clozeDrag: {
          text: form.text,
          tokens: form.tokens,
          correctMap: form.correctMap,
        },
      });

      toast.success("Question updated successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to update question");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-slate-800 mb-4">Question Content</h3>

        <div className="mb-6">
          <FieldLabel>Cloze Text</FieldLabel>
          <textarea
            className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-300 min-h-32
                     focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            placeholder="Use [[blank1]] notation inside the text..."
            value={form.text}
            onChange={(e) => setForm((s) => ({ ...s, text: e.target.value }))}
          />
        </div>

        <div className="mb-6">
          <FieldLabel>Tokens</FieldLabel>
          <div className="flex flex-wrap gap-3">
            {form.tokens.map((t, i) => (
              <input
                key={i}
                className="rounded-xl px-4 py-2 bg-slate-50 border border-slate-300
                         focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                placeholder={`Token ${i + 1}`}
                value={t}
                onChange={(e) => updateToken(i, e.target.value)}
              />
            ))}
            <button
              type="button"
              onClick={() =>
                setForm((s) => ({ ...s, tokens: [...s.tokens, ""] }))
              }
              className="flex items-center gap-2 rounded-xl border px-4 py-2 bg-purple-100 text-purple-600 hover:bg-purple-200 transition-all active:scale-95"
            >
              Add Token
            </button>
          </div>
        </div>

        <div className="mb-6">
          <FieldLabel>Correct Mapping</FieldLabel>
          <div className="space-y-3">
            {["blank1", "blank2", "blank3"].map((b) => (
              <div key={b} className="grid sm:grid-cols-2 gap-4">
                <div className="text-sm font-medium text-slate-700">{b}</div>
                <select
                  className="rounded-xl px-4 py-2 bg-slate-50 border border-slate-300
                           focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  value={form.correctMap[b] || ""}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      correctMap: {
                        ...s.correctMap,
                        [b]: e.target.value,
                      },
                    }))
                  }
                >
                  <option value="">Select token...</option>
                  {form.tokens.map((t, i) => (
                    <option key={i} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <FieldLabel>Explanation (optional)</FieldLabel>
          <textarea
            className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-300 min-h-24
                     focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            placeholder="Add explanation if needed..."
            value={form.explanation}
            onChange={(e) => setForm((s) => ({ ...s, explanation: e.target.value }))}
          />
        </div>

        <div className="flex justify-end">
          <SaveButton busy={busy} />
        </div>
      </Card>
    </form>
  );
}

function EditClozeSelect({ doc, scope, busy, setBusy }) {
  const [form, setForm] = useState(() => ({
    text: doc.clozeSelect?.text || "",
    blanks: doc.clozeSelect?.blanks || {
      blank1: { options: [], correct: "" },
    },
    explanation: doc.explanation || "",
  }));

  async function save(e) {
    e.preventDefault();

    if (!scope.board || !scope.class || !scope.subject || !scope.topic ||
        !scope.stage || !scope.difficulty) {
      return toast.warn("Please complete all fields in the parameter selector above");
    }

    if (!form.text.trim()) {
      return toast.warn("Please enter the cloze text");
    }

    if (!(form.blanks.blank1?.options || []).length) {
      return toast.warn("Please add at least one option");
    }

    if (!form.blanks.blank1?.correct) {
      return toast.warn("Please set the correct answer");
    }

    setBusy(true);
    try {
      const stageMap = {
        "Foundation": 1,
        "Intermediate": 2,
        "Advanced": 3
      };

      const levelMap = {
        "Foundation": "basic",
        "Intermediate": "intermediate",
        "Advanced": "advanced"
      };

      await updateQuestion(doc._id, {
        type: "cloze-select",
        board: scope.board,
        class: scope.class,
        subject: scope.subject,
        topic: scope.topic,
        stage: stageMap[scope.stage] || 1,
        level: levelMap[scope.stage] || "basic",
        difficulty: scope.difficulty.toLowerCase(),
        explanation: form.explanation,
        clozeSelect: {
          text: form.text,
          blanks: form.blanks,
        },
      });

      toast.success("Question updated successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to update question");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-slate-800 mb-4">Question Content</h3>

        <div className="mb-6">
          <FieldLabel>Cloze Text</FieldLabel>
          <textarea
            className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-300 min-h-28
                     focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            placeholder="Write text using [[blank1]] syntax..."
            value={form.text}
            onChange={(e) => setForm((s) => ({ ...s, text: e.target.value }))}
          />
        </div>

        <div className="mb-6">
          <FieldLabel>Blank Options</FieldLabel>
          <div className="rounded-2xl bg-white shadow-sm p-5 space-y-4">
            <div className="text-sm font-semibold text-slate-700">blank1</div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="font-medium text-slate-600 mb-1 block">
                  Options (comma-separated)
                </label>
                <input
                  className="w-full rounded-xl px-4 py-2 bg-slate-50 border border-slate-300
                           focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  value={(form.blanks.blank1?.options || []).join(",")}
                  placeholder="e.g. 50, 70, 100"
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      blanks: {
                        ...s.blanks,
                        blank1: {
                          ...(s.blanks.blank1 || {}),
                          options: e.target.value
                            .split(",")
                            .map((x) => x.trim())
                            .filter(Boolean),
                        },
                      },
                    }))
                  }
                />
              </div>

              <div>
                <label className="font-medium text-slate-600 mb-1 block">
                  Correct Answer
                </label>
                <input
                  className="w-full rounded-xl px-4 py-2 bg-slate-50 border border-slate-300
                           focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  placeholder="Correct option"
                  value={form.blanks.blank1?.correct || ""}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      blanks: {
                        ...s.blanks,
                        blank1: {
                          ...(s.blanks.blank1 || {}),
                          correct: e.target.value,
                        },
                      },
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <FieldLabel>Explanation (optional)</FieldLabel>
          <textarea
            className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-300 min-h-24
                     focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            placeholder="Write explanation if needed…"
            value={form.explanation}
            onChange={(e) => setForm((s) => ({ ...s, explanation: e.target.value }))}
          />
        </div>

        <div className="flex justify-end">
          <SaveButton busy={busy} />
        </div>
      </Card>
    </form>
  );
}

function EditClozeText({ doc, scope, busy, setBusy }) {
  const [form, setForm] = useState(() => ({
    text: doc.clozeText?.text || "",
    answers: {
      blank1: doc.clozeText?.answers?.blank1 || "",
    },
    explanation: doc.explanation || "",
  }));

  async function save(e) {
    e.preventDefault();

    if (!scope.board || !scope.class || !scope.subject || !scope.topic ||
        !scope.stage || !scope.difficulty) {
      return toast.warn("Please complete all fields in the parameter selector above");
    }

    if (!form.text.trim()) {
      return toast.warn("Please enter the cloze text");
    }

    if (!form.answers.blank1?.trim()) {
      return toast.warn("Please enter the answer for blank1");
    }

    setBusy(true);
    try {
      const stageMap = {
        "Foundation": 1,
        "Intermediate": 2,
        "Advanced": 3
      };

      const levelMap = {
        "Foundation": "basic",
        "Intermediate": "intermediate",
        "Advanced": "advanced"
      };

      await updateQuestion(doc._id, {
        type: "cloze-text",
        board: scope.board,
        class: scope.class,
        subject: scope.subject,
        topic: scope.topic,
        stage: stageMap[scope.stage] || 1,
        level: levelMap[scope.stage] || "basic",
        difficulty: scope.difficulty.toLowerCase(),
        explanation: form.explanation,
        clozeText: {
          text: form.text,
          answers: form.answers,
        },
      });

      toast.success("Question updated successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to update question");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-slate-800 mb-4">Question Content</h3>

        <div className="mb-6">
          <FieldLabel>Cloze Text</FieldLabel>
          <textarea
            className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-300 min-h-32
                     focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            placeholder="Write text using [[blank1]] syntax..."
            value={form.text}
            onChange={(e) => setForm((s) => ({ ...s, text: e.target.value }))}
          />
        </div>

        <div className="mb-6">
          <FieldLabel>Answer for blank1</FieldLabel>
          <input
            className="w-full rounded-xl px-4 py-2 bg-slate-50 border border-slate-300
                     focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            placeholder="Enter the correct answer..."
            value={form.answers.blank1}
            onChange={(e) =>
              setForm((s) => ({
                ...s,
                answers: { ...s.answers, blank1: e.target.value },
              }))
            }
          />
        </div>

        <div className="mb-6">
          <FieldLabel>Explanation (optional)</FieldLabel>
          <textarea
            className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-300 min-h-24
                     focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            placeholder="Add explanation if necessary..."
            value={form.explanation}
            onChange={(e) => setForm((s) => ({ ...s, explanation: e.target.value }))}
          />
        </div>

        <div className="flex justify-end">
          <SaveButton busy={busy} />
        </div>
      </Card>
    </form>
  );
}

function EditMatchList({ doc }) {
  return <Card><div className="text-center text-slate-600 p-6">Match List editing coming soon...</div></Card>;
}

function EditEssayRich({ doc }) {
  return <Card><div className="text-center text-slate-600 p-6">Essay Rich editing coming soon...</div></Card>;
}

function EditEssayPlain({ doc, scope, busy, setBusy }) {
  const [form, setForm] = useState(() => ({
    prompt: doc.prompt || "",
    plainText: doc.plainText || "",
  }));

  async function save(e) {
    e.preventDefault();

    if (!scope.board || !scope.class || !scope.subject || !scope.topic ||
        !scope.stage || !scope.difficulty) {
      return toast.warn("Please complete all fields in the parameter selector above");
    }

    if (!form.prompt.trim()) {
      return toast.warn("Please enter the essay prompt");
    }

    if (!form.plainText.trim()) {
      return toast.warn("Please enter the answer");
    }

    setBusy(true);
    try {
      const stageMap = {
        "Foundation": 1,
        "Intermediate": 2,
        "Advanced": 3
      };

      const levelMap = {
        "Foundation": "basic",
        "Intermediate": "intermediate",
        "Advanced": "advanced"
      };

      await updateQuestion(doc._id, {
        type: "essay-plain",
        board: scope.board,
        class: scope.class,
        subject: scope.subject,
        topic: scope.topic,
        stage: stageMap[scope.stage] || 1,
        level: levelMap[scope.stage] || "basic",
        difficulty: scope.difficulty.toLowerCase(),
        prompt: form.prompt,
        plainText: form.plainText,
      });

      toast.success("Question updated successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to update question");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-slate-800 mb-4">Question Content</h3>

        <div className="mb-6">
          <FieldLabel>Essay Prompt</FieldLabel>
          <input
            className="w-full rounded-xl px-4 py-2 bg-slate-50 border border-slate-300
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Enter essay prompt..."
            value={form.prompt}
            onChange={(e) => setForm((s) => ({ ...s, prompt: e.target.value }))}
          />
        </div>

        <div className="mb-6">
          <FieldLabel>Answer (Plain Text)</FieldLabel>
          <textarea
            className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-300 min-h-32
                     focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            placeholder="Write the answer..."
            value={form.plainText}
            onChange={(e) => setForm((s) => ({ ...s, plainText: e.target.value }))}
          />
        </div>

        <div className="flex justify-end">
          <SaveButton busy={busy} />
        </div>
      </Card>
    </form>
  );
}
