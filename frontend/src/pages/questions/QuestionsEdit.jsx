import React, { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FiSave, FiEdit3, FiChevronLeft } from "react-icons/fi";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { getJSON, updateQuestion } from "../../lib/api";
import { buildQuestionStagePayload, buildStageOptions, formatStageLabel, normalizeStageNumber } from "../../lib/stage";
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

        setStage(String(normalizeStageNumber(d.stage || 1)));

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
  const [stages, setStages] = useState([1, 2, 3]);

  const DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard"];

  useEffect(() => {
    loadBoards();
    loadClasses();
    loadStages();
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

  const loadStages = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/questions/stages`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
      });
      setStages(buildStageOptions([scope.stage, ...(res.data?.stages || [])]));
    } catch (err) {
      console.error("Failed to load stages:", err);
      setStages(buildStageOptions([scope.stage]));
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
            {stages.map((stage) => (
              <option key={stage} value={String(stage)}>
                {formatStageLabel(stage)}
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
      const stagePayload = buildQuestionStagePayload(scope.stage);

      await updateQuestion(doc._id, {
        type: "mcq-single",
        board: scope.board,
        class: scope.class,
        subject: scope.subject,
        topic: scope.topic,
        ...stagePayload,
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

      const stagePayload = buildQuestionStagePayload(scope.stage);

      await updateQuestion(doc._id, {
        type: "mcq-multi",
        board: scope.board,
        class: scope.class,
        subject: scope.subject,
        topic: scope.topic,
        ...stagePayload,
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

function EditTrueFalse({ doc, scope, busy, setBusy }) {
  const resolvedAnswer = (() => {
    if (typeof doc.answer === "boolean") return doc.answer ? "true" : "false";
    if (typeof doc.answer === "string") return doc.answer.toLowerCase() === "false" ? "false" : "true";
    if (Array.isArray(doc.correct) && doc.correct.length > 0) {
      return String(doc.correct[0]).toLowerCase() === "false" ? "false" : "true";
    }
    return "true";
  })();

  const [form, setForm] = useState(() => ({
    statement: doc.question || doc.statement || "",
    answer: resolvedAnswer,
    tags: (doc.tags || []).join(","),
    explanation: doc.explanation || "",
  }));

  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  async function save(e) {
    e.preventDefault();

    if (!scope.board || !scope.class || !scope.subject || !scope.topic ||
        !scope.stage || !scope.difficulty) {
      return toast.warn("Please complete all fields in the parameter selector above");
    }

    if (!form.statement.trim()) {
      return toast.warn("Please enter the statement");
    }

    setBusy(true);
    try {
      const stagePayload = buildQuestionStagePayload(scope.stage);

      await updateQuestion(doc._id, {
        type: "true-false",
        board: scope.board,
        class: scope.class,
        subject: scope.subject,
        topic: scope.topic,
        ...stagePayload,
        difficulty: scope.difficulty.toLowerCase(),
        question: form.statement,
        answer: form.answer,
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
          <FieldLabel>Statement</FieldLabel>
          <textarea
            value={form.statement}
            onChange={(e) => update("statement", e.target.value)}
            className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-300 min-h-32
                     focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            placeholder="Enter the true/false statement..."
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mb-6">
          <div>
            <FieldLabel>Correct Answer</FieldLabel>
            <select
              value={form.answer}
              onChange={(e) => update("answer", e.target.value)}
              className="w-full rounded-xl px-4 py-2 bg-slate-50 border border-slate-300
                       focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            >
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          </div>

          <div>
            <FieldLabel>Tags (comma separated)</FieldLabel>
            <input
              value={form.tags}
              onChange={(e) => update("tags", e.target.value)}
              className="w-full rounded-xl px-4 py-2 bg-slate-50 border border-slate-300
                       focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              placeholder="facts, logic, science..."
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
            placeholder="Explain why this statement is true or false..."
          />
        </div>

        <div className="flex justify-end">
          <SaveButton busy={busy} />
        </div>
      </Card>
    </form>
  );
}

function EditChoiceMatrix({ doc, scope, busy, setBusy }) {
  const [form, setForm] = useState(() => ({
    prompt: doc.choiceMatrix?.prompt || "",
    rows: doc.choiceMatrix?.rows || ["Statement 1"],
    cols: doc.choiceMatrix?.cols || ["True", "False"],
    explanation: doc.explanation || "",
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

      const stagePayload = buildQuestionStagePayload(scope.stage);

      await updateQuestion(doc._id, {
        type: "choice-matrix",
        board: scope.board,
        class: scope.class,
        subject: scope.subject,
        topic: scope.topic,
        ...stagePayload,
        difficulty: scope.difficulty.toLowerCase(),
        explanation: form.explanation,
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

        <div className="mt-6">
          <FieldLabel>Explanation (optional)</FieldLabel>
          <textarea
            value={form.explanation}
            onChange={(e) => update("explanation", e.target.value)}
            className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-300 min-h-24
                     focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            placeholder="Explain why these matrix choices are correct..."
          />
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
      const stagePayload = buildQuestionStagePayload(scope.stage);

      await updateQuestion(doc._id, {
        type: "cloze-drag",
        board: scope.board,
        class: scope.class,
        subject: scope.subject,
        topic: scope.topic,
        ...stagePayload,
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
      const stagePayload = buildQuestionStagePayload(scope.stage);

      await updateQuestion(doc._id, {
        type: "cloze-select",
        board: scope.board,
        class: scope.class,
        subject: scope.subject,
        topic: scope.topic,
        ...stagePayload,
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
      const stagePayload = buildQuestionStagePayload(scope.stage);

      await updateQuestion(doc._id, {
        type: "cloze-text",
        board: scope.board,
        class: scope.class,
        subject: scope.subject,
        topic: scope.topic,
        ...stagePayload,
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

function EditMatchList({ doc, scope, busy, setBusy }) {
  const [form, setForm] = useState(() => {
    const sourcePairs = doc.matchList?.pairs || {};
    const normalizedPairs =
      sourcePairs instanceof Map
        ? Object.fromEntries(sourcePairs.entries())
        : { ...sourcePairs };

    return {
      prompt: doc.matchList?.prompt || "",
      left: Array.isArray(doc.matchList?.left) && doc.matchList.left.length ? doc.matchList.left : ["", ""],
      right: Array.isArray(doc.matchList?.right) && doc.matchList.right.length ? doc.matchList.right : ["", ""],
      pairs: normalizedPairs,
      explanation: doc.explanation || "",
    };
  });

  const update = (key, value) => setForm((s) => ({ ...s, [key]: value }));

  const updateLeft = (index, value) =>
    setForm((s) => {
      const next = [...s.left];
      next[index] = value;
      return { ...s, left: next };
    });

  const updateRight = (index, value) =>
    setForm((s) => {
      const next = [...s.right];
      next[index] = value;
      return { ...s, right: next };
    });

  const addLeft = () => setForm((s) => ({ ...s, left: [...s.left, ""] }));
  const addRight = () => setForm((s) => ({ ...s, right: [...s.right, ""] }));

  const removeLeft = (index) =>
    setForm((s) => {
      if (s.left.length <= 2) return s;
      const left = s.left.filter((_, i) => i !== index);
      const pairs = {};
      left.forEach((_, li) => {
        const oldIndex = li >= index ? li + 1 : li;
        if (s.pairs[String(oldIndex)] !== undefined) {
          pairs[String(li)] = s.pairs[String(oldIndex)];
        }
      });
      return { ...s, left, pairs };
    });

  const removeRight = (index) =>
    setForm((s) => {
      if (s.right.length <= 2) return s;
      const right = s.right.filter((_, i) => i !== index);
      const pairs = {};
      Object.entries(s.pairs).forEach(([li, ri]) => {
        const rightIndex = Number(ri);
        if (Number.isNaN(rightIndex)) return;
        if (rightIndex === index) return;
        pairs[li] = String(rightIndex > index ? rightIndex - 1 : rightIndex);
      });
      return { ...s, right, pairs };
    });

  async function save(e) {
    e.preventDefault();

    if (!scope.board || !scope.class || !scope.subject || !scope.topic ||
        !scope.stage || !scope.difficulty) {
      return toast.warn("Please complete all fields in the parameter selector above");
    }

    if (!form.prompt.trim()) {
      return toast.warn("Please enter the prompt");
    }

    if (form.left.some((x) => !x.trim()) || form.right.some((x) => !x.trim())) {
      return toast.warn("Please fill all left and right items");
    }

    const missingPairs = form.left
      .map((_, li) => li)
      .filter((li) => form.pairs[String(li)] === undefined || form.pairs[String(li)] === "");
    if (missingPairs.length) {
      return toast.warn("Please set a right-side match for each left item");
    }

    setBusy(true);
    try {
      const stagePayload = buildQuestionStagePayload(scope.stage);

      await updateQuestion(doc._id, {
        type: "match-list",
        board: scope.board,
        class: scope.class,
        subject: scope.subject,
        topic: scope.topic,
        ...stagePayload,
        difficulty: scope.difficulty.toLowerCase(),
        explanation: form.explanation,
        matchList: {
          prompt: form.prompt,
          left: form.left,
          right: form.right,
          pairs: form.pairs,
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
            className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-300 min-h-24
                     focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            placeholder="Match the following..."
            value={form.prompt}
            onChange={(e) => update("prompt", e.target.value)}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mb-6">
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <FieldLabel>Left List</FieldLabel>
              <button
                type="button"
                onClick={addLeft}
                className="text-xs rounded-lg px-3 py-1 bg-blue-600 text-white font-semibold"
              >
                Add
              </button>
            </div>

            {form.left.map((val, i) => (
              <div key={`left-${i}`} className="flex gap-2">
                <input
                  className="w-full rounded-xl px-4 py-2 bg-white border border-slate-300
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder={`Left item ${i + 1}`}
                  value={val}
                  onChange={(e) => updateLeft(i, e.target.value)}
                />
                <button
                  type="button"
                  disabled={form.left.length <= 2}
                  onClick={() => removeLeft(i)}
                  className="rounded-xl px-3 py-2 bg-white border border-slate-300 text-slate-700 disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <FieldLabel>Right List</FieldLabel>
              <button
                type="button"
                onClick={addRight}
                className="text-xs rounded-lg px-3 py-1 bg-purple-600 text-white font-semibold"
              >
                Add
              </button>
            </div>

            {form.right.map((val, i) => (
              <div key={`right-${i}`} className="flex gap-2">
                <input
                  className="w-full rounded-xl px-4 py-2 bg-white border border-slate-300
                           focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  placeholder={`Right item ${i + 1}`}
                  value={val}
                  onChange={(e) => updateRight(i, e.target.value)}
                />
                <button
                  type="button"
                  disabled={form.right.length <= 2}
                  onClick={() => removeRight(i)}
                  className="rounded-xl px-3 py-2 bg-white border border-slate-300 text-slate-700 disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6 rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-4">
          <FieldLabel>Correct Pairs</FieldLabel>
          {form.left.map((leftVal, li) => (
            <div key={`pair-${li}`} className="grid sm:grid-cols-2 gap-4 items-center">
              <div className="font-semibold text-slate-700">{leftVal || `Left ${li + 1}`}</div>
              <select
                className="w-full rounded-xl px-4 py-2 bg-white border border-slate-300
                         focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                value={form.pairs[String(li)] ?? ""}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    pairs: { ...s.pairs, [String(li)]: e.target.value },
                  }))
                }
              >
                <option value="">Select right item</option>
                {form.right.map((rightVal, ri) => (
                  <option key={`pair-opt-${li}-${ri}`} value={String(ri)}>
                    {rightVal || `Right ${ri + 1}`}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <FieldLabel>Explanation (optional)</FieldLabel>
          <textarea
            className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-300 min-h-24
                     focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            placeholder="Explain the matching logic..."
            value={form.explanation}
            onChange={(e) => update("explanation", e.target.value)}
          />
        </div>

        <div className="flex justify-end">
          <SaveButton busy={busy} />
        </div>
      </Card>
    </form>
  );
}

function EditEssayRich({ doc, scope, busy, setBusy }) {
  const editorRef = useRef(null);
  const [form, setForm] = useState(() => ({
    prompt: doc.prompt || "",
    tags: (doc.tags || []).join(","),
    explanation: doc.explanation || "",
    richHtml: doc.richHtml || "",
  }));

  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.innerHTML = form.richHtml || "";
  }, [doc._id]);

  const applyCmd = (cmd) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(cmd, false, null);
    setForm((s) => ({ ...s, richHtml: editorRef.current?.innerHTML || "" }));
  };

  async function save(e) {
    e.preventDefault();

    if (!scope.board || !scope.class || !scope.subject || !scope.topic ||
        !scope.stage || !scope.difficulty) {
      return toast.warn("Please complete all fields in the parameter selector above");
    }

    if (!form.prompt.trim()) {
      return toast.warn("Please enter the essay prompt");
    }

    setBusy(true);
    try {
      const stagePayload = buildQuestionStagePayload(scope.stage);
      const html = editorRef.current?.innerHTML || "";

      await updateQuestion(doc._id, {
        type: "essay-rich",
        board: scope.board,
        class: scope.class,
        subject: scope.subject,
        topic: scope.topic,
        ...stagePayload,
        difficulty: scope.difficulty.toLowerCase(),
        prompt: form.prompt,
        richHtml: html,
        tags: form.tags,
        explanation: form.explanation,
      });

      toast.success("Question updated successfully!");
      setForm((s) => ({ ...s, richHtml: html }));
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

        <div className="mb-6 rounded-2xl bg-slate-50 border border-slate-200 p-4">
          <FieldLabel>Answer Guidance (Rich Text)</FieldLabel>
          <div className="flex items-center gap-2 mb-3">
            <button type="button" onClick={() => applyCmd("bold")} className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-blue-50 transition">
              <strong>B</strong>
            </button>
            <button type="button" onClick={() => applyCmd("italic")} className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-blue-50 transition">
              <em>I</em>
            </button>
            <button type="button" onClick={() => applyCmd("underline")} className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-blue-50 transition">
              <span className="underline">U</span>
            </button>
            <button type="button" onClick={() => applyCmd("insertUnorderedList")} className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-blue-50 transition">
              • List
            </button>
            <button type="button" onClick={() => applyCmd("insertOrderedList")} className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-blue-50 transition">
              1. List
            </button>
          </div>

          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className="min-h-40 rounded-xl bg-white p-4 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onInput={() => setForm((s) => ({ ...s, richHtml: editorRef.current?.innerHTML || "" }))}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mb-6">
          <div>
            <FieldLabel>Tags (comma separated)</FieldLabel>
            <input
              className="w-full rounded-xl px-4 py-2 bg-slate-50 border border-slate-300
                       focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              placeholder="descriptive writing, grammar..."
              value={form.tags}
              onChange={(e) => setForm((s) => ({ ...s, tags: e.target.value }))}
            />
          </div>
          <div>
            <FieldLabel>Explanation (optional)</FieldLabel>
            <textarea
              className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-300 min-h-24
                       focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="Add evaluation hint or rubric note..."
              value={form.explanation}
              onChange={(e) => setForm((s) => ({ ...s, explanation: e.target.value }))}
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
      const stagePayload = buildQuestionStagePayload(scope.stage);

      await updateQuestion(doc._id, {
        type: "essay-plain",
        board: scope.board,
        class: scope.class,
        subject: scope.subject,
        topic: scope.topic,
        ...stagePayload,
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
