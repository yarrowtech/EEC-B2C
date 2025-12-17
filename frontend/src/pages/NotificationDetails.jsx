import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CalendarDays, ArrowLeft } from "lucide-react";

export default function NotificationDetails() {
    const { id } = useParams();
    const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const navigate = useNavigate();

    const [notification, setNotification] = useState(null);

    /* ---------- pagination + filter (ADDED) ---------- */
    const ITEMS_PER_PAGE = 1; // single notification, kept scalable
    const [page, setPage] = useState(1);
    const [filterDate, setFilterDate] = useState("");

    /* ---------- LOAD (UNCHANGED) ---------- */
    useEffect(() => {
        async function load() {
            const res = await fetch(`${API}/api/notifications/${id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
            });
            const data = await res.json();
            setNotification(data);
        }
        load();
    }, [id, API]);

    /* ---------- FILTER (SAFE) ---------- */
    const filtered = useMemo(() => {
        if (!notification) return [];
        if (!filterDate) return [notification];

        const posted = new Date(notification.createdAt)
            .toISOString()
            .split("T")[0];

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

    /* ---------- STATES ---------- */
    if (!notification) {
        return (
            <div className="p-10 text-center text-gray-500">
                Loading notification…
            </div>
        );
    }

    return (
        <div className="mx-auto p-4 sm:p-6 space-y-6">
            {/* ---------- BACK BUTTON ---------- */}
            <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 text-sm font-semibold
             text-indigo-600 hover:text-indigo-700
             bg-white border border-indigo-100
             px-4 py-2 rounded-lg shadow-sm
             hover:bg-indigo-50 transition"
            >
                <ArrowLeft size={16} />
                Back
            </button>


            {/* ---------- FILTER BAR ---------- */}
            <div className="flex items-center gap-3 bg-white p-4 rounded-xl border shadow-sm">
                <CalendarDays className="text-indigo-600" />
                <label className="text-sm font-semibold text-gray-700">
                    Filter by posted date
                </label>
                <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="ml-auto border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-400"
                />
            </div>

            {/* ---------- CONTENT ---------- */}
            {paginated.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl shadow border text-center text-gray-500">
                    No notifications found for selected date
                </div>
            ) : (
                paginated.map((n) => (
                    <div
                        key={n._id}
                        className="bg-gradient-to-br from-white via-white to-indigo-50
                       rounded-2xl shadow-lg border p-6 sm:p-8"
                    >
                        {/* TITLE */}
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                            {n.title}
                        </h1>

                        {/* META */}
                        {/* META */}
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-6">

                            {/* TYPE */}
                            <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                                Notification
                            </span>

                            {/* POSTED DATE */}
                            <span>
                                Posted on{" "}
                                <b>{new Date(n.createdAt).toLocaleString()}</b>
                            </span>

                            {/* POSTED BY */}
                            {/* {n.createdBy && (
                                <span className="flex items-center gap-1">
                                    • Posted by{" "}
                                    <span className="font-semibold text-gray-700">
                                        {n.createdBy.name}
                                    </span>
                                    <span className="ml-1 px-2 py-0.5 rounded-full text-xs
                       bg-amber-100 text-amber-700 capitalize">
                                        {n.createdBy.role}
                                    </span>
                                </span>
                            )} */}
                        </div>

                        {/* MESSAGE */}
                        <div className="prose max-w-none text-gray-800 leading-relaxed whitespace-pre-line">
                            {n.message}
                        </div>
                    </div>
                ))
            )}

            {/* ---------- PAGINATION ---------- */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white px-6 py-4 rounded-xl border shadow-sm">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 text-sm rounded-lg border bg-white
                       disabled:opacity-50 disabled:cursor-not-allowed
                       hover:bg-gray-100 transition"
                    >
                        Previous
                    </button>

                    <span className="text-sm text-gray-600">
                        Page <b>{page}</b> of <b>{totalPages}</b>
                    </span>

                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 text-sm rounded-lg border bg-white
                       disabled:opacity-50 disabled:cursor-not-allowed
                       hover:bg-gray-100 transition"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
