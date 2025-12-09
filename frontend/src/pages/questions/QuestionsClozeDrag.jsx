import React, { useState } from "react";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { postQuestion } from "../../lib/api";
import {
  FiPackage,
  FiPlus,
  FiUpload,
  FiFileText,
  FiLink,
} from "react-icons/fi";

export default function QuestionsClozeDrag() {
  const { scope } = useQuestionScope();
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    text: "The capital of India is [[blank1]]. The currency is [[blank2]].",
    tokens: ["Rupee", "New Delhi", "Mumbai"],
    correctMap: { blank1: "New Delhi", blank2: "Rupee" },
    explanation: "",
    stage: 1,        // ⭐ ADDED
    className: "",   // ⭐ ADDED
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
        stage: form.stage,          // ⭐ ADDED
        class: form.className,      // ⭐ ADDED
        explanation: form.explanation,
        clozeDrag: {
          text: form.text,
          tokens: form.tokens,
          correctMap: form.correctMap,
        },
      };

      const out = await postQuestion("cloze-drag", payload);
      alert(`Saved! id=${out.id}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  }

  const updateToken = (i, val) =>
    setForm((s) => {
      const tokens = [...s.tokens];
      tokens[i] = val;
      return { ...s, tokens };
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
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl shadow">
          <FiPackage size={22} />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Cloze — Drag & Drop
        </h1>
      </div>

      {/* Subject Topic Picker */}
      <SubjectTopicPicker />

      {/* ⭐ CLASS + STAGE SECTION */}
      <div className="rounded-2xl backdrop-blur-lg p-6 space-y-5">

        {/* Class */}
        <div>
          <label className="font-medium text-slate-700 mb-1 block">Select Class</label>
          <select
            className="
              w-full rounded-xl px-4 py-3 bg-white shadow-sm 
              focus:ring-2 focus:ring-purple-500
            "
            value={form.className}
            onChange={(e) =>
              setForm((s) => ({ ...s, className: e.target.value }))
            }
          >
            <option value="">Select Class</option>
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i + 1} value={`Class ${i + 1}`}>
                Class {i + 1}
              </option>
            ))}
          </select>
        </div>

        {/* Stage */}
        <div>
          <label className="font-medium text-slate-700 mb-1 block">Stage</label>
          <select
            className="
              w-full rounded-xl px-4 py-3 bg-white shadow-sm 
              focus:ring-2 focus:ring-purple-500
            "
            value={form.stage}
            onChange={(e) =>
              setForm((s) => ({ ...s, stage: Number(e.target.value) }))
            }
          >
            <option value={1}>Stage 1: Basic</option>
            {/* <option value={2}>Stage 2: Intermediate</option>
            <option value={3}>Stage 3: Advanced</option> */}
          </select>
        </div>
      </div>

      {/* TEXT SECTION */}
      <div className="rounded-2xl backdrop-blur-lg p-6">
        <div className="flex items-center gap-2 mb-3">
          <FiFileText className="text-indigo-600" />
          <h2 className="font-semibold text-slate-800 text-lg">Cloze Text</h2>
        </div>

        <textarea
          className="
            w-full rounded-xl px-4 py-3 bg-white shadow-sm min-h-32 
            focus:ring-2 focus:ring-indigo-500
          "
          placeholder="Use [[blank1]] notation inside the text..."
          value={form.text}
          onChange={(e) =>
            setForm((s) => ({ ...s, text: e.target.value }))
          }
        />
      </div>

      {/* TOKENS SECTION */}
      <div className="rounded-2xl bg-white/70 backdrop-blur-lg shadow p-6 space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <FiPackage className="text-purple-600" />
          <h2 className="font-semibold text-slate-800 text-lg">Tokens</h2>
        </div>

        <div className="flex flex-wrap gap-3">
          {form.tokens.map((t, i) => (
            <input
              key={i}
              className="
                rounded-xl px-4 py-2 bg-white shadow-sm 
                focus:ring-2 focus:ring-purple-500
                transition-all
              "
              placeholder={`Token ${i + 1}`}
              value={t}
              onChange={(e) => updateToken(i, e.target.value)}
            />
          ))}

          {/* Add Token Button */}
          <button
            type="button"
            onClick={() =>
              setForm((s) => ({ ...s, tokens: [...s.tokens, ""] }))
            }
            className="
              flex items-center gap-2 rounded-xl border px-4 py-2 
              bg-purple-100 text-purple-600 
              hover:bg-purple-200 transition-all active:scale-95
            "
          >
            <FiPlus /> Add Token
          </button>
        </div>
      </div>

      {/* MAPPING SECTION */}
      <div className="rounded-2xl bg-white/70 backdrop-blur-lg shadow p-6 space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <FiLink className="text-green-600" />
          <h2 className="font-semibold text-slate-800 text-lg">
            Correct Mapping
          </h2>
        </div>

        <div className="space-y-3">
          {["blank1", "blank2", "blank3"].map((b) => (
            <div key={b} className="grid sm:grid-cols-2 gap-4">
              <div className="text-sm font-medium text-slate-700">{b}</div>

              <select
                className="
                  rounded-xl px-4 py-2 bg-white shadow-sm 
                  focus:ring-2 focus:ring-green-500
                "
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

      {/* EXPLANATION SECTION */}
      <div className="rounded-2xl backdrop-blur-lg p-6">
        <label className="font-semibold text-slate-800 mb-2 block">
          Explanation (optional)
        </label>
        <textarea
          className="
            w-full rounded-xl px-4 py-3 bg-white shadow-sm min-h-28 
            focus:ring-2 focus:ring-blue-500
          "
          placeholder="Add explanation if needed..."
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
