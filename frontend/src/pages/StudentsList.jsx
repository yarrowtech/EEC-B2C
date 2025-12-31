import React, { useMemo, useState, useEffect, useRef } from "react";
import { Eye, Pencil, X, Search, Users, GraduationCap, BadgeCheck, Loader2, AlertTriangle, Filter, XCircle, Download, ChevronDown } from "lucide-react";
import * as XLSX from "xlsx";

/* pull role the same way the layout does (read-only) */
function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}
function getToken() {
  return localStorage.getItem("jwt") || "";
}

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api"; // adjust if your server uses another port

export default function StudentsList() {
  const user = getUser();
  const role = String(user?.role || "").toLowerCase();

  const [rows, setRows] = useState([]);        // fetched students
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);

  // Filters
  const [selectedState, setSelectedState] = useState("");
  const [selectedBoard, setSelectedBoard] = useState("");
  const [selectedClass, setSelectedClass] = useState("");

  // Export dropdown
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);

  // pagination
  const [page, setPage] = useState(1);
  const pageSize = 10; // show 10 rows per page



  // Esc to close modal
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

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

  // Fetch students from backend
  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const token = getToken();
        const url = new URL(`${API_BASE}/api/users/students`);
        if (query.trim()) url.searchParams.set("q", query.trim());

        const res = await fetch(url.toString(), {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        if (res.status === 401) {
          // token invalid → sign out gracefully
          localStorage.removeItem("jwt");
          localStorage.removeItem("user");
          window.dispatchEvent(new CustomEvent("eec:auth", { detail: { type: "logout" } }));
          setErr("Session expired. Please log in again.");
          setRows([]);
          return;
        }

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.message || `Request failed (${res.status})`);
        }

        const data = await res.json();
        if (!stop) {
          // normalize for table (your schema uses: name,email,phone,class,state,role)
          // const mapped = (data.students || []).map((s, i) => ({
          //   id: s._id || i + 1,
          //   name: s.name || "-",
          //   grade: s.class || "-", // your schema uses `class` for class/grade
          //   state: s.state || "-",
          //   email: s.email || "-",
          //   phone: s.phone || "-",
          //   rollNo: s.class ? `${s.class}-${String(i + 1).padStart(3, "0")}` : `STD-${String(i + 1).padStart(3, "0")}`,
          // }));
          const mapped = (data.students || []).map((s, i) => ({
            ...s, // ⭐ keeps EVERYTHING from DB
            id: s._id || i + 1,
            grade: s.className || s.class || "-",
            rollNo: s.class,
            board: s.board || "",
            state: s.state || "",
          }));
          setRows(mapped);
        }
      } catch (e) {
        if (!stop) {
          console.error(e);
          setErr(e.message || "Failed to load students.");
          setRows([]);
        }
      } finally {
        if (!stop) setLoading(false);
      }
    })();
    return () => {
      stop = true;
    };
  }, [query]); // re-fetch when searching (server-side search)

  const filtered = useMemo(() => {
    let result = rows;

    // Apply text search filter
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.grade.toLowerCase().includes(q) ||
          String(r.rollNo).toLowerCase().includes(q) ||
          (r.email && r.email.toLowerCase().includes(q)) ||
          (r.phone && r.phone.toLowerCase().includes(q))
      );
    }

    // Apply state filter
    if (selectedState) {
      result = result.filter((r) => r.state === selectedState);
    }

    // Apply board filter
    if (selectedBoard) {
      result = result.filter((r) => r.board === selectedBoard);
    }

    // Apply class filter
    if (selectedClass) {
      result = result.filter((r) => r.grade === selectedClass || r.className === selectedClass);
    }

    return result;
  }, [query, rows, selectedState, selectedBoard, selectedClass]);

  // Extract unique values for filter dropdowns
  const uniqueStates = useMemo(() => {
    const states = rows.map((r) => r.state).filter(Boolean);
    return [...new Set(states)].sort();
  }, [rows]);

  const uniqueBoards = useMemo(() => {
    const boards = rows.map((r) => r.board).filter(Boolean);
    return [...new Set(boards)].sort();
  }, [rows]);

  const uniqueClasses = useMemo(() => {
    const classes = rows.map((r) => r.grade || r.className).filter(Boolean);
    return [...new Set(classes)].sort();
  }, [rows]);

  // Clear all filters
  const clearFilters = () => {
    setSelectedState("");
    setSelectedBoard("");
    setSelectedClass("");
  };

  const hasActiveFilters = selectedState || selectedBoard || selectedClass;

  const openModal = (row) => {
    // allow only non-student roles to view (admin / teacher)
    if (role === "student") return;
    setSelected(row);
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setTimeout(() => setSelected(null), 150);
  };

  function getAvatarLetter(name = "") {
    return name.trim().charAt(0).toUpperCase();
  }

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [page, filtered]);

  // Export students to Excel
  function exportToExcel(dataToExport = rows, filenameSuffix = "") {
    // Create organized data with only relevant fields in a specific order
    const exportData = dataToExport.map((student, index) => ({
      "S.No": index + 1,
      "Name": student.name || "-",
      "Email": student.email || "-",
      "Phone": student.phone || "-",
      "Class": student.grade || student.className || "-",
      "Roll No": student.rollNo || "-",
      "Board": student.board || "-",
      "State": student.state || "-",
      "Gender": student.gender || "-",
      "Date of Birth": student.dob || "-",
      "Address": student.address || "-",
      "Father Name": student.fatherName || "-",
      "Father Contact": student.fatherContact || "-",
      "Father Occupation": student.fatherOccupation || "-",
      "Mother Name": student.motherName || "-",
      "Mother Contact": student.motherContact || "-",
      "Mother Occupation": student.motherOccupation || "-",
      "Points": student.points ?? 0,
      "Created At": student.createdAt ? new Date(student.createdAt).toLocaleString() : "-",
      "Updated At": student.updatedAt ? new Date(student.updatedAt).toLocaleString() : "-",
    }));

    // Create worksheet from organized data
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths for better readability
    const columnWidths = [
      { wch: 6 },  // S.No
      { wch: 20 }, // Name
      { wch: 25 }, // Email
      { wch: 15 }, // Phone
      { wch: 10 }, // Class
      { wch: 12 }, // Roll No
      { wch: 15 }, // Board
      { wch: 15 }, // State
      { wch: 10 }, // Gender
      { wch: 15 }, // Date of Birth
      { wch: 30 }, // Address
      { wch: 20 }, // Father Name
      { wch: 15 }, // Father Contact
      { wch: 20 }, // Father Occupation
      { wch: 20 }, // Mother Name
      { wch: 15 }, // Mother Contact
      { wch: 20 }, // Mother Occupation
      { wch: 10 }, // Points
      { wch: 20 }, // Created At
      { wch: 20 }, // Updated At
    ];
    worksheet['!cols'] = columnWidths;

    // Create workbook and add worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students List");

    // Generate filename with current date
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const filename = `Students_List${filenameSuffix ? '_' + filenameSuffix : ''}_${dateStr}.xlsx`;

    XLSX.writeFile(workbook, filename);
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
            <Users size={18} />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-slate-800 tracking-tight">Students</h1>
            <p className="text-sm text-slate-500">
              Role: <span className="capitalize">{role}</span>
            </p>
          </div>
        </div>

        {role !== "student" && (
          <button className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 text-sm text-white shadow-md hover:opacity-90 transition-all">
            Add Student
          </button>
        )}
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md shadow-xl overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 p-4 border-b bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50">
          {/* Search Bar Row */}
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="text"
                placeholder="Search by name, class, email, phone…"
                className="w-full rounded-lg border border-blue-500/30 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
              />
            </div>

            <div className="flex items-center gap-2">
              {loading ? (
                <span className="inline-flex items-center gap-2 text-sm text-slate-600">
                  <Loader2 className="animate-spin" size={16} /> Loading…
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium bg-indigo-100 text-indigo-800 border-indigo-200">
                  <GraduationCap size={14} />
                  {filtered.length} {filtered.length === 1 ? 'student' : 'students'}
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
                        <div className="font-medium text-slate-900">Export All Students</div>
                        <div className="text-xs text-slate-500">{rows.length} students</div>
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
                        <div className="text-xs text-slate-500">{filtered.length} students</div>
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

            {/* State Filter */}
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="rounded-lg border border-blue-500/30 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white hover:border-blue-500/50 transition-colors"
            >
              <option value="">All States</option>
              {uniqueStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>

            {/* Board Filter */}
            <select
              value={selectedBoard}
              onChange={(e) => setSelectedBoard(e.target.value)}
              className="rounded-lg border border-blue-500/30 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white hover:border-blue-500/50 transition-colors"
            >
              <option value="">All Boards</option>
              {uniqueBoards.map((board) => (
                <option key={board} value={board}>
                  {board}
                </option>
              ))}
            </select>

            {/* Class Filter */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="rounded-lg border border-blue-500/30 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white hover:border-blue-500/50 transition-colors"
            >
              <option value="">All Classes</option>
              {uniqueClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
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
            <AlertTriangle size={16} />
            {err}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white text-left">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Class</th>
                <th className="px-4 py-3 font-medium">Board</th>
                <th className="px-4 py-3 font-medium">State</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                {role !== "student" && <th className="px-4 py-3 font-medium">Actions</th>}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={role !== "student" ? 8 : 7} className="px-4 py-6 text-center text-slate-500">
                    <Loader2 className="inline-block animate-spin mr-2" size={16} />
                    Fetching students data...
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={role !== "student" ? 8 : 7} className="px-4 py-6 text-center text-slate-500">
                    No students found.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((r, i) => (
                  <tr
                    key={r.id}
                    className={`transition-all ${i % 2 === 0 ? "bg-white" : "bg-slate-50/60"} hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50`}
                  >
                    <td className="px-4 py-3 text-slate-700">{(page - 1) * pageSize + i + 1}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{r.name}</td>
                    <td className="px-4 py-3 text-slate-700">{r.grade}</td>
                    <td className="px-4 py-3">
                      {r.board ? (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 border border-blue-200">
                          {r.board}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.state ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 border border-emerald-200">
                          {r.state}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{r.email}</td>
                    <td className="px-4 py-3 text-slate-700">{r.phone}</td>

                    {role !== "student" && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openModal(r)}
                            className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-2.5 py-1 text-xs font-medium shadow-sm hover:opacity-90 transition-all"
                          >
                            <Eye size={14} />
                            View
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t bg-white/70 backdrop-blur">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className={`px-3 py-1 rounded-lg border text-sm ${page === 1 ? "opacity-50 cursor-not-allowed" : "bg-white hover:bg-slate-100"
                }`}
            >
              Prev
            </button>

            <div className="text-sm text-slate-600">
              Page <span className="font-semibold">{page}</span> of{" "}
              <span className="font-semibold">
                {Math.ceil(filtered.length / pageSize)}
              </span>
            </div>

            <button
              disabled={page >= Math.ceil(filtered.length / pageSize)}
              onClick={() => setPage((p) => p + 1)}
              className={`px-3 py-1 rounded-lg border text-sm ${page >= Math.ceil(filtered.length / pageSize)
                ? "opacity-50 cursor-not-allowed"
                : "bg-white hover:bg-slate-100"
                }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {open && selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6"
          aria-modal="true"
          role="dialog"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] animate-fade-in"
            onClick={closeModal}
          />
          {/* Panel */}
          <div
            className="relative z-10 w-full h-full sm:h-auto sm:max-w-5xl sm:rounded-2xl border-0 sm:border border-white/60 bg-white/95 backdrop-blur-md shadow-[0_24px_48px_-16px_rgba(2,6,23,0.35)] animate-scale-in overflow-y-auto sm:max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-blue-600/10 to-indigo-600/10 backdrop-blur-sm">
              <div className="flex items-center gap-3">

                {/* Avatar */}
                <div className="relative">
                  {selected.profilePic ? (
                    <img
                      src={selected.profilePic}
                      alt={selected.name}
                      className="h-12 w-12 rounded-xl object-cover shadow-lg ring-2 ring-white/40"
                    />
                  ) : (
                    <div
                      className="h-12 w-12 rounded-xl flex items-center justify-center text-white text-lg font-semibold shadow-lg"
                      style={{
                        background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
                      }}
                    >
                      {getAvatarLetter(selected.name)}
                    </div>
                  )}

                  {/* IG Story Ring */}
                  <div className="absolute inset-0 rounded-xl pointer-events-none ring-[3px] ring-gradient-ig" />
                </div>

                {/* Title */}
                <div>
                  <div className="text-xs text-slate-500">Student</div>
                  <div className="text-base font-semibold text-slate-900 leading-tight">
                    {selected.name} <span className="text-slate-500">• {selected.rollNo}</span>
                  </div>
                </div>

              </div>

              <button
                onClick={closeModal}
                className="inline-flex items-center justify-center rounded-lg border px-2 py-2 hover:bg-white transition-colors"
                aria-label="Close"
                title="Close"
              >
                <X size={16} />
              </button>

            </div>


            {/* Body */}
            <div className="px-4 py-4 pb-20 sm:pb-4">

              {/* LANDSCAPE TWO-COLUMN GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">

                <InfoRow label="Name" value={selected.name} />
                <InfoRow label="Email" value={selected.email} />

                <InfoRow label="Phone" value={selected.phone} />
                <InfoRow label="Class" value={selected.grade} />

                <InfoRow label="Roll No" value={selected.rollNo} />
                <InfoRow label="Board" value={selected.board || "-"} />

                <InfoRow label="State" value={selected.state || "-"} />
                <InfoRow label="Date of Birth" value={selected.dob || "-"} />

                <InfoRow label="Gender" value={selected.gender || "-"} />

                <InfoRow label="Address" value={selected.address || "-"} />
                <InfoRow label="Points" value={selected.points ?? 0} />

                <InfoRow label="Father Name" value={selected.fatherName || "-"} />
                <InfoRow label="Father Occupation" value={selected.fatherOccupation || "-"} />

                <InfoRow label="Father Contact" value={selected.fatherContact || "-"} />
                <InfoRow label="Mother Name" value={selected.motherName || "-"} />

                <InfoRow label="Mother Occupation" value={selected.motherOccupation || "-"} />
                <InfoRow label="Mother Contact" value={selected.motherContact || "-"} />

                <InfoRow label="Created At" value={new Date(selected.createdAt).toLocaleString()} />
                <InfoRow label="Updated At" value={new Date(selected.updatedAt).toLocaleString()} />

              </div>

            </div>


            {/* Footer */}
            <div className="sticky bottom-0 z-20 sm:rounded-br-xl sm:rounded-bl-xl flex items-center justify-end gap-2 px-4 py-3 border-t bg-gradient-to-r from-slate-50 to-slate-100 backdrop-blur-sm">
              <button
                onClick={closeModal}
                className="rounded-lg border px-4 py-2 text-sm bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm"
              >
                Close
              </button>
              {/* {role === "admin" && (
                <button className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 text-sm text-white hover:opacity-90 transition-all">
                  Edit Details
                </button>
              )} */}
            </div>
          </div>
        </div>
      )}

      {/* Tiny animations */}
      <style>{`
        @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes scale-in { from { opacity: 0; transform: translateY(12px) scale(.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
        .animate-fade-in { animation: fade-in .18s ease-out }
        .animate-scale-in { animation: scale-in .22s cubic-bezier(.2,.8,.2,1) }
        .ring-gradient-ig {
    background: conic-gradient(
      from 180deg at 50% 50%,
      #feda75,
      #fa7e1e,
      #d62976,
      #962fbf,
      #4f5bd5,
      #feda75
    );
    -webkit-mask: 
      linear-gradient(#fff 0 0) content-box, 
      linear-gradient(#fff 0 0);
    mask: 
      linear-gradient(#fff 0 0) content-box, 
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    padding: 3px;
      `}</style>
    </div>
  );
}

/* ------- small component for key/value row ------- */
function InfoRow({ label, value, horizontal = false }) {
  if (!horizontal) {
    return (
      <div className="rounded-xl border border-white/60 bg-white/70 backdrop-blur p-3">
        <div className="text-[11px] font-semibold text-slate-500 mb-1">{label}</div>
        <div className="text-sm text-slate-800">{value}</div>
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center rounded-xl border border-white/60 bg-white/70 backdrop-blur p-3">
      <div className="text-[11px] font-semibold text-slate-500">{label}</div>
      <div className="text-sm font-medium text-slate-800 text-right max-w-[60%]">
        {value}
      </div>
    </div>
  );
}

function TableRow({ label, value }) {
  return (
    <tr className="border-b last:border-none">
      <td className="py-2 pr-4 font-semibold text-slate-600 w-1/3">{label}</td>
      <td className="py-2 text-slate-800 w-2/3">{value}</td>
    </tr>
  );
}
