import React, { useState } from "react";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { postQuestion } from "../../lib/api";
import {
  FiGitBranch,
  FiPlus,
  FiLink2,
  FiUpload,
  FiFileText,
} from "react-icons/fi";

export default function QuestionsMatchList() {
  const { scope } = useQuestionScope();
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    prompt: "Match the following:",
    left: ["Lion", "Sparrow", "Shark"],
    right: ["Mammal", "Bird", "Fish"],
    pairs: { "0": "0" },
    explanation: "",
  });

  async function submit(e) {
    e.preventDefault();

    if (!scope.subject || !scope.topic) return alert("Pick Subject & Topic first");

    setBusy(true);
    try {
      const payload = {
        subject: scope.subject,
        topic: scope.topic,
        explanation: form.explanation,
        matchList: {
          prompt: form.prompt,
          left: form.left,
          right: form.right,
          pairs: form.pairs,
        },
      };

      const out = await postQuestion("match-list", payload);
      alert(`Saved! id=${out.id}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  }

  const updateLeft = (i, val) =>
    setForm((s) => {
      const left = [...s.left];
      left[i] = val;
      return { ...s, left };
    });

  const updateRight = (i, val) =>
    setForm((s) => {
      const right = [...s.right];
      right[i] = val;
      return { ...s, right };
    });

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
      <div className="flex items-center gap-3">
        <div className="p-3 bg-yellow-100 text-yellow-600 rounded-2xl shadow">
          <FiGitBranch size={22} />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Match List
        </h1>
      </div>

      {/* Subject Picker */}
      <SubjectTopicPicker />

      {/* Prompt Section */}
      <div className="rounded-2xl backdrop-blur-lg p-6">
        <div className="flex items-center gap-2 mb-3">
          <FiFileText className="text-indigo-600" />
          <h2 className="font-semibold text-slate-800 text-lg">
            Prompt
          </h2>
        </div>

        <textarea
          className="
            w-full rounded-xl px-4 py-3 bg-white shadow-sm min-h-28
            focus:ring-2 focus:ring-indigo-500 transition-all
          "
          placeholder="Write match-list prompt..."
          value={form.prompt}
          onChange={(e) => setForm((s) => ({ ...s, prompt: e.target.value }))}
        />
      </div>

      {/* Left & Right Lists */}
      <div
        className="
        rounded-2xl bg-white/70 backdrop-blur-lg shadow p-6 grid sm:grid-cols-2 gap-6
      "
      >
        {/* LEFT */}
        <div className="space-y-4">
          <h2 className="font-semibold text-slate-800 text-lg flex items-center gap-2">
            <FiGitBranch className="text-blue-600" /> Left List
          </h2>

          {form.left.map((val, i) => (
            <input
              key={i}
              className="
                w-full rounded-xl px-4 py-2 bg-white shadow-sm
                focus:ring-2 focus:ring-blue-500 transition-all
              "
              value={val}
              placeholder={`Left item ${i + 1}`}
              onChange={(e) => updateLeft(i, e.target.value)}
            />
          ))}

          <button
            type="button"
            onClick={() => setForm((s) => ({ ...s, left: [...s.left, ""] }))}
            className="
              flex items-center gap-2 rounded-xl border px-4 py-2 
              bg-blue-100 text-blue-600 hover:bg-blue-200
              transition-all active:scale-95
            "
          >
            <FiPlus /> Add Left
          </button>
        </div>

        {/* RIGHT */}
        <div className="space-y-4">
          <h2 className="font-semibold text-slate-800 text-lg flex items-center gap-2">
            <FiGitBranch className="text-purple-600" /> Right List
          </h2>

          {form.right.map((val, i) => (
            <input
              key={i}
              className="
                w-full rounded-xl px-4 py-2 bg-white shadow-sm
                focus:ring-2 focus:ring-purple-500 transition-all
              "
              value={val}
              placeholder={`Right item ${i + 1}`}
              onChange={(e) => updateRight(i, e.target.value)}
            />
          ))}

          <button
            type="button"
            onClick={() => setForm((s) => ({ ...s, right: [...s.right, ""] }))}
            className="
              flex items-center gap-2 rounded-xl border px-4 py-2 
              bg-purple-100 text-purple-600 hover:bg-purple-200
              transition-all active:scale-95
            "
          >
            <FiPlus /> Add Right
          </button>
        </div>
      </div>

      {/* Correct Pairs */}
      <div
        className="
        rounded-2xl bg-white/70 backdrop-blur-lg shadow p-6
      "
      >
        <div className="flex items-center gap-2 mb-3">
          <FiLink2 className="text-green-600" />
          <h2 className="font-semibold text-slate-800 text-lg">
            Correct Pairs
          </h2>
        </div>

        <div className="space-y-4">
          {form.left.map((_, li) => (
            <div key={li} className="grid sm:grid-cols-2 gap-4">
              <div className="font-medium text-slate-700">
                Left {li}
              </div>
              <select
                className="
                  rounded-xl px-4 py-2 bg-white shadow-sm
                  focus:ring-2 focus:ring-green-500 transition-all
                "
                value={form.pairs[String(li)] ?? ""}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    pairs: { ...s.pairs, [String(li)]: e.target.value },
                  }))
                }
              >
                <option value="">Select right…</option>
                {form.right.map((_, ri) => (
                  <option key={ri} value={ri}>
                    {ri}
                  </option>
                ))}
              </select>
            </div>
          ))}
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
          placeholder="Write explanation if required…"
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
          flex items-center gap-2 rounded-xl px-6 py-3 
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
