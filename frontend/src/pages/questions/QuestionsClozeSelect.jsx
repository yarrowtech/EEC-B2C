import React, { useState } from "react";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { postQuestion } from "../../lib/api";
import { FiFileText, FiList, FiUpload, FiSettings, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";

export default function QuestionsClozeSelect() {
  const { scope } = useQuestionScope();
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    text: "Water boils at [[blank1]] °C.",
    blanks: {
      blank1: { options: ["50", "70", "100"], correct: "100" },
    },
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

    if (!(form.blanks.blank1?.options || []).length) {
      return toast.warn("Please add at least one option");
    }

    if (!form.blanks.blank1?.correct) {
      return toast.warn("Please set the correct answer");
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
        explanation: form.explanation,
        stage: stageMap[scope.stage] || 1,
        level: levelMap[scope.stage] || "basic",
        difficulty: scope.difficulty.toLowerCase(),
        questionType: scope.questionType,
        clozeSelect: {
          text: form.text,
          blanks: form.blanks,
        },
      };

      await postQuestion("cloze-select", payload);
      toast.success("Question saved!");

      setForm({
        text: "Water boils at [[blank1]] °C.",
        blanks: {
          blank1: { options: ["50", "70", "100"], correct: "100" },
        },
        explanation: "",
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
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl shadow-lg">
            <FiCheckCircle size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Cloze — Drop-Down
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

            <div
              className="
            rounded-2xl backdrop-blur-lg p-6 space-y-4
          "
            >
              <div className="flex items-center gap-2 mb-3">
                <FiSettings className="text-purple-600" />
                <h2 className="font-semibold text-slate-800 text-lg">Blank Options</h2>
              </div>

              <div className="rounded-2xl bg-white shadow-sm p-5 space-y-4">
                <div className="text-sm font-semibold text-slate-700">blank1</div>

                <div className="grid sm:grid-cols-2 gap-4">
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

            <div className="rounded-2xl backdrop-blur-lg p-6">
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
        )}
      </div>
    </>
  );
}
