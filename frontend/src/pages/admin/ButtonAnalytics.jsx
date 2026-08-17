import React, { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  BarChart3,
  Clock3,
  Filter,
  MousePointerClick,
  Users,
  Globe2,
  X,
  RotateCcw,
  ChevronDown,
} from "lucide-react";
import { getJSON } from "../../lib/api";

const EVENTS_PAGE_SIZE = 50;

function StatCard({ title, value, icon, color = "from-slate-700 to-slate-900" }) {
  return (
    <div className={`rounded-2xl p-4 text-white bg-gradient-to-r ${color} shadow-md sm:p-5`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-white/80 sm:text-sm">{title}</p>
          <p className="mt-1 truncate text-xl font-bold sm:text-2xl">{value}</p>
        </div>
        <div className="shrink-0 rounded-xl bg-white/15 p-2">{icon}</div>
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
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 font-bold text-white">
      {initial}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options, placeholder }) {
  return (
    <label className="flex w-full flex-col gap-1 sm:w-auto">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 py-2 pr-9 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 sm:w-56"
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    </label>
  );
}

export default function ButtonAnalytics() {
  const [busy, setBusy] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [err, setErr] = useState("");
  const [days, setDays] = useState(30);
  const [search, setSearch] = useState("");
  const [buttonFilter, setButtonFilter] = useState("");
  const [pageFilter, setPageFilter] = useState("");
  const [data, setData] = useState({
    summary: {},
    topButtons: [],
    topPages: [],
    topUsers: [],
    recentEvents: [],
    dailyTrend: [],
    filters: { buttonOptions: [], pageOptions: [] },
    pagination: { hasMore: false },
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
    let cancelled = false;

    async function load() {
      setBusy(true);
      setErr("");
      try {
        const qs = new URLSearchParams();
        qs.set("days", String(days));
        qs.set("limit", String(EVENTS_PAGE_SIZE));
        if (search.trim()) qs.set("search", search.trim());
        if (buttonFilter) qs.set("button", buttonFilter);
        if (pageFilter) qs.set("page", pageFilter);
        const result = await getJSON(`/api/ui-clicks/admin/summary?${qs.toString()}`);
        if (cancelled) return;
        setData({
          summary: result?.summary || {},
          topButtons: Array.isArray(result?.topButtons) ? result.topButtons : [],
          topPages: Array.isArray(result?.topPages) ? result.topPages : [],
          topUsers: Array.isArray(result?.topUsers) ? result.topUsers : [],
          recentEvents: Array.isArray(result?.recentEvents) ? result.recentEvents : [],
          dailyTrend: Array.isArray(result?.dailyTrend) ? result.dailyTrend : [],
          filters: {
            buttonOptions: Array.isArray(result?.filters?.buttonOptions) ? result.filters.buttonOptions : [],
            pageOptions: Array.isArray(result?.filters?.pageOptions) ? result.filters.pageOptions : [],
          },
          pagination: result?.pagination || { hasMore: false },
        });
      } catch (e) {
        if (!cancelled) setErr(e.message || "Failed to load analytics");
      } finally {
        if (!cancelled) setBusy(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [days, search, buttonFilter, pageFilter]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const qs = new URLSearchParams();
      qs.set("days", String(days));
      qs.set("limit", String(EVENTS_PAGE_SIZE));
      qs.set("skip", String(data.recentEvents.length));
      if (search.trim()) qs.set("search", search.trim());
      if (buttonFilter) qs.set("button", buttonFilter);
      if (pageFilter) qs.set("page", pageFilter);
      const result = await getJSON(`/api/ui-clicks/admin/summary?${qs.toString()}`);
      setData((prev) => ({
        ...prev,
        recentEvents: [...prev.recentEvents, ...(Array.isArray(result?.recentEvents) ? result.recentEvents : [])],
        pagination: result?.pagination || { hasMore: false },
      }));
    } catch (e) {
      setErr(e.message || "Failed to load more events");
    } finally {
      setLoadingMore(false);
    }
  }

  const totals = data.summary || {};
  const hasActiveFilters = Boolean(search || buttonFilter || pageFilter || days !== 30);

  function resetFilters() {
    setSearch("");
    setButtonFilter("");
    setPageFilter("");
    setDays(30);
  }

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
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Button Analytics</h1>
        <p className="mt-1 text-sm text-slate-600 sm:text-base">
          Track which user clicked which button across the site.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex w-full flex-col gap-1 sm:w-auto sm:min-w-[240px] sm:flex-1">
            <span className="text-xs font-semibold text-slate-500">Search</span>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search button, user, or page"
                className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </label>

          <FilterSelect
            label="Button"
            value={buttonFilter}
            onChange={setButtonFilter}
            options={data.filters.buttonOptions}
            placeholder="All buttons"
          />

          <FilterSelect
            label="Page"
            value={pageFilter}
            onChange={setPageFilter}
            options={data.filters.pageOptions}
            placeholder="All pages"
          />

          <label className="flex w-full flex-col gap-1 sm:w-auto">
            <span className="text-xs font-semibold text-slate-500">Date range</span>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value) || 30)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 sm:w-40"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={180}>Last 180 days</option>
            </select>
          </label>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          )}
        </div>

        {(buttonFilter || pageFilter || search) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {search && (
              <span className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                Search: {search}
                <button onClick={() => setSearch("")} aria-label="Clear search">
                  <X size={12} />
                </button>
              </span>
            )}
            {buttonFilter && (
              <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                Button: {buttonFilter}
                <button onClick={() => setButtonFilter("")} aria-label="Clear button filter">
                  <X size={12} />
                </button>
              </span>
            )}
            {pageFilter && (
              <span className="flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                Page: {pageFilter}
                <button onClick={() => setPageFilter("")} aria-label="Clear page filter">
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
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
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Click Trend</h2>
              <span className="text-xs font-semibold text-slate-500">{days} day range</span>
            </div>
            {trendData.length === 0 ? (
              <p className="text-sm text-slate-500">No clicks recorded in this range.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-6 xl:grid-cols-7">
                {trendData.map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-2 sm:p-3">
                    <div className="flex h-24 items-end sm:h-32">
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
            <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
              <h2 className="text-lg font-bold text-slate-900">Recent Clicks</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600 sm:px-5">User</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600 sm:px-5">Button</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600 sm:px-5">Page</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600 sm:px-5">Time</th>
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
                        <td className="px-4 py-3 sm:px-5">
                          <div className="flex items-center gap-3">
                            <Avatar name={userName} />
                            <div className="min-w-0">
                              <div className="truncate font-semibold text-slate-900">{userName}</div>
                              <div className="truncate text-xs text-slate-500">
                                {userEmail || "No email"}{roleLabel ? ` · ${roleLabel}` : ""}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 sm:px-5">
                          <div className="font-semibold text-slate-900">{event.buttonLabel || "-"}</div>
                          <div className="text-xs text-slate-500">{event.elementType || "button"}</div>
                        </td>
                        <td className="px-4 py-3 sm:px-5">
                          <div className="max-w-[220px] truncate font-medium text-slate-800">{event.pagePath || "-"}</div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600 sm:px-5">{formatTime(event.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!busy && data.pagination?.hasMore && (
              <div className="border-t border-slate-100 px-5 py-4 text-center">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  {loadingMore ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Top Buttons</h2>
            <div className="space-y-3">
              {data.topButtons.length === 0 ? (
                <p className="text-sm text-slate-500">No data yet.</p>
              ) : (
                data.topButtons.map((item) => (
                  <button
                    type="button"
                    key={item.buttonLabel}
                    onClick={() => setButtonFilter(item.buttonLabel)}
                    className="w-full rounded-xl border border-slate-200 p-3 text-left transition hover:border-indigo-300 hover:bg-indigo-50/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{item.buttonLabel || "-"}</p>
                        <p className="truncate text-xs text-slate-500">{item.samplePagePath || "Unknown page"}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                        {item.count || 0}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      Unique users: {item.uniqueUsers || 0}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Top Pages</h2>
            <div className="space-y-3">
              {data.topPages.length === 0 ? (
                <p className="text-sm text-slate-500">No page data yet.</p>
              ) : (
                data.topPages.map((item) => (
                  <button
                    type="button"
                    key={item.pagePath || "blank"}
                    onClick={() => setPageFilter(item.pagePath)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-rose-300 hover:bg-rose-50/40"
                  >
                    <span className="truncate pr-2 text-sm font-semibold text-slate-900">
                      {item.pagePath || "Unknown page"}
                    </span>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                      {item.count || 0}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Top Users</h2>
            <div className="space-y-3">
              {data.topUsers.length === 0 ? (
                <p className="text-sm text-slate-500">No user data yet.</p>
              ) : (
                data.topUsers.map((item, index) => (
                  <div key={`${item.userId || "anon"}-${index}`} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{item.userName || "Anonymous"}</p>
                        <p className="truncate text-xs text-slate-500">{item.userEmail || "No email"}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
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
