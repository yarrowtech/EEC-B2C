import React, { useEffect, useMemo, useState } from "react";
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
    const [shortDescription, setShortDescription] = useState("");
    const [topicImage, setTopicImage] = useState("");
    const [uploadingImage, setUploadingImage] = useState(false);
    const [data, setData] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState("");
    const [editSubject, setEditSubject] = useState("");
    const [editBoard, setEditBoard] = useState("");
    const [editClass, setEditClass] = useState("");
    const [editShortDescription, setEditShortDescription] = useState("");
    const [editTopicImage, setEditTopicImage] = useState("");
    const [editUploadingImage, setEditUploadingImage] = useState(false);
    const [filterBoard, setFilterBoard] = useState("");
    const [filterClass, setFilterClass] = useState("");
    const [filterSubject, setFilterSubject] = useState("");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user?.id || user?._id || "";
    const userRole = String(user?.role || "").toLowerCase();
    const isTeacher = userRole === "teacher";
    const isAdmin = userRole === "admin";
    const API = import.meta.env.VITE_API_URL;
    const headers = { Authorization: `Bearer ${localStorage.getItem("jwt")}` };

    useEffect(() => {
        loadBoards();
        loadClasses();
        loadTopics();
    }, []);

    // Re-fetch whenever this tab/page regains focus, so a topic approved or
    // rejected elsewhere (e.g. the admin Topic Review page) shows its latest
    // status here without needing a manual reload.
    useEffect(() => {
        const handleFocus = () => loadTopics();
        const handleVisibility = () => {
            if (document.visibilityState === "visible") loadTopics();
        };
        window.addEventListener("focus", handleFocus);
        document.addEventListener("visibilitychange", handleVisibility);
        return () => {
            window.removeEventListener("focus", handleFocus);
            document.removeEventListener("visibilitychange", handleVisibility);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            const res = await axios.get(`${API}/api/boards`, { headers });
            setBoards(res.data);
        } catch (err) {
            console.error("Failed to load boards:", err);
            toast.error("Failed to load boards");
        }
    };

    const loadClasses = async () => {
        try {
            const res = await axios.get(`${API}/api/classes`, { headers });
            setClasses(res.data);
        } catch (err) {
            console.error("Failed to load classes:", err);
            toast.error("Failed to load classes");
        }
    };

    const loadSubjects = async (boardId = "", classId = "") => {
        try {
            let url = `${API}/api/subject`;
            const params = [];
            if (boardId) params.push(`board=${boardId}`);
            if (classId) params.push(`class=${classId}`);
            if (params.length > 0) url += `?${params.join("&")}`;

            const res = await axios.get(url, { headers });
            setSubjects(res.data);
        } catch (err) {
            console.error("Failed to load subjects:", err);
        }
    };

    const loadTopics = async () => {
        try {
            const subRes = await axios.get(`${API}/api/subject`, { headers });

            const subjectRows = subRes.data;
            const final = [];

            for (const s of subjectRows) {
                const tRes = await axios.get(
                    `${API}/api/topic/${s._id}?manage=1`,
                    { headers }
                );
                const topics = tRes.data || [];

                final.push({
                    subjectName: s.name,
                    subjectId: s._id,
                    boardId: s.board?._id || "",
                    boardName: s.board?.name,
                    classId: s.class?._id || "",
                    className: s.class?.name,
                    topics
                });
            }

            setData(final);
        } catch (err) {
            console.error("Failed to load topics:", err);
        }
    };

    const uploadTopicImage = async (file) => {
        if (!file) return "";
        if (!file.type?.startsWith("image/")) {
            throw new Error("Please select a valid image file");
        }

        const formData = new FormData();
        formData.append("image", file);

        const res = await fetch(`${API}/api/upload/image`, {
            method: "POST",
            body: formData,
        });
        const result = await res.json();
        if (!res.ok || !result?.url) {
            throw new Error(result?.message || "Image upload failed");
        }
        return result.url;
    };

    const handleAddTopicImage = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            const url = await uploadTopicImage(file);
            setTopicImage(url);
            toast.success("Topic image uploaded");
        } catch (err) {
            toast.error(err?.message || "Failed to upload image");
        } finally {
            setUploadingImage(false);
            e.target.value = "";
        }
    };

    const handleEditTopicImage = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setEditUploadingImage(true);
        try {
            const url = await uploadTopicImage(file);
            setEditTopicImage(url);
            toast.success("Topic image uploaded");
        } catch (err) {
            toast.error(err?.message || "Failed to upload image");
        } finally {
            setEditUploadingImage(false);
            e.target.value = "";
        }
    };

    const submit = async () => {
        if (!name || !subject || !board || !classId) {
            toast.error("Please fill all fields");
            return;
        }

        try {
            await axios.post(
                `${API}/api/topic`,
                {
                    name,
                    subject,
                    board,
                    class: classId,
                    shortDescription: shortDescription.trim(),
                    topicImage,
                },
                { headers }
            );

            toast.success("Topic added");
            setName("");
            setSubject("");
            setBoard("");
            setClassId("");
            setShortDescription("");
            setTopicImage("");
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
        setEditShortDescription(t.shortDescription || "");
        setEditTopicImage(t.topicImage || "");
    };

    const saveEdit = async () => {
        if (!editName || !editSubject || !editBoard || !editClass) {
            toast.error("Please fill all fields");
            return;
        }

        try {
            await axios.put(
                `${API}/api/topic/${editingId}`,
                {
                    name: editName,
                    subject: editSubject,
                    board: editBoard,
                    class: editClass,
                    shortDescription: editShortDescription.trim(),
                    topicImage: editTopicImage,
                },
                { headers }
            );
            toast.success("Topic updated");
            setEditingId(null);
            loadTopics();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update topic");
        }
    };

    const deleteTopic = async (id) => {
        if (!confirm("Delete this topic?")) return;
        try {
            await axios.delete(`${API}/api/topic/${id}`, { headers });
            toast.success("Topic deleted");
            loadTopics();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete topic");
        }
    };

    const filterSubjectOptions = useMemo(() => {
        const seen = new Set();
        const options = [];
        for (const row of data) {
            if (filterBoard && row.boardId !== filterBoard) continue;
            if (filterClass && row.classId !== filterClass) continue;
            if (seen.has(row.subjectId)) continue;
            seen.add(row.subjectId);
            options.push({ id: row.subjectId, name: row.subjectName });
        }
        return options;
    }, [data, filterBoard, filterClass]);

    const filteredData = useMemo(() => {
        return data.filter((row) => {
            if (filterBoard && row.boardId !== filterBoard) return false;
            if (filterClass && row.classId !== filterClass) return false;
            if (filterSubject && row.subjectId !== filterSubject) return false;
            return true;
        });
    }, [data, filterBoard, filterClass, filterSubject]);

    const hasActiveFilters = Boolean(filterBoard || filterClass || filterSubject);

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
            {(isTeacher || isAdmin) && (
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <textarea
                            value={shortDescription}
                            onChange={(e) => setShortDescription(e.target.value)}
                            disabled={!subject}
                            rows={3}
                            className={`border-2 border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-500 outline-none transition-all resize-none ${!subject ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                            placeholder="Short description of topic"
                        />
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-3">
                            <div className="flex items-center gap-3">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAddTopicImage}
                                    disabled={!subject || uploadingImage}
                                    className="w-full text-sm"
                                />
                                {uploadingImage && (
                                    <span className="text-xs text-purple-600 font-semibold">Uploading...</span>
                                )}
                            </div>
                            {topicImage ? (
                                <img
                                    src={topicImage}
                                    alt="Topic"
                                    className="mt-3 h-20 w-20 rounded-lg object-cover border border-gray-200"
                                />
                            ) : null}
                        </div>
                    </div>
                </div>
            )}

            {/* ---------- Topic Filters ---------- */}
            <div className="bg-white shadow-md rounded-2xl border border-gray-100 p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                    <span className="text-xl"></span>
                    Filter Topics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <select
                        value={filterBoard}
                        onChange={(e) => {
                            setFilterBoard(e.target.value);
                            setFilterSubject("");
                        }}
                        className="border-2 border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-500 outline-none transition-all"
                    >
                        <option value="">All Boards</option>
                        {boards.map((b) => (
                            <option key={b._id} value={b._id}>
                                {b.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filterClass}
                        onChange={(e) => {
                            setFilterClass(e.target.value);
                            setFilterSubject("");
                        }}
                        className="border-2 border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-500 outline-none transition-all"
                    >
                        <option value="">All Classes</option>
                        {classes.map((c) => (
                            <option key={c._id} value={c._id}>
                                {c.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filterSubject}
                        onChange={(e) => setFilterSubject(e.target.value)}
                        className="border-2 border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-500 outline-none transition-all"
                    >
                        <option value="">All Subjects</option>
                        {filterSubjectOptions.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name}
                            </option>
                        ))}
                    </select>

                    <button
                        type="button"
                        onClick={() => {
                            setFilterBoard("");
                            setFilterClass("");
                            setFilterSubject("");
                        }}
                        disabled={!hasActiveFilters}
                        className={`px-6 py-3 rounded-xl transition-all font-semibold shadow-sm ${hasActiveFilters ? "bg-gray-200 text-gray-700 hover:bg-gray-300" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* ---------- Topic List (Grouped by Subject) - Enhanced ---------- */}
            <div className="bg-white shadow-md rounded-2xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <span className="text-xl"></span>
                        Topics Inside Subjects ({filteredData.reduce((acc, curr) => acc + curr.topics.length, 0)})
                    </h3>
                    <button
                        type="button"
                        onClick={loadTopics}
                        className="px-4 py-2 rounded-xl bg-white border border-purple-200 text-purple-700 text-sm font-semibold hover:bg-purple-50 transition-all"
                    >
                        Refresh
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {filteredData.map((row, idx) => (
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
            <th className="p-4 font-semibold text-gray-700 border-b-2 border-gray-200">Image</th>
            <th className="p-4 font-semibold text-gray-700 border-b-2 border-gray-200">Short Description</th>
            <th className="p-4 font-semibold text-gray-700 border-b-2 border-gray-200">Added By</th>
            <th className="p-4 font-semibold text-gray-700 border-b-2 border-gray-200">Status</th>
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

                <td className="p-4">
                    {editingId === topic._id ? (
                        <div className="space-y-2">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleEditTopicImage}
                                disabled={editUploadingImage}
                                className="w-full text-xs"
                            />
                            {editUploadingImage ? (
                                <p className="text-xs text-purple-600 font-semibold">Uploading...</p>
                            ) : null}
                            {editTopicImage ? (
                                <img
                                    src={editTopicImage}
                                    alt="Topic"
                                    className="h-14 w-14 rounded-lg object-cover border border-gray-200"
                                />
                            ) : (
                                <span className="text-xs text-gray-400">No image</span>
                            )}
                        </div>
                    ) : topic.topicImage ? (
                        <img
                            src={topic.topicImage}
                            alt={topic.name}
                            className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                        />
                    ) : (
                        <span className="text-xs text-gray-400">No image</span>
                    )}
                </td>

                <td className="p-4 max-w-[220px]">
                    {editingId === topic._id ? (
                        <textarea
                            value={editShortDescription}
                            onChange={(e) => setEditShortDescription(e.target.value)}
                            rows={2}
                            className="border-2 border-gray-300 p-2 rounded-lg w-full text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none resize-none"
                            placeholder="Short description"
                        />
                    ) : (
                        <p className="text-xs text-gray-700 line-clamp-2">
                            {topic.shortDescription || "No description"}
                        </p>
                    )}
                </td>

                {/* Added By */}
                <td className="p-4 text-gray-700">
                    {topic.createdBy?.name || "Unknown"}
                </td>

                {/* Status */}
                <td className="p-4">
                    <span
                        title={topic.status === "rejected" ? (topic.rejectionReason || "") : ""}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                            topic.status === "approved"
                                ? "bg-emerald-100 text-emerald-700"
                                : topic.status === "rejected"
                                    ? "bg-rose-100 text-rose-700"
                                    : "bg-amber-100 text-amber-700"
                        }`}
                    >
                        {topic.status === "approved"
                            ? "Approved"
                            : topic.status === "rejected"
                                ? "Rejected"
                                : "Pending Review"}
                    </span>
                    {topic.status === "rejected" && topic.rejectionReason ? (
                        <p className="text-xs text-rose-500 mt-1 max-w-40">{topic.rejectionReason}</p>
                    ) : null}
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
                    {(isAdmin || topic.createdBy?._id === userId) ? (
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
                    colSpan={10}
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

                    {filteredData.length === 0 && (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">📚</div>
                            <p className="text-gray-500 font-medium">
                                {hasActiveFilters ? "No topics match your filters" : "No subjects with topics yet"}
                            </p>
                            <p className="text-sm text-gray-400">
                                {hasActiveFilters ? "Try clearing filters to see more" : "Add topics to subjects using the form above"}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
