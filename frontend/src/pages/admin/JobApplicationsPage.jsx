import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, FileText, Search, CheckCircle2, XCircle } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";

export default function JobApplicationsPage() {
  const API = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState("");

  const getInlineResumeUrl = (url) => {
    if (!url) return "#";
    return url.includes("/raw/upload/")
      ? url.replace("/raw/upload/", "/raw/upload/fl_attachment:false/")
      : url;
  };

  async function load() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("limit", "200");
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (query.trim()) params.set("q", query.trim());

      const res = await fetch(`${API}/api/career-applications?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt") || ""}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to fetch applications");
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      toast.error(err?.message || "Failed to fetch applications");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.trim().toLowerCase();
    return items.filter((item) =>
      [item.name, item.email, item.jobPosition, item.status]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [items, query]);

  async function updateStatus(id, status) {
    try {
      setUpdatingId(id);
      const res = await fetch(`${API}/api/career-applications/${id}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt") || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to update status");

      setItems((prev) =>
        prev.map((item) => (item._id === id ? { ...item, status: data.application?.status || status } : item))
      );
      toast.success(`Application ${status}`);
    } catch (err) {
      toast.error(err?.message || "Failed to update status");
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <ToastContainer />

      <div className="rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 to-yellow-50 p-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-white shadow">
            <BriefcaseBusiness className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-orange-800">Job Applications</h1>
            <p className="text-sm text-orange-700">Review resumes and mark candidates as shortlisted or rejected</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by candidate, email, or position..."
            className="w-full pl-10 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
        >
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="reviewed">Reviewed</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="rejected">Rejected</option>
          <option value="hired">Hired</option>
        </select>
        <button
          type="button"
          onClick={load}
          className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600"
        >
          Refresh
        </button>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1000px] w-full text-sm">
            <thead className="bg-orange-50 text-gray-700">
              <tr>
                <th className="text-left p-4 font-semibold">Candidate</th>
                <th className="text-left p-4 font-semibold">Job Position</th>
                <th className="text-left p-4 font-semibold">Resume</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Applied</th>
                <th className="text-left p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    Loading applications...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    No applications found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item._id}>
                    <td className="p-4">
                      <div className="font-semibold text-gray-800">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.email}</div>
                      {item.phone ? <div className="text-xs text-gray-500">{item.phone}</div> : null}
                    </td>
                    <td className="p-4 font-medium text-gray-700">{item.jobPosition}</td>
                    <td className="p-4">
                      <a
                        href={getInlineResumeUrl(item.cvUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        View Resume
                      </a>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                          item.status === "shortlisted"
                            ? "bg-emerald-100 text-emerald-700"
                            : item.status === "rejected"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {item.status}
                      </span>
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
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => updateStatus(item._id, "shortlisted")}
                          disabled={updatingId === item._id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Shortlisted
                        </button>
                        <button
                          type="button"
                          onClick={() => updateStatus(item._id, "rejected")}
                          disabled={updatingId === item._id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Rejected
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
