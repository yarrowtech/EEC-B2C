import React, { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { getJSON } from "../../lib/api";
import { BarChart3, CalendarDays, CalendarRange, CalendarClock, Search, Users } from "lucide-react";

function StatCard({ title, value, icon, color = "from-indigo-600 to-purple-600" }) {
  return (
    <div className={`rounded-2xl p-5 text-white bg-gradient-to-r ${color} shadow-md`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/80">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="p-2 rounded-lg bg-white/20">{icon}</div>
      </div>
    </div>
  );
}

export default function TeacherAnalytics() {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const role = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      return String(user?.role || "").toLowerCase();
    } catch {
      return "";
    }
  }, []);

  useEffect(() => {
    (async () => {
      setBusy(true);
      setErr("");
      try {
        const data = await getJSON("/api/questions?page=1&limit=10000");
        setRows(data.items || []);
      } catch (e) {
        setErr(e.message || "Failed to load teacher analytics");
      } finally {
        setBusy(false);
      }
    })();
  }, []);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const teacherAnalytics = useMemo(() => {
    const map = new Map();

    for (const r of rows) {
      const uploader = r.createdBy;
      const uploaderRole = String(uploader?.role || "").toLowerCase();
      if (uploaderRole !== "teacher") continue;

      const id = String(uploader?._id || "");
      if (!id) continue;

      if (!map.has(id)) {
        map.set(id, {
          id,
          name: uploader?.name || "Unknown Teacher",
          email: uploader?.email || "",
          total: 0,
          daily: 0,
          weekly: 0,
          monthly: 0,
          typeCount: 0,
          typeSet: new Set(),
        });
      }

      const entry = map.get(id);
      entry.total += 1;
      if (r.type) entry.typeSet.add(r.type);

      const createdAt = new Date(r.createdAt);
      if (Number.isNaN(createdAt.getTime())) continue;

      const rowDate = new Date(createdAt);
      rowDate.setHours(0, 0, 0, 0);

      if (rowDate.getTime() === today.getTime()) {
        entry.daily += 1;
      }

      const diffDays = Math.floor((today.getTime() - rowDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 7) {
        entry.weekly += 1;
      }

      if (
        rowDate.getFullYear() === today.getFullYear() &&
        rowDate.getMonth() === today.getMonth()
      ) {
        entry.monthly += 1;
      }
    }

    const list = Array.from(map.values()).map((x) => ({
      ...x,
      typeCount: x.typeSet.size,
    }));

    list.sort((a, b) => b.total - a.total);
    return list;
  }, [rows, today]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return teacherAnalytics;
    return teacherAnalytics.filter((t) =>
      [t.name, t.email].some((v) => String(v || "").toLowerCase().includes(needle))
    );
  }, [teacherAnalytics, q]);

  useEffect(() => {
    setPage(1);
  }, [q, pageSize]);

  const summary = useMemo(() => {
    return filtered.reduce(
      (acc, t) => {
        acc.totalTeachers += 1;
        acc.totalUploads += t.total;
        acc.dailyUploads += t.daily;
        acc.weeklyUploads += t.weekly;
        acc.monthlyUploads += t.monthly;
        return acc;
      },
      {
        totalTeachers: 0,
        totalUploads: 0,
        dailyUploads: 0,
        weeklyUploads: 0,
        monthlyUploads: 0,
      }
    );
  }, [filtered]);

  const topTeachersChartData = useMemo(() => filtered.slice(0, 8), [filtered]);
  const maxTotal = Math.max(1, ...topTeachersChartData.map((t) => t.total));

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  if (role && role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Teacher Analytics</h1>
        <p className="text-slate-600 mt-1">
          Teacher-wise question upload analytics (daily, weekly, monthly)
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total Teachers" value={summary.totalTeachers} icon={<Users size={20} />} color="from-blue-600 to-indigo-600" />
        <StatCard title="Total Uploads" value={summary.totalUploads} icon={<BarChart3 size={20} />} color="from-emerald-600 to-teal-600" />
        <StatCard title="Daily Uploads" value={summary.dailyUploads} icon={<CalendarClock size={20} />} color="from-amber-600 to-orange-600" />
        <StatCard title="Weekly Uploads" value={summary.weeklyUploads} icon={<CalendarRange size={20} />} color="from-rose-600 to-pink-600" />
        <StatCard title="Monthly Uploads" value={summary.monthlyUploads} icon={<CalendarDays size={20} />} color="from-violet-600 to-fuchsia-600" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search teacher by name or email..."
            className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-9 pr-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      {err && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{err}</div>}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-4">Top Teachers by Uploads</h3>
        {!topTeachersChartData.length ? (
          <div className="text-sm text-slate-500">No teacher upload data found</div>
        ) : (
          <div className="space-y-3">
            {topTeachersChartData.map((t) => (
              <div key={t.id}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600 truncate max-w-[70%]">{t.name}</span>
                  <span className="font-semibold text-slate-800">{t.total}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    style={{ width: `${Math.max(4, (t.total / maxTotal) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Teacher</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Total Uploads</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Daily</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Weekly</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Monthly</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Question Types</th>
              </tr>
            </thead>
            <tbody>
              {!busy && paginated.map((t) => (
                <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.email}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold">{t.total}</td>
                  <td className="px-4 py-3">{t.daily}</td>
                  <td className="px-4 py-3">{t.weekly}</td>
                  <td className="px-4 py-3">{t.monthly}</td>
                  <td className="px-4 py-3">{t.typeCount}</td>
                </tr>
              ))}
              {busy && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">Loading teacher analytics...</td>
                </tr>
              )}
              {!busy && !paginated.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">No teacher analytics found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 p-4 border-t border-slate-200 bg-slate-50">
          <div className="text-sm text-slate-600">
            Showing {paginated.length ? (safePage - 1) * pageSize + 1 : 0} to{" "}
            {Math.min(safePage * pageSize, filtered.length)} of {filtered.length}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="rounded-lg border border-slate-300 px-3 py-1.5 bg-white text-sm disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-sm text-slate-700">Page {safePage} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="rounded-lg border border-slate-300 px-3 py-1.5 bg-white text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
