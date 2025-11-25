import React, { useRef, useState } from "react";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { postQuestion } from "../../lib/api";

export default function QuestionsEssayRich() {
  const { scope } = useQuestionScope();
  const [busy, setBusy] = useState(false);
  const [prompt, setPrompt] = useState("Describe the water cycle.");
  const editorRef = useRef(null);

  async function submit(e){
    e.preventDefault();
    if(!scope.subject||!scope.topic) return alert("Pick Subject & Topic first");
    setBusy(true);
    try{
      const html = editorRef.current?.innerHTML || "";
      const payload = { subject: scope.subject, topic: scope.topic, prompt, richHtml: html };
      const out = await postQuestion("essay-rich", payload);
      alert(`Saved! id=${out.id}`);
      setPrompt("");
      if (editorRef.current) editorRef.current.innerHTML = "";
    }catch(err){ alert(err.message); } finally{ setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <h1 className="text-xl font-semibold text-slate-800">Essay — Rich Text</h1>
      <SubjectTopicPicker />
      <div>
        <label className="block text-sm text-slate-600 mb-1">Prompt</label>
        <input className="w-full rounded-lg border px-3 py-2 bg-white" value={prompt} onChange={(e)=>setPrompt(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm text-slate-600 mb-1">Answer (rich text)</label>
        <div ref={editorRef} className="min-h-40 rounded-lg border bg-white p-3" contentEditable suppressContentEditableWarning />
        <div className="text-xs text-slate-500 mt-1">Basic rich text. Swap to TipTap/Quill later.</div>
      </div>
      <button disabled={busy} className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 disabled:opacity-50">
        {busy ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
