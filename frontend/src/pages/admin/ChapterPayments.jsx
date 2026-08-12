import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Wallet, Users, Search, CheckCircle2, RotateCcw, Plus, X, Trash2, Save } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";

export default function ChapterPayments() {
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
  const [teachers, setTeachers] = useState([]);
  const [structures, setStructures] = useState([]);

  /* ---------------- Teacher scope assignments ---------------- */
  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formBoard, setFormBoard] = useState("");
  const [formClass, setFormClass] = useState("");
  const [formSubjects, setFormSubjects] = useState([]);
  const [formSubject, setFormSubject] = useState("");
  const [formTopics, setFormTopics] = useState([]);
  const [formTopic, setFormTopic] = useState("");
  const [formStructure, setFormStructure] = useState("");
  const [formWriter, setFormWriter] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState("");

  /* ---------------- Chapter (topic) payments ---------------- */
  const [topics, setTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [query, setQuery] = useState("");
  const [boardFilter, setBoardFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [budgetDrafts, setBudgetDrafts] = useState({});
  const [savingId, setSavingId] = useState("");
  const [togglingId, setTogglingId] = useState("");

  useEffect(() => {
    async function loadMeta() {
      try {
        const [bRes, cRes, tRes, sRes] = await Promise.all([
          fetch(`${API}/api/boards`),
          fetch(`${API}/api/classes`),
          fetch(`${API}/api/users/teachers`),
          fetch(`${API}/api/payment-structures`, { headers: headers() }),
        ]);
        setBoards(await bRes.json().catch(() => []));
        setClasses(await cRes.json().catch(() => []));
        const tData = await tRes.json().catch(() => ({}));
        setTeachers(Array.isArray(tData?.teachers) ? tData.teachers : []);
        const sData = await sRes.json().catch(() => ({}));
        setStructures(Array.isArray(sData?.items) ? sData.items : []);
      } catch {
        // filters/pickers just stay empty if this fails
      }
    }
    loadMeta();
  }, [API]);

  async function loadAssignments() {
    try {
      setLoadingAssignments(true);
      const res = await fetch(`${API}/api/chapter-assignments`, { headers: headers() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to fetch assignments");
      setAssignments(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      toast.error(err?.message || "Failed to fetch assignments");
    } finally {
      setLoadingAssignments(false);
    }
  }

  useEffect(() => {
    loadAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadTopics() {
    try {
      setLoadingTopics(true);
      const params = new URLSearchParams();
      params.set("limit", "200");
      if (boardFilter) params.set("board", boardFilter);
      if (classFilter) params.set("class", classFilter);
      if (paymentFilter !== "all") params.set("paymentStatus", paymentFilter);

      const res = await fetch(`${API}/api/topic-payments?${params.toString()}`, { headers: headers() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to fetch chapters");
      const rows = Array.isArray(data?.items) ? data.items : [];
      setTopics(rows);
      setBudgetDrafts(Object.fromEntries(rows.map((t) => [t._id, String(t.budgetAmount ?? 0)])));
    } catch (err) {
      toast.error(err?.message || "Failed to fetch chapters");
    } finally {
      setLoadingTopics(false);
    }
  }

  useEffect(() => {
    loadTopics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardFilter, classFilter, paymentFilter]);

  const filteredTopics = useMemo(() => {
    if (!query.trim()) return topics;
    const q = query.trim().toLowerCase();
    return topics.filter((item) =>
      [item.name, item.createdBy?.name, item.createdBy?.email, item.subject?.name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [topics, query]);

  const totals = useMemo(() => {
    const totalBudget = topics.reduce((sum, t) => sum + (Number(t.budgetAmount) || 0), 0);
    const paidAmount = topics
      .filter((t) => t.paymentStatus === "paid")
      .reduce((sum, t) => sum + (Number(t.budgetAmount) || 0), 0);
    return { totalBudget, paidAmount, pendingAmount: totalBudget - paidAmount };
  }, [topics]);

  // --- New assignment form cascading pickers ---
  useEffect(() => {
    setFormSubject("");
    setFormSubjects([]);
    if (!formBoard || !formClass) return;
    fetch(`${API}/api/subject?board=${formBoard}&class=${formClass}`, { headers: headers() })
      .then((r) => r.json())
      .then((rows) => setFormSubjects(Array.isArray(rows) ? rows : []))
      .catch(() => setFormSubjects([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formBoard, formClass]);

  useEffect(() => {
    setFormTopic("");
    setFormTopics([]);
    if (!formBoard || !formClass || !formSubject) return;
    fetch(`${API}/api/topic/${formSubject}?board=${formBoard}&class=${formClass}&manage=1`, {
      headers: headers(),
    })
      .then((r) => r.json())
      .then((rows) => setFormTopics(Array.isArray(rows) ? rows : []))
      .catch(() => setFormTopics([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formBoard, formClass, formSubject]);

  useEffect(() => {
    if (!formStructure) return;
    const structure = structures.find((s) => s._id === formStructure);
    if (structure) setFormAmount(String(structure.amountPerChapter));
  }, [formStructure, structures]);

  function resetForm() {
    setFormBoard("");
    setFormClass("");
    setFormSubject("");
    setFormTopic("");
    setFormStructure("");
    setFormWriter("");
    setFormAmount("");
  }

  async function createAssignment(e) {
    e.preventDefault();
    if (!formBoard || !formWriter || !formAmount) {
      toast.warn("Please select at least a board, a writer, and an amount");
      return;
    }
    const amount = Number(formAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.warn("Enter a valid non-negative amount");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/chapter-assignments`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          writerId: formWriter,
          board: formBoard,
          classId: formClass || undefined,
          subject: formSubject || undefined,
          topicId: formTopic || undefined,
          structureId: formStructure || undefined,
          amount,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to create assignment");

      toast.success("Writer assigned to this scope");
      resetForm();
      setShowForm(false);
      await loadAssignments();
    } catch (err) {
      toast.error(err?.message || "Failed to create assignment");
    } finally {
      setSubmitting(false);
    }
  }

  async function removeAssignment(item) {
    const scopeLabel = [item.board?.name, item.class?.name, item.subject?.name].filter(Boolean).join(" · ");
    if (!window.confirm(`Revoke ${item.writer?.name || "this writer"}'s access to "${scopeLabel}"?`)) return;
    try {
      setRemovingId(item._id);
      const res = await fetch(`${API}/api/chapter-assignments/${item._id}`, {
        method: "DELETE",
        headers: headers(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to remove assignment");

      setAssignments((prev) => prev.filter((a) => a._id !== item._id));
      toast.success("Assignment revoked");
    } catch (err) {
      toast.error(err?.message || "Failed to remove assignment");
    } finally {
      setRemovingId("");
    }
  }

  async function saveBudget(id) {
    const value = Number(budgetDrafts[id]);
    if (!Number.isFinite(value) || value < 0) {
      toast.warn("Enter a valid non-negative budget amount");
      return;
    }
    try {
      setSavingId(id);
      const res = await fetch(`${API}/api/topic/${id}/budget`, {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({ budgetAmount: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to update budget");

      setTopics((prev) => prev.map((t) => (t._id === id ? { ...t, budgetAmount: data.budgetAmount } : t)));
      toast.success("Budget updated");
    } catch (err) {
      toast.error(err?.message || "Failed to update budget");
    } finally {
      setSavingId("");
    }
  }

  async function togglePayment(item) {
    const nextStatus = item.paymentStatus === "paid" ? "unpaid" : "paid";
    try {
      setTogglingId(item._id);
      const res = await fetch(`${API}/api/topic/${item._id}/payment`, {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({ paymentStatus: nextStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to update payment status");

      setTopics((prev) =>
        prev.map((t) =>
          t._id === item._id
            ? { ...t, paymentStatus: data.paymentStatus, paidAt: data.paidAt, paidBy: data.paidBy }
            : t
        )
      );
      toast.success(nextStatus === "paid" ? "Marked as paid" : "Marked as unpaid");
    } catch (err) {
      toast.error(err?.message || "Failed to update payment status");
    } finally {
      setTogglingId("");
    }
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <ToastContainer />

      <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-white shadow">
            <Wallet className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-emerald-800">Teacher Assignments & Chapter Payments</h1>
            <p className="text-sm text-emerald-700">
              Assign writers to a board / class / subject, then pay them per chapter once it's approved
            </p>
          </div>
        </div>
      </div>

      {/* ================= Teacher Assignments ================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800">
            <Users className="w-5 h-5 text-indigo-600" />
            Teacher Assignments
          </h2>
          <button
            type="button"
            onClick={() => setShowForm((s) => !s)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? "Close" : "Assign Writer"}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={createAssignment}
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4"
          >
            <p className="text-xs text-gray-500">
              Board is required. Leave class, subject, or chapter unset to grant the writer that whole scope (e.g.
              board only = the entire board; board + class + subject + chapter = just that one chapter).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={formBoard}
                onChange={(e) => { setFormBoard(e.target.value); setFormClass(""); }}
                className="border-2 border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none"
              >
                <option value="">Select Board (required)</option>
                {boards.map((b) => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
              <select
                value={formClass}
                onChange={(e) => setFormClass(e.target.value)}
                disabled={!formBoard}
                className="border-2 border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none disabled:bg-gray-100 disabled:opacity-60"
              >
                <option value="">Any Class</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
              <select
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                disabled={!formClass}
                className="border-2 border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none disabled:bg-gray-100 disabled:opacity-60"
              >
                <option value="">Any Subject</option>
                {formSubjects.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
              <select
                value={formTopic}
                onChange={(e) => setFormTopic(e.target.value)}
                disabled={!formSubject}
                className="border-2 border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none disabled:bg-gray-100 disabled:opacity-60"
              >
                <option value="">Any Chapter (whole subject)</option>
                {formTopics.map((t) => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={formWriter}
                onChange={(e) => setFormWriter(e.target.value)}
                className="border-2 border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none"
              >
                <option value="">Select Writer</option>
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>{t.name} ({t.email})</option>
                ))}
              </select>
              <select
                value={formStructure}
                onChange={(e) => setFormStructure(e.target.value)}
                className="border-2 border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none"
              >
                <option value="">No rate card (custom amount)</option>
                {structures.map((s) => (
                  <option key={s._id} value={s._id}>{s.name} — ₹{s.amountPerChapter}</option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="Amount per chapter (₹)"
                className="border-2 border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting ? "Assigning..." : "Assign Writer"}
            </button>
          </form>
        )}

        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[800px] w-full text-sm">
              <thead className="bg-indigo-50 text-gray-700">
                <tr>
                  <th className="text-left p-4 font-semibold">Writer</th>
                  <th className="text-left p-4 font-semibold">Scope</th>
                  <th className="text-left p-4 font-semibold">Rate / Chapter</th>
                  <th className="text-center p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadingAssignments ? (
                  <tr><td colSpan={4} className="p-6 text-center text-gray-500">Loading assignments...</td></tr>
                ) : assignments.length === 0 ? (
                  <tr><td colSpan={4} className="p-6 text-center text-gray-500">No writers assigned yet.</td></tr>
                ) : (
                  assignments.map((item) => (
                    <tr key={item._id}>
                      <td className="p-4">
                        <div className="font-medium text-gray-800">{item.writer?.name || "Unknown"}</div>
                        <div className="text-xs text-gray-500">{item.writer?.email || ""}</div>
                      </td>
                      <td className="p-4 text-xs text-gray-600">
                        {[
                          item.board?.name,
                          item.class?.name || "All classes",
                          item.subject?.name || "All subjects",
                          item.topic?.name,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </td>
                      <td className="p-4 font-semibold text-gray-800">
                        ₹{Number(item.amount || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => removeAssignment(item)}
                          disabled={removingId === item._id}
                          className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-40"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {removingId === item._id ? "..." : "Revoke"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ================= Chapter Payments ================= */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-gray-800">Chapter Payments</h2>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500">Total Budget</p>
            <p className="mt-1 text-xl font-bold text-slate-900">₹{totals.totalBudget.toLocaleString("en-IN")}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500">Paid</p>
            <p className="mt-1 text-xl font-bold text-emerald-600">₹{totals.paidAmount.toLocaleString("en-IN")}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500">Pending</p>
            <p className="mt-1 text-xl font-bold text-amber-600">₹{totals.pendingAmount.toLocaleString("en-IN")}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by chapter, writer, or subject..."
              className="w-full pl-10 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>
          <select
            value={boardFilter}
            onChange={(e) => setBoardFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
          >
            <option value="">All Boards</option>
            {boards.map((b) => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
          >
            <option value="all">All Payments</option>
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
          </select>
          <button
            type="button"
            onClick={loadTopics}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 inline-flex items-center gap-1.5"
          >
            <RotateCcw size={14} />
            Refresh
          </button>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[1200px] w-full text-sm">
              <thead className="bg-emerald-50 text-gray-700">
                <tr>
                  <th className="text-left p-4 font-semibold">Chapter</th>
                  <th className="text-left p-4 font-semibold">Board / Class / Subject</th>
                  <th className="text-left p-4 font-semibold">Writer</th>
                  <th className="text-left p-4 font-semibold">Content</th>
                  <th className="text-left p-4 font-semibold">Questions</th>
                  <th className="text-left p-4 font-semibold">Budget (₹)</th>
                  <th className="text-left p-4 font-semibold">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadingTopics ? (
                  <tr><td colSpan={7} className="p-6 text-center text-gray-500">Loading chapters...</td></tr>
                ) : filteredTopics.length === 0 ? (
                  <tr><td colSpan={7} className="p-6 text-center text-gray-500">No chapters found.</td></tr>
                ) : (
                  filteredTopics.map((item) => (
                    <tr key={item._id}>
                      <td className="p-4 font-semibold text-gray-800">{item.name}</td>
                      <td className="p-4 text-xs text-gray-600">
                        <div>{item.board?.name || "N/A"}</div>
                        <div>{item.class?.name || "N/A"}</div>
                        <div className="font-medium text-gray-800">{item.subject?.name || "N/A"}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-gray-800">{item.createdBy?.name || "Unknown"}</div>
                        <div className="text-xs text-gray-500">{item.createdBy?.email || ""}</div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                            item.contentDone ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {item.contentDone ? "Done" : "Pending"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                            item.questionsDone ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {item.questionsDone ? "Done" : "Pending"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={budgetDrafts[item._id] ?? ""}
                            onChange={(e) =>
                              setBudgetDrafts((prev) => ({ ...prev, [item._id]: e.target.value }))
                            }
                            className="w-24 rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                          />
                          <button
                            type="button"
                            onClick={() => saveBudget(item._id)}
                            disabled={
                              savingId === item._id ||
                              String(budgetDrafts[item._id]) === String(item.budgetAmount ?? 0)
                            }
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-900 disabled:opacity-40"
                          >
                            <Save className="w-3.5 h-3.5" />
                            {savingId === item._id ? "..." : "Save"}
                          </button>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                              item.paymentStatus === "paid"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {item.paymentStatus === "paid" ? "Payment Done" : "Pending Payment"}
                          </span>
                          {item.paymentStatus === "paid" && item.paidAt && (
                            <span className="text-[11px] text-gray-500">
                              {new Date(item.paidAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "2-digit",
                              })}
                              {item.paidBy?.name ? ` · by ${item.paidBy.name}` : ""}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => togglePayment(item)}
                            disabled={
                              togglingId === item._id ||
                              (item.paymentStatus !== "paid" && (!item.contentDone || !item.questionsDone))
                            }
                            title={
                              item.paymentStatus !== "paid" && (!item.contentDone || !item.questionsDone)
                                ? "Both content and questions must be approved first"
                                : ""
                            }
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed ${
                              item.paymentStatus === "paid"
                                ? "bg-amber-600 hover:bg-amber-700"
                                : "bg-emerald-600 hover:bg-emerald-700"
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {togglingId === item._id
                              ? "..."
                              : item.paymentStatus === "paid"
                                ? "Mark Unpaid"
                                : "Mark as Paid"}
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
      </section>
    </div>
  );
}
