import React, { useState } from "react";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { postQuestion } from "../../lib/api";
import {
  FiEdit3,
  FiCheckCircle,
  FiUpload,
  FiAlertCircle,
} from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";

export default function QuestionsMCQMulti() {
  const { scope } = useQuestionScope();
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    question: "",
    options: ["", "", "", ""],
    correct: { A: false, B: false, C: false, D: false },
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

  const toggle = (k) =>
    setForm((s) => ({
      ...s,
      correct: { ...s.correct, [k]: !s.correct[k] },
    }));

  async function submit(e) {
    e.preventDefault();

    if (!scope.board || !scope.class || !scope.subject || !scope.topic ||
        !scope.stage || !scope.difficulty || !scope.questionType) {
      return toast.warn("Please complete all fields in the parameter selector above");
    }

    if (!form.question.trim()) {
      return toast.warn("Please enter the question");
    }

    if (form.options.some((opt) => !opt.trim())) {
      return toast.warn("Please fill all options");
    }

    setBusy(true);
    try {
      const correct = Object.entries(form.correct)
        .filter(([, v]) => v)
        .map(([k]) => k);

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
        tags: form.tags,
        question: form.question,
        options: form.options,
        correct,
        explanation: form.explanation,
      };

      await postQuestion("mcq-multi", payload);
      toast.success("Question saved!");

      setForm({
        question: "",
        options: ["", "", "", ""],
        correct: { A: false, B: false, C: false, D: false },
        explanation: "",
        tags: "",
      });
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
      <div className="space-y-8 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl shadow">
            <FiEdit3 size={22} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              MCQ — Multiple Correct
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
              <label className="font-semibold text-slate-800 mb-2 block">
                Question
              </label>
              <textarea
                className="
                w-full rounded-xl px-4 py-3 bg-white shadow-sm min-h-32
                focus:ring-2 focus:ring-blue-500
              "
                placeholder="Enter your question..."
                value={form.question}
                onChange={(e) => update("question", e.target.value)}
              />
            </div>

            <div className="rounded-2xl backdrop-blur-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <FiCheckCircle className="text-green-600" />
                <h2 className="text-lg font-semibold text-slate-800">Options</h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                {["A", "B", "C", "D"].map((L, i) => (
                  <div key={L} className="space-y-2">
                    <label className="font-medium text-slate-700">Option {L}</label>

                    <input
                      className="
                      w-full rounded-xl px-4 py-3 bg-white shadow-sm 
                      focus:ring-2 focus:ring-indigo-500
                    "
                      placeholder={`Enter option ${L}`}
                      value={form.options[i]}
                      onChange={(e) => updateOpt(i, e.target.value)}
                    />

                    <label
                      className="
                      flex items-center gap-3 cursor-pointer 
                      text-sm font-medium text-slate-700
                    "
                    >
                      <input
                        type="checkbox"
                        className="hidden peer"
                        checked={form.correct[L]}
                        onChange={() => toggle(L)}
                      />
                      <div
                        className="
                        w-5 h-5 rounded-md border-2 border-slate-400 
                        peer-checked:border-green-500 peer-checked:bg-green-500 
                        transition-all
                      "
                      ></div>
                      Mark as Correct
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="font-bold text-slate-800 mb-2 block">
                  Tags (optional)
                </label>
                <input
                  className="w-full rounded-xl px-4 py-3 bg-white shadow-sm 
                  focus:ring-2 focus:ring-green-500"
                  placeholder="chapter-name, keyword…"
                  value={form.tags}
                  onChange={(e) => update("tags", e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-2xl backdrop-blur-lg p-6">
              <label className="font-medium text-slate-700 mb-2 block">
                Explanation (optional)
              </label>
              <textarea
                className="
                w-full rounded-xl px-4 py-3 bg-white shadow-sm min-h-24 
                focus:ring-2 focus:ring-purple-500
              "
                placeholder="Add explanation if needed..."
                value={form.explanation}
                onChange={(e) => update("explanation", e.target.value)}
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
