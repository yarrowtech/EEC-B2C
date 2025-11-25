import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { getJSON, deleteQuestion } from "../../lib/api";

const TYPES = [
  "mcq-single","mcq-multi","choice-matrix","true-false",
  "cloze-drag","cloze-select","cloze-text","match-list",
  "essay-rich","essay-plain",
];

export default function QuestionsList() {
  const { scope } = useQuestionScope();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const page = Number(searchParams.get("page") || 1);
  const limit = 10;
  const [type, setType] = useState(searchParams.get("type") || "");
  const [q, setQ] = useState(searchParams.get("q") || "");

  const canSearch = useMemo(() => !!scope.subject || !!scope.topic || !!type || !!q, [scope, type, q]);

  async function load() {
    setBusy(true); setErr("");
    try {
      const qs = new URLSearchParams();
      if (scope.subject) qs.set("subject", scope.subject);
      if (scope.topic) qs.set("topic", scope.topic);
      if (type) qs.set("type", type);
      if (q) qs.set("q", q);
      qs.set("page", page.toString());
      qs.set("limit", limit.toString());
      const data = await getJSON(`/api/questions?${qs.toString()}`);
      setRows(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      setErr(e.message || "Failed to load");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page]);

  function applyFilters(e) {
    e.preventDefault();
    const next = {};
    if (scope.subject) next.subject = scope.subject;
    if (scope.topic) next.topic = scope.topic;
    if (type) next.type = type;
    if (q) next.q = q;
    next.page = "1";
    setSearchParams(next);
    // trigger load after url update
    setTimeout(load, 0);
  }

  async function onDelete(id) {
    if (!confirm("Delete this question?")) return;
    try {
      await deleteQuestion(id);
      await load();
    } catch (e) {
      alert(e.message);
    }
  }

  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">Questions — List</h1>

      <SubjectTopicPicker />

      <form onSubmit={applyFilters} className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Type</label>
          <select className="w-full rounded-lg border px-3 py-2 bg-white" value={type} onChange={(e)=>setType(e.target.value)}>
            <option value="">All types</option>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Search</label>
          <input className="w-full rounded-lg border px-3 py-2 bg-white"
                 value={q} onChange={(e)=>setQ(e.target.value)}
                 placeholder="search in question/prompt/subject/topic"/>
        </div>
        <div className="flex items-end gap-2">
          <button className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700">Apply</button>
          {!canSearch && <span className="text-xs text-slate-500">Tip: set filters or search to narrow down</span>}
        </div>
      </form>

      {err && <div className="text-red-600 text-sm">{err}</div>}

      <div className="overflow-auto rounded-xl border bg-white">
        <table className="min-w-[800px] w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3">Type</th>
              <th className="text-left p-3">Subject</th>
              <th className="text-left p-3">Topic</th>
              <th className="text-left p-3">Difficulty</th>
              <th className="text-left p-3">Preview</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r._id} className="border-t">
                <td className="p-3">{r.type}</td>
                <td className="p-3">{r.subject}</td>
                <td className="p-3">{r.topic}</td>
                <td className="p-3">{r.difficulty || "-"}</td>
                <td className="p-3">
                  <div className="line-clamp-2 max-w-[380px]">
                    {r.question || r.prompt || (r.choiceMatrix?.prompt) || (r.clozeDrag?.text) || (r.clozeSelect?.text) || (r.clozeText?.text) || (r.matchList?.prompt) || "-"}
                  </div>
                </td>
                <td className="p-3 text-right">
                  <Link to={`/dashboard/questions/edit/${r._id}`} className="rounded-md px-3 py-1 border hover:bg-slate-50 mr-2">Edit</Link>
                  <button onClick={()=>onDelete(r._id)} className="rounded-md px-3 py-1 border text-red-600 hover:bg-red-50">Delete</button>
                </td>
              </tr>
            ))}
            {!rows.length && !busy && (
              <tr><td colSpan={6} className="p-6 text-center text-slate-500">No questions found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">Total: {total}</div>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={()=>setSearchParams({ ...Object.fromEntries(searchParams), page: String(page-1) })}
            className="rounded-md border px-3 py-1 disabled:opacity-50"
          >Prev</button>
          <span className="text-sm px-2">Page {page} / {pages}</span>
          <button
            disabled={page >= pages}
            onClick={()=>setSearchParams({ ...Object.fromEntries(searchParams), page: String(page+1) })}
            className="rounded-md border px-3 py-1 disabled:opacity-50"
          >Next</button>
        </div>
      </div>
    </div>
  );
}
