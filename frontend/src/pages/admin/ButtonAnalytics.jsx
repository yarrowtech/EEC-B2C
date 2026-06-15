import React, { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { BarChart3, Clock3, Filter, MousePointerClick, Users, Globe2 } from "lucide-react";
import { getJSON } from "../../lib/api";

function StatCard({ title, value, icon, color = "from-slate-700 to-slate-900" }) {
  return (
    <div className={`rounded-2xl p-5 text-white bg-gradient-to-r ${color} shadow-md`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-white/80">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="rounded-xl bg-white/15 p-2">{icon}</div>
      </div>
    </div>
  );
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function Avatar({ name }) {
  const initial = String(name || "A").trim().charAt(0).toUpperCase() || "A";
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 font-bold text-white">
      {initial}
    </div>
  );
}

export default function ButtonAnalytics() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [days, setDays] = useState(30);
  const [search, setSearch] = useState("");
  const [data, setData] = useState({
    summary: {},
    topButtons: [],
    topPages: [],
    topUsers: [],
    recentEvents: [],
    dailyTrend: [],
  });

  const role = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      return String(user?.role || "").toLowerCase();
    } catch {
      return "";
    }
  }, []);

  useEffect(() => {
    async function load() {
      setBusy(true);
      setErr("");
      try {
        const qs = new URLSearchParams();
        qs.set("days", String(days));
        if (search.trim()) qs.set("search", search.trim());
        const result = await getJSON(`/api/ui-clicks/admin/summary?${qs.toString()}`);
        setData({
          summary: result?.summary || {},
          topButtons: Array.isArray(result?.topButtons) ? result.topButtons : [],
          topPages: Array.isArray(result?.topPages) ? result.topPages : [],
          topUsers: Array.isArray(result?.topUsers) ? result.topUsers : [],
          recentEvents: Array.isArray(result?.recentEvents) ? result.recentEvents : [],
          dailyTrend: Array.isArray(result?.dailyTrend) ? result.dailyTrend : [],
        });
      } catch (e) {
        setErr(e.message || "Failed to load analytics");
      } finally {
        setBusy(false);
      }
    }

    load();
  }, [days, search]);

  const totals = data.summary || {};

  const trendData = useMemo(
    () =>
      (data.dailyTrend || []).map((item) => {
        const date = new Date(item.year, (item.month || 1) - 1, item.day || 1);
        return {
          label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          value: Number(item.count || 0),
        };
      }),
    [data.dailyTrend]
  );

  const maxTrend = Math.max(1, ...trendData.map((item) => item.value));

  if (role && role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Button Analytics</h1>
          <p className="mt-1 text-slate-600">
            Track which user clicked which button across the site.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search button, user, or page"
              className="min-w-[240px] w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value) || 30)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={180}>Last 180 days</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total Clicks" value={totals.totalClicks || 0} icon={<MousePointerClick size={20} />} color="from-indigo-600 to-purple-600" />
        <StatCard title="Unique Users" value={totals.uniqueUsers || 0} icon={<Users size={20} />} color="from-emerald-600 to-teal-600" />
        <StatCard title="Unique Buttons" value={totals.uniqueButtons || 0} icon={<BarChart3 size={20} />} color="from-amber-600 to-orange-600" />
        <StatCard title="Unique Pages" value={totals.uniquePages || 0} icon={<Globe2 size={20} />} color="from-rose-600 to-pink-600" />
        <StatCard title="Range Days" value={totals.rangeDays || days} icon={<Clock3 size={20} />} color="from-slate-700 to-slate-900" />
      </div>

      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {err}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Click Trend</h2>
              <span className="text-xs font-semibold text-slate-500">{days} day range</span>
            </div>
            {trendData.length === 0 ? (
              <p className="text-sm text-slate-500">No clicks recorded in this range.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
                {trendData.map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex h-32 items-end">
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-cyan-500"
                        style={{ height: `${Math.max(8, (item.value / maxTrend) * 100)}%` }}
                      />
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-xs font-semibold text-slate-500">{item.label}</p>
                      <p className="text-sm font-bold text-slate-900">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-bold text-slate-900">Recent Clicks</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold text-slate-600">User</th>
                    <th className="px-5 py-3 text-left font-semibold text-slate-600">Button</th>
                    <th className="px-5 py-3 text-left font-semibold text-slate-600">Page</th>
                    <th className="px-5 py-3 text-left font-semibold text-slate-600">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {busy && (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-slate-500">
                        Loading analytics...
                      </td>
                    </tr>
                  )}
                  {!busy && data.recentEvents.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-slate-500">
                        No click events found.
                      </td>
                    </tr>
                  )}
                  {!busy && data.recentEvents.map((event) => {
                    const userName = event.userName || event.userId?.name || "Anonymous";
                    const userEmail = event.userEmail || event.userId?.email || "";
                    const roleLabel = event.userRole || event.userId?.role || "";
                    return (
                      <tr key={event._id} className="border-t border-slate-100">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={userName} />
                            <div>
                              <div className="font-semibold text-slate-900">{userName}</div>
                              <div className="text-xs text-slate-500">
                                {userEmail || "No email"}{roleLabel ? ` · ${roleLabel}` : ""}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="font-semibold text-slate-900">{event.buttonLabel || "-"}</div>
                          <div className="text-xs text-slate-500">{event.elementType || "button"}</div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="font-medium text-slate-800">{event.pagePath || "-"}</div>
                        </td>
                        <td className="px-5 py-3 text-slate-600">{formatTime(event.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Top Buttons</h2>
            <div className="space-y-3">
              {data.topButtons.length === 0 ? (
                <p className="text-sm text-slate-500">No data yet.</p>
              ) : (
                data.topButtons.map((item) => (
                  <div key={item.buttonLabel} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{item.buttonLabel || "-"}</p>
                        <p className="text-xs text-slate-500">{item.samplePagePath || "Unknown page"}</p>
                      </div>
                      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                        {item.count || 0}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      Unique users: {item.uniqueUsers || 0}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Top Pages</h2>
            <div className="space-y-3">
              {data.topPages.length === 0 ? (
                <p className="text-sm text-slate-500">No page data yet.</p>
              ) : (
                data.topPages.map((item) => (
                  <div key={item.pagePath || "blank"} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                    <span className="truncate pr-4 text-sm font-semibold text-slate-900">
                      {item.pagePath || "Unknown page"}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                      {item.count || 0}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Top Users</h2>
            <div className="space-y-3">
              {data.topUsers.length === 0 ? (
                <p className="text-sm text-slate-500">No user data yet.</p>
              ) : (
                data.topUsers.map((item, index) => (
                  <div key={`${item.userId || "anon"}-${index}`} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{item.userName || "Anonymous"}</p>
                        <p className="text-xs text-slate-500">{item.userEmail || "No email"}</p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                        {item.count || 0}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
