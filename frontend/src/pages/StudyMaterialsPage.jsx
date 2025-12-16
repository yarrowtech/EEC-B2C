import React, { useEffect, useState } from "react";
import { FileText, Lock } from "lucide-react";
import SecurePdfViewer from "../components/SecurePdfViewer.jsx";
import { toast, ToastContainer } from "react-toastify";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function StudyMaterialsPage() {
    const [user, setUser] = useState(null);
    const [materials, setMaterials] = useState([]);
    const [subject, setSubject] = useState("All");
    const [loading, setLoading] = useState(true);
    const [openPdf, setOpenPdf] = useState(null);

    /* ---------------- USER ACCESS CHECK ---------------- */
    function hasAccess(material) {
        if (material.isFree) return true;
        if (!user?.purchasedMaterials) return false;
        return user.purchasedMaterials.includes(material._id);
    }

    /* ---------------- FETCH USER (DB = SOURCE OF TRUTH) ---------------- */
    useEffect(() => {
        async function fetchUser() {
            const token = localStorage.getItem("jwt");
            if (!token) return;

            try {
                const res = await fetch(`${API}/api/users/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) return;

                const data = await res.json();
                setUser(data.user);
            } catch (err) {
                console.error("FETCH USER ERROR:", err);
            }
        }

        fetchUser();
    }, []);

    /* ---------------- FETCH STUDY MATERIALS ---------------- */
    useEffect(() => {
        if (!user) return;

        async function fetchMaterials() {
            try {
                const token = localStorage.getItem("jwt");

                const url = new URL(`${API}/api/study-materials`);
                url.searchParams.set("class", user.class);
                if (user.board) url.searchParams.set("board", user.board);

                const res = await fetch(url.toString(), {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                const data = await res.json();
                setMaterials(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("FETCH MATERIALS ERROR:", err);
                setMaterials([]);
            } finally {
                setLoading(false);
            }
        }

        fetchMaterials();
    }, [user]);

    /* ---------------- RAZORPAY LOADER ---------------- */
    function loadRazorpay() {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            document.body.appendChild(script);
        });
    }

    /* ---------------- PURCHASE HANDLER ---------------- */
    async function handlePurchase(material) {
        const token = localStorage.getItem("jwt");
        const loaded = await loadRazorpay();
        if (!loaded) return alert("Razorpay failed to load");

        const res = await fetch(`${API}/api/study-materials/create-order`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ materialId: material._id }),
        });

        if (!res.ok) {
            toast.error("Failed to create order");
            return;
        }

        const order = await res.json();

        const options = {
            key: order.key,
            amount: order.amount,
            currency: "INR",
            name: "EEC Learning",
            description: material.title,
            order_id: order.orderId,
            handler: async function (response) {
                await fetch(`${API}/api/study-materials/verify-payment`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        ...response,
                        materialId: material._id,
                    }),
                });

                toast.success("Payment successful!");

                // 🔥 Refresh user from DB → instant UI update
                const userRes = await fetch(`${API}/api/users/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const userData = await userRes.json();
                setUser(userData.user);
            },
            theme: { color: "#4f46e5" },
        };

        new window.Razorpay(options).open();
    }

    /* ---------------- FILTER ---------------- */
    const subjects = ["All", ...new Set(materials.map((m) => m.subject))];
    const visibleMaterials =
        subject === "All"
            ? materials
            : materials.filter((m) => m.subject === subject);

    /* ---------------- LOADING GUARD ---------------- */
    if (!user) {
        return (
            <div className="p-6 text-gray-500">
                Loading user information...
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <ToastContainer />

            {/* HEADER */}
            <div className="bg-gradient-to-r from-indigo-500 via-blue-600 to-sky-600 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-8 h-8 text-indigo-200" />
                    <h1 className="text-3xl font-bold">Study Materials</h1>
                </div>
                <p className="text-indigo-100">
                    {user.className} • {user.board || "Not Available"}
                </p>
            </div>

            {/* SUBJECT FILTER */}
            <div className="flex gap-3 flex-wrap">
                {subjects.map((s) => (
                    <button
                        key={s}
                        onClick={() => setSubject(s)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${subject === s
                            ? "bg-indigo-600 text-white"
                            : "bg-white border hover:bg-gray-100"
                            }`}
                    >
                        {s}
                    </button>
                ))}
            </div>

            {/* CONTENT */}
            {loading ? (
                <div className="text-center text-gray-500">Loading materials...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visibleMaterials.map((m) => (
                        <div
                            key={m._id}
                            className="group relative overflow-hidden rounded-3xl
      bg-gradient-to-br from-white via-indigo-50 to-sky-100
      p-6 shadow-lg hover:shadow-2xl
      hover:-translate-y-1 transition-all duration-300"
                        >
                            {/* TOP RIBBON */}
                            <div
                                className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold rounded-bl-2xl
        ${m.isFree
                                        ? "bg-green-500 text-white"
                                        : hasAccess(m)
                                            ? "bg-indigo-600 text-white"
                                            : "bg-yellow-500 text-white"}`}
                            >
                                {m.isFree ? "FREE" : hasAccess(m) ? "OWNED" : "PAID"}
                            </div>

                            {/* ICON */}
                            <div className="flex justify-center mb-4">
                                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-3xl shadow-inner">
                                    📘
                                </div>
                            </div>

                            {/* TITLE */}
                            <h3 className="text-center font-extrabold text-lg text-indigo-900 line-clamp-2">
                                {m.title}
                            </h3>

                            {/* SUBJECT */}
                            <p className="text-center text-sm text-gray-600 mt-1">
                                {m.subject}
                            </p>

                            {/* PRICE / STATUS BADGE */}
                            <div className="mt-4 flex justify-center">
                                <span
                                    className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wide
          ${m.isFree
                                            ? "bg-green-100 text-green-700"
                                            : hasAccess(m)
                                                ? "bg-indigo-100 text-indigo-700"
                                                : "bg-yellow-100 text-yellow-800"}`}
                                >
                                    {m.isFree
                                        ? "Free Access"
                                        : hasAccess(m)
                                            ? "✔ Purchased"
                                            : `₹ ${m.price} Only`}
                                </span>
                            </div>

                            {/* CTA BUTTON */}
                            <div className="mt-6">
                                {hasAccess(m) ? (
                                    <button
                                        onClick={() => setOpenPdf(m)}
                                        className="w-full py-3 rounded-xl
            bg-gradient-to-r from-indigo-600 to-blue-600
            text-white font-bold text-sm
            hover:from-indigo-700 hover:to-blue-700
            shadow-md hover:shadow-xl transition"
                                    >
                                        View
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handlePurchase(m)}
                                        className="w-full py-3 rounded-xl
            bg-gradient-to-r from-yellow-400 to-orange-500
            text-white font-bold text-sm
            hover:from-yellow-500 hover:to-orange-600
            shadow-md hover:shadow-xl transition animate-pulse"
                                    >
                                        Buy Now
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* PDF VIEWER */}
            {openPdf && (
                <SecurePdfViewer
                    pdfUrl={openPdf.pdfUrl}
                    title={openPdf.title}
                    onClose={() => setOpenPdf(null)}
                />
            )}
        </div>
    );
}
