import React, { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { getJSON } from "../../lib/api";
import { Users, BarChart3, Target, CheckCircle2 } from "lucide-react";

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
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [passPercent, setPassPercent] = useState(60);
  const [setRows, setSetRows] = useState([]);
  const [teacherSummaries, setTeacherSummaries] = useState([]);
  const [scope, setScope] = useState("all-teachers");
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
    async function load() {
      setBusy(true);
      setErr("");
      try {
        const data = await getJSON(
          `/api/questions/upload-performance?passPercent=${encodeURIComponent(passPercent)}`
        );
        setSetRows(Array.isArray(data?.setRows) ? data.setRows : []);
        setTeacherSummaries(
          Array.isArray(data?.teacherSummaries) ? data.teacherSummaries : []
        );
        setScope(String(data?.scope || "all-teachers"));
      } catch (e) {
        setErr(e.message || "Failed to load analytics");
      } finally {
        setBusy(false);
      }
    }
    load();
  }, [passPercent]);

  const filteredRows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return setRows;
    return setRows.filter((r) =>
      [
        r.teacherName,
        r.teacherEmail,
        r.boardLabel,
        r.classLabel,
        r.subjectLabel,
        r.topicLabel,
        r.type,
      ]
        .map((x) => String(x || "").toLowerCase())
        .some((x) => x.includes(needle))
    );
  }, [setRows, q]);

  useEffect(() => {
    setPage(1);
  }, [q, pageSize]);

  const totals = useMemo(() => {
    return filteredRows.reduce(
      (acc, r) => {
        acc.uploadedQuestions += Number(r.uploadedQuestions || 0);
        acc.attemptsCount += Number(r.attemptsCount || 0);
        acc.successfulAttemptsCount += Number(r.successfulAttemptsCount || 0);
        acc.uniqueStudentsCount += Number(r.uniqueStudentsCount || 0);
        return acc;
      },
      {
        uploadedQuestions: 0,
        attemptsCount: 0,
        successfulAttemptsCount: 0,
        uniqueStudentsCount: 0,
      }
    );
  }, [filteredRows]);

  const successRate = totals.attemptsCount
    ? Math.round((totals.successfulAttemptsCount / totals.attemptsCount) * 100)
    : 0;

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, safePage, pageSize]);

  if (role && role !== "admin" && role !== "teacher") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">
          {scope === "self" ? "My Question Performance" : "Teacher Question Performance"}
        </h1>
        <p className="text-slate-600 mt-1">
          Track attempts and successful practice-test submissions on uploaded question sets.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm grid gap-4 md:grid-cols-3">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Success Threshold (%)
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={passPercent}
            onChange={(e) => setPassPercent(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-slate-700 mb-1">Search</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by teacher, board, class, subject, topic, type..."
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Teachers" value={teacherSummaries.length} icon={<Users size={20} />} color="from-blue-600 to-indigo-600" />
        <StatCard title="Uploaded Questions" value={totals.uploadedQuestions} icon={<BarChart3 size={20} />} color="from-emerald-600 to-teal-600" />
        <StatCard title="Student Attempts" value={totals.attemptsCount} icon={<Target size={20} />} color="from-amber-600 to-orange-600" />
        <StatCard title="Successful Attempts" value={totals.successfulAttemptsCount} icon={<CheckCircle2 size={20} />} color="from-rose-600 to-pink-600" />
        <StatCard title="Success Rate" value={`${successRate}%`} icon={<Target size={20} />} color="from-violet-600 to-fuchsia-600" />
      </div>

      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {err}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1300px] w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {scope !== "self" && (
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Teacher</th>
                )}
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Board</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Class</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Subject</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Topic</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Uploaded Qs</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Attempts</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Students</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Successful</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Success %</th>
              </tr>
            </thead>
            <tbody>
              {!busy &&
                paginatedRows.map((r, idx) => (
                  <tr
                    key={`${r.teacherId}-${r.board}-${r.className}-${r.subject}-${r.topic}-${r.type}-${idx}`}
                    className="border-b border-slate-100 hover:bg-slate-50/60"
                  >
                    {scope !== "self" && (
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{r.teacherName || "-"}</div>
                        <div className="text-xs text-slate-500">{r.teacherEmail || "-"}</div>
                      </td>
                    )}
                    <td className="px-4 py-3">{r.boardLabel || "-"}</td>
                    <td className="px-4 py-3">{r.classLabel || "-"}</td>
                    <td className="px-4 py-3">{r.subjectLabel || "-"}</td>
                    <td className="px-4 py-3">{r.topicLabel || "-"}</td>
                    <td className="px-4 py-3">{r.type || "-"}</td>
                    <td className="px-4 py-3 font-semibold">{r.uploadedQuestions || 0}</td>
                    <td className="px-4 py-3">{r.attemptsCount || 0}</td>
                    <td className="px-4 py-3">{r.uniqueStudentsCount || 0}</td>
                    <td className="px-4 py-3">{r.successfulAttemptsCount || 0}</td>
                    <td className="px-4 py-3 font-semibold">{r.successRate || 0}%</td>
                  </tr>
                ))}
              {busy && (
                <tr>
                  <td
                    colSpan={scope === "self" ? 10 : 11}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Loading analytics...
                  </td>
                </tr>
              )}
              {!busy && !paginatedRows.length && (
                <tr>
                  <td
                    colSpan={scope === "self" ? 10 : 11}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    No analytics data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="text-sm text-slate-600">
          Showing {filteredRows.length ? (safePage - 1) * pageSize + 1 : 0} to{" "}
          {Math.min(safePage * pageSize, filteredRows.length)} of {filteredRows.length}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <button
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm text-slate-600">
            Page {safePage} / {totalPages}
          </span>
          <button
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
