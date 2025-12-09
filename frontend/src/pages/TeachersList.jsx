import React, { useMemo, useState, useEffect } from "react";
import { Eye, Pencil, X, Search, Users, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

function getUser() {
  try { return JSON.parse(localStorage.getItem("user") || "null"); }
  catch { return null; }
}

function getToken() {
  return localStorage.getItem("jwt") || "";
}

const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

export default function TeachersList() {
  const user = getUser();
  const role = String(user?.role || "").toLowerCase();

  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const totalPages = Math.ceil(rows.length / PAGE_SIZE);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, page]);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);

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
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      const data = await res.json();
      setRows(data.teachers || []);
      setPage(1); // reset to page 1 after search
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

      if (!res.ok) {
        alert(data.message || "Failed to create teacher.");
        return;
      }

      alert("Teacher created successfully!");
      setOpen(false);
      setForm({ name: "", email: "", phone: "", password: "" });

      load();
    } catch (err) {
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function updateTeacher() {
    try {
      setLoading(true);
      const token = getToken();

      const res = await fetch(`${API_BASE}/api/users/teachers/${selected._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Update failed.");
        return;
      }

      alert("Teacher updated!");
      setEditOpen(false);
      load();
    } catch (err) {
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteTeacher() {
    try {
      const token = getToken();

      const res = await fetch(`${API_BASE}/api/users/teachers/${selected._id}`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        }
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Delete failed.");
        return;
      }

      alert("Teacher deleted!");
      setDeleteOpen(false);
      load();
    } catch (err) {
      alert("Something went wrong.");
    }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between bg-white/70 backdrop-blur-xl p-4 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-400/30">
            <Users size={24} />
          </span>

          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Teachers</h1>
            <p className="text-sm text-slate-500">Manage teachers</p>
          </div>
        </div>

        {role === "admin" && (
          <button
            onClick={() => setOpen(true)}
            className="rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-5 py-2.5 text-sm text-white shadow-md shadow-purple-400/40 hover:opacity-90 transition-all"
          >
            + Add Teacher
          </button>
        )}
      </div>

      {/* Table Wrapper */}
      <div className="rounded-3xl bg-white/60 backdrop-blur-xl shadow-xl shadow-slate-300/30 p-6 space-y-4">

        {/* Search */}
        <div className="relative w-full md:w-96 mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-800" size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search teachers…"
            className="w-full rounded-xl border pl-10 pr-3 py-2.5 text-sm bg-white/80 backdrop-blur-sm shadow-md focus:ring-2 focus:ring-purple-400 transition-all"
          />
        </div>

        {/* Table */}
        <table className="min-w-full text-sm">
          <thead className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-left shadow-md shadow-purple-300/30">
            <tr>
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedRows.map((t, i) => (
              <tr
                key={t._id}
                className="bg-white/70 backdrop-blur-sm hover:bg-purple-50/70 transition-all border-b last:border-none"
              >
                <td className="px-4 py-3">{(page - 1) * PAGE_SIZE + i + 1}</td>
                <td className="px-4 py-3">{t.name}</td>
                <td className="px-4 py-3">{t.email}</td>
                <td className="px-4 py-3">{t.phone}</td>

                <td className="px-4 py-3 flex gap-3">

                  {/* Edit */}
                  <button
                    className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 shadow transition-all"
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
                  >
                    <Pencil size={16} />
                  </button>

                  {/* Delete */}
                  <button
                    className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 shadow transition-all"
                    onClick={() => {
                      setSelected(t);
                      setDeleteOpen(true);
                    }}
                  >
                    <Trash2 size={16} />
                  </button>

                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-6">
          {/* Prev Button */}
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border shadow bg-white hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft size={16} /> Prev
          </button>

          {/* Page Numbers */}
          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`px-4 py-2 rounded-xl border shadow ${
                  page === i + 1
                    ? "bg-purple-600 text-white"
                    : "bg-white hover:bg-slate-50"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {/* Next Button */}
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border shadow bg-white hover:bg-slate-50 disabled:opacity-40"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>

      </div>

      {/* ------------------ ADD TEACHER MODAL ------------------ */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-lg"
            onClick={() => setOpen(false)}
          />

          <div className="relative z-10 w-full max-w-md bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-400/40 p-6 space-y-4">

            <h2 className="text-xl font-semibold text-slate-800">
              Add Teacher
            </h2>

            <input
              className="w-full border rounded-xl px-3 py-2 bg-white/70 backdrop-blur-sm shadow focus:ring-2 focus:ring-purple-400"
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <input
              className="w-full border rounded-xl px-3 py-2 bg-white/70 backdrop-blur-sm shadow"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <input
              className="w-full border rounded-xl px-3 py-2 bg-white/70 backdrop-blur-sm shadow"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />

            <input
              className="w-full border rounded-xl px-3 py-2 bg-white/70 backdrop-blur-sm shadow"
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-xl border bg-white text-slate-700 shadow hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                onClick={createTeacher}
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------ EDIT TEACHER MODAL ------------------ */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-lg"
            onClick={() => setEditOpen(false)}
          />

          <div className="relative z-10 w-full max-w-md bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-400/40 p-6 space-y-4 border">

            <h2 className="text-xl font-semibold text-slate-800">
              Edit Teacher
            </h2>

            <input
              className="w-full border rounded-xl px-3 py-2 bg-white/70 backdrop-blur-sm shadow"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full Name"
            />

            <input
              className="w-full border rounded-xl px-3 py-2 bg-white/70 backdrop-blur-sm shadow"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email"
            />

            <input
              className="w-full border rounded-xl px-3 py-2 bg-white/70 backdrop-blur-sm shadow"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Phone"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                className="px-4 py-2 rounded-xl border bg-white text-slate-700 shadow hover:bg-slate-100"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </button>

              <button
                onClick={updateTeacher}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow hover:opacity-90"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------ DELETE CONFIRMATION MODAL ------------------ */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-lg"
            onClick={() => setDeleteOpen(false)}
          />

          <div className="relative z-10 w-full max-w-sm bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-400/40 p-6 space-y-4 border">

            <h2 className="text-xl font-semibold text-slate-800">
              Delete Teacher?
            </h2>

            <p className="text-sm text-slate-600">
              This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                className="px-4 py-2 rounded-xl border bg-white text-slate-700 shadow hover:bg-slate-100"
                onClick={() => setDeleteOpen(false)}
              >
                Cancel
              </button>

              <button
                onClick={deleteTeacher}
                className="px-5 py-2 rounded-xl bg-red-600 text-white shadow hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
