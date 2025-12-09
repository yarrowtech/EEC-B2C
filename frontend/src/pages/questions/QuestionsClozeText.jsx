import React, { useState } from "react";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { postQuestion } from "../../lib/api";
import { FiFileText, FiEdit3, FiUpload } from "react-icons/fi";

export default function QuestionsClozeText() {
  const { scope } = useQuestionScope();
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    text: "The chemical formula of water is [[blank1]].",
    answers: { blank1: "H2O" },
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
        explanation: form.explanation,
        clozeText: {
          text: form.text,
          answers: form.answers,
        },
      };

      const out = await postQuestion("cloze-text", payload);
      alert(`Saved! id=${out.id}`);
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
        rounded-3xl 
        bg-gradient-to-br from-white/70 to-white/30 
        border border-white/40 
        backdrop-blur-xl 
        shadow-xl p-8
      "
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl shadow">
          <FiEdit3 size={22} />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Cloze — Free Text
        </h1>
      </div>

      {/* Subject picker */}
      <SubjectTopicPicker />

      {/* Text Section */}
      <div
        className="
          rounded-2xl backdrop-blur-lg p-6
        "
      >
        <div className="flex items-center gap-2 mb-3">
          <FiFileText className="text-indigo-600" />
          <h2 className="font-semibold text-slate-800 text-lg">Cloze Text</h2>
        </div>

        <textarea
          className="
            w-full rounded-xl px-4 py-3 bg-white shadow-sm min-h-32
            focus:ring-2 focus:ring-indigo-500 transition-all
          "
          placeholder="Write text using [[blank1]] syntax..."
          value={form.text}
          onChange={(e) =>
            setForm((s) => ({ ...s, text: e.target.value }))
          }
        />
      </div>

      {/* Answer Section */}
      <div
        className="
          rounded-2xl bg-white/60 backdrop-blur-lg shadow p-6 space-y-4
        "
      >
        <h2 className="font-semibold text-slate-800 text-lg flex items-center gap-2">
          <FiEdit3 className="text-purple-600" />
          Answers for Blanks
        </h2>

        {/* Blank 1 */}
        <div>
          <label className="font-medium text-slate-600 mb-1 block">
            Answer for blank1
          </label>
          <input
            className="
              w-full rounded-xl px-4 py-2 bg-white shadow-sm
              focus:ring-2 focus:ring-purple-500
            "
            placeholder="Enter the correct answer..."
            value={form.answers.blank1 || ""}
            onChange={(e) =>
              setForm((s) => ({
                ...s,
                answers: { ...s.answers, blank1: e.target.value },
              }))
            }
          />
        </div>
      </div>

      {/* Explanation */}
      <div
        className="
          rounded-2xl backdrop-blur-lg p-6
        "
      >
        <label className="font-semibold text-slate-800 mb-2 block">
          Explanation (optional)
        </label>

        <textarea
          className="
            w-full rounded-xl px-4 py-3 bg-white shadow-sm min-h-28
            focus:ring-2 focus:ring-blue-500
          "
          placeholder="Add explanation if necessary..."
          value={form.explanation}
          onChange={(e) =>
            setForm((s) => ({ ...s, explanation: e.target.value }))
          }
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
  );
}
