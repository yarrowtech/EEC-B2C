import React, { useEffect, useState } from "react";
import { FileText, Lock, Wallet, CreditCard, Search, Grid, List, Heart, Eye, ArrowUpDown, X } from "lucide-react";
import SecurePdfViewer from "../components/SecurePdfViewer.jsx";
import { toast, ToastContainer } from "react-toastify";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function StudyMaterialsPage() {
    const [user, setUser] = useState(null);
    const [materials, setMaterials] = useState([]);
    const [subject, setSubject] = useState("All");
    const [category, setCategory] = useState("All");
    const [priceFilter, setPriceFilter] = useState("All");
    const [loading, setLoading] = useState(true);
    const [openPdf, setOpenPdf] = useState(null);
    const [wallet, setWallet] = useState(0);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("newest");
    const [viewMode, setViewMode] = useState("grid"); // grid or list
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewMaterial, setPreviewMaterial] = useState(null);
    const [favorites, setFavorites] = useState([]);

    /* ---------------- LOAD FAVORITES FROM LOCALSTORAGE ---------------- */
    useEffect(() => {
        const savedFavorites = localStorage.getItem("studyMaterialFavorites");
        if (savedFavorites) {
            setFavorites(JSON.parse(savedFavorites));
        }
    }, []);

    /* ---------------- FAVORITES HANDLERS ---------------- */
    function toggleFavorite(materialId) {
        setFavorites(prev => {
            const newFavorites = prev.includes(materialId)
                ? prev.filter(id => id !== materialId)
                : [...prev, materialId];

            localStorage.setItem("studyMaterialFavorites", JSON.stringify(newFavorites));
            toast.success(prev.includes(materialId) ? "Removed from favorites" : "Added to favorites");
            return newFavorites;
        });
    }

    function isFavorite(materialId) {
        return favorites.includes(materialId);
    }

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

    /* ---------------- FILTER & SEARCH & SORT ---------------- */
    const subjects = ["All", ...new Set(materials.map((m) => m.subject))];
    const categories = ["All", ...new Set(materials.map((m) => m.category || "Notes").filter(Boolean))];
    const priceFilters = ["All", "Free", "Paid"];

    let visibleMaterials = materials;

    // Filter by search query
    if (searchQuery.trim()) {
        visibleMaterials = visibleMaterials.filter((m) =>
            m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (m.category && m.category.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }

    // Filter by subject
    if (subject !== "All") {
        visibleMaterials = visibleMaterials.filter((m) => m.subject === subject);
    }

    // Filter by category
    if (category !== "All") {
        visibleMaterials = visibleMaterials.filter((m) => (m.category || "Notes") === category);
    }

    // Filter by price
    if (priceFilter === "Free") {
        visibleMaterials = visibleMaterials.filter((m) => m.isFree === true);
    } else if (priceFilter === "Paid") {
        visibleMaterials = visibleMaterials.filter((m) => m.isFree === false);
    }

    // Sort materials
    visibleMaterials = [...visibleMaterials].sort((a, b) => {
        switch (sortBy) {
            case "newest":
                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            case "oldest":
                return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
            case "price-low":
                return (a.price || 0) - (b.price || 0);
            case "price-high":
                return (b.price || 0) - (a.price || 0);
            case "alphabetical":
                return a.title.localeCompare(b.title);
            default:
                return 0;
        }
    });

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

            {/* SEARCH & CONTROLS BAR */}
            <div className="relative z-10 bg-white/80 backdrop-blur-xl rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-gray-200/50">
                <div className="flex flex-col lg:flex-row gap-4 mb-6">
                    {/* SEARCH BAR */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by title, subject, or category..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-10 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-medium
                                         focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none
                                         transition-all duration-300 shadow-sm hover:shadow-md"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* SORT DROPDOWN */}
                    <div className="w-full lg:w-64">
                        <div className="relative">
                            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-medium
                                         focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none
                                         transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer appearance-none"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="alphabetical">Alphabetical (A-Z)</option>
                            </select>
                        </div>
                    </div>

                    {/* VIEW MODE TOGGLE */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 shadow-sm hover:shadow-md ${
                                viewMode === "grid"
                                    ? "bg-indigo-600 text-white"
                                    : "bg-white text-gray-600 border-2 border-gray-200 hover:border-indigo-300"
                            }`}
                            title="Grid View"
                        >
                            <Grid className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 shadow-sm hover:shadow-md ${
                                viewMode === "list"
                                    ? "bg-indigo-600 text-white"
                                    : "bg-white text-gray-600 border-2 border-gray-200 hover:border-indigo-300"
                            }`}
                            title="List View"
                        >
                            <List className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* FILTERS */}
                <h3 className="text-base md:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="text-2xl">🔍</span> Filter Materials
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* SUBJECT FILTER DROPDOWN */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                            <span className="text-indigo-600">📚</span> Subject
                        </label>
                        <select
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-medium
                                     focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none
                                     transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
                        >
                            {subjects.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* CATEGORY FILTER DROPDOWN */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                            <span className="text-blue-600">🏷️</span> Category
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-medium
                                     focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none
                                     transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
                        >
                            {categories.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* PRICE FILTER DROPDOWN */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                            <span className="text-green-600">💰</span> Price
                        </label>
                        <select
                            value={priceFilter}
                            onChange={(e) => setPriceFilter(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-medium
                                     focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none
                                     transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
                        >
                            {priceFilters.map((p) => (
                                <option key={p} value={p}>
                                    {p === "Free" && "✨ "}
                                    {p === "Paid" && "💎 "}
                                    {p}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Results Counter and Active Filters */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
                        <div className="text-sm font-semibold text-gray-700">
                            {visibleMaterials.length === 0 ? (
                                <span className="text-red-600">No materials found</span>
                            ) : (
                                <span>
                                    Showing <span className="text-indigo-600">{visibleMaterials.length}</span> of{" "}
                                    <span className="text-gray-900">{materials.length}</span> material{materials.length !== 1 ? "s" : ""}
                                    {searchQuery && (
                                        <span className="ml-2 text-gray-600">
                                            for "{searchQuery}"
                                        </span>
                                    )}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Active Filters Display */}
                    {(subject !== "All" || category !== "All" || priceFilter !== "All") && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-gray-600">Active Filters:</span>
                            {subject !== "All" && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
                                    📚 {subject}
                                    <button
                                        onClick={() => setSubject("All")}
                                        className="ml-1 hover:bg-indigo-200 rounded-full p-0.5 transition-colors"
                                    >
                                        ✕
                                    </button>
                                </span>
                            )}
                            {category !== "All" && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                                    🏷️ {category}
                                    <button
                                        onClick={() => setCategory("All")}
                                        className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                                    >
                                        ✕
                                    </button>
                                </span>
                            )}
                            {priceFilter !== "All" && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                                    💰 {priceFilter}
                                    <button
                                        onClick={() => setPriceFilter("All")}
                                        className="ml-1 hover:bg-green-200 rounded-full p-0.5 transition-colors"
                                    >
                                        ✕
                                    </button>
                                </span>
                            )}
                            <button
                                onClick={() => {
                                    setSubject("All");
                                    setCategory("All");
                                    setPriceFilter("All");
                                }}
                                className="ml-2 px-3 py-1 rounded-full text-xs font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all"
                            >
                                Clear All
                            </button>
                        </div>
                    )}
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
                <div className={`relative z-10 ${viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
                    : "flex flex-col gap-4"}`}>
                    {visibleMaterials.map((m) => (
                        <div
                            key={m._id}
                            className={`group relative overflow-hidden rounded-xl md:rounded-2xl bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-2xl border border-gray-200/50 transition-all duration-300 ${
                                viewMode === "grid"
                                    ? "p-5 md:p-6 transform hover:-translate-y-2"
                                    : "p-4 md:p-5 hover:border-indigo-300"
                            }`}
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

                            {/* FAVORITE HEART BUTTON */}
                            <button
                                onClick={() => toggleFavorite(m._id)}
                                className="absolute top-3 left-3 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white shadow-md hover:shadow-lg transition-all duration-300 z-10 group/fav"
                                title={isFavorite(m._id) ? "Remove from favorites" : "Add to favorites"}
                            >
                                <Heart
                                    className={`w-5 h-5 transition-all duration-300 ${
                                        isFavorite(m._id)
                                            ? "fill-red-500 text-red-500"
                                            : "text-gray-400 group-hover/fav:text-red-400"
                                    }`}
                                />
                            </button>

                            {viewMode === "grid" ? (
                                // GRID VIEW LAYOUT
                                <>
                                    {/* ICON with glow effect */}
                                    <div className="flex justify-center mb-4 relative mt-8">
                                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                                        <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-3xl md:text-4xl shadow-xl transform group-hover:scale-110 transition-transform duration-300">
                                            📘
                                        </div>
                                    </div>

                                    {/* TITLE */}
                                    <h3 className="text-center font-extrabold text-base md:text-lg bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent line-clamp-2 mb-2">
                                        {m.title}
                                    </h3>

                                    {/* SUBJECT & CATEGORY */}
                                    <div className="flex flex-col items-center gap-2 mb-3">
                                        <p className="text-center text-xs md:text-sm text-gray-600 font-medium">
                                            {m.subject}
                                        </p>
                                        {m.category && (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                                                🏷️ {m.category}
                                            </span>
                                        )}
                                    </div>

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

                                    {/* CTA BUTTONS */}
                                    <div className="mt-6 space-y-2">
                                        {hasAccess(m) && (
                                            <button
                                                onClick={() => {
                                                    setPreviewMaterial(m);
                                                    setShowPreviewModal(true);
                                                }}
                                                className="w-full py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 transition-all duration-300 flex items-center justify-center gap-2"
                                            >
                                                <Eye className="w-4 h-4" /> Preview
                                            </button>
                                        )}
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
                                </>
                            ) : (
                                // LIST VIEW LAYOUT
                                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                                    {/* Icon */}
                                    <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-3xl shadow-md">
                                        📘
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">
                                            {m.title}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <span className="text-sm text-gray-600 font-medium">{m.subject}</span>
                                            {m.category && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                                                    🏷️ {m.category}
                                                </span>
                                            )}
                                        </div>
                                        <span
                                            className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${m.isFree
                                                    ? "bg-green-100 text-green-700"
                                                    : hasAccess(m)
                                                        ? "bg-indigo-100 text-indigo-700"
                                                        : "bg-yellow-100 text-yellow-800"}`}
                                        >
                                            {m.isFree ? "Free" : hasAccess(m) ? "Purchased" : `₹${m.price}`}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 flex-shrink-0 w-full md:w-auto">
                                        {hasAccess(m) && (
                                            <button
                                                onClick={() => {
                                                    setPreviewMaterial(m);
                                                    setShowPreviewModal(true);
                                                }}
                                                className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 transition-all duration-300 flex items-center justify-center gap-2"
                                            >
                                                <Eye className="w-4 h-4" /> Preview
                                            </button>
                                        )}
                                        {hasAccess(m) ? (
                                            <button
                                                onClick={() => setOpenPdf(m)}
                                                className="flex-1 md:flex-none px-6 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-300"
                                            >
                                                📖 View
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handlePurchase(m)}
                                                className="flex-1 md:flex-none px-6 py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold text-sm hover:from-yellow-500 hover:to-orange-600 shadow-md hover:shadow-lg transition-all duration-300"
                                            >
                                                🛒 Buy
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
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

            {/* PREVIEW MODAL */}
            {showPreviewModal && previewMaterial && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl max-w-2xl w-full p-6 md:p-8 transform transition-all">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Eye className="w-6 h-6 text-indigo-600" />
                                Material Preview
                            </h3>
                            <button
                                onClick={() => {
                                    setShowPreviewModal(false);
                                    setPreviewMaterial(null);
                                }}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Material Details */}
                        <div className="space-y-4">
                            {/* Icon and Title */}
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-20 h-20 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-4xl shadow-md">
                                    📘
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-xl font-bold text-gray-900 mb-2">{previewMaterial.title}</h4>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
                                            📚 {previewMaterial.subject}
                                        </span>
                                        {previewMaterial.category && (
                                            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                                                🏷️ {previewMaterial.category}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Class</p>
                                    <p className="font-semibold text-gray-900">{previewMaterial.class || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Board</p>
                                    <p className="font-semibold text-gray-900">{previewMaterial.board || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Type</p>
                                    <p className="font-semibold text-gray-900">
                                        {previewMaterial.isFree ? "Free Resource" : "Premium Content"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Price</p>
                                    <p className="font-semibold text-gray-900">
                                        {previewMaterial.isFree ? "Free" : `₹${previewMaterial.price}`}
                                    </p>
                                </div>
                            </div>

                            {/* Upload Date */}
                            {previewMaterial.createdAt && (
                                <div className="text-sm text-gray-600">
                                    <span className="font-semibold">Uploaded:</span>{" "}
                                    {new Date(previewMaterial.createdAt).toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric"
                                    })}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => {
                                        setShowPreviewModal(false);
                                        setPreviewMaterial(null);
                                    }}
                                    className="flex-1 px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all duration-300"
                                >
                                    Close
                                </button>
                                {hasAccess(previewMaterial) ? (
                                    <button
                                        onClick={() => {
                                            setShowPreviewModal(false);
                                            setOpenPdf(previewMaterial);
                                        }}
                                        className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                                    >
                                        📖 Open Material
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setShowPreviewModal(false);
                                            handlePurchase(previewMaterial);
                                        }}
                                        className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold hover:from-yellow-500 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all duration-300"
                                    >
                                        🛒 Purchase Now
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
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
