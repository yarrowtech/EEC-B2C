import React, { useState } from "react";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { postQuestion } from "../../lib/api";
import { buildQuestionStagePayload } from "../../lib/stage";
import {
  FiGitBranch,
  FiPlus,
  FiLink2,
  FiUpload,
  FiTrash2,
  FiAlertCircle,
} from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";

export default function QuestionsMatchList() {
  const { scope } = useQuestionScope();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    prompt: "",
    left: ["", ""],
    right: ["", ""],
    pairs: {},
    explanation: "",
    tags: "",
  });

  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const updateLeft = (i, val) =>
    setForm((s) => {
      const left = [...s.left];
      left[i] = val;
      return { ...s, left };
    });

  const updateRight = (i, val) =>
    setForm((s) => {
      const right = [...s.right];
      right[i] = val;
      return { ...s, right };
    });

  const addLeft = () => setForm((s) => ({ ...s, left: [...s.left, ""] }));
  const addRight = () => setForm((s) => ({ ...s, right: [...s.right, ""] }));

  const removeLeft = (index) =>
    setForm((s) => {
      if (s.left.length <= 2) return s;
      const left = s.left.filter((_, i) => i !== index);
      const pairs = {};
      left.forEach((_, li) => {
        const oldIndex = li >= index ? li + 1 : li;
        if (s.pairs[String(oldIndex)] !== undefined) {
          pairs[String(li)] = s.pairs[String(oldIndex)];
        }
      });
      return { ...s, left, pairs };
    });

  const removeRight = (index) =>
    setForm((s) => {
      if (s.right.length <= 2) return s;
      const right = s.right.filter((_, i) => i !== index);
      const pairs = {};
      Object.entries(s.pairs).forEach(([li, ri]) => {
        const rightIndex = Number(ri);
        if (Number.isNaN(rightIndex)) return;
        if (rightIndex === index) return;
        pairs[li] = String(rightIndex > index ? rightIndex - 1 : rightIndex);
      });
      return { ...s, right, pairs };
    });

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

    if (!form.prompt.trim()) {
      return toast.warn("Please enter the prompt");
    }

    if (form.left.some((x) => !x.trim()) || form.right.some((x) => !x.trim())) {
      return toast.warn("Please fill all left and right list items");
    }

    const unmapped = form.left
      .map((_, li) => li)
      .filter((li) => form.pairs[String(li)] === undefined || form.pairs[String(li)] === "");

    if (unmapped.length) {
      return toast.warn("Please set a right-side match for each left item");
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
        explanation: form.explanation,
        tags: form.tags,
        matchList: {
          prompt: form.prompt,
          left: form.left,
          right: form.right,
          pairs: form.pairs,
        },
      };

      await postQuestion("match-list", payload);
      toast.success("Question saved successfully!");
      setForm({
        prompt: "",
        left: ["", ""],
        right: ["", ""],
        pairs: {},
        explanation: "",
        tags: "",
      });
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
          <div className="p-3 bg-gradient-to-br from-yellow-500 to-amber-600 text-white rounded-2xl shadow-lg">
            <FiGitBranch size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Add Match List</h1>
            <p className="text-slate-600 text-sm mt-1">Create two lists and define the correct mapping</p>
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
              <textarea
                className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-300 min-h-24 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="Match the following:"
                value={form.prompt}
                onChange={(e) => update("prompt", e.target.value)}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-3">
                <h2 className="font-bold text-slate-800 text-lg">Left List</h2>
                {form.left.map((val, i) => (
                  <div key={`left-${i}`} className="flex gap-2">
                    <input
                      className="w-full rounded-xl px-4 py-3 bg-white border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder={`Left item ${i + 1}`}
                      value={val}
                      onChange={(e) => updateLeft(i, e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeLeft(i)}
                      disabled={form.left.length <= 2}
                      className="rounded-xl px-3 py-2 bg-white border border-slate-300 text-slate-700 disabled:opacity-40"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addLeft} className="rounded-xl px-4 py-2 bg-blue-600 text-white font-semibold flex items-center gap-2">
                  <FiPlus /> Add Left
                </button>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-3">
                <h2 className="font-bold text-slate-800 text-lg">Right List</h2>
                {form.right.map((val, i) => (
                  <div key={`right-${i}`} className="flex gap-2">
                    <input
                      className="w-full rounded-xl px-4 py-3 bg-white border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                      placeholder={`Right item ${i + 1}`}
                      value={val}
                      onChange={(e) => updateRight(i, e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeRight(i)}
                      disabled={form.right.length <= 2}
                      className="rounded-xl px-3 py-2 bg-white border border-slate-300 text-slate-700 disabled:opacity-40"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addRight} className="rounded-xl px-4 py-2 bg-purple-600 text-white font-semibold flex items-center gap-2">
                  <FiPlus /> Add Right
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-4">
              <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <FiLink2 className="text-green-600" /> Correct Pairs
              </h2>
              {form.left.map((leftVal, li) => (
                <div key={`pair-${li}`} className="grid sm:grid-cols-2 gap-4 items-center">
                  <div className="font-semibold text-slate-700">{leftVal || `Left ${li + 1}`}</div>
                  <select
                    className="w-full rounded-xl px-4 py-3 bg-white border border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    value={form.pairs[String(li)] ?? ""}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        pairs: { ...s.pairs, [String(li)]: e.target.value },
                      }))
                    }
                  >
                    <option value="">Select right item</option>
                    {form.right.map((rightVal, ri) => (
                      <option key={`opt-${li}-${ri}`} value={String(ri)}>
                        {rightVal || `Right ${ri + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="font-bold text-slate-800 mb-2 block">Tags (optional)</label>
                <input
                  className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  placeholder="animals, science..."
                  value={form.tags}
                  onChange={(e) => update("tags", e.target.value)}
                />
              </div>
              <div>
                <label className="font-bold text-slate-800 mb-2 block">Explanation (optional)</label>
                <textarea
                  className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-300 min-h-24 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Explain the match logic..."
                  value={form.explanation}
                  onChange={(e) => update("explanation", e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 rounded-xl px-6 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-lg shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiUpload size={20} /> {busy ? "Saving Question..." : "Save Question"}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
