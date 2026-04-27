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
  const [prompt, setPrompt] = useState("");
  const [tags, setTags] = useState("");
  const [explanation, setExplanation] = useState("");
  const [explanationImage, setExplanationImage] = useState("");
  const editorRef = useRef(null);

  const applyCmd = (cmd) => document.execCommand(cmd, false, null);

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

    if (!prompt.trim()) {
      return toast.warn("Please enter the essay prompt");
    }

    const html = editorRef.current?.innerHTML || "";

    setBusy(true);
    try {
      const payload = {
        board: scope.board,
        class: scope.class,
        subject: scope.subject,
        topic: scope.topic,
        ...buildQuestionStagePayload(scope.stage),
        difficulty: scope.difficulty.toLowerCase(),
        questionType: scope.questionType,
        prompt,
        richHtml: html,
        tags,
        explanation,
        explanationImage,
      };

      await postQuestion("essay-rich", payload);
      toast.success("Question saved successfully!");

      setPrompt("");
      setTags("");
      setExplanation("");
      setExplanationImage("");
      if (editorRef.current) editorRef.current.innerHTML = "";
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
            <div>
              <label className="font-bold text-slate-800 mb-2 block text-lg">Prompt</label>
              <input
                className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Enter essay prompt..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 space-y-4">
              <label className="font-bold text-slate-800 text-lg">Answer Guidance (Rich Text, optional)</label>

              <div className="flex items-center gap-2">
                <button type="button" onClick={() => applyCmd("bold")} className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-blue-50 transition">
                  <FiBold />
                </button>
                <button type="button" onClick={() => applyCmd("italic")} className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-blue-50 transition">
                  <FiItalic />
                </button>
                <button type="button" onClick={() => applyCmd("underline")} className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-blue-50 transition">
                  <FiUnderline />
                </button>
              </div>

              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                className="min-h-40 rounded-xl bg-white p-4 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="font-bold text-slate-800 mb-2 block">Tags (optional)</label>
                <input
                  className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  placeholder="descriptive writing, grammar..."
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
              <ExplanationEditor
                explanation={explanation}
                explanationImage={explanationImage}
                onExplanationChange={setExplanation}
                onExplanationImageChange={setExplanationImage}
              />
            </div>

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
