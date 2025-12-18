import React, { useState, useEffect } from "react";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { postQuestion } from "../../lib/api";
import { FiEdit3, FiCheckCircle, FiFileText } from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";

export default function QuestionsEssayPlain() {
  const { scope } = useQuestionScope();
  const [busy, setBusy] = useState(false);
  const [classes, setClasses] = useState([]);
  const [boards, setBoards] = useState([]);

  const [form, setForm] = useState({
    prompt: "Explain Newton's First Law.",
    plainText: "",
    stage: 1,
    className: "",
    board: "",
  });

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
      const payload = {
        subject: scope.subject,
        topic: scope.topic,
        prompt: form.prompt,
        plainText: form.plainText,
        stage: form.stage,
        class: form.className,
        board: form.board,
      };

      const out = await postQuestion("essay-plain", payload);
      // alert(`Saved! id=${out.id}`);
      toast.success("Question saved!");
      setForm({ prompt: "", plainText: "", stage: 1, className: "", board: "" });
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
        space-y-8 rounded-3xl 
        bg-gradient-to-br from-white/70 to-white/30 
        border border-white/40 backdrop-blur-xl shadow-xl p-8
      "
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-rose-100 to-pink-100 text-rose-700 shadow">
            <FiEdit3 size={22} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Essay — Plain Text
          </h1>
        </div>

        <SubjectTopicPicker />
        {/* Stage + Class */}
        <div className="rounded-2xl backdrop-blur-lg p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-6">

            {/* Stage */}
            <div>
              <label className="font-medium text-slate-700 mb-1 block">Stage</label>
              <select
                className="w-full rounded-xl px-4 py-3 bg-white shadow-sm 
        focus:ring-2 focus:ring-purple-500"
                value={form.stage || 1}
                onChange={(e) =>
                  setForm((s) => ({ ...s, stage: Number(e.target.value) }))
                }
              >
                <option value={1}>Stage 1 — Basic</option>
              </select>
            </div>

            {/* Class */}
            <div>
              <label className="font-medium text-slate-700 mb-1 block">Select Class</label>
              <select
                className="w-full rounded-xl px-4 py-3 bg-white shadow-sm 
        focus:ring-2 focus:ring-purple-500"
                value={form.className || ""}
                onChange={(e) =>
                  setForm((s) => ({ ...s, className: e.target.value }))
                }
              >
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c._id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

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

        {/* Answer */}
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

        {/* Save Button */}
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
    </>
  );
}