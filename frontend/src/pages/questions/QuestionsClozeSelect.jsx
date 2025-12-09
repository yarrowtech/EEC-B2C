import React, { useState } from "react";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { postQuestion } from "../../lib/api";
import { FiFileText, FiList, FiUpload, FiSettings } from "react-icons/fi";

export default function QuestionsClozeSelect() {
  const { scope } = useQuestionScope();
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    text: "Water boils at [[blank1]] °C.",
    blanks: {
      blank1: { options: ["50", "70", "100"], correct: "100" },
    },
    explanation: "",
    stage: 1,       // ⭐ ADDED
    className: "",  // ⭐ ADDED
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
        stage: form.stage,         // ⭐ ADDED
        class: form.className,     // ⭐ ADDED
        clozeSelect: {
          text: form.text,
          blanks: form.blanks,
        },
      };

      const out = await postQuestion("cloze-select", payload);
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
        rounded-3xl bg-gradient-to-br from-white/70 to-white/30 
        border border-white/40 backdrop-blur-xl shadow-xl p-8
      "
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl shadow">
          <FiList size={22} />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Cloze — Drop-Down
        </h1>
      </div>

      {/* Picker */}
      <SubjectTopicPicker />

      {/* ⭐ CLASS + STAGE SECTION */}
      <div className="rounded-2xl backdrop-blur-lg p-6 space-y-5">

        {/* Class */}
        <div>
          <label className="font-medium text-slate-700 mb-1 block">
            Select Class
          </label>
          <select
            className="w-full rounded-xl px-4 py-3 bg-white shadow-sm 
                        focus:ring-2 focus:ring-purple-500"
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
          <label className="font-medium text-slate-700 mb-1 block">
            Stage
          </label>
          <select
            className="w-full rounded-xl px-4 py-3 bg-white shadow-sm 
                        focus:ring-2 focus:ring-purple-500"
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

      {/* Text Section */}
      <div className="rounded-2xl backdrop-blur-lg p-6">
        <div className="flex items-center gap-2 mb-3">
          <FiFileText className="text-indigo-600" />
          <h2 className="font-semibold text-slate-800 text-lg">Cloze Text</h2>
        </div>

        <textarea
          className="
            w-full rounded-xl px-4 py-3 bg-white shadow-sm min-h-28
            focus:ring-2 focus:ring-indigo-500
          "
          placeholder="Write text using [[blank1]] syntax..."
          value={form.text}
          onChange={(e) =>
            setForm((s) => ({ ...s, text: e.target.value }))
          }
        />
      </div>

      {/* Blank Editor */}
      <div
        className="
        rounded-2xl backdrop-blur-lg p-6 space-y-4
      "
      >
        <div className="flex items-center gap-2 mb-3">
          <FiSettings className="text-purple-600" />
          <h2 className="font-semibold text-slate-800 text-lg">Blank Options</h2>
        </div>

        {/* Single Blank UI */}
        <div className="rounded-2xl bg-white shadow-sm p-5 space-y-4">
          <div className="text-sm font-semibold text-slate-700">blank1</div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Options Input */}
            <div>
              <label className="font-medium text-slate-600 mb-1 block">
                Options (comma-separated)
              </label>
              <input
                className="
                  w-full rounded-xl px-4 py-2 bg-white shadow-sm
                  focus:ring-2 focus:ring-purple-500
                "
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

            {/* Correct Answer */}
            <div>
              <label className="font-medium text-slate-600 mb-1 block">
                Correct Answer
              </label>
              <input
                className="
                  w-full rounded-xl px-4 py-2 bg-white shadow-sm
                  focus:ring-2 focus:ring-green-500
                "
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
          placeholder="Write explanation if needed…"
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
