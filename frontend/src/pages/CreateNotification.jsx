import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Bell, Send } from "lucide-react";
import Swal from "sweetalert2";

export default function CreateNotification() {
    const ITEMS_PER_PAGE = 5;
    const [page, setPage] = useState(1);
    const [notifications, setNotifications] = useState([]);
    const totalPages = Math.ceil(notifications.length / ITEMS_PER_PAGE);

    const paginatedNotifications = notifications.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
    );
    useEffect(() => {
        setPage(1);
    }, [notifications.length]);

    const [form, setForm] = useState({
        title: "",
        message: "",
        role: "student",
    });



    const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

    async function submit(e) {
        e.preventDefault();

        const res = await fetch(`${API}/api/notifications`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("jwt")}`,
            },
            body: JSON.stringify(form),
        });

        if (res.ok) {
            toast.success("🎉 Notification sent successfully!");
            setForm({ title: "", message: "", role: "student" });
            loadNotifications(); // refresh list
        } else {
            toast.error("❌ Failed to send notification");
        }
    }

    async function loadNotifications() {
        try {
            const res = await fetch(`${API}/api/notifications`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
            });
            const data = await res.json();
            setNotifications(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to load notifications", err);
        }
    }

    useEffect(() => {
        loadNotifications();
    }, []);

    // async function deleteNotification(id) {
    //     if (!window.confirm("Delete this notification?")) return;

    //     try {
    //         const res = await fetch(`${API}/api/notifications/${id}`, {
    //             method: "DELETE",
    //             headers: {
    //                 Authorization: `Bearer ${localStorage.getItem("jwt")}`,
    //             },
    //         });

    //         if (res.ok) {
    //             toast.success("Notification deleted");
    //             setNotifications((prev) => prev.filter((n) => n._id !== id));
    //         } else {
    //             toast.error("Failed to delete");
    //         }
    //     } catch (err) {
    //         toast.error("Something went wrong");
    //     }
    // }


    async function deleteNotification(id) {
        const result = await Swal.fire({
            title: "Delete notification?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#64748b",
            confirmButtonText: "Yes, delete",
            cancelButtonText: "Cancel",
            reverseButtons: true,
        });

        if (!result.isConfirmed) return;

        try {
            const res = await fetch(`${API}/api/notifications/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
            });

            if (res.ok) {
                await Swal.fire({
                    icon: "success",
                    title: "Deleted!",
                    text: "Notification has been removed.",
                    timer: 1400,
                    showConfirmButton: false,
                });

                setNotifications((prev) => prev.filter((n) => n._id !== id));
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Delete failed",
                    text: "Unable to delete notification.",
                });
            }
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Something went wrong",
                text: "Please try again later.",
            });
        }
    }


    return (
        <div className="flex justify-center py-10 px-4">
            <div className="w-full space-y-8">

                {/* ================= FORM ================= */}
                <form
                    onSubmit={submit}
                    className="bg-gradient-to-br from-indigo-50 via-white to-amber-50
                    border border-indigo-100 rounded-2xl shadow-lg p-6 sm:p-8"
                >
                    {/* HEADER */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500
                        flex items-center justify-center text-white shadow-md">
                            <Bell size={22} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                Create Notification
                            </h2>
                            <p className="text-sm text-gray-500">
                                Send important updates to users
                            </p>
                        </div>
                    </div>

                    {/* TITLE */}
                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Notification Title
                        </label>
                        <input
                            placeholder="Eg. Exam Schedule Update"
                            className="w-full rounded-xl bg-white border border-gray-200 px-4 py-2.5
                            focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            required
                        />
                    </div>

                    {/* MESSAGE */}
                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Message
                        </label>
                        <textarea
                            placeholder="Write the notification message here..."
                            rows={4}
                            className="w-full rounded-xl bg-white border border-gray-200 px-4 py-2.5
                            focus:outline-none focus:ring-2 focus:ring-indigo-400 transition resize-none"
                            value={form.message}
                            onChange={(e) => setForm({ ...form, message: e.target.value })}
                            required
                        />
                    </div>

                    {/* TARGET ROLE */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Send To
                        </label>
                        <select
                            className="w-full rounded-xl bg-white border border-gray-200 px-4 py-2.5
                            focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                            value={form.role}
                            onChange={(e) => setForm({ ...form, role: e.target.value })}
                        >
                            <option value="student">Students</option>
                            <option value="teacher">Teachers</option>
                            <option value="all">All Users</option>
                        </select>
                    </div>

                    {/* SUBMIT */}
                    <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2
                        rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600
                        text-white font-semibold py-3
                        hover:from-indigo-700 hover:to-purple-700
                        transition shadow-md active:scale-[0.98]"
                    >
                        <Send size={18} />
                        Send Notification
                    </button>
                </form>

                {/* ================= NOTIFICATION LIST ================= */}
                <div className="bg-white border rounded-2xl shadow-md overflow-hidden">
                    <div className="px-6 py-4 border-b">
                        <h3 className="text-lg font-bold text-gray-900">
                            Sent Notifications
                        </h3>
                        <p className="text-sm text-gray-500">
                            Recently sent updates
                        </p>
                    </div>

                    <div className="divide-y max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 && (
                            <div className="px-6 py-8 text-center text-gray-500 text-sm">
                                No notifications yet
                            </div>
                        )}

                        {paginatedNotifications.map((n) => (
                            <div
                                key={n._id}
                                className="px-6 py-4 hover:bg-gray-50 transition"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h4 className="font-semibold text-gray-900">
                                            {n.title}
                                        </h4>
                                        <span className="inline-block mt-1 text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">
                                            {n.role}
                                        </span>
                                    </div>

                                    {/* DELETE (ADMIN ONLY) */}
                                    {JSON.parse(localStorage.getItem("user") || "{}")?.role === "admin" && (
                                        <button
                                            onClick={() => deleteNotification(n._id)}
                                            className="text-xs px-3 py-1.5 rounded-lg
                 bg-red-100 text-red-600
                 hover:bg-red-200 transition"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>

                                <p className="text-sm text-gray-600 mt-1">
                                    {n.message}
                                </p>

                                <p className="text-xs text-gray-400 mt-2">
                                    {new Date(n.createdAt).toLocaleString()}
                                </p>
                            </div>
                        ))}
                        {/* PAGINATION */}

                    </div>
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
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

            </div>
        </div>
    );
}
