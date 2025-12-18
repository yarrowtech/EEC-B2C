import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { Pencil, Trash2 } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AddBoard() {
    const [name, setName] = useState("");
    const [boards, setBoards] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);

    const token = localStorage.getItem("jwt");

    async function loadBoards() {
        try {
            const res = await fetch(`${API}/api/boards`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setBoards(Array.isArray(data) ? data : []);
        } catch {
            toast.error("Failed to load boards");
        }
    }

    useEffect(() => {
        loadBoards();
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!name.trim()) return toast.warn("Board name required");

        setLoading(true);
        try {
            const url = editingId
                ? `${API}/api/boards/${editingId}`
                : `${API}/api/boards`;

            const method = editingId ? "PUT" : "POST";

            await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name }),
            });

            toast.success(editingId ? "Board updated" : "Board added");
            setName("");
            setEditingId(null);
            loadBoards();
        } catch {
            toast.error("Operation failed");
        } finally {
            setLoading(false);
        }
    }

    async function remove(id) {
        if (!confirm("Delete this board?")) return;

        await fetch(`${API}/api/boards/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });

        toast.success("Board deleted");
        loadBoards();
    }

    return (
        <div className="space-y-6 p-6">
            <ToastContainer />

            <h1 className="text-2xl font-bold text-slate-800">
                Manage Boards
            </h1>

            <form onSubmit={handleSubmit} className="flex gap-3 max-w-md">
                <input
                    className="flex-1 rounded-xl border px-4 py-2"
                    placeholder="CBSE"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <button
                    disabled={loading}
                    className="rounded-xl bg-indigo-600 text-white px-5 py-2 font-semibold"
                >
                    {editingId ? "Update" : "Add"}
                </button>
            </form>

            <div className="bg-white shadow border overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-200 text-left">
                        <tr>
                            <th className="p-3">Board</th>
                            <th className="p-3">Created By</th>
                            <th className="p-3 w-32">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {boards.map((b) => (
                            <tr
                                key={b._id}
                                className="border-t hover:bg-gray-50 transition"
                            >
                                <td className="p-3 font-medium text-gray-800">
                                    {b.name}
                                </td>

                                <td className="p-3 text-sm text-gray-600">
                                    <div className="flex flex-col">
                                        <span> {b.createdBy?.name || "_"} </span>
                                        <span>
                                            {new Date(b.createdAt).toLocaleString("en-US", {
                                                year: "numeric",
                                                month: "short",
                                                day: "2-digit",
                                                hour: "numeric",
                                                minute: "2-digit",
                                                second: "2-digit",
                                                hour12: true,
                                            })}
                                        </span>
                                    </div>
                                </td>

                                <td className="p-3 flex gap-2">
                                    <button
                                        onClick={() => {
                                            setName(b.name);
                                            setEditingId(b._id);
                                        }}
                                        className="p-2 rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition"
                                        title="Edit"
                                    >
                                        <Pencil size={16} />
                                    </button>

                                    <button
                                        onClick={() => remove(b._id)}
                                        className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {boards.length === 0 && (
                            <tr>
                                <td
                                    colSpan="3"
                                    className="p-4 text-center text-gray-500"
                                >
                                    No boards added yet
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
