import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

export default function AddSubject() {
    const [name, setName] = useState("");
    const [board, setBoard] = useState("");
    const [classId, setClassId] = useState("");
    const [subjects, setSubjects] = useState([]);
    const [boards, setBoards] = useState([]);
    const [classes, setClasses] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState("");
    const [editBoard, setEditBoard] = useState("");
    const [editClass, setEditClass] = useState("");
    const [page, setPage] = useState(1);
    const [limit] = useState(5); // 5 rows per page
    const totalPages = Math.ceil(subjects.length / limit);
    const currentData = subjects.slice((page - 1) * limit, page * limit);
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const user = JSON.parse(localStorage.getItem("user"));


    const loadBoards = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/boards`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
            });
            console.log("Boards loaded:", res.data);
            setBoards(res.data);
        } catch (err) {
            console.error("Failed to load boards:", err);
            toast.error("Failed to load boards");
        }
    };

    const loadClasses = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/classes`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
            });
            console.log("Classes loaded:", res.data);
            setClasses(res.data);
        } catch (err) {
            console.error("Failed to load classes:", err);
            toast.error("Failed to load classes");
        }
    };

    const loadSubjects = async () => {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/subject`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
        });
        setSubjects(res.data);
    };

    useEffect(() => {
        loadBoards();
        loadClasses();
        loadSubjects();
    }, []);

    const submit = async () => {
        if (!name || !board || !classId) {
            toast.error("Please fill all fields");
            return;
        }

        try {
            await axios.post(
                `${import.meta.env.VITE_API_URL}/api/subject`,
                { name, board, class: classId },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                    },
                }
            );

            toast.success("Subject Added");
            setName("");
            setBoard("");
            setClassId("");
            loadSubjects();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to add subject");
        }
    };

    const startEdit = (sub) => {
        setEditingId(sub._id);
        setEditName(sub.name);
        setEditBoard(sub.board?._id || "");
        setEditClass(sub.class?._id || "");
    };

    const saveEdit = async () => {
        if (!editName || !editBoard || !editClass) {
            toast.error("Please fill all fields");
            return;
        }

        try {
            await axios.put(
                `${import.meta.env.VITE_API_URL}/api/subject/${editingId}`,
                { name: editName, board: editBoard, class: editClass },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                    },
                }
            );
            toast.success("Subject Updated");
            setEditingId(null);
            loadSubjects();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update subject");
        }
    };

    const confirmDelete = (id) => {
        setDeleteId(id);
        setShowDeletePopup(true);
    };

    const handleDelete = async () => {
        try {
            await axios.delete(
                `${import.meta.env.VITE_API_URL}/api/subject/${deleteId}`,
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
                }
            );

            toast.success("Subject deleted successfully!");
            setShowDeletePopup(false);
            loadSubjects();
        } catch (err) {
            toast.error("Failed to delete subject");
        }
    };


    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8">
            <ToastContainer />

            {/* Enhanced Header */}
            <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 rounded-2xl p-8 shadow-sm border border-green-100">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-3">
                    <div className="p-3 bg-white rounded-xl shadow-md">
                        <span className="text-3xl"></span>
                    </div>
                    Manage Subjects
                </h2>
                <p className="text-gray-600 mt-2 text-lg">
                    Add, edit, and manage subjects for different boards and classes
                </p>
            </div>

            {/* ---------- ADD SUBJECT CARD - Enhanced ---------- */}
            <div className="bg-white shadow-md rounded-2xl border border-gray-100 p-6">
                <h3 className="text-lg font-semibold mb-6 text-gray-800 flex items-center gap-2">
                    <span className="text-xl"></span>
                    Add New Subject
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <select
                        value={board}
                        onChange={(e) => setBoard(e.target.value)}
                        className="border-2 border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-green-500 outline-none transition-all"
                    >
                        <option value="">Select Board</option>
                        {boards.map((b) => (
                            <option key={b._id} value={b._id}>
                                {b.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={classId}
                        onChange={(e) => setClassId(e.target.value)}
                        className="border-2 border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-green-500 outline-none transition-all"
                    >
                        <option value="">Select Class</option>
                        {classes.map((c) => (
                            <option key={c._id} value={c._id}>
                                {c.name}
                            </option>
                        ))}
                    </select>

                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="border-2 border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-green-500 outline-none transition-all"
                        placeholder="Enter Subject Name"
                    />

                    <button
                        onClick={submit}
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg font-semibold"
                    >
                        Save Subject
                    </button>
                </div>
            </div>

            {/* ---------- SUBJECT LIST CARD - Enhanced ---------- */}
            <div className="bg-white shadow-md rounded-2xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <span className="text-xl"></span>
                        All Subjects ({subjects.length})
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    {/* ---------- SUBJECT TABLE WITH PAGINATION ---------- */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 text-left">
                                <tr>
                                    <th className="p-4 font-semibold text-gray-700 border-b-2 border-gray-200 w-16 text-center">#</th>
                                    <th className="p-4 font-semibold text-gray-700 border-b-2 border-gray-200">Board</th>
                                    <th className="p-4 font-semibold text-gray-700 border-b-2 border-gray-200">Class</th>
                                    <th className="p-4 font-semibold text-gray-700 border-b-2 border-gray-200">Subject</th>
                                    <th className="p-4 font-semibold text-gray-700 border-b-2 border-gray-200">Added By</th>
                                    <th className="p-4 font-semibold text-gray-700 border-b-2 border-gray-200">Time</th>
                                    <th className="p-4 font-semibold text-gray-700 border-b-2 border-gray-200 w-48 text-center">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="text-sm">

                                {currentData.map((s, i) => (
                                    <tr key={s._id} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all">
                                        <td className="p-4 text-center">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 text-white text-sm font-bold flex items-center justify-center shadow mx-auto">
                                                {(page - 1) * limit + (i + 1)}
                                            </div>
                                        </td>

                                        <td className="p-4">
                                            {editingId === s._id ? (
                                                <select
                                                    value={editBoard}
                                                    onChange={(e) => setEditBoard(e.target.value)}
                                                    className="border-2 border-gray-300 p-2 rounded-lg w-full text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                                                >
                                                    <option value="">Select Board</option>
                                                    {boards.map((b) => (
                                                        <option key={b._id} value={b._id}>
                                                            {b.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-semibold">
                                                    {s.board?.name || "N/A"}
                                                </span>
                                            )}
                                        </td>

                                        <td className="p-4">
                                            {editingId === s._id ? (
                                                <select
                                                    value={editClass}
                                                    onChange={(e) => setEditClass(e.target.value)}
                                                    className="border-2 border-gray-300 p-2 rounded-lg w-full text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                                                >
                                                    <option value="">Select Class</option>
                                                    {classes.map((c) => (
                                                        <option key={c._id} value={c._id}>
                                                            {c.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">
                                                    {s.class?.name || "N/A"}
                                                </span>
                                            )}
                                        </td>

                                        <td className="p-4">
                                            {editingId === s._id ? (
                                                <input
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="border-2 border-gray-300 p-2 rounded-lg w-full focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                                                />
                                            ) : (
                                                <span className="font-semibold text-gray-800">{s.name}</span>
                                            )}
                                        </td>

                                        <td className="p-4 text-gray-700">
                                            {s.createdBy?.name || "Unknown"}
                                        </td>

                                        <td className="p-4 text-xs text-gray-500">
                                            {new Date(s.createdAt).toLocaleString("en-US", {
                                                year: "numeric",
                                                month: "short",
                                                day: "2-digit",
                                                hour: "numeric",
                                                minute: "2-digit",
                                                hour12: true,
                                            })}
                                        </td>

                                        <td className="p-4">
                                            {user.role === "admin" || s.createdBy?._id === user.id ? (
                                                <div className="flex gap-2 justify-center">
                                                    {editingId === s._id ? (
                                                        <>
                                                            <button
                                                                onClick={saveEdit}
                                                                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 shadow-sm hover:shadow-md transition-all font-semibold text-xs"
                                                            >
                                                                ✓ Save
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingId(null)}
                                                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-semibold text-xs"
                                                            >
                                                                ✕ Cancel
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => startEdit(s)}
                                                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 shadow-sm hover:shadow-md transition-all font-semibold text-xs"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => confirmDelete(s._id)}
                                                                className="px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 shadow-sm hover:shadow-md transition-all font-semibold text-xs"
                                                            >
                                                                Delete
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs font-semibold text-red-500 px-3 py-1.5 bg-red-50 rounded-lg">
                                                    Not Permitted
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}

                                {subjects.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="text-6xl">📚</div>
                                                <p className="text-gray-500 font-medium">No subjects added yet</p>
                                                <p className="text-sm text-gray-400">Start by adding your first subject above</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}

                            </tbody>
                        </table>
                    </div>

                    {/* ---------- PAGINATION - Enhanced ---------- */}
                    <div className="flex justify-between items-center p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-gray-200">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                            className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${page === 1
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg"
                                }`}
                        >
                            ← Previous
                        </button>

                        <span className="text-sm font-bold text-gray-700 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200">
                            Page {page} of {totalPages || 1}
                        </span>

                        <button
                            disabled={page === totalPages || totalPages === 0}
                            onClick={() => setPage(page + 1)}
                            className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${page === totalPages || totalPages === 0
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg"
                                }`}
                        >
                            Next →
                        </button>
                    </div>

                </div>
            </div>

            {/* Enhanced Delete Confirmation Popup */}
            {showDeletePopup && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white shadow-2xl rounded-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-gradient-to-r from-red-500 to-pink-500 p-6 text-white">
                            <h3 className="text-2xl font-bold flex items-center gap-2">
                                <span className="text-3xl">⚠️</span>
                                Delete Subject?
                            </h3>
                        </div>

                        <div className="p-6">
                            <p className="text-gray-700 mb-2 text-lg">
                                Are you sure you want to delete this subject?
                            </p>
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                                <p className="text-red-800 font-semibold text-sm">
                                    ⚠️ Warning: All topics inside it will be permanently deleted.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 p-6 bg-gray-50 border-t border-gray-200">
                            <button
                                onClick={() => setShowDeletePopup(false)}
                                className="flex-1 px-5 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition-all"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleDelete}
                                className="flex-1 px-5 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 font-semibold shadow-md hover:shadow-lg transition-all"
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
