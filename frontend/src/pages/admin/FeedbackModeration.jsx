import { useEffect, useMemo, useState } from "react";
import { listFeedbackAdmin, updateFeedbackStatus } from "../../lib/api";

const STATUS_OPTIONS = ["pending", "approved", "rejected", "all"];

export default function FeedbackModeration() {
  const [status, setStatus] = useState("pending");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await listFeedbackAdmin(status === "all" ? "" : status);
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      setError(err?.message || "Failed to load feedback");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [status]);

  async function changeStatus(id, nextStatus) {
    try {
      await updateFeedbackStatus(id, nextStatus);
      await load();
    } catch (err) {
      setError(err?.message || "Status update failed");
    }
  }

  const counts = useMemo(() => {
    const map = { pending: 0, approved: 0, rejected: 0 };
    for (const item of items) {
      const s = String(item?.status || "").toLowerCase();
      if (map[s] !== undefined) map[s] += 1;
    }
    return map;
  }, [items]);

  return (
    <div className="p-6 space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-bold text-slate-900">Feedback Moderation</h1>
        <p className="mt-1 text-sm text-slate-600">Approve feedback before showing it publicly.</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setStatus(opt)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold border ${status === opt ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-700 border-slate-300"}`}
            >
              {opt[0].toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>
        <div className="mt-3 text-xs text-slate-500">
          Pending: {counts.pending} | Approved: {counts.approved} | Rejected: {counts.rejected}
        </div>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      {loading ? <div className="text-sm text-slate-600">Loading feedback...</div> : null}

      {!loading && items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">No feedback found.</div>
      ) : null}

      <div className="space-y-3">
        {items.map((item) => (
          <article key={item._id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">{item.name} • {"★".repeat(Number(item.rating || 0))}</h3>
                <p className="text-xs text-slate-500">{item.schoolName} | {item?.userId?.email || "-"}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {String(item.status || "pending")}
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-700 leading-relaxed">{item.comment}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => changeStatus(item._id, "approved")}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => changeStatus(item._id, "rejected")}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => changeStatus(item._id, "pending")}
                className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white"
              >
                Mark Pending
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
