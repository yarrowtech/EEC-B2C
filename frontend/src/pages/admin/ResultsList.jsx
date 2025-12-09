import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { adminAttempts } from "../../lib/api.js";
import { Search } from "lucide-react";

export default function ResultsList() {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      setBusy(true); setErr("");
      try {
        const { items } = await adminAttempts();
        setRows(items || []);
      } catch (e) {
        setErr(e.message || "Failed to load");
      } finally {
        setBusy(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(r =>
      (r.user?.name || "").toLowerCase().includes(s) ||
      (r.user?.email || "").toLowerCase().includes(s) ||
      (r.subject || "").toLowerCase().includes(s) ||
      (r.topic || "").toLowerCase().includes(s) ||
      (r.type || "").toLowerCase().includes(s)
    );
  }, [rows, q]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">Results</h1>
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            placeholder="Search by student, subject, topic, type…"
            className="w-full rounded-lg border pl-8 pr-3 py-2 bg-white"
          />
        </div>
        {busy && <span className="text-xs text-slate-500">Loading…</span>}
        {err && <span className="text-xs text-rose-600">{err}</span>}
      </div>

      <div className="overflow-auto rounded-2xl border bg-white/70 backdrop-blur">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3">Student</th>
              <th className="text-left p-3">Exam (Subject • Topic • Type)</th>
              <th className="text-left p-3">Score</th>
              <th className="text-left p-3">Attempts by Student</th>
              <th className="text-left p-3">Date</th>
              <th className="text-right p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r._id} className="border-t">
                <td className="p-3">
                  <div className="font-medium">{r.user?.name || "—"}</div>
                  <div className="text-xs text-slate-500">{r.user?.email || ""}</div>
                </td>
                <td className="p-3">
                  {r.subject || "—"} • {r.topic || "—"} • <span className="uppercase text-xs bg-slate-100 px-1.5 py-0.5 rounded">{r.type}</span>
                </td>
                <td className="p-3">
                  <span className="font-semibold">{r.score}</span> / {r.total} <span className="ml-2 text-xs text-slate-500">({r.percent}%)</span>
                </td>
                <td className="p-3">{r.attemptsForUser || 1}</td>
                <td className="p-3 text-slate-600">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="p-3 text-right">
                  <Link to={`/dashboard/results/${r._id}`} className="rounded-md px-3 py-1 border hover:bg-slate-50">View</Link>
                </td>
              </tr>
            ))}
            {!filtered.length && !busy && (
              <tr><td colSpan={6} className="p-6 text-center text-slate-500">No results found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
