import React, { useState } from "react";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { postQuestion } from "../../lib/api";
import { FiCheckCircle, FiUpload, FiAlertCircle } from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";

export default function QuestionsMCQUpload() {
  const { scope } = useQuestionScope();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    question: "",
    options: ["", "", "", ""],
    correct: "A",
    explanation: "",
    tags: "",
  });

  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  const updateOpt = (i, v) =>
    setForm((s) => {
      const next = [...s.options];
      next[i] = v;
      return { ...s, options: next };
    });

  async function submit(e) {
    e.preventDefault();

    // Validate all required scope fields
    if (!scope.board || !scope.class || !scope.subject || !scope.topic ||
        !scope.stage || !scope.difficulty || !scope.questionType) {
      return toast.warn("Please complete all fields in the parameter selector above");
    }

    // Validate question fields
    if (!form.question.trim()) {
      return toast.warn("Please enter the question");
    }

    if (form.options.some(opt => !opt.trim())) {
      return toast.warn("Please fill all options");
    }

    setBusy(true);
    try {
      // Map stage names to numbers (backend expects 1, 2, or 3)
      const stageMap = {
        "Foundation": 1,
        "Intermediate": 2,
        "Advanced": 3
      };

      // Map stage to level
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
        question: form.question,
        options: form.options,
        correct: form.correct,
        explanation: form.explanation,
        tags: form.tags,
      };

      await postQuestion("mcq-single", payload);
      toast.success("Question saved successfully!");

      // Reset only the question form, keep scope intact
      setForm({
        question: "",
        options: ["", "", "", ""],
        correct: "A",
        explanation: "",
        tags: "",
      });
    } catch (err) {
      toast.error(err.message || "Failed to save question.");
    } finally {
      setBusy(false);
    }
  }

  // Check if all scope parameters are selected
  const isScopeComplete = scope.board && scope.class && scope.subject &&
                          scope.topic && scope.stage && scope.difficulty &&
                          scope.questionType;

  return (
    <>
      <ToastContainer position="bottom-right" />
      <div className="space-y-6 p-6">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl shadow-lg">
            <FiCheckCircle size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Add MCQ — Single Correct
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Select all parameters, then add your question below
            </p>
          </div>
        </div>

        {/* Subject / Topic Picker - Now includes all 7 parameters */}
        <SubjectTopicPicker />

        {/* Question Form - Only shows if scope is complete */}
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
            className="space-y-6 rounded-3xl bg-white border border-slate-200 shadow-xl p-8"
          >
            {/* Question Text */}
            <div>
              <label className="font-bold text-slate-800 mb-2 block text-lg">
                Question Text
              </label>
              <textarea
                className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-300 min-h-32
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Enter your question here..."
                value={form.question}
                onChange={(e) => update("question", e.target.value)}
              />
            </div>

            {/* Options */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FiCheckCircle className="text-green-600" />
                <h2 className="text-lg font-bold text-slate-800">Answer Options</h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {["A", "B", "C", "D"].map((L, i) => (
                  <div key={L}>
                    <label className="font-semibold text-slate-700 mb-2 block">
                      Option {L}
                    </label>
                    <input
                      className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-300
                               focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder={`Enter option ${L}`}
                      value={form.options[i]}
                      onChange={(e) => updateOpt(i, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Correct Answer & Explanation */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="font-bold text-slate-800 mb-2 block">
                  Correct Answer
                </label>
                <select
                  className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-300
                           focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  value={form.correct}
                  onChange={(e) => update("correct", e.target.value)}
                >
                  {["A", "B", "C", "D"].map((x) => (
                    <option key={x} value={x}>
                      Option {x}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 mb-2 block">
                  Tags (optional)
                </label>
                <input
                  className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-300
                           focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  placeholder="algebra, physics, grammar..."
                  value={form.tags}
                  onChange={(e) => update("tags", e.target.value)}
                />
              </div>
            </div>

            {/* Explanation */}
            <div>
              <label className="font-bold text-slate-800 mb-2 block">
                Explanation (optional)
              </label>
              <textarea
                className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-300 min-h-24
                         focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                placeholder="Explain why this is the correct answer..."
                value={form.explanation}
                onChange={(e) => update("explanation", e.target.value)}
              />
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-2
                       rounded-xl px-6 py-4
                       bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg
                       shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700
                       active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiUpload size={20} /> {busy ? "Saving Question..." : "Save Question"}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
