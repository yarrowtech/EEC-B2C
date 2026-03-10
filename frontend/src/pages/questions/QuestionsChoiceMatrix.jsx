import React, { useState } from "react";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { postChoiceMatrixBulk, postQuestion } from "../../lib/api";
import { buildQuestionStagePayload } from "../../lib/stage";
import {
  FiGrid,
  FiPlus,
  FiUpload,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import * as XLSX from "xlsx";

export default function QuestionsChoiceMatrix() {
  const { scope } = useQuestionScope();
  const [busy, setBusy] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkInputKey, setBulkInputKey] = useState(0);

  const [form, setForm] = useState({
    prompt: "",
    rows: ["Statement 1"],
    cols: ["True", "False"],
    correct: {},
  });

  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  const toggle = (ri, ci) =>
    setForm((s) => ({
      ...s,
      correct: { ...s.correct, [`${ri}-${ci}`]: !s.correct[`${ri}-${ci}`] },
    }));

  const addRow = () =>
    setForm((s) => ({
      ...s,
      rows: [...s.rows, `Statement ${s.rows.length + 1}`],
    }));

  const addCol = () =>
    setForm((s) => ({
      ...s,
      cols: [...s.cols, `Choice ${s.cols.length + 1}`],
    }));

  function downloadBulkTemplate() {
    const worksheet = XLSX.utils.json_to_sheet([
      {
        prompt: "Mark each statement as True or False",
        rows: "Sun rises in east|2+2=5",
        cols: "True|False",
        correctCells: "Sun rises in east:True|2+2=5:False",
        explanation: "Basic facts",
        tags: "logic, basics",
      },
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Choice Matrix");
    XLSX.writeFile(workbook, "choice_matrix_bulk_template.xlsx");
  }

  async function submitBulkUpload() {
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
      payload.append("questionType", "choice-matrix");

      const res = await postChoiceMatrixBulk(payload);
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
    if (!scope.board || !scope.class || !scope.subject || !scope.topic ||
        !scope.stage || !scope.difficulty || !scope.questionType) {
      return toast.warn("Please complete all fields in the parameter selector above");
    }

    if (!form.prompt.trim()) {
      return toast.warn("Please enter the prompt");
    }

    if (form.rows.some((row) => !row.trim()) || form.cols.some((col) => !col.trim())) {
      return toast.warn("Please fill all row and column labels");
    }

    setBusy(true);
    try {
      const correctCells = Object.entries(form.correct)
        .filter(([, v]) => v)
        .map(([k]) => k);

      const payload = {
        board: scope.board,
        class: scope.class,
        subject: scope.subject,
        topic: scope.topic,
        ...buildQuestionStagePayload(scope.stage),
        difficulty: scope.difficulty.toLowerCase(),
        questionType: scope.questionType,
        choiceMatrix: {
          prompt: form.prompt,
          rows: form.rows,
          cols: form.cols,
          correctCells,
        },
      };

      await postQuestion("choice-matrix", payload);
      toast.success("Question saved successfully!");

      setForm({
        prompt: "",
        rows: ["Statement 1"],
        cols: ["True", "False"],
        correct: {},
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
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl shadow-lg">
            <FiCheckCircle size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Choice Matrix
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
          <div className="space-y-6">
            <div className="rounded-3xl bg-white border border-slate-200 shadow-xl p-8 space-y-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Bulk Upload (Excel)</h2>
                  <p className="text-slate-600 text-sm mt-1">
                    Upload multiple Choice Matrix questions using one Excel file.
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
                <p className="font-semibold text-slate-800 mb-2">Excel columns for Choice Matrix bulk upload:</p>
                <p className="text-sm text-slate-700">
                  <strong>Required:</strong> prompt, rows, cols
                </p>
                <p className="text-sm text-slate-700">
                  <strong>Optional:</strong> correctCells, explanation, tags
                </p>
                <p className="text-sm text-slate-700 mt-1">
                  <strong>rows/cols separator:</strong> use <code>|</code> (example: <code>True|False</code>)
                </p>
                <p className="text-sm text-slate-700 mt-1">
                  <strong>correctCells format:</strong> <code>rowLabel:colLabel|rowLabel:colLabel</code> or <code>0-1|1-0</code>
                </p>
              </div>
            </div>

            <form
              onSubmit={submit}
              className="
              space-y-8 p-8 rounded-3xl 
              bg-gradient-to-br from-white/70 to-white/30 
              border border-white/40 backdrop-blur-xl shadow-xl
            "
            >
              <div className="rounded-2xl backdrop-blur-lg p-6">
                <label className="font-semibold text-slate-800 mb-2 block">
                  Prompt
                </label>
                <textarea
                  className="
                  w-full rounded-xl px-4 py-3 bg-white shadow-sm min-h-28 
                  focus:ring-2 focus:ring-blue-500
                "
                  placeholder="Enter the main question prompt..."
                  value={form.prompt}
                  onChange={(e) => update("prompt", e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={addRow} className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-all shadow active:scale-95">
                  <FiPlus /> Add Row
                </button>

                <button type="button" onClick={addCol} className="flex items-center gap-2 px-4 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white transition-all shadow active:scale-95">
                  <FiPlus /> Add Column
                </button>
              </div>

              <div className="overflow-auto rounded-2xl bg-white/60 backdrop-blur-lg shadow p-4">
                <table className="min-w-[700px] border-collapse w-full text-sm">
                  <thead>
                    <tr className="bg-slate-100/60 backdrop-blur">
                      <th className="border border-slate-400 px-4 py-3 text-left font-semibold text-slate-700">
                        Row / Column
                      </th>
                      {form.cols.map((c, i) => (
                        <th key={i} className="border border-slate-400 px-4 py-3 text-center font-semibold text-slate-700">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {form.rows.map((r, ri) => (
                      <tr key={ri} className="odd:bg-slate-50/30">
                        <td className="border border-slate-400 px-3 py-2">
                          <input
                            className="w-full rounded-lg border border-slate-400 px-3 py-2 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500"
                            value={r}
                            onChange={(e) =>
                              setForm((s) => {
                                const rows = [...s.rows];
                                rows[ri] = e.target.value;
                                return { ...s, rows };
                              })
                            }
                          />
                        </td>

                        {form.cols.map((c, ci) => (
                          <td key={ci} className="border border-slate-400 px-3 py-2 text-center">
                            <label className="inline-flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                className="hidden peer"
                                checked={!!form.correct[`${ri}-${ci}`]}
                                onChange={() => toggle(ri, ci)}
                              />

                              <div className="
                              w-5 h-5 rounded-md border-2 border-slate-400 
                              peer-checked:border-green-500 peer-checked:bg-green-500
                              transition-all
                            "></div>
                            </label>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
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
          </div>
        )}
      </div>
    </>
  );
}
