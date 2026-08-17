import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { ClipboardCheck, CheckCircle2, XCircle, Search, Eye, X } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import { getJSON } from "../../lib/api";

export default function QuestionReview() {
  const API = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();
  const isAdmin = String(user?.role || "").toLowerCase() === "admin";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [updatingId, setUpdatingId] = useState("");
  const [rejectingId, setRejectingId] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [viewingItem, setViewingItem] = useState(null);

  const [boardMap, setBoardMap] = useState({});
  const [classMap, setClassMap] = useState({});
  const [subjectMap, setSubjectMap] = useState({});
  const [topicMap, setTopicMap] = useState({});

  function previewOf(item) {
    return (
      item.question ||
      item.prompt ||
      item.choiceMatrix?.prompt ||
      item.clozeDrag?.text ||
      item.clozeSelect?.text ||
      item.clozeText?.text ||
      item.matchList?.prompt ||
      "(no preview)"
    );
  }

  async function loadMetadata() {
    try {
      const boardsData = (await getJSON("/api/boards")) || [];
      const bMap = {};
      boardsData.forEach((b) => (bMap[b._id] = b.name));
      setBoardMap(bMap);

      const classesData = (await getJSON("/api/classes")) || [];
      const cMap = {};
      classesData.forEach((c) => (cMap[c._id] = c.name));
      setClassMap(cMap);

      const subjects = (await getJSON("/api/subject")) || [];
      const sMap = {};
      subjects.forEach((s) => (sMap[s._id] = s.name));
      setSubjectMap(sMap);

      const tMap = {};
      for (const s of subjects) {
        const topics = (await getJSON(`/api/topic/${s._id}`)) || [];
        topics.forEach((t) => (tMap[t._id] = t.name));
      }
      setTopicMap(tMap);
    } catch (err) {
      console.error("Failed to load metadata", err);
    }
  }

  async function load() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("limit", "200");
      params.set("status", statusFilter);
      if (query.trim()) params.set("q", query.trim());

      const res = await fetch(`${API}/api/questions/review?${params.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("jwt") || ""}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to fetch questions");
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      toast.error(err?.message || "Failed to fetch questions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isAdmin) return;
    loadMetadata();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.trim().toLowerCase();
    return items.filter((item) =>
      [previewOf(item), item.createdBy?.name, item.createdBy?.email, item.type]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [items, query]);

  async function review(id, status, reason = "") {
    try {
      setUpdatingId(id);
      const res = await fetch(`${API}/api/questions/${id}/review`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt") || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to update question");

      setItems((prev) => prev.filter((item) => item._id !== id));
      toast.success(`Question ${status}`);
      setRejectingId("");
      setRejectReason("");
    } catch (err) {
      toast.error(err?.message || "Failed to update question");
    } finally {
      setUpdatingId("");
    }
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <ToastContainer />

      <div className="rounded-2xl border border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50 p-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-white shadow">
            <ClipboardCheck className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-purple-800">Question Review</h1>
            <p className="text-sm text-purple-700">Approve or reject questions submitted by teachers before they go live</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by question text, type, or teacher..."
            className="w-full pl-10 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
        >
          <option value="pending">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
        <button
          type="button"
          onClick={load}
          className="px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700"
        >
          Refresh
        </button>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1200px] w-full text-sm">
            <thead className="bg-purple-50 text-gray-700">
              <tr>
                <th className="text-left p-4 font-semibold">Question</th>
                <th className="text-left p-4 font-semibold">Type</th>
                <th className="text-left p-4 font-semibold">Board / Class / Subject / Topic</th>
                <th className="text-left p-4 font-semibold">Submitted By</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Submitted</th>
                <th className="text-left p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-500">
                    Loading questions...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-500">
                    No questions found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item._id}>
                    <td className="p-4">
                      <div className="max-w-72 line-clamp-2 text-gray-800 font-medium">{previewOf(item)}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                        {item.type}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-gray-600">
                      <div>{boardMap[item.board] || item.board || "N/A"}</div>
                      <div>{classMap[item.class] || item.class || "N/A"}</div>
                      <div className="font-medium text-gray-800">{subjectMap[item.subject] || item.subject || "N/A"}</div>
                      <div>{topicMap[item.topic] || item.topic || "N/A"}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-800">{item.createdBy?.name || "Unknown"}</div>
                      <div className="text-xs text-gray-500">{item.createdBy?.email || ""}</div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                          item.status === "approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : item.status === "rejected"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {item.status}
                      </span>
                      {item.status === "rejected" && item.rejectionReason ? (
                        <div className="text-xs text-rose-500 mt-1 max-w-48">{item.rejectionReason}</div>
                      ) : null}
                    </td>
                    <td className="p-4 text-xs text-gray-600">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingItem(item)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 w-fit"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>

                        {item.status === "pending" ? (
                          rejectingId === item._id ? (
                            <div className="flex flex-col gap-2 w-56">
                              <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Reason (optional)"
                                rows={2}
                                className="border border-gray-300 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => review(item._id, "rejected", rejectReason)}
                                  disabled={updatingId === item._id}
                                  className="flex-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                                >
                                  Confirm Reject
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRejectingId("");
                                    setRejectReason("");
                                  }}
                                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => review(item._id, "approved")}
                                disabled={updatingId === item._id}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectingId(item._id)}
                                disabled={updatingId === item._id}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Reject
                              </button>
                            </div>
                          )
                        ) : (
                          <span className="text-xs text-gray-400">Reviewed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewingItem && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setViewingItem(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-purple-50">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{viewingItem.type}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {boardMap[viewingItem.board] || viewingItem.board} / {classMap[viewingItem.class] || viewingItem.class} /{" "}
                  {subjectMap[viewingItem.subject] || viewingItem.subject} / {topicMap[viewingItem.topic] || viewingItem.topic}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                className="p-2 rounded-lg hover:bg-purple-100"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <QuestionDetail item={viewingItem} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionDetail({ item }) {
  const optionLetter = (i) => ["A", "B", "C", "D"][i];

  if (item.type === "mcq-single" || item.type === "mcq-multi") {
    return (
      <>
        <Field label="Question" value={item.question} />
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Options</h4>
          <div className="space-y-2">
            {(item.options || []).map((opt, i) => {
              const key = opt.key || optionLetter(i);
              const isCorrect = (item.correct || []).includes(key);
              return (
                <div
                  key={i}
                  className={`px-3 py-2 rounded-lg border text-sm ${
                    isCorrect ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold" : "bg-gray-50 border-gray-200"
                  }`}
                >
                  {key}. {opt.text} {isCorrect ? "✓" : ""}
                </div>
              );
            })}
          </div>
        </div>
        {item.explanation ? <Field label="Explanation" value={item.explanation} /> : null}
      </>
    );
  }

  if (item.type === "true-false") {
    return (
      <>
        <Field label="Statement" value={item.question} />
        <Field label="Correct Answer" value={(item.correct || []).join(", ")} />
        {item.explanation ? <Field label="Explanation" value={item.explanation} /> : null}
      </>
    );
  }

  if (item.type === "choice-matrix") {
    const cm = item.choiceMatrix || {};
    return (
      <>
        <Field label="Prompt" value={cm.prompt} />
        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="w-full text-xs">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-3 py-2"></th>
                {(cm.cols || []).map((c, i) => (
                  <th key={i} className="text-left px-3 py-2">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(cm.rows || []).map((r, ri) => (
                <tr key={ri} className="border-t border-gray-200">
                  <td className="px-3 py-2 font-medium">{r}</td>
                  {(cm.cols || []).map((_, ci) => {
                    const isCorrect = (cm.correctCells || []).includes(`${ri}-${ci}`);
                    return (
                      <td key={ci} className={`px-3 py-2 text-center ${isCorrect ? "bg-emerald-50 text-emerald-700 font-bold" : ""}`}>
                        {isCorrect ? "✓" : ""}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  if (item.type === "cloze-drag") {
    const c = item.clozeDrag || {};
    return (
      <>
        <Field label="Text" value={c.text} />
        <Field label="Tokens" value={(c.tokens || []).join(", ")} />
        <Field label="Correct Map" value={JSON.stringify(c.correctMap || {})} />
      </>
    );
  }

  if (item.type === "cloze-select") {
    const c = item.clozeSelect || {};
    return (
      <>
        <Field label="Text" value={c.text} />
        <Field label="Blanks" value={JSON.stringify(c.blanks || {})} />
      </>
    );
  }

  if (item.type === "cloze-text") {
    const c = item.clozeText || {};
    return (
      <>
        <Field label="Text" value={c.text} />
        <Field label="Answers" value={JSON.stringify(c.answers || {})} />
      </>
    );
  }

  if (item.type === "match-list") {
    const m = item.matchList || {};
    return (
      <>
        <Field label="Prompt" value={m.prompt} />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Left</h4>
            <ul className="text-sm text-gray-700 list-disc list-inside">
              {(m.left || []).map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Right</h4>
            <ul className="text-sm text-gray-700 list-disc list-inside">
              {(m.right || []).map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
        <Field label="Pairs (left index → right index)" value={JSON.stringify(m.pairs || {})} />
      </>
    );
  }

  if (item.type === "essay-rich") {
    return (
      <>
        <Field label="Prompt" value={item.prompt} />
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Content</h4>
          <div
            className="prose prose-sm max-w-none border border-gray-200 rounded-xl p-4"
            dangerouslySetInnerHTML={{ __html: item.richHtml || "" }}
          />
        </div>
      </>
    );
  }

  if (item.type === "essay-plain") {
    return (
      <>
        <Field label="Prompt" value={item.prompt} />
        <Field label="Answer" value={item.plainText} />
      </>
    );
  }

  return <p className="text-sm text-gray-500">No preview available for this question type.</p>;
}

function Field({ label, value }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-1">{label}</h4>
      <p className="text-sm text-gray-700 border border-gray-200 rounded-xl p-3 bg-gray-50 whitespace-pre-wrap">
        {value || "—"}
      </p>
    </div>
  );
}
