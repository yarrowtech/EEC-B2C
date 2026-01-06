import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { Pencil, Trash2 } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AddClass() {
    const [name, setName] = useState("");
    const [classes, setClasses] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);

    const token = localStorage.getItem("jwt");

    /* ---------- FETCH ---------- */
    async function loadClasses() {
        try {
            const res = await fetch(`${API}/api/classes`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setClasses(Array.isArray(data) ? data : []);
        } catch (err) {
            toast.error("Failed to load classes");
        }
    }

    useEffect(() => {
        loadClasses();
    }, []);

    /* ---------- SUBMIT ---------- */
    async function handleSubmit(e) {
        e.preventDefault();
        if (!name.trim()) return toast.warn("Class name required");

        setLoading(true);
        try {
            const url = editingId
                ? `${API}/api/classes/${editingId}`
                : `${API}/api/classes`;

            const method = editingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name }),
            });

            if (!res.ok) throw new Error();

            toast.success(editingId ? "Class updated" : "Class added");
            setName("");
            setEditingId(null);
            loadClasses();
        } catch {
            toast.error("Operation failed");
        } finally {
            setLoading(false);
        }
    }

    /* ---------- DELETE ---------- */
    async function remove(id) {
        if (!confirm("Delete this class?")) return;

        try {
            await fetch(`${API}/api/classes/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Class deleted");
            loadClasses();
        } catch {
            toast.error("Delete failed");
        }
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <ToastContainer />

            {/* Enhanced Header */}
            <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 rounded-2xl p-8 shadow-sm border border-indigo-100">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
                    <div className="p-3 rounded-xl shadow-md">
                        <span className="text-3xl">🎓</span>
                    </div>
                    Manage Classes
                </h1>
                <p className="text-gray-600 mt-2 text-lg">
                    Add, edit, and manage educational classes
                </p>
            </div>

            {/* ADD / EDIT FORM - Enhanced */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                    <span className="text-xl">{editingId ? "" : ""}</span>
                    {editingId ? "Edit Class" : "Add New Class"}
                </h3>
                <form
                    onSubmit={handleSubmit}
                    className="flex gap-3 max-w-2xl"
                >
                    <input
                        className="flex-1 rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                        placeholder="e.g., Class 10, Grade 5, Standard 12"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <button
                        disabled={loading}
                        className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Processing..." : editingId ? "Update Class" : "Add Class"}
                    </button>
                    {editingId && (
                        <button
                            type="button"
                            onClick={() => {
                                setEditingId(null);
                                setName("");
                            }}
                            className="px-4 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-all"
                        >
                            Cancel
                        </button>
                    )}
                </form>
            </div>

            {/* LIST - Enhanced */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <span className="text-xl"></span>
                        All Classes ({classes.length})
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 text-left">
                            <tr>
                                <th className="p-4 font-semibold text-gray-700 border-b-2 border-gray-200">Class Name</th>
                                <th className="p-4 font-semibold text-gray-700 border-b-2 border-gray-200">Created By</th>
                                <th className="p-4 font-semibold text-gray-700 border-b-2 border-gray-200 w-32 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {classes.map((c, index) => (
                                <tr key={c._id} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-sm font-bold flex items-center justify-center shadow">
                                                {index + 1}
                                            </div>
                                            <span className="font-semibold text-gray-800">{c.name}</span>
                                        </div>
                                    </td>

                                    <td className="p-4 text-sm text-gray-600">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-medium text-gray-800">{c.createdBy?.name || "Unknown"}</span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(c.createdAt).toLocaleString("en-US", {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "2-digit",
                                                    hour: "numeric",
                                                    minute: "2-digit",
                                                    hour12: true,
                                                })}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="p-4">
                                        <div className="flex gap-2 justify-center">
                                            <button
                                                onClick={() => {
                                                    setName(c.name);
                                                    setEditingId(c._id);
                                                }}
                                                className="p-2 rounded-lg bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 hover:from-yellow-200 hover:to-amber-200 transition-all shadow-sm hover:shadow-md"
                                                title="Edit"
                                            >
                                                <Pencil size={16} />
                                            </button>

                                            <button
                                                onClick={() => remove(c._id)}
                                                className="p-2 rounded-lg bg-gradient-to-r from-red-100 to-pink-100 text-red-700 hover:from-red-200 hover:to-pink-200 transition-all shadow-sm hover:shadow-md"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {classes.length === 0 && (
                                <tr>
                                    <td
                                        colSpan="3"
                                        className="p-12 text-center"
                                    >
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="text-6xl">📚</div>
                                            <p className="text-gray-500 font-medium">No classes added yet</p>
                                            <p className="text-sm text-gray-400">Start by adding your first class above</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
