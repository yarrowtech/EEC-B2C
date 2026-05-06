import React, { useRef, useState } from "react";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { postQuestion } from "../../lib/api";
import { buildQuestionStagePayload } from "../../lib/stage";
import ExplanationEditor from "../../components/questions/ExplanationEditor";
import {
  FiEdit3,
  FiBold,
  FiItalic,
  FiUnderline,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";

export default function QuestionsEssayRich() {
  const { scope } = useQuestionScope();
  const [busy, setBusy] = useState(false);
  const [questionCount, setQuestionCount] = useState(1);
  const editorRefs = useRef({});

  const createEmptyQuestion = () => ({
    prompt: "",
    tags: "",
    explanation: "",
    explanationImage: "",
    richHtml: "",
  });

  const [forms, setForms] = useState([createEmptyQuestion()]);

  const update = (qIdx, key, value) =>
    setForms((prev) => prev.map((item, idx) => (idx === qIdx ? { ...item, [key]: value } : item)));

  function applyCmd(qIdx, cmd) {
    const editor = editorRefs.current[qIdx];
    if (!editor) return;
    editor.focus();
    document.execCommand(cmd, false, null);
    update(qIdx, "richHtml", editor.innerHTML || "");
  }

  function onEditorInput(qIdx) {
    const editor = editorRefs.current[qIdx];
    update(qIdx, "richHtml", editor?.innerHTML || "");
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
    delete editorRefs.current[index];
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
      if (!forms[i].prompt.trim()) {
        return toast.warn(`Please enter the essay prompt for Question ${i + 1}`);
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
          prompt: form.prompt,
          richHtml: form.richHtml || "",
          tags: form.tags,
          explanation: form.explanation,
          explanationImage: form.explanationImage,
        };

        await postQuestion("essay-rich", payload);
        savedCount += 1;
      }

      toast.success(`${savedCount} question${savedCount > 1 ? "s" : ""} saved successfully!`);
      setQuestionCount(1);
      setForms([createEmptyQuestion()]);
      editorRefs.current = {};
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
          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
            <FiEdit3 size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Add Essay — Rich Text</h1>
            <p className="text-slate-600 text-sm mt-1">Create prompt and optional formatted answer guidance</p>
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
                  className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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

                <div>
                  <label className="font-bold text-slate-800 mb-2 block text-lg">Prompt</label>
                  <input
                    className="w-full rounded-xl px-4 py-3 bg-white border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Enter essay prompt..."
                    value={form.prompt}
                    onChange={(e) => update(qIdx, "prompt", e.target.value)}
                  />
                </div>

                <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4">
                  <label className="font-bold text-slate-800 text-lg">Answer Guidance (Rich Text, optional)</label>

                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => applyCmd(qIdx, "bold")} className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-blue-50 transition">
                      <FiBold />
                    </button>
                    <button type="button" onClick={() => applyCmd(qIdx, "italic")} className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-blue-50 transition">
                      <FiItalic />
                    </button>
                    <button type="button" onClick={() => applyCmd(qIdx, "underline")} className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-blue-50 transition">
                      <FiUnderline />
                    </button>
                  </div>

                  <div
                    ref={(el) => {
                      if (el) {
                        editorRefs.current[qIdx] = el;
                        if (el.innerHTML !== (form.richHtml || "")) el.innerHTML = form.richHtml || "";
                      }
                    }}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={() => onEditorInput(qIdx)}
                    className="min-h-40 rounded-xl bg-white p-4 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="font-bold text-slate-800 mb-2 block">Tags (optional)</label>
                    <input
                      className="w-full rounded-xl px-4 py-3 bg-white border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                      placeholder="descriptive writing, grammar..."
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
            ))}

            <button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 rounded-xl px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiCheckCircle size={20} /> {busy ? "Saving Question..." : "Save Question"}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
