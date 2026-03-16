import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CalendarDays, ArrowLeft, Bell, Loader, BookOpen } from "lucide-react";

export default function NotificationDetails() {
    const { id } = useParams();
    const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const navigate = useNavigate();

    const [notification, setNotification] = useState(null);
    const [loading, setLoading] = useState(true);

    const ITEMS_PER_PAGE = 1;
    const [page, setPage] = useState(1);
    const [filterDate, setFilterDate] = useState("");

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`${API}/api/notifications/${id}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                    },
                });
                const data = await res.json();
                setNotification(data);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id, API]);

    const filtered = useMemo(() => {
        if (!notification) return [];
        if (!filterDate) return [notification];
        const posted = new Date(notification.createdAt).toISOString().split("T")[0];
        return posted === filterDate ? [notification] : [];
    }, [notification, filterDate]);

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

    const paginated = filtered.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
    );

    useEffect(() => {
        setPage(1);
    }, [filterDate]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader className="animate-spin text-indigo-600" size={48} />
            </div>
        );
    }

    if (!notification) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-4xl mx-auto">

                {/* Header Card */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
                    >
                        <ArrowLeft size={20} />
                        Back
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 rounded-full">
                            <Bell size={28} className="text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Notification Details</h1>
                            <p className="text-gray-500 text-sm mt-0.5">View full notification content</p>
                        </div>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-white rounded-2xl shadow-lg p-4 mb-6 flex items-center gap-3">
                    <CalendarDays className="text-indigo-600" size={20} />
                    <label className="text-sm font-semibold text-gray-700">Filter by posted date</label>
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="ml-auto border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                    />
                </div>

                {/* Content */}
                {paginated.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-lg p-10 text-center text-gray-500">
                        No notifications found for the selected date.
                    </div>
                ) : (
                    paginated.map((n) => (
                        <div key={n._id} className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                            {/* Title & Meta */}
                            <div className="mb-5">
                                <h2 className="text-2xl font-bold text-gray-800 mb-3">{n.title}</h2>
                                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                                    <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                                        Notification
                                    </span>
                                    <span>
                                        Posted on{" "}
                                        <span className="font-semibold text-gray-700">
                                            {new Date(n.createdAt).toLocaleString()}
                                        </span>
                                    </span>
                                </div>
                            </div>

                            <hr className="border-gray-100 mb-5" />

                            {/* Message */}
                            <div className="prose max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
                                {n.message}
                            </div>

                            {n.source === "study-material" && n.materialId && (
                                <div className="mt-6">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            navigate(`/dashboard/study-materials?materialId=${encodeURIComponent(n.materialId)}`)
                                        }
                                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-700 transition"
                                    >
                                        <BookOpen size={16} />
                                        Open Study Material
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl shadow-lg">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 text-sm rounded-lg border bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-600">
                            Page <b>{page}</b> of <b>{totalPages}</b>
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 text-sm rounded-lg border bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
