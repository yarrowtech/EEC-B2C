import React, { useState } from "react";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { postQuestion } from "../../lib/api";
import { FiCheckSquare, FiAlertCircle, FiUpload } from "react-icons/fi";

export default function QuestionsTrueFalse() {
  const { scope } = useQuestionScope();
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    statement: "",
    answer: "true",
    explanation: "",
  });

  async function submit(e) {
    e.preventDefault();
    if (!scope.subject || !scope.topic)
      return alert("Pick Subject & Topic first");

    setBusy(true);
    try {
      const payload = {
        subject: scope.subject,
        topic: scope.topic,
        question: form.statement,
        answer: form.answer,
        explanation: form.explanation,
      };

      const out = await postQuestion("true-false", payload);
      alert(`Saved! id=${out.id}`);

      setForm({ statement: "", answer: "true", explanation: "" });
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="
        space-y-8 
        rounded-3xl bg-gradient-to-br from-white/70 to-white/30 
        border border-white/40 backdrop-blur-xl shadow-xl p-8
      "
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-green-100 text-green-600 rounded-2xl shadow">
          <FiCheckSquare size={22} />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          True / False
        </h1>
      </div>

      {/* Subject / Topic Picker */}
      <SubjectTopicPicker />

      {/* Statement */}
      <div className="rounded-2xl backdrop-blur-lg p-6">
        <label className="font-semibold text-slate-800 mb-2 block">
          Statement
        </label>
        <textarea
          className="
            w-full rounded-xl px-4 py-3 bg-white shadow-sm min-h-28
            focus:ring-2 focus:ring-blue-500
          "
          placeholder="Enter a statement for True/False..."
          value={form.statement}
          onChange={(e) => setForm((s) => ({ ...s, statement: e.target.value }))}
        />
      </div>

      {/* True / False Selector */}
      <div
        className="
        rounded-2xl backdrop-blur-lg p-6 grid sm:grid-cols-2 gap-6
      "
      >
        <div>
          <label className="font-semibold text-slate-800 mb-2 block">
            Correct Answer
          </label>

          <select
            className="
              w-full rounded-xl px-4 py-3 bg-white shadow-sm 
              focus:ring-2 focus:ring-green-500 transition-all
            "
            value={form.answer}
            onChange={(e) => setForm((s) => ({ ...s, answer: e.target.value }))}
          >
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        </div>

        {/* Explanation */}
        <div>
          <label className="font-semibold text-slate-800 mb-2 block">
            Explanation (optional)
          </label>
          <textarea
            className="
              w-full rounded-xl px-4 py-3 bg-white shadow-sm min-h-24 
              focus:ring-2 focus:ring-purple-500
            "
            placeholder="Explain the logic behind the answer..."
            value={form.explanation}
            onChange={(e) => setForm((s) => ({ ...s, explanation: e.target.value }))}
          />
        </div>
      </div>

      {/* Save Button */}
      <button
        disabled={busy}
        className="
          flex items-center gap-2
          rounded-xl px-6 py-3 
          bg-green-600 text-white font-semibold
          shadow-md hover:bg-green-700 hover:shadow-xl
          active:scale-95 transition-all disabled:opacity-50
        "
      >
        <FiUpload /> {busy ? "Saving..." : "Save Question"}
      </button>
    </form>
  );
}
