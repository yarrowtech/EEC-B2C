import React, { useState } from "react";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { postQuestion } from "../../lib/api";
import { buildQuestionStagePayload } from "../../lib/stage";
import ExplanationEditor from "../../components/questions/ExplanationEditor";
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
  const [questionCount, setQuestionCount] = useState(1);

  const createEmptyQuestion = () => ({
    text: "The capital of India is [[blank1]]. The currency is [[blank2]].",
    tokens: ["Rupee", "New Delhi", "Mumbai"],
    correctMap: { blank1: "New Delhi", blank2: "Rupee" },
    explanation: "",
    explanationImage: "",
  });

  const [forms, setForms] = useState([createEmptyQuestion()]);

  const update = (qIdx, key, value) =>
    setForms((prev) => prev.map((item, idx) => (idx === qIdx ? { ...item, [key]: value } : item)));

  const updateToken = (qIdx, i, val) =>
    setForms((prev) =>
      prev.map((item, idx) => {
        if (idx !== qIdx) return item;
        const tokens = [...item.tokens];
        tokens[i] = val;
        return { ...item, tokens };
      })
    );

  const addToken = (qIdx) =>
    setForms((prev) =>
      prev.map((item, idx) => (idx === qIdx ? { ...item, tokens: [...item.tokens, ""] } : item))
    );

  const updateCorrectMap = (qIdx, blankKey, value) =>
    setForms((prev) =>
      prev.map((item, idx) =>
        idx === qIdx
          ? { ...item, correctMap: { ...item.correctMap, [blankKey]: value } }
          : item
      )
    );

  function applyQuestionCount(rawValue) {
    const parsed = Number(rawValue);
    const safeCount = Number.isFinite(parsed)
      ? Math.min(50, Math.max(1, Math.floor(parsed)))
      : 1;
    setQuestionCount(safeCount);
    setForms((prev) => {
      if (safeCount === prev.length) return prev;
      if (safeCount < prev.length) return prev.slice(0, safeCount);
      return [...prev, ...Array.from({ length: safeCount - prev.length }, createEmptyQuestion)];
    });
  }

  function deleteQuestionBlock(index) {
    if (forms.length <= 1) return;
    const nextCount = forms.length - 1;
    setForms((prev) => prev.filter((_, idx) => idx !== index));
    setQuestionCount(nextCount);
  }

  async function submit(e) {
    e.preventDefault();
    if (!scope.board || !scope.class || !scope.subject || !scope.topic ||
        !scope.stage || !scope.difficulty || !scope.questionType) {
      return toast.warn("Please complete all fields in the parameter selector above");
    }

    for (let i = 0; i < forms.length; i += 1) {
      const form = forms[i];
      if (!form.text.trim()) {
        return toast.warn(`Please enter the cloze text for Question ${i + 1}`);
      }
      if (form.tokens.some((t) => !t.trim())) {
        return toast.warn(`Please fill all tokens for Question ${i + 1}`);
      }
    }

    setBusy(true);
    try {
      let savedCount = 0;
      for (const form of forms) {
        const payload = {
          board: scope.board,
          class: scope.class,
          subject: scope.subject,
          topic: scope.topic,
          ...buildQuestionStagePayload(scope.stage),
          difficulty: scope.difficulty.toLowerCase(),
          questionType: scope.questionType,
          explanation: form.explanation,
          explanationImage: form.explanationImage,
          clozeDrag: {
            text: form.text,
            tokens: form.tokens,
            correctMap: form.correctMap,
          },
        };

        await postQuestion("cloze-drag", payload);
        savedCount += 1;
      }

      toast.success(`${savedCount} question${savedCount > 1 ? "s" : ""} saved!`);
      setQuestionCount(1);
      setForms([createEmptyQuestion()]);
    } catch (err) {
      toast.error(err.message || "Failed to save question.");
    } finally {
      setBusy(false);
    }
  }

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
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="font-bold text-slate-800 mb-2 block">
                  How many questions do you want to add?
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={questionCount}
                  onChange={(e) => applyQuestionCount(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-300
                           focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              <div className="flex items-end">
                <p className="text-sm text-slate-600">You can add up to 50 questions in one save.</p>
              </div>
            </div>

            {forms.map((form, qIdx) => (
              <div key={qIdx} className="rounded-2xl border border-slate-200 p-5 space-y-5 bg-slate-50">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-extrabold text-slate-900">Question {qIdx + 1}</h3>
                  <button
                    type="button"
                    onClick={() => deleteQuestionBlock(qIdx)}
                    disabled={forms.length <= 1}
                    className="rounded-lg px-3 py-1.5 text-sm font-semibold bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>

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
                    onChange={(e) => update(qIdx, "text", e.target.value)}
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
                        onChange={(e) => updateToken(qIdx, i, e.target.value)}
                      />
                    ))}

                    <button
                      type="button"
                      onClick={() => addToken(qIdx)}
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
                          onChange={(e) => updateCorrectMap(qIdx, b, e.target.value)}
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
                  <ExplanationEditor
                    explanation={form.explanation}
                    explanationImage={form.explanationImage}
                    onExplanationChange={(value) => update(qIdx, "explanation", value)}
                    onExplanationImageChange={(value) => update(qIdx, "explanationImage", value)}
                  />
                </div>
              </div>
            ))}

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
