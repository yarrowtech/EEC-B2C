import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

export default function AddTopic() {
    const [subjects, setSubjects] = useState([]);
    const [subject, setSubject] = useState("");
    const [name, setName] = useState("");
    const [data, setData] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState("");
    const user = JSON.parse(localStorage.getItem("user"));

    useEffect(() => {
        loadSubjects();
        loadTopics();
    }, []);

    const loadSubjects = async () => {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/subject`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
        });
        setSubjects(res.data);
    };

    const loadTopics = async () => {
        const subRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/subject`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
        });

        const subjects = subRes.data;
        const final = [];

        for (const s of subjects) {
            const tRes = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/topic/${s._id}`,
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
                }
            );

            final.push({ subjectName: s.name, subjectId: s._id, topics: tRes.data });
        }

        setData(final);
    };

    const submit = async () => {
        await axios.post(
            `${import.meta.env.VITE_API_URL}/api/topic`,
            { name, subject },
            {
                headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
            }
        );

        toast.success("Topic Added");
        setName("");
        loadTopics();
    };

    const startEdit = (t) => {
        setEditingId(t._id);
        setEditName(t.name);
    };

    const saveEdit = async () => {
        await axios.put(
            `${import.meta.env.VITE_API_URL}/api/topic/${editingId}`,
            { name: editName },
            {
                headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
            }
        );
        setEditingId(null);
        loadTopics();
    };

    const deleteTopic = async (id) => {
        if (!confirm("Delete this topic?")) return;

        await axios.delete(`${import.meta.env.VITE_API_URL}/api/topic/${id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
        });

        loadTopics();
    };

    return (
        <div className="p-6">
            <ToastContainer />
            {/* ---------- Page Title ---------- */}
            <h2 className="text-2xl font-semibold mb-6 text-slate-800">Manage Topics</h2>

            {/* ---------- Add Topic Card ---------- */}
            <div className="bg-white shadow-sm rounded-xl border border-slate-200 p-6 mb-10">
                <h3 className="text-lg font-semibold mb-4 text-slate-700">Add New Topic</h3>

                {/* Select + Input */}
                <div className="flex md:flex-row flex-col gap-3">

                    <select
                        className="border border-slate-300 p-2 rounded-lg w-full md:w-1/3 focus:ring-2 focus:ring-blue-400 outline-none"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                    >
                        <option value="">Select Subject</option>
                        {subjects.map((s) => (
                            <option key={s._id} value={s._id}>
                                {s.name}
                            </option>
                        ))}
                    </select>

                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="border border-slate-300 p-2 rounded-lg w-full md:w-1/2 focus:ring-2 focus:ring-blue-400 outline-none"
                        placeholder="Enter Topic Name"
                    />

                    <button
                        onClick={submit}
                        className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition w-fit"
                    >
                        Save Topic
                    </button>
                </div>
            </div>

            {/* ---------- Topic List (Grouped by Subject) ---------- */}
            <div className="bg-white shadow-sm rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold mb-4 text-slate-700">Topics Inside Subjects</h3>

                {data.map((row, idx) => (
                    <div key={idx} className="mb-8 bg-slate-50 border border-slate-200 rounded-lg p-5">

                        {/* Subject Title */}
                        <h3 className="font-semibold text-lg mb-3 text-blue-700">
                            {row.subjectName}
                        </h3>

                        {/* Topics Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full border border-slate-200 rounded-lg overflow-hidden shadow-sm">
    <thead>
        <tr className="bg-slate-100 text-slate-700 text-sm">
            <th className="border p-3 w-12">#</th>
            <th className="border p-3 text-left">Topic</th>
            <th className="border p-3 text-left">Added By</th>
            <th className="border p-3 text-left">Time</th>
            <th className="border p-3 w-40 text-center">Actions</th>
        </tr>
    </thead>

    <tbody className="text-sm">
        {row.topics.map((topic, i) => (
            <tr key={topic._id} className="hover:bg-slate-50 transition">
                <td className="border p-3 text-center">{i + 1}</td>

                <td className="border p-3">
                    {editingId === topic._id ? (
                        <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="border border-slate-300 p-1 rounded w-full focus:ring-2 focus:ring-blue-400"
                        />
                    ) : (
                        <span className="font-medium text-slate-700">{topic.name}</span>
                    )}
                </td>

                {/* Added By */}
                <td className="border p-3">
                    {topic.createdBy?.name || "Unknown"}
                </td>

                {/* Time */}
                <td className="border p-3">
                    {new Date(topic.createdAt).toLocaleString()}
                </td>

                {/* Actions with Permission */}
                <td className="border p-3 text-center">
                    {(user.role === "admin" || topic.createdBy?._id === user.id) ? (
                        <>
                            {editingId === topic._id ? (
                                <button
                                    onClick={saveEdit}
                                    className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 mr-2"
                                >
                                    Save
                                </button>
                            ) : (
                                <button
                                    onClick={() => startEdit(topic)}
                                    className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-2"
                                >
                                    Edit
                                </button>
                            )}

                            <button
                                onClick={() => deleteTopic(topic._id)}
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

        {/* Empty State */}
        {row.topics.length === 0 && (
            <tr>
                <td
                    colSpan={5}
                    className="border p-3 text-center text-slate-500"
                >
                    No topics added under this subject
                </td>
            </tr>
        )}
    </tbody>
</table>

                        </div>

                    </div>
                ))}
            </div>
        </div>
    );
}
