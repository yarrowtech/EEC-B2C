import React, { useState } from "react";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { postQuestion } from "../../lib/api";
import { buildQuestionStagePayload } from "../../lib/stage";
import ExplanationEditor from "../../components/questions/ExplanationEditor";
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
  const [questionCount, setQuestionCount] = useState(1);

  const createEmptyQuestion = () => ({
    prompt: "",
    left: ["", ""],
    right: ["", ""],
    pairs: {},
    explanation: "",
    explanationImage: "",
    tags: "",
  });

  const [forms, setForms] = useState([createEmptyQuestion()]);

  const update = (qIdx, key, value) =>
    setForms((prev) => prev.map((item, idx) => (idx === qIdx ? { ...item, [key]: value } : item)));

  const updateLeft = (qIdx, i, val) =>
    setForms((prev) =>
      prev.map((item, idx) => {
        if (idx !== qIdx) return item;
        const left = [...item.left];
        left[i] = val;
        return { ...item, left };
      })
    );

  const updateRight = (qIdx, i, val) =>
    setForms((prev) =>
      prev.map((item, idx) => {
        if (idx !== qIdx) return item;
        const right = [...item.right];
        right[i] = val;
        return { ...item, right };
      })
    );

  const addLeft = (qIdx) =>
    setForms((prev) =>
      prev.map((item, idx) => (idx === qIdx ? { ...item, left: [...item.left, ""] } : item))
    );

  const addRight = (qIdx) =>
    setForms((prev) =>
      prev.map((item, idx) => (idx === qIdx ? { ...item, right: [...item.right, ""] } : item))
    );

  const removeLeft = (qIdx, index) =>
    setForms((prev) =>
      prev.map((item, idx) => {
        if (idx !== qIdx) return item;
        if (item.left.length <= 2) return item;
        const left = item.left.filter((_, i) => i !== index);
        const pairs = {};
        left.forEach((_, li) => {
          const oldIndex = li >= index ? li + 1 : li;
          if (item.pairs[String(oldIndex)] !== undefined) {
            pairs[String(li)] = item.pairs[String(oldIndex)];
          }
        });
        return { ...item, left, pairs };
      })
    );

  const removeRight = (qIdx, index) =>
    setForms((prev) =>
      prev.map((item, idx) => {
        if (idx !== qIdx) return item;
        if (item.right.length <= 2) return item;
        const right = item.right.filter((_, i) => i !== index);
        const pairs = {};
        Object.entries(item.pairs).forEach(([li, ri]) => {
          const rightIndex = Number(ri);
          if (Number.isNaN(rightIndex)) return;
          if (rightIndex === index) return;
          pairs[li] = String(rightIndex > index ? rightIndex - 1 : rightIndex);
        });
        return { ...item, right, pairs };
      })
    );

  const updatePair = (qIdx, leftIndex, rightIndex) =>
    setForms((prev) =>
      prev.map((item, idx) =>
        idx === qIdx
          ? {
              ...item,
              pairs: { ...item.pairs, [String(leftIndex)]: rightIndex },
            }
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
      if (!form.prompt.trim()) {
        return toast.warn(`Please enter the prompt for Question ${i + 1}`);
      }

      if (form.left.some((x) => !x.trim()) || form.right.some((x) => !x.trim())) {
        return toast.warn(`Please fill all left and right list items for Question ${i + 1}`);
      }

      const unmapped = form.left
        .map((_, li) => li)
        .filter((li) => form.pairs[String(li)] === undefined || form.pairs[String(li)] === "");

      if (unmapped.length) {
        return toast.warn(`Please set a right-side match for each left item in Question ${i + 1}`);
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
          matchList: {
            prompt: form.prompt,
            left: form.left,
            right: form.right,
            pairs: form.pairs,
          },
        };

        await postQuestion("match-list", payload);
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
                  <textarea
                    className="w-full rounded-xl px-4 py-3 bg-white border border-slate-300 min-h-24 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="Match the following:"
                    value={form.prompt}
                    onChange={(e) => update(qIdx, "prompt", e.target.value)}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
                    <h2 className="font-bold text-slate-800 text-lg">Left List</h2>
                    {form.left.map((val, i) => (
                      <div key={`left-${qIdx}-${i}`} className="flex gap-2">
                        <input
                          className="w-full rounded-xl px-4 py-3 bg-white border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          placeholder={`Left item ${i + 1}`}
                          value={val}
                          onChange={(e) => updateLeft(qIdx, i, e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => removeLeft(qIdx, i)}
                          disabled={form.left.length <= 2}
                          className="rounded-xl px-3 py-2 bg-white border border-slate-300 text-slate-700 disabled:opacity-40"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addLeft(qIdx)} className="rounded-xl px-4 py-2 bg-blue-600 text-white font-semibold flex items-center gap-2">
                      <FiPlus /> Add Left
                    </button>
                  </div>

                  <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
                    <h2 className="font-bold text-slate-800 text-lg">Right List</h2>
                    {form.right.map((val, i) => (
                      <div key={`right-${qIdx}-${i}`} className="flex gap-2">
                        <input
                          className="w-full rounded-xl px-4 py-3 bg-white border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                          placeholder={`Right item ${i + 1}`}
                          value={val}
                          onChange={(e) => updateRight(qIdx, i, e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => removeRight(qIdx, i)}
                          disabled={form.right.length <= 2}
                          className="rounded-xl px-3 py-2 bg-white border border-slate-300 text-slate-700 disabled:opacity-40"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addRight(qIdx)} className="rounded-xl px-4 py-2 bg-purple-600 text-white font-semibold flex items-center gap-2">
                      <FiPlus /> Add Right
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
                  <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <FiLink2 className="text-green-600" /> Correct Pairs
                  </h2>
                  {form.left.map((leftVal, li) => (
                    <div key={`pair-${qIdx}-${li}`} className="grid sm:grid-cols-2 gap-4 items-center">
                      <div className="font-semibold text-slate-700">{leftVal || `Left ${li + 1}`}</div>
                      <select
                        className="w-full rounded-xl px-4 py-3 bg-white border border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        value={form.pairs[String(li)] ?? ""}
                        onChange={(e) => updatePair(qIdx, li, e.target.value)}
                      >
                        <option value="">Select right item</option>
                        {form.right.map((rightVal, ri) => (
                          <option key={`opt-${qIdx}-${li}-${ri}`} value={String(ri)}>
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
                      className="w-full rounded-xl px-4 py-3 bg-white border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                      placeholder="animals, science..."
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
