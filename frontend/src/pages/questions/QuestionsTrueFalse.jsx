import React, { useState } from "react";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { postQuestion } from "../../lib/api";
import { buildQuestionStagePayload } from "../../lib/stage";
import { FiCheckSquare, FiAlertCircle, FiUpload } from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";

export default function QuestionsTrueFalse() {
  const { scope } = useQuestionScope();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    statement: "",
    answer: "true",
    explanation: "",
    tags: "",
  });

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

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

    if (!form.statement.trim()) {
      return toast.warn("Please enter the statement");
    }

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
        question: form.statement,
        answer: form.answer,
        explanation: form.explanation,
        tags: form.tags,
      };

      await postQuestion("true-false", payload);
      toast.success("Question saved successfully!");

      setForm({ statement: "", answer: "true", explanation: "", tags: "" });
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
          <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl shadow-lg">
            <FiCheckSquare size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Add True / False</h1>
            <p className="text-slate-600 text-sm mt-1">Select all parameters, then add your statement below</p>
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
          <form
            onSubmit={submit}
            className="space-y-6 rounded-3xl bg-white border border-slate-200 shadow-xl p-8"
          >
            <div>
              <label className="font-bold text-slate-800 mb-2 block text-lg">Statement</label>
              <textarea
                className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-300 min-h-32 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="Enter a statement for True/False..."
                value={form.statement}
                onChange={(e) => update("statement", e.target.value)}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="font-bold text-slate-800 mb-2 block">Correct Answer</label>
                <select
                  className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  value={form.answer}
                  onChange={(e) => update("answer", e.target.value)}
                >
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 mb-2 block">Tags (optional)</label>
                <input
                  className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  placeholder="facts, logic, science..."
                  value={form.tags}
                  onChange={(e) => update("tags", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-800 mb-2 block">Explanation (optional)</label>
              <textarea
                className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-300 min-h-24 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                placeholder="Explain why the statement is true or false..."
                value={form.explanation}
                onChange={(e) => update("explanation", e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 rounded-xl px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-lg shadow-lg hover:shadow-xl hover:from-green-700 hover:to-emerald-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiUpload size={20} /> {busy ? "Saving Question..." : "Save Question"}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
