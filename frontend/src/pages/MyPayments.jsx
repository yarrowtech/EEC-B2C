import { useEffect, useState } from "react";
import { Wallet, CheckCircle2, Clock, Circle, ClipboardList, IndianRupee } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";

export default function MyPayments() {
  const API = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const [items, setItems] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const headers = { Authorization: `Bearer ${localStorage.getItem("jwt") || ""}` };
      try {
        setLoading(true);
        const [paymentsRes, assignmentsRes] = await Promise.all([
          fetch(`${API}/api/my-payments`, { headers }),
          fetch(`${API}/api/chapter-assignments/mine`, { headers }),
        ]);
        const paymentsData = await paymentsRes.json().catch(() => ({}));
        if (!paymentsRes.ok) throw new Error(paymentsData?.message || "Failed to fetch your chapters");
        setItems(Array.isArray(paymentsData?.items) ? paymentsData.items : []);

        const assignmentsData = await assignmentsRes.json().catch(() => ({}));
        setAssignments(assignmentsRes.ok && Array.isArray(assignmentsData?.items) ? assignmentsData.items : []);
      } catch (err) {
        toast.error(err?.message || "Failed to fetch your chapters");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [API]);

  const assignmentAmountById = new Map(
    assignments
      .map((a) => [String(a?.topic?._id || a?.topic || ""), Number(a?.amount || 0)])
      .filter(([id]) => id)
  );

  function getChapterAmount(item) {
    const directAmount = Number(item?.budgetAmount);
    if (Number.isFinite(directAmount) && directAmount > 0) return directAmount;
    const assignmentAmount = Number(item?.assignmentId?.amount || 0);
    if (Number.isFinite(assignmentAmount) && assignmentAmount > 0) return assignmentAmount;
    const assignmentFallback = assignmentAmountById.get(String(item?.assignmentId || "")) || 0;
    if (assignmentFallback > 0) return assignmentFallback;
    const topicAmount = Number(item?.assignment?.amount);
    if (Number.isFinite(topicAmount) && topicAmount > 0) return topicAmount;
    return 0;
  }

  const totalAmount = items.reduce((sum, t) => sum + getChapterAmount(t), 0);
  const paidAmount = items
    .filter((t) => String(t.paymentStatus || "").toLowerCase() === "paid")
    .reduce((sum, t) => sum + getChapterAmount(t), 0);
  const pendingAmount = totalAmount - paidAmount;
  const paidCount = items.filter((t) => String(t.paymentStatus || "").toLowerCase() === "paid").length;
  const pendingCount = items.length - paidCount;

  function ChecklistBadge({ done, label }) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold ${
          done ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
        }`}
      >
        {done ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
        {label}
      </span>
    );
  }

  function PaymentBadge({ status, paidAt }) {
    const isPaid = String(status || "").toLowerCase() === "paid";
    return (
      <div className="flex flex-col gap-1 items-start">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
            isPaid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          {isPaid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
          {isPaid ? "Paid" : "Unpaid"}
        </span>
        {isPaid && paidAt ? (
          <span className="text-[11px] text-gray-500">
            {new Date(paidAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "2-digit",
            })}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <ToastContainer />

      <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-white shadow">
            <Wallet className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-emerald-800">My Payments</h1>
            <p className="text-sm text-emerald-700">
              Chapters you've written, and their payment status
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Total Agreed</p>
          <p className="mt-1 text-xl font-bold text-slate-900">₹{totalAmount.toLocaleString("en-IN")}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">{items.length} chapter{items.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Paid</p>
          <p className="mt-1 text-xl font-bold text-emerald-600">₹{paidAmount.toLocaleString("en-IN")}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">{paidCount} chapter{paidCount !== 1 ? "s" : ""}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Pending</p>
          <p className="mt-1 text-xl font-bold text-amber-600">₹{pendingAmount.toLocaleString("en-IN")}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">{pendingCount} chapter{pendingCount !== 1 ? "s" : ""}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Assigned Scopes</p>
          <p className="mt-1 text-xl font-bold text-indigo-600">{assignments.length}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">from admin</p>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-800">Your Assigned Scopes &amp; Rates</h2>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[820px] w-full text-sm">
              <thead className="bg-indigo-50 text-gray-700">
                <tr>
                  <th className="text-left p-4 font-semibold">Board</th>
                  <th className="text-left p-4 font-semibold">Class</th>
                  <th className="text-left p-4 font-semibold">Subject</th>
                  <th className="text-left p-4 font-semibold">Chapter</th>
                  <th className="text-left p-4 font-semibold">Rate Card</th>
                  <th className="text-left p-4 font-semibold">Amount (₹)</th>
                  <th className="text-left p-4 font-semibold">Payment</th>
                  <th className="text-left p-4 font-semibold">Assigned On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-gray-500">
                      Loading your assigned scopes...
                    </td>
                  </tr>
                ) : assignments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-gray-500">
                      No scopes have been assigned to you yet.
                    </td>
                  </tr>
                ) : (
                  assignments.map((a) => (
                    <tr key={a._id}>
                      <td className="p-4 font-medium text-gray-800">{a.board?.name || "—"}</td>
                      <td className="p-4 text-gray-600">
                        {a.class?.name || <span className="italic text-slate-400">All classes</span>}
                      </td>
                      <td className="p-4 text-gray-600">
                        {a.subject?.name || <span className="italic text-slate-400">All subjects</span>}
                      </td>
                      <td className="p-4 text-gray-600">
                        {a.topic?.name || <span className="italic text-slate-400">Any chapter</span>}
                      </td>
                      <td className="p-4 text-gray-600">{a.structure?.name || "—"}</td>
                      <td className="p-4 font-semibold text-gray-800">
                        <span className="inline-flex items-center gap-1">
                          <IndianRupee className="w-3.5 h-3.5" />
                          {Number(a.amount || 0).toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td className="p-4">
                        <PaymentBadge status={a.topic?.paymentStatus} paidAt={a.topic?.paidAt} />
                      </td>
                      <td className="p-4 text-xs text-gray-500">
                        {a.createdAt
                          ? new Date(a.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "2-digit",
                            })
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-1">
        <Wallet className="w-4 h-4 text-emerald-600" />
        <h2 className="text-sm font-bold text-slate-800">Chapter Payment Breakdown</h2>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-emerald-50 text-gray-700">
              <tr>
                <th className="text-left p-4 font-semibold">Chapter</th>
                <th className="text-left p-4 font-semibold">Board / Class / Subject</th>
                <th className="text-left p-4 font-semibold">Checklist</th>
                <th className="text-left p-4 font-semibold">Amount (₹)</th>
                <th className="text-left p-4 font-semibold">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">
                    Loading your assignments...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">
                    You haven't created any chapters yet.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item._id}>
                    <td className="p-4 font-semibold text-gray-800">{item.name || "N/A"}</td>
                    <td className="p-4 text-xs text-gray-600">
                      <div>{item.board?.name || "N/A"}</div>
                      <div>{item.class?.name || "N/A"}</div>
                      <div className="font-medium text-gray-800">{item.subject?.name || "N/A"}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        <ChecklistBadge done={item.contentDone} label="Content" />
                        <ChecklistBadge done={item.questionsDone} label="Questions" />
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-gray-800">
                      ₹{getChapterAmount(item).toLocaleString("en-IN")}
                    </td>
                    <td className="p-4">
                      {item.paymentStatus === "paid" ? (
                        <div className="flex flex-col gap-1 items-start">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Payment Done
                          </span>
                          {item.paidAt && (
                            <span className="text-[11px] text-gray-500">
                              {new Date(item.paidAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                          <Clock className="w-3.5 h-3.5" />
                          Pending Payment
                        </span>
                      )}
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
