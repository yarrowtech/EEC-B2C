import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { adminAttempts, getJSON } from "../../lib/api.js";
import { Search, BookOpen, User, ClipboardList } from "lucide-react";

export default function ResultsList() {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [subjectMap, setSubjectMap] = useState({});
  const [topicMap, setTopicMap] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10; // you can change this if needed



  async function loadSubjectTopicNames() {
    try {
      const subjectRes = await getJSON("/api/subjects");
      const topicRes = await getJSON("/api/topics");

      const subjects = subjectRes.items || [];
      const topics = topicRes.items || [];

      const sMap = {};
      subjects.forEach(s => sMap[s._id] = s.name);

      const tMap = {};
      topics.forEach(t => tMap[t._id] = t.name);

      setSubjectMap(sMap);
      setTopicMap(tMap);
    } catch (err) {
      console.error("Failed to load names", err);
    }
  }

  // loadSubjectTopicNames();
  useEffect(() => {
    loadSubjectTopicNames();
  }, []);



  useEffect(() => {
    (async () => {
      setBusy(true);
      setErr("");
      try {
        const { items } = await adminAttempts();
        setRows(items || []);
      } catch (e) {
        setErr(e.message || "Failed to load");
      } finally {
        setBusy(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      (r.user?.name || "").toLowerCase().includes(s) ||
      (r.user?.email || "").toLowerCase().includes(s) ||
      (r.subject || "").toLowerCase().includes(s) ||
      (r.topic || "").toLowerCase().includes(s) ||
      (r.type || "").toLowerCase().includes(s)
    );
  }, [rows, q]);

  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const paginatedRows = filtered.slice(indexOfFirst, indexOfLast);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-800">Results</h1>

      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by student, subject, topic, type…"
            className="w-full rounded-lg border pl-8 pr-3 py-2 bg-white"
          />
        </div>
        {busy && <span className="text-xs text-slate-500">Loading…</span>}
        {err && <span className="text-xs text-rose-600">{err}</span>}
      </div>

      {/* Styled Table */}
      <div className="overflow-x-auto border bg-white shadow-sm">
        <table className="min-w-[900px] w-full">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                #
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Student
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Exam Details
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Score
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Attempts
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Date
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {paginatedRows.map((r, i) => (
              <tr
                key={r._id}
                className="hover:bg-gray-50 transition-colors"
              >
                {/* Student */}
                <td className="px-6 py-4 text-sm text-gray-700">
                  {indexOfFirst + i + 1}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="px-2 py-0.5 bg-blue-100 rounded-full flex items-center justify-center font-semibold text-blue-600">
                      {(r.user?.name || "?").charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <div className="font-medium text-gray-900">
                        {r.user?.name || "Unknown"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {r.user?.email}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Exam Details */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                    </div>

                    <div>
                      <div className="font-medium text-gray-900">
                        {/* {r.subject || "Subject"} */}
                        {/* {subjectMap[r.subject] || r.subject} */}
                        {r.subjectName || subjectMap[r.subject] || r.subject}
                      </div>
                      <div className="text-xs text-gray-500">
                        {/* {r.topic || "Topic"} •{" "} */}
                        {/* {topicMap[r.topic] || r.topic} */}
                        {r.topicName || topicMap[r.topic] || r.topic} • {" "}
                        <span className="uppercase text-[10px] bg-slate-200 px-2 py-0.5 rounded-full">
                          {r.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>

                {/* Score */}
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <span className="font-semibold text-gray-900">
                      {r.score}
                    </span>
                    <span className="text-gray-500">/{r.total}</span>
                  </div>
                  <div className="text-xs text-gray-500">{r.percent}%</div>
                </td>

                {/* Attempts */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-medium">
                      {r.attemptsForUser || 1}
                    </span>
                  </div>
                </td>

                {/* Date */}
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(r.createdAt).toLocaleString()}
                </td>

                {/* Action */}
                <td className="px-6 py-4">
                  <Link
                    to={`/dashboard/results/${r._id}`}
                    className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))}

            {!filtered.length && !busy && (
              <tr>
                <td
                  colSpan={7}
                  className="p-6 text-center text-slate-500"
                >
                  No results found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-2 py-4 bg-white">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Prev
          </button>

          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
