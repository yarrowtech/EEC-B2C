import React, { useMemo, useState, useEffect } from "react";
import {
  Pencil,
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import Swal from "sweetalert2";

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
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "http://localhost:5000/api";

export default function TeachersList() {
  const user = getUser();
  const role = String(user?.role || "").toLowerCase();

  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const totalPages = Math.ceil(rows.length / PAGE_SIZE);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, page]);

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    load();
  }, [query]);

  async function load() {
    try {
      const token = getToken();
      const url = new URL(`${API_BASE}/api/users/teachers`);
      if (query.trim()) url.searchParams.set("q", query.trim());

      const res = await fetch(url, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      const data = await res.json();
      setRows(data.teachers || []);
      setPage(1);
    } catch (err) {
      console.error(err);
    }
  }

  async function createTeacher() {
    try {
      setLoading(true);
      const token = getToken();

      const res = await fetch(`${API_BASE}/api/users/teachers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      Swal.fire("Success", "Teacher created successfully", "success");
      setOpen(false);
      setForm({ name: "", email: "", phone: "", password: "" });
      load();
    } catch (err) {
      Swal.fire("Error", err.message || "Failed", "error");
    } finally {
      setLoading(false);
    }
  }

  async function updateTeacher() {
    try {
      const token = getToken();
      const res = await fetch(
        `${API_BASE}/api/users/teachers/${selected._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      Swal.fire("Updated", "Teacher updated successfully", "success");
      setEditOpen(false);
      load();
    } catch (err) {
      Swal.fire("Error", err.message || "Update failed", "error");
    }
  }

  async function deleteTeacher(teacher) {
    const result = await Swal.fire({
      title: "Delete Teacher?",
      text: `Delete ${teacher.name}? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete",
    });

    if (!result.isConfirmed) return;

    try {
      const token = getToken();
      const res = await fetch(
        `${API_BASE}/api/users/teachers/${teacher._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      Swal.fire("Deleted", "Teacher removed successfully", "success");
      load();
    } catch (err) {
      Swal.fire("Error", err.message || "Delete failed", "error");
    }
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between bg-white/70 backdrop-blur-xl p-5 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white shadow-lg">
            <Users size={24} />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Teachers</h1>
            <p className="text-sm text-slate-500">Manage teachers</p>
          </div>
        </div>

        {role === "admin" && (
          <button
            onClick={() => setOpen(true)}
            className="rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-5 py-2.5 text-white shadow hover:opacity-90"
          >
            + Add Teacher
          </button>
        )}
      </div>

      {/* TABLE / EMPTY STATE */}
      <div className="rounded-3xl bg-white/60 backdrop-blur-xl shadow-xl p-6">

        {/* SEARCH */}
        <div className="relative w-full md:w-96 mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search teachers..."
            className="w-full rounded-xl border pl-10 pr-3 py-2.5 bg-white shadow focus:ring-2 focus:ring-purple-400"
          />
        </div>

        {rows.length === 0 ? (
          /* EMPTY STATE */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-fuchsia-100 flex items-center justify-center mb-6">
              <Users className="w-12 h-12 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              No Teachers Found
            </h2>
            <p className="text-slate-500 max-w-md">
              There are no teachers available right now.
              Add a new teacher to get started.
            </p>

            {role === "admin" && (
              <button
                onClick={() => setOpen(true)}
                className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow hover:scale-105 transition"
              >
                + Add First Teacher
              </button>
            )}
          </div>
        ) : (
          <>
            {/* TABLE */}
            <table className="min-w-full text-sm">
              <thead className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {paginatedRows.map((t, i) => (
                  <tr key={t._id} className="border-b hover:bg-purple-50">
                    <td className="px-4 py-3">{(page - 1) * PAGE_SIZE + i + 1}</td>
                    <td className="px-4 py-3">{t.name}</td>
                    <td className="px-4 py-3">{t.email}</td>
                    <td className="px-4 py-3">{t.phone}</td>
                    <td className="px-4 py-3 flex gap-3">
                      <button
                        onClick={() => {
                          setSelected(t);
                          setForm({
                            name: t.name,
                            email: t.email,
                            phone: t.phone,
                            password: "",
                          });
                          setEditOpen(true);
                        }}
                        className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        onClick={() => deleteTeacher(t)}
                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 rounded-xl border bg-white disabled:opacity-40"
                >
                  <ChevronLeft size={16} /> Prev
                </button>

                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`px-4 py-2 rounded-xl ${page === i + 1
                        ? "bg-purple-600 text-white"
                        : "bg-white border"
                        }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 rounded-xl border bg-white disabled:opacity-40"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ADD & EDIT MODALS (UNCHANGED) */}
      {/* Your existing add/edit modals remain exactly as they are */}
      {/* ------------------ ADD TEACHER MODAL ------------------ */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-md"
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl bg-white/90 backdrop-blur-xl">

            {/* Top Gradient Header */}
            <div className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 px-6 py-5 text-white">
              <h2 className="text-xl font-extrabold tracking-wide">
                Add Teacher
              </h2>
              <p className="text-sm text-purple-100 mt-1">
                Create a new teacher account
              </p>
            </div>

            {/* Form Body */}
            <div className="p-6 space-y-4">

              <input
                className="w-full rounded-xl px-4 py-2.5 bg-white border border-slate-200
          shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                placeholder="Full Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />

              <input
                className="w-full rounded-xl px-4 py-2.5 bg-white border border-slate-200
          shadow-sm focus:ring-2 focus:ring-fuchsia-500 focus:outline-none transition"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />

              <input
                className="w-full rounded-xl px-4 py-2.5 bg-white border border-slate-200
          shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />

              <input
                type="password"
                className="w-full rounded-xl px-4 py-2.5 bg-white border border-slate-200
          shadow-sm focus:ring-2 focus:ring-pink-500 focus:outline-none transition"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300
            bg-white text-slate-700 font-semibold
            hover:bg-slate-100 transition"
                >
                  Cancel
                </button>

                <button
                  onClick={createTeacher}
                  disabled={loading}
                  className="px-6 py-2 rounded-xl font-semibold text-white
            bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600
            shadow-lg hover:opacity-90 hover:scale-[1.02]
            active:scale-95 transition disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Teacher"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ------------------ EDIT TEACHER MODAL ------------------ */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-md"
            onClick={() => setEditOpen(false)}
          />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl bg-white/90 backdrop-blur-xl">

            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 px-6 py-5 text-white">
              <h2 className="text-xl font-extrabold tracking-wide">
                Edit Teacher
              </h2>
              <p className="text-sm text-indigo-100 mt-1">
                Update teacher information
              </p>
            </div>

            {/* Form Body */}
            <div className="p-6 space-y-4">

              <input
                className="w-full rounded-xl px-4 py-2.5 bg-white border border-slate-200
          shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Full Name"
              />

              <input
                className="w-full rounded-xl px-4 py-2.5 bg-white border border-slate-200
          shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email"
              />

              <input
                className="w-full rounded-xl px-4 py-2.5 bg-white border border-slate-200
          shadow-sm focus:ring-2 focus:ring-fuchsia-500 focus:outline-none transition"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Phone"
              />

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setEditOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300
            bg-white text-slate-700 font-semibold
            hover:bg-slate-100 transition"
                >
                  Cancel
                </button>

                <button
                  onClick={updateTeacher}
                  className="px-6 py-2 rounded-xl font-semibold text-white
            bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600
            shadow-lg hover:opacity-90 hover:scale-[1.02]
            active:scale-95 transition"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
