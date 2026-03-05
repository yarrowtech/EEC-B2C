import React, { useEffect, useMemo, useState } from "react";
import { CreditCard, Search } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";

export default function AdminSubscriptionsPage() {
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API}/api/subscriptions/all`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to load subscriptions");
        setSubscriptions(data.subscriptions || []);
      } catch (err) {
        toast.error(err.message || "Failed to load subscriptions");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [API]);

  const filtered = useMemo(() => {
    if (!query.trim()) return subscriptions;
    const q = query.trim().toLowerCase();
    return subscriptions.filter((s) => {
      const userName = s.user?.name || "";
      const userEmail = s.user?.email || "";
      const packageName = s.package?.displayName || s.packageName || "";
      return (
        userName.toLowerCase().includes(q) ||
        userEmail.toLowerCase().includes(q) ||
        packageName.toLowerCase().includes(q) ||
        String(s.transactionId || "").toLowerCase().includes(q)
      );
    });
  }, [subscriptions, query]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <ToastContainer />

      <div className="rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 to-yellow-50 p-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-white shadow">
            <CreditCard className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-orange-800">Subscriptions</h1>
            <p className="text-sm text-orange-700">
              Track who purchased subscription packages
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by user, email, package, or transaction..."
            className="w-full pl-10 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-orange-50 text-gray-700">
              <tr>
                <th className="text-left p-4 font-semibold">User</th>
                <th className="text-left p-4 font-semibold">Package</th>
                <th className="text-left p-4 font-semibold">Amount</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Period</th>
                <th className="text-left p-4 font-semibold">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    Loading subscriptions...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    No subscriptions found.
                  </td>
                </tr>
              ) : (
                filtered.map((sub) => {
                  const packageLabel = sub.package?.displayName || sub.packageName || "-";
                  const start = sub.startDate
                    ? new Date(sub.startDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                      })
                    : "-";
                  const end = sub.endDate
                    ? new Date(sub.endDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                      })
                    : "-";

                  return (
                    <tr key={sub._id}>
                      <td className="p-4">
                        <div className="font-semibold text-gray-800">{sub.user?.name || "-"}</div>
                        <div className="text-xs text-gray-500">{sub.user?.email || "-"}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-gray-800">{packageLabel}</div>
                        <div className="text-xs text-gray-500">{sub.package?.name || sub.packageName || "-"}</div>
                      </td>
                      <td className="p-4 font-semibold text-gray-800">
                        ₹{sub.amountPaid ?? 0}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                            sub.status === "active"
                              ? "bg-emerald-100 text-emerald-700"
                              : sub.status === "expired"
                              ? "bg-gray-200 text-gray-600"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-gray-600">
                        {start} → {end}
                      </td>
                      <td className="p-4 text-xs text-gray-600">
                        <div className="font-semibold">{sub.paymentMethod || "-"}</div>
                        <div className="font-mono">{sub.transactionId || "-"}</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
