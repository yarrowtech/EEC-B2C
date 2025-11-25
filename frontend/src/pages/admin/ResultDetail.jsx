import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { adminAttempt } from "../../lib/api";

export default function ResultDetail() {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      setBusy(true); setErr("");
      try {
        const data = await adminAttempt(id);
        setDoc(data);
      } catch (e) {
        setErr(e.message || "Failed to load");
      } finally {
        setBusy(false);
      }
    })();
  }, [id]);

  if (busy && !doc) return <div>Loading…</div>;
  if (err) return <div className="text-rose-600">{err}</div>;
  if (!doc) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Attempt Details</h1>
        <Link to="/dashboard/results" className="rounded-lg border px-3 py-1.5 hover:bg-slate-50">Back</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Info title="Student" value={`${doc.user?.name || "—"} (${doc.user?.email || "—"})`} />
        <Info title="Subject" value={doc.subject} />
        <Info title="Topic" value={doc.topic} />
        <Info title="Type" value={doc.type} />
        <Info title="Score" value={`${doc.score} / ${doc.total} (${doc.percent}%)`} />
        <Info title="Submitted" value={doc.submittedAt ? new Date(doc.submittedAt).toLocaleString() : "—"} />
      </div>

      <div className="rounded-2xl border bg-white/70 backdrop-blur">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3">#</th>
              <th className="text-left p-3">Question</th>
              <th className="text-left p-3">Student Answer</th>
              <th className="text-left p-3">Correct</th>
              <th className="text-left p-3">Result</th>
            </tr>
          </thead>
          <tbody>
            {doc.items.map((it, idx) => (
              <tr key={it.qid} className="border-t">
                <td className="p-3">{idx + 1}</td>
                <td className="p-3">{it.question}</td>
                <td className="p-3">{it.studentAnswer}</td>
                <td className="p-3">{it.correctAnswer}</td>
                <td className="p-3">{it.isCorrect ? "✔️" : "❌"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Info({ title, value }) {
  return (
    <div className="rounded-xl border bg-white/70 backdrop-blur p-3">
      <div className="text-[11px] text-slate-500/90">{title}</div>
      <div className="text-sm font-semibold text-slate-800 truncate">{value}</div>
    </div>
  );
}
