import React, { useState } from "react";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { postQuestion } from "../../lib/api";
import { buildQuestionStagePayload } from "../../lib/stage";
import ExplanationEditor from "../../components/questions/ExplanationEditor";
import { FiFileText, FiEdit3, FiUpload, FiAlertCircle } from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";

function extractBlankKeys(text = "") {
  const matches = text.match(/\[\[(.*?)\]\]/g) || [];
  const normalized = matches
    .map((m) => m.replace(/\[\[|\]\]/g, "").trim())
    .filter(Boolean);
  return [...new Set(normalized)];
}

export default function QuestionsClozeText() {
  const { scope } = useQuestionScope();
  const [busy, setBusy] = useState(false);
  const [questionCount, setQuestionCount] = useState(1);

  const createEmptyQuestion = () => ({
    text: "",
    answers: {},
    explanation: "",
    explanationImage: "",
    tags: "",
  });

  const [forms, setForms] = useState([createEmptyQuestion()]);

  const update = (qIdx, key, value) =>
    setForms((prev) => prev.map((item, idx) => (idx === qIdx ? { ...item, [key]: value } : item)));

  const updateAnswer = (qIdx, key, value) =>
    setForms((prev) =>
      prev.map((item, idx) =>
        idx === qIdx ? { ...item, answers: { ...item.answers, [key]: value } } : item
      )
    );

  function onTextChange(qIdx, value) {
    const keys = extractBlankKeys(value);
    setForms((prev) =>
      prev.map((item, idx) => {
        if (idx !== qIdx) return item;
        const nextAnswers = {};
        keys.forEach((k) => {
          nextAnswers[k] = item.answers[k] || "";
        });
        return { ...item, text: value, answers: nextAnswers };
      })
    );
  }

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

    if (
      !scope.board ||
      !scope.class ||
      !scope.subject ||
      !scope.topic ||
      !scope.stage ||
      !scope.difficulty ||
      !scope.questionType
    ) {
      return toast.warn("Please complete all fields in the parameter selector above");
    }

    for (let i = 0; i < forms.length; i += 1) {
      const form = forms[i];
      const blankKeys = extractBlankKeys(form.text);

      if (!form.text.trim()) {
        return toast.warn(`Please enter the cloze text for Question ${i + 1}`);
      }

      if (!blankKeys.length) {
        return toast.warn(`Add at least one blank using [[blank_name]] syntax for Question ${i + 1}`);
      }

      const missing = blankKeys.filter((k) => !String(form.answers[k] || "").trim());
      if (missing.length) {
        return toast.warn(`Please provide answers for Question ${i + 1}: ${missing.join(", ")}`);
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
          tags: form.tags,
          clozeText: {
            text: form.text,
            answers: form.answers,
          },
        };

        await postQuestion("cloze-text", payload);
        savedCount += 1;
      }

      toast.success(`${savedCount} question${savedCount > 1 ? "s" : ""} saved successfully!`);
      setQuestionCount(1);
      setForms([createEmptyQuestion()]);
    } catch (err) {
      toast.error(err.message || "Failed to save question.");
    } finally {
      setBusy(false);
    }
  }

  const isScopeComplete =
    scope.board &&
    scope.class &&
    scope.subject &&
    scope.topic &&
    scope.stage &&
    scope.difficulty &&
    scope.questionType;

  return (
    <>
      <ToastContainer position="bottom-right" />
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-rose-500 to-red-500 text-white rounded-2xl shadow-lg">
            <FiEdit3 size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Add Cloze — Free Text</h1>
            <p className="text-slate-600 text-sm mt-1">Use placeholders like [[blank1]] inside the text</p>
          </div>
        </div>

        <SubjectTopicPicker />

        {!isScopeComplete ? (
          <div className="rounded-3xl bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200 p-8 text-center">
            <FiAlertCircle className="mx-auto text-orange-500 mb-3" size={48} />
            <h3 className="text-xl font-bold text-orange-900 mb-2">Complete All Parameters First</h3>
            <p className="text-orange-700">
              Please select Board, Class, Subject, Topic, Stage, Difficulty, and Question Type above to continue
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-6 rounded-3xl bg-white border border-slate-200 shadow-xl p-8">
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
                  className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              <div className="flex items-end">
                <p className="text-sm text-slate-600">You can add up to 50 questions in one save.</p>
              </div>
            </div>

            {forms.map((form, qIdx) => {
              const blankKeys = extractBlankKeys(form.text);
              return (
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

                  <div>
                    <label className="font-bold text-slate-800 mb-2 block text-lg">Cloze Text</label>
                    <textarea
                      className="w-full rounded-xl px-4 py-3 bg-white border border-slate-300 min-h-32 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      placeholder="Example: The capital of France is [[blank1]]."
                      value={form.text}
                      onChange={(e) => onTextChange(qIdx, e.target.value)}
                    />
                  </div>

                  <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
                    <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                      <FiFileText className="text-indigo-600" /> Answers For Blanks
                    </h2>
                    {!blankKeys.length ? (
                      <p className="text-sm text-slate-600">No blanks detected yet. Add placeholders like [[blank1]].</p>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-4">
                        {blankKeys.map((k) => (
                          <div key={k}>
                            <label className="font-semibold text-slate-700 mb-2 block">{k}</label>
                            <input
                              className="w-full rounded-xl px-4 py-3 bg-white border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                              placeholder={`Answer for ${k}`}
                              value={form.answers[k] || ""}
                              onChange={(e) => updateAnswer(qIdx, k, e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="font-bold text-slate-800 mb-2 block">Tags (optional)</label>
                      <input
                        className="w-full rounded-xl px-4 py-3 bg-white border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                        placeholder="grammar, vocabulary..."
                        value={form.tags}
                        onChange={(e) => update(qIdx, "tags", e.target.value)}
                      />
                    </div>
                    <ExplanationEditor
                      explanation={form.explanation}
                      explanationImage={form.explanationImage}
                      onExplanationChange={(value) => update(qIdx, "explanation", value)}
                      onExplanationImageChange={(value) => update(qIdx, "explanationImage", value)}
                    />
                  </div>
                </div>
              );
            })}

            <button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 rounded-xl px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiUpload size={20} /> {busy ? "Saving Question..." : "Save Question"}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
