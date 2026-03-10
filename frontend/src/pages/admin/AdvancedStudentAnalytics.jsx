import React, { useEffect, useMemo, useState } from "react";
import { adminAttempts, getJSON } from "../../lib/api";
import { Activity, BarChart3, Users, Target, Search, MapPinned, PieChart } from "lucide-react";

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

function BarChartCard({ title, icon, data = [], color = "from-indigo-500 to-purple-500", emptyText = "No data" }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-slate-700">{icon}</span>
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      </div>
      {!data.length ? (
        <div className="text-sm text-slate-500">{emptyText}</div>
      ) : (
        <div className="space-y-3">
          {data.map((d) => (
            <div key={d.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-600 truncate max-w-[70%]">{d.label}</span>
                <span className="font-semibold text-slate-800">{d.value}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${color}`}
                  style={{ width: `${Math.max(4, (d.value / max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdvancedStudentAnalytics() {
  const [rows, setRows] = useState([]);
  const [studentsCount, setStudentsCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    (async () => {
      setBusy(true);
      setErr("");
      try {
        const [{ items }, studentsData] = await Promise.all([
          adminAttempts(),
          getJSON("/api/users/students-count"),
        ]);
        setRows(items || []);
        setStudentsCount(studentsData?.students?.length || 0);
      } catch (e) {
        setErr(e.message || "Failed to load analytics");
      } finally {
        setBusy(false);
      }
    })();
  }, []);

  const allTypes = useMemo(
    () => [...new Set(rows.map((r) => r.type).filter(Boolean))].sort(),
    [rows]
  );

  const allStates = useMemo(
    () =>
      [...new Set(rows.map((r) => String(r.user?.state || "").trim()).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b)),
    [rows]
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      const stateValue = String(r.user?.state || "").trim();
      const matchesType = !typeFilter || r.type === typeFilter;
      const matchesState = !stateFilter || stateValue === stateFilter;
      if (!matchesType || !matchesState) return false;
      if (!needle) return true;

      return [
        r.user?.name,
        r.user?.email,
        r.user?.state,
        r.subjectName,
        r.topicName,
        r.type,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
  }, [rows, q, typeFilter, stateFilter]);

  useEffect(() => {
    setPage(1);
  }, [q, typeFilter, stateFilter, pageSize]);

  const totalAttempts = filtered.length;
  const avgPercent = totalAttempts
    ? Math.round(filtered.reduce((sum, r) => sum + Number(r.percent || 0), 0) / totalAttempts)
    : 0;
  const highScorers = filtered.filter((r) => Number(r.percent || 0) >= 75).length;
  const typeCount = new Set(filtered.map((r) => r.type).filter(Boolean)).size;

  const stateWiseData = useMemo(() => {
    const m = new Map();
    filtered.forEach((r) => {
      const s = String(r.user?.state || "").trim() || "Unknown";
      m.set(s, (m.get(s) || 0) + 1);
    });
    return Array.from(m.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filtered]);

  const typeWiseData = useMemo(() => {
    const m = new Map();
    filtered.forEach((r) => {
      const t = String(r.type || "").trim() || "Unknown";
      m.set(t, (m.get(t) || 0) + 1);
    });
    return Array.from(m.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  const scoreBandData = useMemo(() => {
    const bands = [
      { label: "90-100%", min: 90, max: 100, value: 0 },
      { label: "75-89%", min: 75, max: 89.99, value: 0 },
      { label: "50-74%", min: 50, max: 74.99, value: 0 },
      { label: "0-49%", min: 0, max: 49.99, value: 0 },
    ];
    filtered.forEach((r) => {
      const p = Number(r.percent || 0);
      const band = bands.find((b) => p >= b.min && p <= b.max);
      if (band) band.value += 1;
    });
    return bands;
  }, [filtered]);

  const dateTrendData = useMemo(() => {
    const counts = {};
    filtered.forEach((r) => {
      const d = new Date(r.createdAt);
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    const points = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
      points.push({
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value: counts[key] || 0,
      });
    }
    return points;
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Advanced Student Analytics</h1>
        <p className="text-slate-600 mt-1">Full data analytics with filters, visuals, and detailed pagination</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total Students" value={studentsCount} icon={<Users size={20} />} color="from-blue-600 to-indigo-600" />
        <StatCard title="Total Attempts" value={totalAttempts} icon={<Activity size={20} />} color="from-emerald-600 to-teal-600" />
        <StatCard title="Average Score" value={`${avgPercent}%`} icon={<Target size={20} />} color="from-amber-600 to-orange-600" />
        <StatCard title="Question Types Used" value={typeCount} icon={<BarChart3 size={20} />} color="from-rose-600 to-pink-600" />
        <StatCard title="High Scorers (75%+)" value={highScorers} icon={<PieChart size={20} />} color="from-violet-600 to-fuchsia-600" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by student, email, subject, topic, state..."
              className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-9 pr-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">All Types</option>
            {allTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">All States</option>
            {allStates.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {err && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{err}</div>}

      <div className="grid gap-4 lg:grid-cols-2">
        <BarChartCard
          title="State-wise Attempt Distribution"
          icon={<MapPinned size={16} />}
          data={stateWiseData}
          color="from-blue-500 to-indigo-500"
        />
        <BarChartCard
          title="Type-wise Attempt Distribution"
          icon={<BarChart3 size={16} />}
          data={typeWiseData}
          color="from-emerald-500 to-teal-500"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BarChartCard
          title="Score Band Distribution"
          icon={<PieChart size={16} />}
          data={scoreBandData}
          color="from-rose-500 to-pink-500"
        />
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-slate-700"><Activity size={16} /></span>
            <h3 className="text-sm font-bold text-slate-800">Date-wise Attempts (Last 7 Days)</h3>
          </div>
          <div className="grid grid-cols-7 gap-3 items-end h-44">
            {dateTrendData.map((d) => {
              const max = Math.max(1, ...dateTrendData.map((x) => x.value));
              return (
                <div key={d.label} className="flex flex-col items-center justify-end h-full">
                  <div className="text-[11px] font-semibold text-slate-700 mb-1">{d.value}</div>
                  <div
                    className="w-full rounded-md bg-gradient-to-t from-indigo-600 to-purple-500"
                    style={{ height: `${Math.max(6, (d.value / max) * 120)}px` }}
                  />
                  <div className="text-[11px] text-slate-500 mt-2 text-center">{d.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Student</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">State</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Subject</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Topic</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Score</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Percent</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Attempts</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {!busy && paginatedRows.map((r) => (
                <tr key={r._id} className="border-b border-slate-100 hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{r.user?.name || "—"}</div>
                    <div className="text-xs text-slate-500">{r.user?.email || ""}</div>
                  </td>
                  <td className="px-4 py-3">{r.user?.state || "Unknown"}</td>
                  <td className="px-4 py-3">{r.subjectName || "—"}</td>
                  <td className="px-4 py-3">{r.topicName || "—"}</td>
                  <td className="px-4 py-3">{r.type || "—"}</td>
                  <td className="px-4 py-3">{r.score} / {r.total}</td>
                  <td className="px-4 py-3">{Math.round(Number(r.percent || 0))}%</td>
                  <td className="px-4 py-3">{r.attemptsForUser || 1}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
              {busy && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">Loading analytics...</td>
                </tr>
              )}
              {!busy && !paginatedRows.length && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">No analytics data found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 p-4 border-t border-slate-200 bg-slate-50">
          <div className="text-sm text-slate-600">
            Showing {paginatedRows.length ? (safePage - 1) * pageSize + 1 : 0} to{" "}
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
