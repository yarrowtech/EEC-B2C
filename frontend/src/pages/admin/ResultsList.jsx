import React, { useEffect, useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { adminAttempts, getJSON } from "../../lib/api.js";
import { Search, BookOpen, User, ClipboardList, Filter, XCircle, Download, ChevronDown, FileText, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";

export default function ResultsList() {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [subjectMap, setSubjectMap] = useState({});
  const [topicMap, setTopicMap] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10; // you can change this if needed

  // Advanced Filters
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedDateRange, setSelectedDateRange] = useState("");

  // Export dropdown
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);



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
    let result = rows;

    // Apply text search filter
    const s = q.trim().toLowerCase();
    if (s) {
      result = result.filter((r) =>
        (r.user?.name || "").toLowerCase().includes(s) ||
        (r.user?.email || "").toLowerCase().includes(s) ||
        (r.subject || "").toLowerCase().includes(s) ||
        (r.topic || "").toLowerCase().includes(s) ||
        (r.type || "").toLowerCase().includes(s) ||
        (r.subjectName || "").toLowerCase().includes(s) ||
        (r.topicName || "").toLowerCase().includes(s)
      );
    }

    // Apply subject filter
    if (selectedSubject) {
      result = result.filter((r) =>
        r.subject === selectedSubject || r.subjectName === selectedSubject
      );
    }

    // Apply type filter
    if (selectedType) {
      result = result.filter((r) => r.type === selectedType);
    }

    // Apply date range filter
    if (selectedDateRange) {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      result = result.filter((r) => {
        const resultDate = new Date(r.createdAt);

        switch (selectedDateRange) {
          case "today":
            return resultDate >= startOfToday;
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return resultDate >= weekAgo;
          case "month":
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return resultDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    return result;
  }, [rows, q, selectedSubject, selectedType, selectedDateRange]);

  // Extract unique values for filter dropdowns
  const uniqueSubjects = useMemo(() => {
    const subjects = rows.map((r) => r.subjectName || subjectMap[r.subject] || r.subject).filter(Boolean);
    return [...new Set(subjects)].sort();
  }, [rows, subjectMap]);

  const uniqueTypes = useMemo(() => {
    const types = rows.map((r) => r.type).filter(Boolean);
    return [...new Set(types)].sort();
  }, [rows]);

  // Clear all filters
  const clearFilters = () => {
    setSelectedSubject("");
    setSelectedType("");
    setSelectedDateRange("");
  };

  const hasActiveFilters = selectedSubject || selectedType || selectedDateRange;

  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const paginatedRows = filtered.slice(indexOfFirst, indexOfLast);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showExportMenu]);

  // Export results to Excel
  function exportToExcel(dataToExport = rows, filenameSuffix = "") {
    // Create organized data with only relevant fields in a specific order
    const exportData = dataToExport.map((result, index) => ({
      "S.No": index + 1,
      "Student Name": result.user?.name || "-",
      "Student Email": result.user?.email || "-",
      "Subject": result.subjectName || subjectMap[result.subject] || result.subject || "-",
      "Topic": result.topicName || topicMap[result.topic] || result.topic || "-",
      "Exam Type": result.type || "-",
      "Score": result.score || 0,
      "Total Marks": result.total || 0,
      "Percentage": result.percent ? `${result.percent}%` : "-",
      "Attempts": result.attemptsForUser || 1,
      "Date": result.createdAt ? new Date(result.createdAt).toLocaleDateString() : "-",
      "Time": result.createdAt ? new Date(result.createdAt).toLocaleTimeString() : "-",
    }));

    // Create worksheet from organized data
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths for better readability
    const columnWidths = [
      { wch: 6 },  // S.No
      { wch: 20 }, // Student Name
      { wch: 25 }, // Student Email
      { wch: 20 }, // Subject
      { wch: 25 }, // Topic
      { wch: 12 }, // Exam Type
      { wch: 8 },  // Score
      { wch: 12 }, // Total Marks
      { wch: 12 }, // Percentage
      { wch: 10 }, // Attempts
      { wch: 15 }, // Date
      { wch: 15 }, // Time
    ];
    worksheet['!cols'] = columnWidths;

    // Create workbook and add worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");

    // Generate filename with current date
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const filename = `Exam_Results${filenameSuffix ? '_' + filenameSuffix : ''}_${dateStr}.xlsx`;

    XLSX.writeFile(workbook, filename);
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-sm">
            <FileText size={18} />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-slate-800 tracking-tight">Exam Results</h1>
            <p className="text-sm text-slate-500">View and manage all exam attempts</p>
          </div>
        </div>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md shadow-xl overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 p-4 border-b bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
          {/* Search Bar Row */}
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                type="text"
                placeholder="Search by student, subject, topic, type…"
                className="w-full rounded-lg border border-indigo-500/30 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white"
              />
            </div>

            <div className="flex items-center gap-2">
              {busy ? (
                <span className="inline-flex items-center gap-2 text-sm text-slate-600">
                  <Loader2 className="animate-spin" size={16} /> Loading…
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium bg-purple-100 text-purple-800 border-purple-200">
                  <ClipboardList size={14} />
                  {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
                </span>
              )}

              {/* Export Dropdown */}
              <div className="relative" ref={exportMenuRef}>
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm shadow-md transition-all font-medium"
                >
                  <Download size={16} />
                  Export
                  <ChevronDown size={16} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-200 bg-white shadow-lg z-50 overflow-hidden">
                    <button
                      onClick={() => {
                        exportToExcel(rows, "All");
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 border-b"
                    >
                      <Download size={14} className="text-green-600" />
                      <div>
                        <div className="font-medium text-slate-900">Export All Results</div>
                        <div className="text-xs text-slate-500">{rows.length} results</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        exportToExcel(filtered, "Filtered");
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-colors flex items-center gap-2"
                      disabled={filtered.length === 0}
                    >
                      <Download size={14} className="text-blue-600" />
                      <div>
                        <div className="font-medium text-slate-900">Export Filtered Results</div>
                        <div className="text-xs text-slate-500">{filtered.length} results</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Filter Buttons Row */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <Filter size={16} className="text-slate-500" />
              <span>Filters:</span>
            </div>

            {/* Subject Filter */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="rounded-lg border border-indigo-500/30 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white hover:border-indigo-500/50 transition-colors"
            >
              <option value="">All Subjects</option>
              {uniqueSubjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="rounded-lg border border-indigo-500/30 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white hover:border-indigo-500/50 transition-colors"
            >
              <option value="">All Types</option>
              {uniqueTypes.map((type) => (
                <option key={type} value={type}>
                  {type.toUpperCase()}
                </option>
              ))}
            </select>

            {/* Date Range Filter */}
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="rounded-lg border border-indigo-500/30 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white hover:border-indigo-500/50 transition-colors"
            >
              <option value="">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 px-3 py-1.5 text-sm font-medium transition-colors"
              >
                <XCircle size={14} />
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Error state */}
        {err && (
          <div className="flex items-center gap-2 p-3 text-sm text-rose-700 bg-rose-50 border-t border-rose-100">
            {err}
          </div>
        )}

        {/* Styled Table */}
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full">
            <thead className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  #
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Student
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Exam Details
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Score
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Attempts
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {paginatedRows.map((r, i) => (
                <tr
                  key={r._id}
                  className={`transition-all ${i % 2 === 0 ? "bg-white" : "bg-slate-50/60"} hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50`}
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
                      <span className="uppercase text-[10px] bg-slate-200 px-2 py-0.5 rounded-full">
                        {r.type}
                      </span>
                      <div className="text-xs text-gray-500">
                        {/* {r.topic || "Topic"} •{" "} */}
                        {/* {topicMap[r.topic] || r.topic} */}
                        {r.topicName || topicMap[r.topic] || r.topic} {" "}

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
                  <div className="flex flex-col leading-tight">
                    <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(r.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
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
          <div className="flex items-center justify-between px-4 py-3 border-t bg-white/70 backdrop-blur">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className={`px-3 py-1 rounded-lg border text-sm ${
                currentPage === 1
                  ? "opacity-50 cursor-not-allowed"
                  : "bg-white hover:bg-slate-100"
              }`}
            >
              Prev
            </button>

            <div className="text-sm text-slate-600">
              Page <span className="font-semibold">{currentPage}</span> of{" "}
              <span className="font-semibold">{totalPages || 1}</span>
            </div>

            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className={`px-3 py-1 rounded-lg border text-sm ${
                currentPage >= totalPages
                  ? "opacity-50 cursor-not-allowed"
                  : "bg-white hover:bg-slate-100"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
