import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

export default function AddTopic() {
    const [boards, setBoards] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [board, setBoard] = useState("");
    const [classId, setClassId] = useState("");
    const [subject, setSubject] = useState("");
    const [name, setName] = useState("");
    const [data, setData] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState("");
    const [editSubject, setEditSubject] = useState("");
    const [editBoard, setEditBoard] = useState("");
    const [editClass, setEditClass] = useState("");
    const user = JSON.parse(localStorage.getItem("user"));

    useEffect(() => {
        loadBoards();
        loadClasses();
        loadTopics();
    }, []);

    // Load subjects when board or class changes
    useEffect(() => {
        if (board && classId) {
            loadSubjects(board, classId);
            setSubject(""); // Reset subject when board/class changes
        } else {
            setSubjects([]);
            setSubject("");
        }
    }, [board, classId]);

    const loadBoards = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/boards`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
            });
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
            setClasses(res.data);
        } catch (err) {
            console.error("Failed to load classes:", err);
            toast.error("Failed to load classes");
        }
    };

    const loadSubjects = async (boardId = "", classId = "") => {
        try {
            let url = `${import.meta.env.VITE_API_URL}/api/subject`;
            const params = [];
            if (boardId) params.push(`board=${boardId}`);
            if (classId) params.push(`class=${classId}`);
            if (params.length > 0) url += `?${params.join("&")}`;

            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
            });
            setSubjects(res.data);
        } catch (err) {
            console.error("Failed to load subjects:", err);
        }
    };

    const loadTopics = async () => {
        try {
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

                final.push({
                    subjectName: s.name,
                    subjectId: s._id,
                    boardName: s.board?.name,
                    className: s.class?.name,
                    topics: tRes.data
                });
            }

            setData(final);
        } catch (err) {
            console.error("Failed to load topics:", err);
        }
    };

    const submit = async () => {
        if (!name || !subject || !board || !classId) {
            toast.error("Please fill all fields");
            return;
        }

        try {
            await axios.post(
                `${import.meta.env.VITE_API_URL}/api/topic`,
                { name, subject, board, class: classId },
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
                }
            );

            toast.success("Topic Added");
            setName("");
            setSubject("");
            setBoard("");
            setClassId("");
            loadTopics();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to add topic");
        }
    };

    const startEdit = (t, subjectData) => {
        setEditingId(t._id);
        setEditName(t.name);
        setEditSubject(subjectData.subjectId);
        setEditBoard(t.board?._id || "");
        setEditClass(t.class?._id || "");
    };

    const saveEdit = async () => {
        if (!editName || !editSubject || !editBoard || !editClass) {
            toast.error("Please fill all fields");
            return;
        }

        try {
            await axios.put(
                `${import.meta.env.VITE_API_URL}/api/topic/${editingId}`,
                { name: editName, subject: editSubject, board: editBoard, class: editClass },
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
                }
            );
            toast.success("Topic Updated");
            setEditingId(null);
            loadTopics();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update topic");
        }
    };

    const deleteTopic = async (id) => {
        if (!confirm("Delete this topic?")) return;

        await axios.delete(`${import.meta.env.VITE_API_URL}/api/topic/${id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
        });

        loadTopics();
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8">
            <ToastContainer />

            {/* Enhanced Header */}
            <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 rounded-2xl p-8 shadow-sm border border-purple-100">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
                    <div className="p-3 bg-white rounded-xl shadow-md">
                        <span className="text-3xl"></span>
                    </div>
                    Manage Topics
                </h2>
                <p className="text-gray-600 mt-2 text-lg">
                    Add, edit, and manage topics for your subjects
                </p>
            </div>

            {/* ---------- Add Topic Card - Enhanced ---------- */}
            <div className="bg-white shadow-md rounded-2xl border border-gray-100 p-6">
                <h3 className="text-lg font-semibold mb-6 text-gray-800 flex items-center gap-2">
                    <span className="text-xl"></span>
                    Add New Topic
                </h3>

                {/* Board → Class → Subject → Topic (Cascading Flow) */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Step 1: Select Board */}
                    <select
                        value={board}
                        onChange={(e) => {
                            setBoard(e.target.value);
                            setClassId("");
                            setSubject("");
                            setName("");
                        }}
                        className="border-2 border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-500 outline-none transition-all"
                    >
                        <option value=""> Select Board</option>
                        {boards.map((b) => (
                            <option key={b._id} value={b._id}>
                                {b.name}
                            </option>
                        ))}
                    </select>

                    {/* Step 2: Select Class */}
                    <select
                        value={classId}
                        onChange={(e) => {
                            setClassId(e.target.value);
                            setSubject("");
                            setName("");
                        }}
                        disabled={!board}
                        className={`border-2 border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-500 outline-none transition-all ${!board ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                    >
                        <option value=""> Select Class</option>
                        {classes.map((c) => (
                            <option key={c._id} value={c._id}>
                                {c.name}
                            </option>
                        ))}
                    </select>

                    {/* Step 3: Select Subject (filtered by board & class) */}
                    <select
                        className={`border-2 border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-500 outline-none transition-all ${!board || !classId ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        disabled={!board || !classId}
                    >
                        <option value=""> Select Subject</option>
                        {subjects.map((s) => (
                            <option key={s._id} value={s._id}>
                                {s.name}
                            </option>
                        ))}
                    </select>

                    {/* Step 4: Enter Topic Name */}
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={!subject}
                        className={`border-2 border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-500 outline-none transition-all ${!subject ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                        placeholder=" Enter Topic Name"
                    />

                    <button
                        onClick={submit}
                        disabled={!name || !subject || !board || !classId}
                        className={`px-6 py-3 rounded-xl transition-all font-semibold shadow-md ${!name || !subject || !board || !classId ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 hover:shadow-lg'}`}
                    >
                        Save Topic
                    </button>
                </div>
            </div>

            {/* ---------- Topic List (Grouped by Subject) - Enhanced ---------- */}
            <div className="bg-white shadow-md rounded-2xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <span className="text-xl"></span>
                        Topics Inside Subjects ({data.reduce((acc, curr) => acc + curr.topics.length, 0)})
                    </h3>
                </div>

                <div className="p-6 space-y-6">
                    {data.map((row, idx) => (
                        <div key={idx} className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">

                            {/* Subject Title with Board & Class */}
                            <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-purple-200">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white text-lg font-bold flex items-center justify-center shadow-md">
                                    {idx + 1}
                                </div>
                                <h3 className="font-bold text-xl text-purple-700">
                                    {row.subjectName}
                                </h3>
                                <span className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-semibold border border-orange-200">
                                    {row.boardName || "N/A"}
                                </span>
                                <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200">
                                    {row.className || "N/A"}
                                </span>
                                <span className="ml-auto px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold">
                                    {row.topics.length} Topic{row.topics.length !== 1 ? 's' : ''}
                                </span>
                            </div>

                            {/* Topics Table */}
                            <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
                                <table className="w-full">
    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 text-left">
        <tr>
            <th className="p-4 font-semibold text-gray-700 border-b-2 border-gray-200 w-16 text-center">#</th>
            <th className="p-4 font-semibold text-gray-700 border-b-2 border-gray-200">Board</th>
            <th className="p-4 font-semibold text-gray-700 border-b-2 border-gray-200">Class</th>
            <th className="p-4 font-semibold text-gray-700 border-b-2 border-gray-200">Topic</th>
            <th className="p-4 font-semibold text-gray-700 border-b-2 border-gray-200">Added By</th>
            <th className="p-4 font-semibold text-gray-700 border-b-2 border-gray-200">Time</th>
            <th className="p-4 font-semibold text-gray-700 border-b-2 border-gray-200 w-48 text-center">Actions</th>
        </tr>
    </thead>

    <tbody className="text-sm">
        {row.topics.map((topic, i) => (
            <tr key={topic._id} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all">
                <td className="p-4 text-center">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-pink-500 text-white text-sm font-bold flex items-center justify-center shadow mx-auto">
                        {i + 1}
                    </div>
                </td>

                {/* Board Column */}
                <td className="p-4">
                    {editingId === topic._id ? (
                        <select
                            value={editBoard}
                            onChange={(e) => setEditBoard(e.target.value)}
                            className="border-2 border-gray-300 p-2 rounded-lg w-full text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                        >
                            <option value="">Select Board</option>
                            {boards.map((b) => (
                                <option key={b._id} value={b._id}>{b.name}</option>
                            ))}
                        </select>
                    ) : (
                        <span className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-semibold">
                            {topic.board?.name || "N/A"}
                        </span>
                    )}
                </td>

                {/* Class Column */}
                <td className="p-4">
                    {editingId === topic._id ? (
                        <select
                            value={editClass}
                            onChange={(e) => setEditClass(e.target.value)}
                            className="border-2 border-gray-300 p-2 rounded-lg w-full text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                        >
                            <option value="">Select Class</option>
                            {classes.map((c) => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </select>
                    ) : (
                        <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">
                            {topic.class?.name || "N/A"}
                        </span>
                    )}
                </td>

                {/* Topic Name Column */}
                <td className="p-4">
                    {editingId === topic._id ? (
                        <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="border-2 border-gray-300 p-2 rounded-lg w-full focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                        />
                    ) : (
                        <span className="font-semibold text-gray-800">{topic.name}</span>
                    )}
                </td>

                {/* Added By */}
                <td className="p-4 text-gray-700">
                    {topic.createdBy?.name || "Unknown"}
                </td>

                {/* Time */}
                <td className="p-4 text-xs text-gray-500">
                    {new Date(topic.createdAt).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                    })}
                </td>

                {/* Actions with Permission */}
                <td className="p-4">
                    {(user.role === "admin" || topic.createdBy?._id === user.id) ? (
                        <div className="flex gap-2 justify-center">
                            {editingId === topic._id ? (
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
                                        onClick={() => startEdit(topic, row)}
                                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 shadow-sm hover:shadow-md transition-all font-semibold text-xs"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => deleteTopic(topic._id)}
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

        {/* Empty State */}
        {row.topics.length === 0 && (
            <tr>
                <td
                    colSpan={7}
                    className="p-12 text-center"
                >
                    <div className="flex flex-col items-center gap-3">
                        <div className="text-6xl">📝</div>
                        <p className="text-gray-500 font-medium">No topics added under this subject</p>
                        <p className="text-sm text-gray-400">Add topics using the form above</p>
                    </div>
                </td>
            </tr>
        )}
    </tbody>
</table>
                            </div>
                        </div>
                    ))}

                    {data.length === 0 && (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">📚</div>
                            <p className="text-gray-500 font-medium">No subjects with topics yet</p>
                            <p className="text-sm text-gray-400">Add topics to subjects using the form above</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
