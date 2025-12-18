import React, { useState, useEffect } from "react";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { postQuestion } from "../../lib/api";
import {
  FiGrid,
  FiPlus,
  FiUpload,
  FiEdit3,
} from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";

export default function QuestionsChoiceMatrix() {
  const { scope } = useQuestionScope();
  const [busy, setBusy] = useState(false);
  const [classes, setClasses] = useState([]);
  const [boards, setBoards] = useState([]);

  const [form, setForm] = useState({
    prompt: "",
    rows: ["Statement 1"],
    cols: ["True", "False"],
    correct: {},
    className: "",
    level: "basic",
    stage: 1,     // ⭐ ADDED
    board: "",  // ⭐ ADDED
  });

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

  async function submit(e) {
    e.preventDefault();
    if (!scope.subject || !scope.topic)
      // return alert("Pick Subject & Topic first");
      return toast.warn("Pick Subject & Topic first");

    if (!form.className)
      return toast.warn("Select Class for the question.");

    if (!form.board)
      return toast.warn("Select Board for the question.");

    setBusy(true);
    try {
      const correctCells = Object.entries(form.correct)
        .filter(([, v]) => v)
        .map(([k]) => k);

      const payload = {
        subject: scope.subject,
        topic: scope.topic,
        class: form.className,
        stage: form.stage,        // ⭐ ADDED TO PAYLOAD
        board: form.board,      // ⭐ ADDED TO PAYLOAD
        choiceMatrix: {
          prompt: form.prompt,
          rows: form.rows,
          cols: form.cols,
          correctCells,
        },
      };

      const out = await postQuestion("choice-matrix", payload);
      alert(`Saved! id=${out.id}`);

      setForm({
        prompt: "",
        rows: ["Statement 1"],
        cols: ["True", "False"],
        correct: {},
        className: "",
        level: "basic",
        stage: 1,   // RESET STAGE
        board: "",// RESET BOARD
      });
    } catch (err) {
      // alert(err.message);
      toast.error(err.message || "Failed to save question.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    async function loadMeta() {
      try {
        const [clsRes, brdRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/classes`),
          fetch(`${import.meta.env.VITE_API_URL}/api/boards`)
        ]);

        const clsData = await clsRes.json();
        const brdData = await brdRes.json();

        setClasses(Array.isArray(clsData) ? clsData : []);
        setBoards(Array.isArray(brdData) ? brdData : []);
      } catch (err) {
        console.error("Failed to load class/board", err);
      }
    }

    loadMeta();
  }, []);

  return (
    <>
      <ToastContainer position="bottom-right" />
      <form
        onSubmit={submit}
        className="
      space-y-8 p-8 rounded-3xl 
      bg-gradient-to-br from-white/70 to-white/30 
      border border-white/40 backdrop-blur-xl shadow-xl
    "
      >
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl shadow">
            <FiGrid size={22} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Choice Matrix
          </h1>
        </div>

        {/* Subject Topic Picker */}
        <SubjectTopicPicker />

        {/* Class Select */}
        <div className="rounded-2xl backdrop-blur-lg p-6 space-y-4">
          <label className="font-medium text-slate-700 mb-1 block">Select Class</label>
          <select
            className="w-full rounded-xl px-4 py-3 bg-white shadow-sm focus:ring-2 focus:ring-purple-500"
            value={form.className}
            onChange={(e) => setForm((s) => ({ ...s, className: e.target.value }))}
          >
            <option value="">Select Class</option>
            {classes.map((c) => (
              <option key={c._id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* ⭐ ADDED — Stage Selector */}
          <div>
            <label className="font-medium text-slate-700 mb-1">Stage</label>
            <select
              className="w-full rounded-xl px-4 py-3 bg-white shadow-sm 
                       focus:ring-2 focus:ring-purple-500"
              value={form.stage}
              onChange={(e) => setForm((s) => ({ ...s, stage: Number(e.target.value) }))}
            >
              <option value={1}>Stage 1: Basic</option>
              {/* <option value={2}>Stage 2: Intermediate</option>
              <option value={3}>Stage 3: Advanced</option> */}
            </select>
          </div>
          <div>
            <label className="font-medium text-slate-700 mb-1 flex gap-1 items-center">Select Board</label>
            <select
              className="w-full rounded-xl px-4 py-3 bg-white shadow-sm focus:ring-2 focus:ring-purple-500"
              value={form.board}
              onChange={(e) => update("board", e.target.value)}
            >
              <option value="">Select Board</option>
              {boards.map((b) => (
                <option key={b._id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>



        {/* Prompt */}
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
            onChange={(e) => setForm((s) => ({ ...s, prompt: e.target.value }))}
          />
        </div>

        {/* Add Row / Col */}
        <div className="flex gap-3">
          <button type="button" onClick={addRow} className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-all shadow active:scale-95">
            <FiPlus /> Add Row
          </button>

          <button type="button" onClick={addCol} className="flex items-center gap-2 px-4 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white transition-all shadow active:scale-95">
            <FiPlus /> Add Column
          </button>
        </div>

        {/* Table */}
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

        {/* Save */}
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
    </>
  );
}
