import React, { useRef, useState } from "react";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { postQuestion } from "../../lib/api";
import { FiEdit3, FiBold, FiItalic, FiUnderline, FiCheckCircle } from "react-icons/fi";

export default function QuestionsEssayRich() {
  const { scope } = useQuestionScope();
  const [busy, setBusy] = useState(false);
  const [prompt, setPrompt] = useState("Describe the water cycle.");
  const editorRef = useRef(null);

  const applyCmd = (cmd) => document.execCommand(cmd, false, null);

  async function submit(e) {
    e.preventDefault();
    if (!scope.subject || !scope.topic) return alert("Pick Subject & Topic first");

    setBusy(true);
    try {
      const html = editorRef.current?.innerHTML || "";

      const payload = {
        subject: scope.subject,
        topic: scope.topic,
        prompt,
        richHtml: html,
      };

      const out = await postQuestion("essay-rich", payload);
      alert(`Saved! id=${out.id}`);

      setPrompt("");
      if (editorRef.current) editorRef.current.innerHTML = "";
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="
        space-y-8 rounded-3xl bg-gradient-to-br from-white/70 to-white/30 
        border border-white/40 backdrop-blur-xl shadow-xl p-8
      "
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 text-indigo-700 shadow">
          <FiEdit3 size={22} />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Essay — Rich Text
        </h1>
      </div>

      <SubjectTopicPicker />

      {/* Prompt */}
      <div className="rounded-2xl backdrop-blur-lg p-6">
        <label className="font-semibold text-slate-800 mb-2 block">Prompt</label>
        <input
          className="
            w-full rounded-xl px-4 py-3 bg-white shadow-sm
            focus:ring-2 focus:ring-blue-500 transition-all
          "
          placeholder="Enter essay prompt..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>

      {/* Rich Text Editor */}
      <div className="rounded-2xl bg-white/80 backdrop-blur-xl shadow p-6 space-y-4">

        <label className="font-semibold text-slate-800">Answer (Rich Text)</label>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => applyCmd("bold")}
            className="p-2 rounded-lg bg-white hover:bg-blue-50 transition"
          >
            <FiBold />
          </button>
          <button
            type="button"
            onClick={() => applyCmd("italic")}
            className="p-2 rounded-lg bg-white hover:bg-blue-50 transition"
          >
            <FiItalic />
          </button>
          <button
            type="button"
            onClick={() => applyCmd("underline")}
            className="p-2 rounded-lg bg-white hover:bg-blue-50 transition"
          >
            <FiUnderline />
          </button>
        </div>

        {/* Editor */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="
            min-h-40 rounded-xl bg-white p-4 shadow-sm 
            focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all
          "
        />

        <p className="text-xs text-slate-500">
          Basic rich text. Upgrade coming soon → TipTap / Quill.
        </p>
      </div>

      {/* Save Button */}
      <button
        disabled={busy}
        className="
          flex items-center gap-2 rounded-xl px-6 py-3 
          bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold
          shadow-md hover:shadow-xl hover:scale-[1.02]
          active:scale-95 transition-all disabled:opacity-50
        "
      >
        <FiCheckCircle /> {busy ? "Saving..." : "Save Question"}
      </button>
    </form>
  );
}
