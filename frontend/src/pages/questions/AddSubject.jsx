import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

export default function AddSubject() {
    const [name, setName] = useState("");
    const [subjects, setSubjects] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState("");
    const [page, setPage] = useState(1);
    const [limit] = useState(5); // 5 rows per page
    const totalPages = Math.ceil(subjects.length / limit);
    const currentData = subjects.slice((page - 1) * limit, page * limit);
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const user = JSON.parse(localStorage.getItem("user"));


    const loadSubjects = async () => {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/subject`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
        });
        setSubjects(res.data);
    };

    useEffect(() => {
        loadSubjects();
    }, []);

    const submit = async () => {
        await axios.post(
            `${import.meta.env.VITE_API_URL}/api/subject`,
            { name },
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
            }
        );

        toast.success("Subject Added");
        setName("");
        loadSubjects();
    };

    const startEdit = (sub) => {
        setEditingId(sub._id);
        setEditName(sub.name);
    };

    const saveEdit = async () => {
        await axios.put(
            `${import.meta.env.VITE_API_URL}/api/subject/${editingId}`,
            { name: editName },
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
            }
        );
        toast.success("Subject Updated");
        setEditingId(null);
        loadSubjects();
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
        <div className="p-6">
            <ToastContainer />
            {/* ---------- PAGE TITLE ---------- */}
            <h2 className="text-2xl font-semibold mb-6 text-slate-800">Manage Subjects</h2>

            {/* ---------- ADD SUBJECT CARD ---------- */}
            <div className="bg-white shadow-sm rounded-xl border border-slate-200 p-6 mb-8">
                <h3 className="text-lg font-semibold mb-4 text-slate-700">Add New Subject</h3>

                <div className="flex gap-3 items-center">
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="border border-slate-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-400 outline-none"
                        placeholder="Enter Subject Name"
                    />

                    <button
                        onClick={submit}
                        className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        Save
                    </button>
                </div>
            </div>

            {/* ---------- SUBJECT LIST CARD ---------- */}
            <div className="bg-white shadow-sm rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold mb-4 text-slate-700">All Subjects</h3>

                <div className="overflow-x-auto">
                    {/* ---------- SUBJECT TABLE WITH PAGINATION ---------- */}
                    <div className="overflow-x-auto">
                        <table className="w-full border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                            <thead>
                                <tr className="bg-slate-100 text-slate-700 text-sm">
                                    <th className="border p-3 w-12">#</th>
                                    <th className="border p-3 text-left">Subject</th>
                                    <th className="border p-3 text-left">Added By</th>
                                    <th className="border p-3 text-left">Time</th>
                                    <th className="border p-3 w-40 text-center">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="text-sm">

                                {currentData.map((s, i) => (
                                    <tr key={s._id} className="hover:bg-slate-50 transition">
                                        <td className="border p-3 text-center">
                                            {(page - 1) * limit + (i + 1)}
                                        </td>

                                        <td className="border p-3">
                                            <span className="font-medium text-slate-700">{s.name}</span>
                                        </td>

                                        <td className="border p-3">
                                            {s.createdBy?.name || "Unknown"}
                                        </td>

                                        <td className="border p-3">
                                            {new Date(s.createdAt).toLocaleString()}
                                        </td>

                                        <td className="border p-3 text-center">

                                            {user.role === "admin" || s.createdBy?._id === user.id ? (
                                                <>
                                                    {editingId === s._id ? (
                                                        <button className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 mr-2">
                                                            Save
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => startEdit(s)}
                                                            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-2"
                                                        >
                                                            Edit
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => confirmDelete(s._id)}
                                                        className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                                    >
                                                        Delete
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="text-xs font-semibold text-red-500">
                                                    Not Permitted
                                                </span>
                                            )}

                                        </td>


                                    </tr>
                                ))}

                                {subjects.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="border p-3 text-center text-slate-500">
                                            No subjects added yet
                                        </td>
                                    </tr>
                                )}

                            </tbody>
                        </table>
                    </div>

                    {/* ---------- PAGINATION ---------- */}
                    <div className="flex justify-between items-center mt-4">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                            className={`px-4 py-2 rounded-lg border ${page === 1
                                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                : "bg-white hover:bg-slate-100"
                                }`}
                        >
                            Previous
                        </button>

                        <span className="text-sm font-medium text-slate-700">
                            Page {page} of {totalPages}
                        </span>

                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(page + 1)}
                            className={`px-4 py-2 rounded-lg border ${page === totalPages
                                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                : "bg-white hover:bg-slate-100"
                                }`}
                        >
                            Next
                        </button>
                    </div>

                </div>
            </div>
            {showDeletePopup && (
                <div className="fixed inset-0 bg-black/50 bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white shadow-lg rounded-xl p-6 w-80 text-center">
                        <h3 className="text-lg font-semibold text-slate-800 mb-3">
                            Delete Subject?
                        </h3>

                        <p className="text-slate-600 mb-5">
                            Are you sure you want to delete this subject?
                            <br />All topics inside it will be deleted.
                        </p>

                        <div className="flex justify-center gap-3">
                            <button
                                onClick={() => setShowDeletePopup(false)}
                                className="px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
