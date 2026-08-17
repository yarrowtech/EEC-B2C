import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { ClipboardCheck, CheckCircle2, XCircle, Search, Eye, X } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";

export default function TopicReview() {
  const API = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();
  const isAdmin = String(user?.role || "").toLowerCase() === "admin";

  const [reviewType, setReviewType] = useState("topic");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [updatingId, setUpdatingId] = useState("");
  const [rejectingId, setRejectingId] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [viewingItem, setViewingItem] = useState(null);

  function hasPlainText(html) {
    return Boolean(
      String(html || "")
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ")
        .trim()
    );
  }

  function stripTags(html, max = 140) {
    const text = String(html || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) return "";
    return text.length > max ? `${text.slice(0, max)}...` : text;
  }

  async function load() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("limit", "200");
      params.set("type", reviewType);
      params.set("status", statusFilter);
      if (query.trim()) params.set("q", query.trim());

      const res = await fetch(`${API}/api/topic-review?${params.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("jwt") || ""}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to fetch topics");
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      toast.error(err?.message || "Failed to fetch topics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isAdmin) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, reviewType]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.trim().toLowerCase();
    const submitter = (item) =>
      reviewType === "content" ? item.draftUpdatedBy : item.createdBy;
    return items.filter((item) =>
      [item.name, submitter(item)?.name, submitter(item)?.email, item.subject?.name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [items, query, reviewType]);

  async function review(id, status, reason = "") {
    try {
      setUpdatingId(id);
      const res = await fetch(`${API}/api/topic/${id}/review`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt") || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: reviewType, status, reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to update topic");

      setItems((prev) => prev.filter((item) => item._id !== id));
      toast.success(reviewType === "content" ? `Content ${status}` : `Topic ${status}`);
      setRejectingId("");
      setRejectReason("");
    } catch (err) {
      toast.error(err?.message || "Failed to update topic");
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
            <h1 className="text-2xl font-bold text-purple-800">Topic Review</h1>
            <p className="text-sm text-purple-700">
              {reviewType === "content"
                ? "Approve or reject content updates submitted by teachers before they go live"
                : "Approve or reject topics submitted by teachers before they go live"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setReviewType("topic")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            reviewType === "topic"
              ? "bg-purple-600 text-white shadow"
              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          Topic Submissions
        </button>
        <button
          type="button"
          onClick={() => setReviewType("content")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            reviewType === "content"
              ? "bg-purple-600 text-white shadow"
              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          Content Submissions
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by topic, subject, or teacher..."
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
          <table className="min-w-[1100px] w-full text-sm">
            <thead className="bg-purple-50 text-gray-700">
              <tr>
                <th className="text-left p-4 font-semibold">Topic</th>
                <th className="text-left p-4 font-semibold">Board / Class / Subject</th>
                <th className="text-left p-4 font-semibold">Submitted By</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Submitted</th>
                <th className="text-left p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    Loading topics...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    No topics found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isContent = reviewType === "content";
                  const submitter = isContent ? item.draftUpdatedBy : item.createdBy;
                  const rowStatus = isContent ? item.contentStatus : item.status;
                  const rowReason = isContent ? item.contentRejectionReason : item.rejectionReason;
                  const rowDate = isContent ? item.updatedAt : item.createdAt;
                  const contentPreview = isContent
                    ? [stripTags(item.draftTopicSummary, 100), stripTags(item.draftLearningOutcome, 100)]
                        .filter(Boolean)
                        .join(" · ")
                    : "";

                  return (
                  <tr key={item._id}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {item.topicImage ? (
                          <img
                            src={item.topicImage}
                            alt={item.name}
                            className="h-10 w-10 rounded-lg object-cover border border-gray-200"
                          />
                        ) : null}
                        <div>
                          <div className="font-semibold text-gray-800">{item.name}</div>
                          {isContent && contentPreview ? (
                            <div className="text-xs text-gray-500 max-w-64 line-clamp-2">{contentPreview}</div>
                          ) : item.shortDescription ? (
                            <div className="text-xs text-gray-500 max-w-64 line-clamp-2">{item.shortDescription}</div>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-gray-600">
                      <div>{item.board?.name || "N/A"}</div>
                      <div>{item.class?.name || "N/A"}</div>
                      <div className="font-medium text-gray-800">{item.subject?.name || "N/A"}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-800">{submitter?.name || "Unknown"}</div>
                      <div className="text-xs text-gray-500">{submitter?.email || ""}</div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                          rowStatus === "approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : rowStatus === "rejected"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {rowStatus}
                      </span>
                      {rowStatus === "rejected" && rowReason ? (
                        <div className="text-xs text-rose-500 mt-1 max-w-48">{rowReason}</div>
                      ) : null}
                    </td>
                    <td className="p-4 text-xs text-gray-600">
                      {rowDate
                        ? new Date(rowDate).toLocaleString("en-US", {
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

                        {rowStatus === "pending" ? (
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
                  );
                })
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
                <h3 className="text-lg font-bold text-gray-800">{viewingItem.name}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {viewingItem.board?.name || "N/A"} / {viewingItem.class?.name || "N/A"} /{" "}
                  {viewingItem.subject?.name || "N/A"}
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

            <div className="p-6 overflow-y-auto space-y-6">
              {reviewType === "content" ? (
                <>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Submitted Content</h4>
                    {hasPlainText(viewingItem.draftTopicSummary) ? (
                      <div
                        className="prose prose-sm max-w-none border border-gray-200 rounded-xl p-4"
                        dangerouslySetInnerHTML={{ __html: viewingItem.draftTopicSummary }}
                      />
                    ) : (
                      <p className="text-sm text-gray-400 italic">No content submitted</p>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Submitted Learning Outcome</h4>
                    {hasPlainText(viewingItem.draftLearningOutcome) ? (
                      <div
                        className="prose prose-sm max-w-none border border-gray-200 rounded-xl p-4"
                        dangerouslySetInnerHTML={{ __html: viewingItem.draftLearningOutcome }}
                      />
                    ) : (
                      <p className="text-sm text-gray-400 italic">No learning outcome submitted</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {viewingItem.topicImage ? (
                    <img
                      src={viewingItem.topicImage}
                      alt={viewingItem.name}
                      className="w-full max-h-64 object-cover rounded-xl border border-gray-200"
                    />
                  ) : null}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Short Description</h4>
                    <p className="text-sm text-gray-600">
                      {viewingItem.shortDescription || "No description provided"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Content</h4>
                    {hasPlainText(viewingItem.topicSummary) ? (
                      <div
                        className="prose prose-sm max-w-none border border-gray-200 rounded-xl p-4"
                        dangerouslySetInnerHTML={{ __html: viewingItem.topicSummary }}
                      />
                    ) : (
                      <p className="text-sm text-gray-400 italic">No content added yet</p>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Learning Outcome</h4>
                    {hasPlainText(viewingItem.learningOutcome) ? (
                      <div
                        className="prose prose-sm max-w-none border border-gray-200 rounded-xl p-4"
                        dangerouslySetInnerHTML={{ __html: viewingItem.learningOutcome }}
                      />
                    ) : (
                      <p className="text-sm text-gray-400 italic">No learning outcome added yet</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
