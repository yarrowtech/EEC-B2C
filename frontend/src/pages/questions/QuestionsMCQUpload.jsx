import React, { useState } from "react";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { postQuestion } from "../../lib/api";
import { FiSliders, FiHelpCircle, FiCheckCircle, FiTag, FiUpload } from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";

export default function QuestionsMCQUpload() {
  const { scope } = useQuestionScope();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    difficulty: "easy",
    question: "",
    options: ["", "", "", ""],
    correct: "A",
    explanation: "",
    tags: "",
    stage: 1,
    level: "basic",
    className: "",
    board: "",
  });
  const user = JSON.parse(localStorage.getItem("user"));

  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  const updateOpt = (i, v) =>
    setForm((s) => {
      const next = [...s.options];
      next[i] = v;
      return { ...s, options: next };
    });

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
      const payload = {
        subject: scope.subject,
        topic: scope.topic,
        difficulty: form.difficulty,
        tags: form.tags,
        question: form.question,
        options: form.options,
        correct: form.correct,
        explanation: form.explanation,
        stage: form.stage,
        level: form.level,
        class: form.className,
        board: form.board,
        // createdBy: req.user.id, 
      };

      const out = await postQuestion("mcq-single", payload);
      // alert(`Saved! id=${out.id}`);
      toast.success("Question saved!");

      setForm({
        difficulty: "easy",
        question: "",
        options: ["", "", "", ""],
        correct: "A",
        explanation: "",
        tags: "",
        stage: 1,
        level: "basic",
        className: "",
        board: "",
      });
    } catch (err) {
      // alert(err.message);
      toast.error(err.message || "Failed to save question.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <ToastContainer />
    <form
      onSubmit={submit}
      className="space-y-8 rounded-3xl bg-gradient-to-br from-white/70 to-white/30 
                 border border-white/40 backdrop-blur-xl shadow-xl p-8"
    >
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl shadow">
          <FiSliders size={22} />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          MCQ — Single Correct
        </h1>
      </div>

      {/* Subject / Topic Picker */}
      <SubjectTopicPicker />

      {/* Section: Settings */}
      <div className="rounded-2xl backdrop-blur-lg p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
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
                         focus:ring-2 focus:ring-blue-500"
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
              value={form.stage}
              onChange={(e) => update("stage", Number(e.target.value))}
            >
              <option value={1}>Stage 1: Basic</option>
              {/* <option value={2}>Stage 2: Intermediate</option>
              <option value={3}>Stage 3: Advanced</option> */}
            </select>
          </div>

          <div>
            <label className="font-medium text-slate-700 mb-1">Select Class</label>
            <select
              className="w-full rounded-xl px-4 py-3 bg-white shadow-sm 
               focus:ring-2 focus:ring-purple-500"
              value={form.className}
              onChange={(e) => update("className", e.target.value)}
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

          <select
            className="w-full rounded-xl px-4 py-3"
            value={form.board}
            onChange={(e) => update("board", e.target.value)}
          >
            <option value="">Select Board</option>
            <option value="CBSE">CBSE</option>
            <option value="ICSE">ICSE</option>
            <option value="WB Board">WB Board</option>
            <option value="State Board">State Board</option>
          </select>



          {/* Tags */}
          <div>
            <label className="font-medium text-slate-700 mb-1 flex gap-1 items-center">
              <FiTag className="text-green-600" /> Tags
            </label>
            <input
              className="w-full rounded-xl px-4 py-3 bg-white shadow-sm 
                         focus:ring-2 focus:ring-green-500"
              placeholder="algebra, motion, grammar…"
              value={form.tags}
              onChange={(e) => update("tags", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Section: Question Text */}
      <div className="rounded-2xlbackdrop-blur-lg p-6">
        <label className="font-semibold text-slate-800 mb-2 block">
          Question
        </label>
        <textarea
          className="w-full rounded-xl px-4 py-3 bg-white shadow-sm min-h-32 
                     focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your question here..."
          value={form.question}
          onChange={(e) => update("question", e.target.value)}
        />
      </div>

      {/* Section: Options */}
      <div className="rounded-2xl backdrop-blur-lg p-6">
        <div className="flex items-center gap-2 mb-3">
          <FiCheckCircle className="text-green-600" />
          <h2 className="text-lg font-semibold text-slate-800">Options</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {["A", "B", "C", "D"].map((L, i) => (
            <div key={L}>
              <label className="font-medium text-slate-700 mb-1">Option {L}</label>
              <input
                className="w-full rounded-xl px-4 py-3 bg-white shadow-sm 
                           focus:ring-2 focus:ring-blue-500"
                placeholder={`Enter option ${L}`}
                value={form.options[i]}
                onChange={(e) => updateOpt(i, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Section: Correct + Explanation */}
      <div className="rounded-2xl backdrop-blur-lg p-6">
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="font-medium text-slate-700 mb-2 block">
              Correct Option
            </label>
            <select
              className="w-full rounded-xl px-4 py-3 bg-white shadow-sm 
                         focus:ring-2 focus:ring-blue-500"
              value={form.correct}
              onChange={(e) => update("correct", e.target.value)}
            >
              {["A", "B", "C", "D"].map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-medium text-slate-700 mb-2 block">
              Explanation (optional)
            </label>
            <textarea
              className="w-full rounded-xl px-4 py-3 bg-white shadow-sm min-h-24 
                         focus:ring-2 focus:ring-purple-500"
              placeholder="Explain the logic behind the answer..."
              value={form.explanation}
              onChange={(e) => update("explanation", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        disabled={busy}
        className="
          flex items-center gap-2
          rounded-xl px-6 py-3 
          bg-blue-600 text-white font-semibold
          shadow-md hover:bg-blue-700 hover:shadow-xl
          active:scale-95 transition-all disabled:opacity-50
        "
      >
        <FiUpload /> {busy ? "Saving..." : "Save Question"}
      </button>
    </form>
  </>
  );
}
