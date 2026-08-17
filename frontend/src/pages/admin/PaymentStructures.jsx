import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { CreditCard, Plus, X, Trash2, Power } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";

export default function PaymentStructures() {
  const API = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const isAdmin = (() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return String(user?.role || "").toLowerCase() === "admin";
    } catch {
      return false;
    }
  })();

  const headers = () => ({
    Authorization: `Bearer ${localStorage.getItem("jwt") || ""}`,
    "Content-Type": "application/json",
  });

  const [boards, setBoards] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [board, setBoard] = useState("");
  const [classId, setClassId] = useState("");
  const [subject, setSubject] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState("");
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    async function loadMeta() {
      try {
        const [bRes, cRes] = await Promise.all([
          fetch(`${API}/api/boards`),
          fetch(`${API}/api/classes`),
        ]);
        setBoards(await bRes.json().catch(() => []));
        setClasses(await cRes.json().catch(() => []));
      } catch {
        // filters just stay empty if this fails
      }
    }
    loadMeta();
  }, [API]);

  useEffect(() => {
    if (!board || !classId) {
      setSubjects([]);
      return;
    }
    fetch(`${API}/api/subject?board=${board}&class=${classId}`, { headers: headers() })
      .then((r) => r.json())
      .then((rows) => setSubjects(Array.isArray(rows) ? rows : []))
      .catch(() => setSubjects([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, classId]);

  async function load() {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/payment-structures`, { headers: headers() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to fetch payment structures");
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      toast.error(err?.message || "Failed to fetch payment structures");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setName("");
    setBoard("");
    setClassId("");
    setSubject("");
    setAmount("");
  }

  async function createStructure(e) {
    e.preventDefault();
    const amountValue = Number(amount);
    if (!name.trim()) {
      toast.warn("Please enter a name for this rate card");
      return;
    }
    if (!Number.isFinite(amountValue) || amountValue < 0) {
      toast.warn("Enter a valid non-negative amount");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/payment-structures`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          name: name.trim(),
          board: board || undefined,
          class: classId || undefined,
          subject: subject || undefined,
          amountPerChapter: amountValue,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to create rate card");

      toast.success("Rate card created");
      resetForm();
      setShowForm(false);
      await load();
    } catch (err) {
      toast.error(err?.message || "Failed to create rate card");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(item) {
    try {
      setTogglingId(item._id);
      const res = await fetch(`${API}/api/payment-structures/${item._id}`, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({ active: !item.active }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to update rate card");

      setItems((prev) => prev.map((s) => (s._id === item._id ? data : s)));
      toast.success(data.active ? "Rate card activated" : "Rate card deactivated");
    } catch (err) {
      toast.error(err?.message || "Failed to update rate card");
    } finally {
      setTogglingId("");
    }
  }

  async function deleteStructure(item) {
    if (!window.confirm(`Delete rate card "${item.name}"? Existing assignments keep their agreed amount.`)) return;
    try {
      setDeletingId(item._id);
      const res = await fetch(`${API}/api/payment-structures/${item._id}`, {
        method: "DELETE",
        headers: headers(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to delete rate card");

      setItems((prev) => prev.filter((s) => s._id !== item._id));
      toast.success("Rate card deleted");
    } catch (err) {
      toast.error(err?.message || "Failed to delete rate card");
    } finally {
      setDeletingId("");
    }
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <ToastContainer />

      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-blue-50 p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-white shadow">
              <CreditCard className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-indigo-800">Payment Structures</h1>
              <p className="text-sm text-indigo-700">
                Reusable rate cards — set once, reuse across many chapter assignments
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((s) => !s)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? "Close" : "New Rate Card"}
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={createStructure}
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4"
        >
          <h2 className="text-lg font-bold text-gray-800">New Rate Card</h2>
          <p className="text-xs text-gray-500">
            Leave board/class/subject blank to apply broadly. Set board only for a board-wide rate, board + class for
            a class-wide rate, or all three for a subject-wide rate.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CBSE Class 6 Science - Standard Rate"
              className="border-2 border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none"
            />
            <input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount per chapter (₹)"
              className="border-2 border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={board}
              onChange={(e) => {
                setBoard(e.target.value);
                setClassId("");
                setSubject("");
              }}
              className="border-2 border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none"
            >
              <option value="">Any Board</option>
              {boards.map((b) => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
            <select
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value);
                setSubject("");
              }}
              disabled={!board}
              className="border-2 border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none disabled:bg-gray-100 disabled:opacity-60"
            >
              <option value="">Any Class</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={!classId}
              className="border-2 border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none disabled:bg-gray-100 disabled:opacity-60"
            >
              <option value="">Any Subject</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create Rate Card"}
          </button>
        </form>
      )}

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[800px] w-full text-sm">
            <thead className="bg-indigo-50 text-gray-700">
              <tr>
                <th className="text-left p-4 font-semibold">Name</th>
                <th className="text-left p-4 font-semibold">Scope</th>
                <th className="text-left p-4 font-semibold">Amount / Chapter</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-center p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">
                    Loading rate cards...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">
                    No rate cards yet. Create one to speed up chapter assignments.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item._id}>
                    <td className="p-4 font-semibold text-gray-800">{item.name}</td>
                    <td className="p-4 text-xs text-gray-600">
                      {[item.board?.name, item.class?.name, item.subject?.name].filter(Boolean).join(" · ") ||
                        "All boards/classes/subjects"}
                    </td>
                    <td className="p-4 font-semibold text-gray-800">
                      ₹{Number(item.amountPerChapter || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                          item.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {item.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleActive(item)}
                          disabled={togglingId === item._id}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-700 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-40"
                        >
                          <Power className="w-3.5 h-3.5" />
                          {item.active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteStructure(item)}
                          disabled={deletingId === item._id}
                          className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-40"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {deletingId === item._id ? "..." : "Delete"}
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
