import React, { useState } from "react";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { postQuestion } from "../../lib/api";
import { FiEdit3, FiCheckCircle, FiFileText, FiAlertCircle } from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";

export default function QuestionsEssayPlain() {
  const { scope } = useQuestionScope();
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    prompt: "Explain Newton's First Law.",
    plainText: "",
  });

  async function submit(e) {
    e.preventDefault();
    if (!scope.board || !scope.class || !scope.subject || !scope.topic ||
        !scope.stage || !scope.difficulty || !scope.questionType) {
      return toast.warn("Please complete all fields in the parameter selector above");
    }

    if (!form.prompt.trim()) {
      return toast.warn("Please enter the essay prompt");
    }

    if (!form.plainText.trim()) {
      return toast.warn("Please enter the answer");
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
        prompt: form.prompt,
        plainText: form.plainText,
        stage: stageMap[scope.stage] || 1,
        level: levelMap[scope.stage] || "basic",
        difficulty: scope.difficulty.toLowerCase(),
        questionType: scope.questionType,
      };

      const out = await postQuestion("essay-plain", payload);
      // alert(`Saved! id=${out.id}`);
      toast.success("Question saved!");
      setForm({ prompt: "", plainText: "" });
    } catch (err) {
      // alert(err.message);
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
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-rose-100 to-pink-100 text-rose-700 shadow">
            <FiEdit3 size={22} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Essay — Plain Text
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
            space-y-8 rounded-3xl 
            bg-gradient-to-br from-white/70 to-white/30 
            border border-white/40 backdrop-blur-xl shadow-xl p-8
          "
          >
            <div className="rounded-2xl backdrop-blur-lg p-6">
              <label className="font-semibold text-slate-800 mb-2 block flex items-center gap-2">
                <FiFileText className="text-blue-600" />
                Essay Prompt
              </label>

              <input
                className="
                w-full rounded-xl px-4 py-3 bg-white shadow-sm
                focus:ring-2 focus:ring-blue-500 transition-all
              "
                placeholder="Enter essay prompt..."
                value={form.prompt}
                onChange={(e) =>
                  setForm((s) => ({ ...s, prompt: e.target.value }))
                }
              />
            </div>

            <div className="rounded-2xl backdrop-blur-lg p-6">
              <label className="font-semibold text-slate-800 mb-2 block">
                Answer (Plain Text)
              </label>

              <textarea
                className="
                w-full rounded-xl px-4 py-3 bg-white shadow-sm min-h-40
                focus:ring-2 focus:ring-indigo-500 transition-all
              "
                placeholder="Write your full detailed answer here..."
                value={form.plainText}
                onChange={(e) =>
                  setForm((s) => ({ ...s, plainText: e.target.value }))
                }
              />
            </div>

            <button
              disabled={busy}
              className="
              flex items-center gap-2 rounded-xl px-6 py-3 
              bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold
              shadow-md hover:shadow-xl hover:scale-[1.02]
              active:scale-95 transition-all disabled:opacity-50
            "
            >
              <FiCheckCircle /> {busy ? "Saving..." : "Save Question"}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
