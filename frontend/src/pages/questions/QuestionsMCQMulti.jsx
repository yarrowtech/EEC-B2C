import React, { useState, useEffect } from "react";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { postQuestion } from "../../lib/api";
import {
  FiSliders,
  FiHelpCircle,
  FiEdit3,
  FiTag,
  FiCheckCircle,
  FiUpload,
} from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";

export default function QuestionsMCQMulti() {
  const { scope } = useQuestionScope();
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    difficulty: "easy",
    question: "",
    options: ["", "", "", ""],
    correct: { A: false, B: false, C: false, D: false },
    explanation: "",
    tags: "",
    stage: 1,
    className: "",
    board: "",
  });
  const [classes, setClasses] = useState([]);
  const [boards, setBoards] = useState([]);

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

  async function submit(e) {
    e.preventDefault();
    if (!scope.subject || !scope.topic)
      // return alert("Pick Subject & Topic first");
      return toast.warn("Pick Subject & Topic first");

    if (!form.className)
      return toast.warn("Select Class for the question.");

    if (!form.board)
      return toast.warn("Select Board for the question.");

    setBusy(true);
    try {
      const correct = Object.entries(form.correct)
        .filter(([, v]) => v)
        .map(([k]) => k);

      const payload = {
        subject: scope.subject,
        topic: scope.topic,
        difficulty: form.difficulty,
        tags: form.tags,
        question: form.question,
        options: form.options,
        correct,
        explanation: form.explanation,
        stage: form.stage,
        class: form.className,
        board: form.board,
      };

      const out = await postQuestion("mcq-multi", payload);
      // alert(`Saved! id=${out.id}`);
      toast.success("Question saved!");

      setForm({
        difficulty: "easy",
        question: "",
        options: ["", "", "", ""],
        correct: { A: false, B: false, C: false, D: false },
        explanation: "",
        tags: "",
        board: "",
        className: "",
        stage: 1,
      });
    } catch (err) {
      // alert(err.message);
      toast.error(err.message || "Failed to save question.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    async function loadMeta() {
      try {
        const [clsRes, brdRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/classes`),
          fetch(`${import.meta.env.VITE_API_URL}/api/boards`)
        ]);

        const clsData = await clsRes.json();
        const brdData = await brdRes.json();

        setClasses(Array.isArray(clsData) ? clsData : []);
        setBoards(Array.isArray(brdData) ? brdData : []);
      } catch (err) {
        console.error("Failed to load class/board", err);
      }
    }

    loadMeta();
  }, []);

  return (
    <>
      <ToastContainer position="bottom-right" />
      <form
        onSubmit={submit}
        className="
        space-y-8 
        rounded-3xl bg-gradient-to-br from-white/70 to-white/30 
        border border-white/40 backdrop-blur-xl shadow-xl p-8
      "
      >
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl shadow">
            <FiEdit3 size={22} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            MCQ — Multiple Correct
          </h1>
        </div>

        {/* Subject / Topic Picker */}
        <SubjectTopicPicker />

        {/* Section: Settings */}
        <div className="rounded-2xl backdrop-blur-lg p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <FiSliders className="text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800">Question Settings</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {/* Difficulty */}
            <div>
              <label className="font-medium text-slate-700 mb-1 flex gap-1 items-center">
                <FiHelpCircle className="text-blue-500" /> Difficulty
              </label>
              <select
                className="w-full rounded-xl px-4 py-3 bg-white shadow-sm 
      focus:ring-2 focus:ring-blue-500 transition-all"
                value={form.difficulty}
                onChange={(e) => update("difficulty", e.target.value)}
              >
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {/* Stage */}
            <div>
              <label className="font-medium text-slate-700 mb-1">Stage</label>
              <select
                className="w-full rounded-xl px-4 py-3 bg-white shadow-sm 
      focus:ring-2 focus:ring-purple-500"
                value={form.stage || 1}
                onChange={(e) => update("stage", Number(e.target.value))}
              >
                <option value={1}>Stage 1 — Basic</option>
              </select>
            </div>

            {/* Class */}
            <div>
              <label className="font-medium text-slate-700 mb-1">Select Class</label>
              <select
                className="w-full rounded-xl px-4 py-3 bg-white shadow-sm 
      focus:ring-2 focus:ring-purple-500"
                value={form.className || ""}
                onChange={(e) => update("className", e.target.value)}
              >
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c._id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-medium text-slate-700 mb-1 flex gap-1 items-center">Select Board</label>
              <select
                className="w-full rounded-xl px-4 py-3 bg-white shadow-sm focus:ring-2 focus:ring-purple-500"
                value={form.board}
                onChange={(e) => update("board", e.target.value)}
              >
                {/* <option value="">Select Board</option>
                <option value="CBSE">CBSE</option>
                <option value="ICSE">ICSE</option> */}
                <option value="">Select Board</option>
                {boards.map((b) => (
                  <option key={b._id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="font-medium text-slate-700 mb-1 flex gap-1 items-center">
                <FiTag className="text-green-600" /> Tags
              </label>
              <input
                className="w-full rounded-xl px-4 py-3 bg-white shadow-sm 
      focus:ring-2 focus:ring-green-500"
                placeholder="chapter-name, keyword…"
                value={form.tags}
                onChange={(e) => update("tags", e.target.value)}
              />
            </div>
          </div>

        </div>

        {/* Question Field */}
        <div className="rounded-2xl backdrop-blur-lg p-6">
          <label className="font-semibold text-slate-800 mb-2 block">
            Question
          </label>
          <textarea
            className="
            w-full rounded-xl px-4 py-3 bg-white shadow-sm min-h-32
            focus:ring-2 focus:ring-blue-500
          "
            placeholder="Enter your question..."
            value={form.question}
            onChange={(e) => update("question", e.target.value)}
          />
        </div>

        {/* Options */}
        <div className="rounded-2xl backdrop-blur-lg p-6">
          <div className="flex items-center gap-2 mb-3">
            <FiCheckCircle className="text-green-600" />
            <h2 className="text-lg font-semibold text-slate-800">Options</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {["A", "B", "C", "D"].map((L, i) => (
              <div key={L} className="space-y-2">
                <label className="font-medium text-slate-700">Option {L}</label>

                <input
                  className="
                  w-full rounded-xl px-4 py-3 bg-white shadow-sm 
                  focus:ring-2 focus:ring-indigo-500
                "
                  placeholder={`Enter option ${L}`}
                  value={form.options[i]}
                  onChange={(e) => updateOpt(i, e.target.value)}
                />

                {/* Custom Checkbox */}
                <label
                  className="
                  flex items-center gap-3 cursor-pointer 
                  text-sm font-medium text-slate-700
                "
                >
                  <input
                    type="checkbox"
                    className="hidden peer"
                    checked={form.correct[L]}
                    onChange={() => toggle(L)}
                  />
                  <div
                    className="
                    w-5 h-5 rounded-md border-2 border-slate-400 
                    peer-checked:border-green-500 peer-checked:bg-green-500 
                    transition-all
                  "
                  ></div>
                  Mark as Correct
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Explanation */}
        <div className="rounded-2xl backdrop-blur-lg p-6">
          <label className="font-medium text-slate-700 mb-2 block">
            Explanation (optional)
          </label>
          <textarea
            className="
            w-full rounded-xl px-4 py-3 bg-white shadow-sm min-h-24 
            focus:ring-2 focus:ring-purple-500
          "
            placeholder="Add explanation if needed..."
            value={form.explanation}
            onChange={(e) => update("explanation", e.target.value)}
          />
        </div>

        {/* Save Button */}
        <button
          disabled={busy}
          className="
          flex items-center gap-2
          rounded-xl px-6 py-3 
          bg-indigo-600 text-white font-semibold 
          shadow-md hover:bg-indigo-700 hover:shadow-xl 
          active:scale-95 transition-all disabled:opacity-50
        "
        >
          <FiUpload /> {busy ? "Saving..." : "Save Question"}
        </button>
      </form>
    </>
  );
}
