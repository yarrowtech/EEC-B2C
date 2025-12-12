import React, { useMemo, useState, useEffect } from "react";
import { Eye, Pencil, X, Search, Users, GraduationCap, BadgeCheck, Loader2, AlertTriangle } from "lucide-react";
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
    // we already do server-side filtering by ?q=, but keep client-side fallback if needed
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.grade.toLowerCase().includes(q) ||
        String(r.rollNo).toLowerCase().includes(q)
    );
  }, [query, rows]);

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

  // Export all students to Excel
  function exportToExcel() {
    const worksheet = XLSX.utils.json_to_sheet(rows);   // rows = ALL students
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

    XLSX.writeFile(workbook, "students.xlsx");
  }

  return (
    <div className="space-y-6">
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
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between p-3 border-b bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50">
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
              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800 border-indigo-200">
                <GraduationCap size={14} />
                {filtered.length} results
              </span>
            )}
            {/* Export Button */}
            <div className="flex justify-end mb-3">
              <button
                onClick={exportToExcel}
                className="rounded-lg bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm shadow-md transition-all"
              >
                Export to Excel
              </button>
            </div>
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
                <th className="px-4 py-3 font-medium">State</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                {role !== "student" && <th className="px-4 py-3 font-medium">Actions</th>}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={role !== "student" ? 7 : 6} className="px-4 py-6 text-center text-slate-500">
                    <Loader2 className="inline-block animate-spin mr-2" size={16} />
                    Fetching students data...
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={role !== "student" ? 7 : 6} className="px-4 py-6 text-center text-slate-500">
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
                      {r.state || "-"}
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
                          {/* {role === "admin" && (
                            <button className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-2.5 py-1 text-xs font-medium shadow-sm hover:opacity-90 transition-all">
                              <Pencil size={14} />
                              Edit
                            </button>
                          )} */}
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
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
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
            className="relative z-10 w-full sm:max-w-5xl rounded-t-2xl sm:rounded-2xl border border-white/60 bg-white/95 backdrop-blur-md shadow-[0_24px_48px_-16px_rgba(2,6,23,0.35)] animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-blue-600/10 to-indigo-600/10">

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
            <div className="px-4 py-4">

              {/* LANDSCAPE TWO-COLUMN GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                <InfoRow label="Name" value={selected.name} />
                <InfoRow label="Email" value={selected.email} />

                <InfoRow label="Phone" value={selected.phone} />
                <InfoRow label="Class" value={selected.grade} />

                <InfoRow label="Roll No" value={selected.rollNo} />
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
            <div className="rounded-br-xl rounded-bl-xl flex items-center justify-end gap-2 px-4 py-3 border-t bg-gradient-to-r from-slate-50 to-slate-100">
              <button
                onClick={closeModal}
                className="rounded-lg border px-3 py-2 text-sm bg-red-500 text-white hover:bg-red-600 transition-colors"
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
