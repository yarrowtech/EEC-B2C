import React, { useState } from "react";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { postMCQSingleBulk, postQuestion } from "../../lib/api";
import { buildQuestionStagePayload } from "../../lib/stage";
import ExplanationEditor from "../../components/questions/ExplanationEditor";
import { FiCheckCircle, FiUpload, FiAlertCircle } from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import * as XLSX from "xlsx";

export default function QuestionsMCQUpload() {
  const { scope } = useQuestionScope();
  const [busy, setBusy] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkInputKey, setBulkInputKey] = useState(0);
  const [questionCount, setQuestionCount] = useState(1);
  const [forms, setForms] = useState([{
    question: "",
    options: ["", "", "", ""],
    correct: "A",
    explanation: "",
    explanationImage: "",
    tags: "",
  }]);

  const createEmptyQuestion = () => ({
    question: "",
    options: ["", "", "", ""],
    correct: "A",
    explanation: "",
    explanationImage: "",
    tags: "",
  });

  const update = (qIdx, key, value) =>
    setForms((prev) =>
      prev.map((item, idx) => (idx === qIdx ? { ...item, [key]: value } : item))
    );

  const updateOpt = (qIdx, optIdx, value) =>
    setForms((prev) =>
      prev.map((item, idx) => {
        if (idx !== qIdx) return item;
        const nextOptions = [...item.options];
        nextOptions[optIdx] = value;
        return { ...item, options: nextOptions };
      })
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

  function downloadBulkTemplate() {
    const worksheet = XLSX.utils.json_to_sheet([
      {
        question: "What is 2 + 2?",
        optionA: "3",
        optionB: "4",
        optionC: "5",
        optionD: "6",
        correct: "B",
        explanation: "2 + 2 equals 4.",
        tags: "math, arithmetic",
      },
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "MCQ Single");
    XLSX.writeFile(workbook, "mcq_single_bulk_template.xlsx");
  }

  async function submitBulkUpload() {
    // Validate all required scope fields
    if (!scope.board || !scope.class || !scope.subject || !scope.topic ||
        !scope.stage || !scope.difficulty || !scope.questionType) {
      return toast.warn("Please complete all fields in the parameter selector above");
    }

    if (!bulkFile) {
      return toast.warn("Please choose an Excel file first");
    }

    setBulkBusy(true);
    try {
      const stagePayload = buildQuestionStagePayload(scope.stage);
      const payload = new FormData();
      payload.append("file", bulkFile);
      payload.append("board", scope.board);
      payload.append("class", scope.class);
      payload.append("subject", scope.subject);
      payload.append("topic", scope.topic);
      payload.append("stage", String(stagePayload.stage));
      payload.append("level", stagePayload.level);
      payload.append("difficulty", scope.difficulty.toLowerCase());
      payload.append("questionType", "mcq-single");

      const res = await postMCQSingleBulk(payload);
      const failed = Number(res?.failed || 0);
      if (failed > 0) {
        toast.success(`Uploaded ${res.inserted} questions. ${failed} rows were skipped.`);
      } else {
        toast.success(`Uploaded ${res.inserted} questions successfully!`);
      }

      setBulkFile(null);
      setBulkInputKey((k) => k + 1);
    } catch (err) {
      toast.error(err.message || "Failed to upload file.");
    } finally {
      setBulkBusy(false);
    }
  }

  async function submit(e) {
    e.preventDefault();

    // Validate all required scope fields
    if (!scope.board || !scope.class || !scope.subject || !scope.topic ||
        !scope.stage || !scope.difficulty || !scope.questionType) {
      return toast.warn("Please complete all fields in the parameter selector above");
    }

    // Validate question fields
    for (let i = 0; i < forms.length; i += 1) {
      const item = forms[i];
      if (!item.question.trim()) {
        return toast.warn(`Please enter the question text for Question ${i + 1}`);
      }
      if (item.options.some((opt) => !opt.trim())) {
        return toast.warn(`Please fill all options for Question ${i + 1}`);
      }
    }

    setBusy(true);
    try {
      let savedCount = 0;
      for (const item of forms) {
        const payload = {
          board: scope.board,
          class: scope.class,
          subject: scope.subject,
          topic: scope.topic,
          ...buildQuestionStagePayload(scope.stage),
          difficulty: scope.difficulty.toLowerCase(),
          questionType: scope.questionType,
          question: item.question,
          options: item.options,
          correct: item.correct,
          explanation: item.explanation,
          explanationImage: item.explanationImage,
          tags: item.tags,
        };
        await postQuestion("mcq-single", payload);
        savedCount += 1;
      }

      toast.success(`${savedCount} question${savedCount > 1 ? "s" : ""} saved successfully!`);

      // Reset only the question form, keep scope intact
      setQuestionCount(1);
      setForms([createEmptyQuestion()]);
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
          <div className="space-y-6">
            <div className="rounded-3xl bg-white border border-slate-200 shadow-xl p-8 space-y-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Bulk Upload (Excel)</h2>
                  <p className="text-slate-600 text-sm mt-1">
                    Upload multiple MCQ single questions using one Excel file.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={downloadBulkTemplate}
                  className="rounded-xl px-4 py-2 bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors"
                >
                  Download Template
                </button>
              </div>

              <div className="grid sm:grid-cols-[1fr_auto] gap-4">
                <input
                  key={bulkInputKey}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                  className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-300
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <button
                  type="button"
                  onClick={submitBulkUpload}
                  disabled={bulkBusy}
                  className="rounded-xl px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold
                           shadow hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkBusy ? "Uploading..." : "Upload File"}
                </button>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                <p className="font-semibold text-slate-800 mb-2">Excel columns for MCQ single bulk upload:</p>
                <p className="text-sm text-slate-700">
                  <strong>Required:</strong> question, optionA, optionB, optionC, optionD, correct
                </p>
                <p className="text-sm text-slate-700">
                  <strong>Optional:</strong> explanation, tags
                </p>
              </div>
            </div>

            <form
              onSubmit={submit}
              className="space-y-6 rounded-3xl bg-white border border-slate-200 shadow-xl p-8"
            >
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
                    className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-300
                             focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <p className="text-sm text-slate-600">
                    You can add up to 50 questions in one save.
                  </p>
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
                    <label className="font-bold text-slate-800 mb-2 block text-lg">
                      Question Text
                    </label>
                    <textarea
                      className="w-full rounded-xl px-4 py-3 bg-white border border-slate-300 min-h-32
                               focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Enter your question here..."
                      value={form.question}
                      onChange={(e) => update(qIdx, "question", e.target.value)}
                    />
                  </div>

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
                            className="w-full rounded-xl px-4 py-3 bg-white border border-slate-300
                                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder={`Enter option ${L}`}
                            value={form.options[i]}
                            onChange={(e) => updateOpt(qIdx, i, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="font-bold text-slate-800 mb-2 block">
                        Correct Answer
                      </label>
                      <select
                        className="w-full rounded-xl px-4 py-3 bg-white border border-slate-300
                                 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        value={form.correct}
                        onChange={(e) => update(qIdx, "correct", e.target.value)}
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
                        className="w-full rounded-xl px-4 py-3 bg-white border border-slate-300
                                 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                        placeholder="algebra, physics, grammar..."
                        value={form.tags}
                        onChange={(e) => update(qIdx, "tags", e.target.value)}
                      />
                    </div>
                  </div>

                  <ExplanationEditor
                    explanation={form.explanation}
                    explanationImage={form.explanationImage}
                    onExplanationChange={(value) => update(qIdx, "explanation", value)}
                    onExplanationImageChange={(value) => update(qIdx, "explanationImage", value)}
                  />
                </div>
              ))}

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
          </div>
        )}
      </div>
    </>
  );
}
