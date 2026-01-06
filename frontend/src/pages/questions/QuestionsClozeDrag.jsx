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
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";

export default function QuestionsClozeDrag() {
  const { scope } = useQuestionScope();
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    text: "The capital of India is [[blank1]]. The currency is [[blank2]].",
    tokens: ["Rupee", "New Delhi", "Mumbai"],
    correctMap: { blank1: "New Delhi", blank2: "Rupee" },
    explanation: "",
  });

  async function submit(e) {
    e.preventDefault();
    if (!scope.board || !scope.class || !scope.subject || !scope.topic ||
        !scope.stage || !scope.difficulty || !scope.questionType) {
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

      const payload = {
        board: scope.board,
        class: scope.class,
        subject: scope.subject,
        topic: scope.topic,
        stage: stageMap[scope.stage] || 1,
        level: levelMap[scope.stage] || "basic",
        difficulty: scope.difficulty.toLowerCase(),
        questionType: scope.questionType,
        explanation: form.explanation,
        clozeDrag: {
          text: form.text,
          tokens: form.tokens,
          correctMap: form.correctMap,
        },
      };

      await postQuestion("cloze-drag", payload);
      toast.success("Question saved!");

      setForm({
        text: "The capital of India is [[blank1]]. The currency is [[blank2]].",
        tokens: ["Rupee", "New Delhi", "Mumbai"],
        correctMap: { blank1: "New Delhi", blank2: "Rupee" },
        explanation: "",
      });
    } catch (err) {
      toast.error(err.message || "Failed to save question.");
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

  const isScopeComplete = scope.board && scope.class && scope.subject &&
                          scope.topic && scope.stage && scope.difficulty &&
                          scope.questionType;

  return (
    <>
      <ToastContainer position="bottom-right" />
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl shadow-lg">
            <FiCheckCircle size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Cloze — Drag & Drop
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Select all parameters, then add your question below
            </p>
          </div>
        </div>

        <SubjectTopicPicker />

        {!isScopeComplete ? (
          <div className="rounded-3xl bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200 p-8 text-center">
            <FiAlertCircle className="mx-auto text-orange-500 mb-3" size={48} />
            <h3 className="text-xl font-bold text-orange-900 mb-2">
              Complete All Parameters First
            </h3>
            <p className="text-orange-700">
              Please select Board, Class, Subject, Topic, Stage, Difficulty, and Question Type above to continue
            </p>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="
              space-y-8 
              rounded-3xl bg-gradient-to-br from-white/70 to-white/30 
              border border-white/40 backdrop-blur-xl shadow-xl p-8
            "
          >
            <div className="rounded-2xl backdrop-blur-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <FiFileText className="text-indigo-600" />
                <h2 className="font-semibold text-slate-800 text-lg">Cloze Textt</h2>
              </div>

              <textarea
                className="
                  w-full rounded-xl px-4 py-3 bg-white shadow-sm min-h-32 
                  focus:ring-2 focus:ring-indigo-500
                "
                placeholder="Use [[blank1]] notation inside the text..."
                value={form.text}
                onChange={(e) => setForm((s) => ({ ...s, text: e.target.value }))}
              />
            </div>

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
        )}
      </div>
    </>
  );
}
