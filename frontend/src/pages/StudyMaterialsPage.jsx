import React, { useEffect, useState } from "react";
import { FileText, Lock, Wallet, Coins, CreditCard } from "lucide-react";
import SecurePdfViewer from "../components/SecurePdfViewer.jsx";
import { toast, ToastContainer } from "react-toastify";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function StudyMaterialsPage() {
    const [user, setUser] = useState(null);
    const [materials, setMaterials] = useState([]);
    const [subject, setSubject] = useState("All");
    const [priceFilter, setPriceFilter] = useState("All");
    const [loading, setLoading] = useState(true);
    const [openPdf, setOpenPdf] = useState(null);
    const [wallet, setWallet] = useState(0);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null);

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

    /* ---------------- FETCH WALLET BALANCE ---------------- */
    useEffect(() => {
        async function fetchWallet() {
            const token = localStorage.getItem("jwt");
            if (!token) return;

            try {
                const res = await fetch(`${API}/api/users/wallet`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) return;

                const data = await res.json();
                setWallet(data.wallet || 0);
            } catch (err) {
                console.error("FETCH WALLET ERROR:", err);
            }
        }

        fetchWallet();
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
                if (subject !== "All") url.searchParams.set("subject", subject);

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
        setSelectedMaterial(material);
        setShowPaymentModal(true);
    }

    /* ---------------- PURCHASE WITH RAZORPAY ---------------- */
    async function purchaseWithRazorpay(material) {
        const token = localStorage.getItem("jwt");
        const loaded = await loadRazorpay();
        if (!loaded) return toast.error("Razorpay failed to load");

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
                setShowPaymentModal(false);
            },
            theme: { color: "#4f46e5" },
        };

        new window.Razorpay(options).open();
    }

    /* ---------------- PURCHASE WITH WALLET ---------------- */
    async function purchaseWithWallet(material) {
        const token = localStorage.getItem("jwt");

        if (wallet < material.price) {
            toast.error("Insufficient wallet balance");
            return;
        }

        try {
            const res = await fetch(`${API}/api/study-materials/purchase-with-wallet`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ materialId: material._id }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Purchase failed");
                return;
            }

            toast.success("Material purchased successfully!");

            // Refresh user and wallet
            const userRes = await fetch(`${API}/api/users/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const userData = await userRes.json();
            setUser(userData.user);

            const walletRes = await fetch(`${API}/api/users/wallet`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const walletData = await walletRes.json();
            setWallet(walletData.wallet || 0);

            setShowPaymentModal(false);
        } catch (err) {
            console.error("Wallet purchase error:", err);
            toast.error("Something went wrong");
        }
    }

    /* ---------------- FILTER ---------------- */
    const subjects = ["All", ...new Set(materials.map((m) => m.subject))];
    const priceFilters = ["All", "Free", "Paid"];

    let visibleMaterials = materials;

    // Filter by subject
    if (subject !== "All") {
        visibleMaterials = visibleMaterials.filter((m) => m.subject === subject);
    }

    // Filter by price
    if (priceFilter === "Free") {
        visibleMaterials = visibleMaterials.filter((m) => m.isFree === true);
    } else if (priceFilter === "Paid") {
        visibleMaterials = visibleMaterials.filter((m) => m.isFree === false);
    }

    /* ---------------- LOADING GUARD ---------------- */
    if (!user) {
        return (
            <div className="p-6 text-gray-500">
                Loading user information...
            </div>
        );
    }

    return (
        <div className="min-h-screen space-y-6 md:space-y-8 p-4 sm:p-6 md:p-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
            <ToastContainer />

            {/* Animated background blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
                <div className="absolute -top-20 -right-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
                <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
            </div>

            {/* HEADER */}
            <div className="relative z-10 overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 p-6 md:p-8 text-white shadow-2xl">
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>

                <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                                <FileText size={40} className="drop-shadow-lg" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-lg">
                                    Study Materials
                                </h1>
                                <p className="text-sm md:text-base text-blue-100 mt-1">
                                    {user.className} • {user.board || "Not Available"}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="bg-white/20 backdrop-blur-sm px-4 sm:px-5 py-3 rounded-xl md:rounded-2xl shadow-lg border border-white/30">
                                <p className="text-xs text-white/80">Total Materials</p>
                                <p className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-lg">
                                    {materials.length}
                                </p>
                            </div>
                            {user?.role === "student" && (
                                <div className="bg-gradient-to-br from-amber-400/30 to-yellow-500/30 backdrop-blur-sm px-4 sm:px-5 py-3 rounded-xl md:rounded-2xl shadow-lg border border-amber-300/50">
                                    <div className="flex items-center gap-2">
                                        <Wallet className="w-4 h-4 text-white" />
                                        <p className="text-xs text-white/80">My Wallet</p>
                                    </div>
                                    <p className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-lg">
                                        ₹{wallet.toFixed(2)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* FILTERS */}
            <div className="relative z-10 bg-white/80 backdrop-blur-xl rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-gray-200/50">
                {/* SUBJECT FILTER */}
                <div className="mb-6">
                    <h3 className="text-sm md:text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <span className="text-indigo-600">📚</span> Filter by Subject
                    </h3>
                    <div className="flex gap-2 md:gap-3 flex-wrap">
                        {subjects.map((s) => (
                            <button
                                key={s}
                                onClick={() => setSubject(s)}
                                className={`px-3 md:px-4 py-2 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-all duration-300 ${subject === s
                                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105"
                                    : "bg-white border border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 shadow-md hover:shadow-lg"
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* PRICE FILTER */}
                <div>
                    <h3 className="text-sm md:text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <span className="text-green-600">💰</span> Filter by Price
                    </h3>
                    <div className="flex gap-2 md:gap-3 flex-wrap">
                        {priceFilters.map((p) => (
                            <button
                                key={p}
                                onClick={() => setPriceFilter(p)}
                                className={`px-3 md:px-4 py-2 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-all duration-300 ${priceFilter === p
                                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg scale-105"
                                    : "bg-white border border-gray-200 text-gray-700 hover:border-green-300 hover:bg-green-50 shadow-md hover:shadow-lg"
                                    }`}
                            >
                                {p === "Free" && " "}
                                {p === "Paid" && " "}
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="relative z-10 text-center">
                    <div className="bg-white/80 backdrop-blur-xl rounded-xl md:rounded-2xl p-8 shadow-lg border border-gray-200/50">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 font-medium">Loading materials...</p>
                    </div>
                </div>
            ) : visibleMaterials.length === 0 ? (
                <div className="relative z-10 flex flex-col items-center justify-center py-16 bg-white/80 backdrop-blur-xl rounded-xl md:rounded-2xl shadow-lg border border-gray-200/50">
                    <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-4">
                        <FileText className="w-12 h-12 md:w-14 md:h-14 text-gray-400" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-gray-700">
                        No study materials found
                    </h3>
                    <p className="text-sm md:text-base text-gray-500 mt-2">
                        Study Materials will appear here very soon
                    </p>
                </div>
            ) : (
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {visibleMaterials.map((m) => (
                        <div
                            key={m._id}
                            className="group relative overflow-hidden rounded-xl md:rounded-2xl bg-white/90 backdrop-blur-sm p-5 md:p-6 shadow-lg hover:shadow-2xl border border-gray-200/50 transform hover:-translate-y-2 transition-all duration-300"
                        >
                            {/* TOP RIBBON */}
                            <div
                                className={`absolute top-0 right-0 px-3 py-1.5 text-xs font-bold rounded-bl-xl shadow-lg ${m.isFree
                                        ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white"
                                        : hasAccess(m)
                                            ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white"
                                            : "bg-gradient-to-br from-yellow-400 to-orange-500 text-white"}`}
                            >
                                {m.isFree ? "FREE" : hasAccess(m) ? "OWNED" : "PAID"}
                            </div>

                            {/* ICON with glow effect */}
                            <div className="flex justify-center mb-4 relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                                <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-3xl md:text-4xl shadow-xl transform group-hover:scale-110 transition-transform duration-300">
                                    📘
                                </div>
                            </div>

                            {/* TITLE */}
                            <h3 className="text-center font-extrabold text-base md:text-lg bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent line-clamp-2 mb-2">
                                {m.title}
                            </h3>

                            {/* SUBJECT */}
                            <p className="text-center text-xs md:text-sm text-gray-600 font-medium">
                                {m.subject}
                            </p>

                            {/* PRICE / STATUS BADGE */}
                            <div className="mt-4 flex justify-center">
                                <span
                                    className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold tracking-wide shadow-md ${m.isFree
                                            ? "bg-green-100 text-green-700 border border-green-200"
                                            : hasAccess(m)
                                                ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                                                : "bg-yellow-100 text-yellow-800 border border-yellow-200"}`}
                                >
                                    {m.isFree
                                        ? "Free Access"
                                        : hasAccess(m)
                                            ? "Purchased"
                                            : `₹ ${m.price} Only`}
                                </span>
                            </div>

                            {/* CTA BUTTON */}
                            <div className="mt-6">
                                {hasAccess(m) ? (
                                    <button
                                        onClick={() => setOpenPdf(m)}
                                        className="w-full py-3 rounded-lg md:rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm md:text-base hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105"
                                    >
                                        📖 View Material
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handlePurchase(m)}
                                        className="w-full py-3 rounded-lg md:rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold text-sm md:text-base hover:from-yellow-500 hover:to-orange-600 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105"
                                    >
                                        🛒 Buy Now
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
                    subject={openPdf.subject}
                    title={openPdf.title}
                    // board={openPdf.board}
                    // className={openPdf.class}
                    // userName={user.name}
                    onClose={() => setOpenPdf(null)}
                />
            )}

            {/* PAYMENT MODAL */}
            {showPaymentModal && selectedMaterial && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl max-w-md w-full p-6 md:p-8 transform transition-all">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl md:text-2xl font-bold text-gray-900">Choose Payment Method</h3>
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Material Info */}
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 mb-6">
                            <p className="text-sm text-gray-600 mb-1">Purchasing</p>
                            <h4 className="font-bold text-gray-900 mb-2">{selectedMaterial.title}</h4>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Price</span>
                                <span className="text-2xl font-bold text-indigo-600">₹{selectedMaterial.price}</span>
                            </div>
                        </div>

                        {/* Wallet Balance Info */}
                        {user?.role === "student" && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Wallet className="w-5 h-5 text-amber-600" />
                                        <span className="text-sm font-semibold text-gray-700">Your Wallet Balance</span>
                                    </div>
                                    <span className="text-lg font-bold text-amber-600">₹{wallet.toFixed(2)}</span>
                                </div>
                                {wallet >= selectedMaterial.price && (
                                    <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Sufficient balance available
                                    </p>
                                )}
                                {wallet < selectedMaterial.price && (
                                    <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        Need ₹{(selectedMaterial.price - wallet).toFixed(2)} more
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Payment Options */}
                        <div className="space-y-3">
                            {/* Wallet Payment Option */}
                            {user?.role === "student" && wallet >= selectedMaterial.price && (
                                <button
                                    onClick={() => purchaseWithWallet(selectedMaterial)}
                                    className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white/20 rounded-lg">
                                            <Wallet className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold">Pay with Wallet</p>
                                            <p className="text-xs text-white/80">Instant purchase</p>
                                        </div>
                                    </div>
                                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            )}

                            {/* Razorpay Payment Option */}
                            <button
                                onClick={() => purchaseWithRazorpay(selectedMaterial)}
                                className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-lg">
                                        <CreditCard className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold">Pay with Card/UPI</p>
                                        <p className="text-xs text-white/80">Razorpay secure payment</p>
                                    </div>
                                </div>
                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        {/* Info Note */}
                        <p className="text-xs text-gray-500 text-center mt-6 flex flex-wrap justify-center items-center gap-1">
                           <Lock size={10} />  All transactions are secure and encrypted
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
