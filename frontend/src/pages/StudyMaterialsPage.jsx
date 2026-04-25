import React, { useEffect, useState } from "react";
import { FileText, Lock, Wallet, CreditCard, Search, Grid, List, Heart, Eye, ArrowUpDown, X } from "lucide-react";
import SecurePdfViewer from "../components/SecurePdfViewer.jsx";
import { toast, ToastContainer } from "react-toastify";
import { useLocation } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const CACHE_PREFIX = "eec:study-materials";
const STUDY_MATERIALS_TOAST_ID = "study-materials-toast";

function getCacheKey(section, userKey = "anonymous") {
    return `${CACHE_PREFIX}:${userKey}:${section}`;
}

function readCache(section, userKey, ttlMs) {
    try {
        const raw = localStorage.getItem(getCacheKey(section, userKey));
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed.ts !== "number") return null;
        if (Date.now() - parsed.ts > ttlMs) return null;
        return parsed.data;
    } catch {
        return null;
    }
}

function writeCache(section, userKey, data) {
    try {
        localStorage.setItem(
            getCacheKey(section, userKey),
            JSON.stringify({ ts: Date.now(), data })
        );
    } catch {
        // Ignore storage errors.
    }
}

export default function StudyMaterialsPage() {
    const location = useLocation();
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
    const [highlightedMaterialId, setHighlightedMaterialId] = useState("");
    const [openedMaterialIds, setOpenedMaterialIds] = useState([]);

    const userKey = user?._id || user?.id || user?.email || "anonymous";

    function getOpenedMaterialsKey(currentUserKey) {
        return `${CACHE_PREFIX}:${currentUserKey}:opened-materials`;
    }

    /* ---------------- LOAD FAVORITES FROM LOCALSTORAGE ---------------- */
    useEffect(() => {
        const savedFavorites = localStorage.getItem("studyMaterialFavorites");
        if (savedFavorites) {
            setFavorites(JSON.parse(savedFavorites));
        }
    }, []);

    useEffect(() => {
        if (!userKey) return;
        try {
            const raw = localStorage.getItem(getOpenedMaterialsKey(userKey));
            const parsed = raw ? JSON.parse(raw) : [];
            setOpenedMaterialIds(Array.isArray(parsed) ? parsed.map((id) => String(id)) : []);
        } catch {
            setOpenedMaterialIds([]);
        }
    }, [userKey]);

    /* ---------------- FAVORITES HANDLERS ---------------- */
    function toggleFavorite(materialId) {
        const wasFavorite = favorites.includes(materialId);
        const newFavorites = wasFavorite
            ? favorites.filter((id) => id !== materialId)
            : [...favorites, materialId];

        setFavorites(newFavorites);
        localStorage.setItem("studyMaterialFavorites", JSON.stringify(newFavorites));
        toast.success(
            wasFavorite ? "Removed from favorites" : "Added to favorites",
            { containerId: STUDY_MATERIALS_TOAST_ID }
        );
    }

    function isFavorite(materialId) {
        return favorites.includes(materialId);
    }

    function markMaterialAsOpened(materialId) {
        if (!materialId) return;
        const id = String(materialId);
        setOpenedMaterialIds((prev) => {
            if (prev.includes(id)) return prev;
            const next = [...prev, id];
            try {
                localStorage.setItem(getOpenedMaterialsKey(userKey), JSON.stringify(next));
            } catch {
                // Ignore storage errors.
            }
            return next;
        });
    }

    function handleOpenMaterial(material) {
        if (!material?._id) return;
        markMaterialAsOpened(material._id);
        setOpenPdf(material);
    }

    /* ---------------- USER ACCESS CHECK ---------------- */
    function hasAccess(material) {
        if (typeof material?.canAccess === "boolean") return material.canAccess;
        if (isMaterialFree(material)) return true;
        return hasPurchased(material._id);
    }

    function isMaterialFree(material) {
        const price = Number(material?.price || 0);
        return Boolean(material?.isFree) && price <= 0;
    }

    function hasPurchased(materialId) {
        if (!Array.isArray(user?.purchasedMaterials)) return false;
        return user.purchasedMaterials.some((id) => String(id) === String(materialId));
    }

    function getAccessState(material) {
        if (isMaterialFree(material)) return "free";
        if (hasPurchased(material?._id)) return "owned";
        if (hasAccess(material)) return "package";
        return "paid";
    }

    /* ---------------- FETCH USER (DB = SOURCE OF TRUTH) ---------------- */
    useEffect(() => {
        async function fetchUser() {
            const token = localStorage.getItem("jwt");
            if (!token) return;
            const storedUser = JSON.parse(localStorage.getItem("user") || "null");
            const userKey = storedUser?._id || storedUser?.id || storedUser?.email || "anonymous";
            let hasCachedUser = false;

            const cachedUser = readCache("profile", userKey, 5 * 60 * 1000);
            if (cachedUser) {
                setUser(cachedUser);
                hasCachedUser = true;
            }

            try {
                const res = await fetch(`${API}/api/users/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) {
                    if (!hasCachedUser && storedUser) setUser(storedUser);
                    return;
                }

                const data = await res.json();
                setUser(data.user);
                writeCache("profile", userKey, data.user);
            } catch (err) {
                console.error("FETCH USER ERROR:", err);
                if (!hasCachedUser && storedUser) setUser(storedUser);
            }
        }

        fetchUser();
    }, []);

    /* ---------------- FETCH WALLET BALANCE ---------------- */
    useEffect(() => {
        async function fetchWallet() {
            const token = localStorage.getItem("jwt");
            if (!token) return;
            const storedUser = JSON.parse(localStorage.getItem("user") || "null");
            const userKey = storedUser?._id || storedUser?.id || storedUser?.email || "anonymous";
            let hasCachedWallet = false;

            const cachedWallet = readCache("wallet", userKey, 60 * 1000);
            if (cachedWallet !== null) {
                setWallet(Number(cachedWallet) || 0);
                hasCachedWallet = true;
            }

            try {
                const res = await fetch(`${API}/api/users/wallet`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) {
                    if (!hasCachedWallet) setWallet(Number(storedUser?.wallet || 0));
                    return;
                }

                const data = await res.json();
                setWallet(data.wallet || 0);
                writeCache("wallet", userKey, data.wallet || 0);
            } catch (err) {
                console.error("FETCH WALLET ERROR:", err);
                if (!hasCachedWallet) setWallet(Number(storedUser?.wallet || 0));
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
                const userKey = user?._id || user?.id || user?.email || "anonymous";

                const url = new URL(`${API}/api/study-materials`);
                url.searchParams.set("class", user.class);
                if (user.board) url.searchParams.set("board", user.board);
                if (subject !== "All") url.searchParams.set("subject", subject);
                const cacheKey = `materials:${url.searchParams.toString()}`;

                const cachedMaterials = readCache(cacheKey, userKey, 5 * 60 * 1000);
                if (cachedMaterials) {
                    setMaterials(Array.isArray(cachedMaterials) ? cachedMaterials : []);
                    setLoading(false);
                }

                const res = await fetch(url.toString(), {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                const data = await res.json();
                setMaterials(Array.isArray(data) ? data : []);
                writeCache(cacheKey, userKey, Array.isArray(data) ? data : []);
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
                const userKey = userData.user?._id || userData.user?.id || userData.user?.email || "anonymous";
                writeCache("profile", userKey, userData.user);
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
            const userKey = userData.user?._id || userData.user?.id || userData.user?.email || "anonymous";
            writeCache("profile", userKey, userData.user);

            const walletRes = await fetch(`${API}/api/users/wallet`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const walletData = await walletRes.json();
            setWallet(walletData.wallet || 0);
            writeCache("wallet", userKey, walletData.wallet || 0);

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
        visibleMaterials = visibleMaterials.filter((m) => isMaterialFree(m));
    } else if (priceFilter === "Paid") {
        visibleMaterials = visibleMaterials.filter((m) => !isMaterialFree(m));
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

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const targetMaterialId = params.get("materialId");
        if (!targetMaterialId || loading) return;

        const targetExists = visibleMaterials.some((m) => String(m._id) === String(targetMaterialId));
        if (!targetExists) return;

        const element = document.getElementById(`study-material-${targetMaterialId}`);
        if (!element) return;

        setHighlightedMaterialId(targetMaterialId);
        element.scrollIntoView({ behavior: "smooth", block: "center" });

        const t = setTimeout(() => setHighlightedMaterialId(""), 2500);
        return () => clearTimeout(t);
    }, [location.search, loading, visibleMaterials]);

    const targetMaterialIdFromQuery = String(new URLSearchParams(location.search).get("materialId") || "");

    function isUnreadTargetMaterial(materialId) {
        if (!targetMaterialIdFromQuery) return false;
        const id = String(materialId || "");
        if (!id || id !== targetMaterialIdFromQuery) return false;
        return !openedMaterialIds.includes(id);
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
        <div className="min-h-screen space-y-3 md:space-y-8 p-3 sm:p-6 md:p-8 pb-24 md:pb-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
            <ToastContainer containerId={STUDY_MATERIALS_TOAST_ID} position="bottom-right" />
            {/* Animated background blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
                <div className="absolute -top-20 -right-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
                <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
            </div>

            {/* ── MOBILE HEADER ── */}
            <div className="md:hidden relative z-10 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 px-4 py-3.5 text-white shadow-xl">
                <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full -mr-14 -mt-14 pointer-events-none"></div>
                <div className="relative flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl flex-shrink-0">
                            <FileText size={22} className="drop-shadow" />
                        </div>
                        <div>
                            <h1 className="text-base font-extrabold leading-tight">Study Materials</h1>
                            <p className="text-xs text-blue-100 mt-0.5">{user.className} • {user.board || "N/A"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="bg-white/15 rounded-xl px-2.5 py-1.5 text-center">
                            <p className="text-xs text-white/70 leading-none">Total</p>
                            <p className="text-sm font-bold leading-tight">{materials.length}</p>
                        </div>
                        {user?.role === "student" && (
                            <div className="bg-amber-400/30 border border-amber-300/40 rounded-xl px-2.5 py-1.5 text-center">
                                <p className="text-xs text-white/70 leading-none">Wallet</p>
                                <p className="text-sm font-bold leading-tight">₹{wallet.toFixed(0)}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── DESKTOP HEADER ── */}
            <div className="hidden md:block relative z-10 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 p-8 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
                <div className="relative z-10">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                                <FileText size={40} className="drop-shadow-lg" />
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-lg">Study Materials</h1>
                                <p className="text-sm md:text-base text-blue-100 mt-1">{user.className} • {user.board || "Not Available"}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="bg-white/20 backdrop-blur-sm px-5 py-3 rounded-2xl shadow-lg border border-white/30">
                                <p className="text-xs text-white/80">Total Materials</p>
                                <p className="text-3xl font-extrabold text-white drop-shadow-lg">{materials.length}</p>
                            </div>
                            {user?.role === "student" && (
                                <div className="bg-gradient-to-br from-amber-400/30 to-yellow-500/30 backdrop-blur-sm px-5 py-3 rounded-2xl shadow-lg border border-amber-300/50">
                                    <div className="flex items-center gap-2">
                                        <Wallet className="w-4 h-4 text-white" />
                                        <p className="text-xs text-white/80">My Wallet</p>
                                    </div>
                                    <p className="text-3xl font-extrabold text-white drop-shadow-lg">₹{wallet.toFixed(2)}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* SEARCH & CONTROLS BAR */}
            <div className="relative z-10 bg-white/90 backdrop-blur-xl rounded-xl md:rounded-2xl p-3 md:p-6 shadow-md md:shadow-lg border border-gray-200/50">

                {/* ── MOBILE: search row + filter selects ── */}
                <div className="md:hidden space-y-2.5">
                    {/* Search + sort + view toggle in one row */}
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search materials..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-8 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-700 text-sm font-medium focus:border-indigo-500 focus:outline-none transition-all"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => setViewMode(v => v === "grid" ? "list" : "grid")}
                            className="p-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-600 active:scale-95 transition-all"
                            title={viewMode === "grid" ? "Switch to list" : "Switch to grid"}
                        >
                            {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                        </button>
                    </div>
                    {/* Filter selects in a 3-col compact grid */}
                    <div className="grid grid-cols-3 gap-2">
                        <select value={subject} onChange={(e) => setSubject(e.target.value)}
                            className="w-full px-2 py-2 rounded-xl border-2 border-gray-200 bg-white text-gray-700 text-xs font-medium focus:border-indigo-500 focus:outline-none cursor-pointer truncate">
                            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select value={category} onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-2 py-2 rounded-xl border-2 border-gray-200 bg-white text-gray-700 text-xs font-medium focus:border-blue-500 focus:outline-none cursor-pointer truncate">
                            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)}
                            className="w-full px-2 py-2 rounded-xl border-2 border-gray-200 bg-white text-gray-700 text-xs font-medium focus:border-green-500 focus:outline-none cursor-pointer">
                            {priceFilters.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    {/* Result count + clear */}
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 font-medium">
                            {visibleMaterials.length === 0
                                ? <span className="text-red-500">No results</span>
                                : <span><span className="text-indigo-600 font-bold">{visibleMaterials.length}</span> of {materials.length} materials</span>}
                        </p>
                        {(subject !== "All" || category !== "All" || priceFilter !== "All" || searchQuery) && (
                            <button onClick={() => { setSubject("All"); setCategory("All"); setPriceFilter("All"); setSearchQuery(""); }}
                                className="text-xs text-indigo-600 font-semibold active:scale-95 transition-all">
                                Clear all
                            </button>
                        )}
                    </div>
                </div>

                {/* ── DESKTOP: original layout ── */}
                <div className="hidden md:block">
                    <div className="flex flex-col lg:flex-row gap-4 mb-6">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input type="text" placeholder="Search by title, subject, or category..."
                                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-10 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all duration-300 shadow-sm hover:shadow-md" />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                        <div className="w-full lg:w-64 relative">
                            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-medium focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer appearance-none">
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="alphabetical">Alphabetical (A-Z)</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setViewMode("grid")}
                                className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 shadow-sm hover:shadow-md ${viewMode === "grid" ? "bg-indigo-600 text-white" : "bg-white text-gray-600 border-2 border-gray-200 hover:border-indigo-300"}`}
                                title="Grid View"><Grid className="w-5 h-5" /></button>
                            <button onClick={() => setViewMode("list")}
                                className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 shadow-sm hover:shadow-md ${viewMode === "list" ? "bg-indigo-600 text-white" : "bg-white text-gray-600 border-2 border-gray-200 hover:border-indigo-300"}`}
                                title="List View"><List className="w-5 h-5" /></button>
                        </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><span className="text-2xl"></span> Filter Materials</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"><span className="text-indigo-600"> </span> Subject</label>
                            <select value={subject} onChange={(e) => setSubject(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer">
                                {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"><span className="text-blue-600"></span> Category</label>
                            <select value={category} onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer">
                                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        {/* <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"><span className="text-green-600">💰</span> Price</label>
                            <select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-medium focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer">
                                {priceFilters.map((p) => <option key={p} value={p}>{p === "Free" && "✨ "}{p === "Paid" && "💎 "}{p}</option>)}
                            </select>
                        </div> */}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
                            <div className="text-sm font-semibold text-gray-700">
                                {visibleMaterials.length === 0
                                    ? <span className="text-red-600">No materials found</span>
                                    : <span>Showing <span className="text-indigo-600">{visibleMaterials.length}</span> of <span className="text-gray-900">{materials.length}</span> material{materials.length !== 1 ? "s" : ""}{searchQuery && <span className="ml-2 text-gray-600">for "{searchQuery}"</span>}</span>}
                            </div>
                        </div>
                        {(subject !== "All" || category !== "All" || priceFilter !== "All") && (
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-gray-600">Active Filters:</span>
                                {subject !== "All" && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">📚 {subject}<button onClick={() => setSubject("All")} className="ml-1 hover:bg-indigo-200 rounded-full p-0.5 transition-colors">✕</button></span>}
                                {category !== "All" && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">🏷️ {category}<button onClick={() => setCategory("All")} className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors">✕</button></span>}
                                {priceFilter !== "All" && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">💰 {priceFilter}<button onClick={() => setPriceFilter("All")} className="ml-1 hover:bg-green-200 rounded-full p-0.5 transition-colors">✕</button></span>}
                                <button onClick={() => { setSubject("All"); setCategory("All"); setPriceFilter("All"); }} className="ml-2 px-3 py-1 rounded-full text-xs font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all">Clear All</button>
                            </div>
                        )}
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
                <div className={`relative z-10 ${
                    viewMode === "grid"
                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-6"
                        : "flex flex-col gap-2 md:gap-4"
                }`}>
                    {visibleMaterials.map((m) => (
                        <div
                            key={m._id}
                            id={`study-material-${m._id}`}
                            className={`group relative overflow-hidden rounded-xl md:rounded-2xl bg-white/90 backdrop-blur-sm shadow-sm md:shadow-lg hover:shadow-2xl border border-gray-200/50 transition-all duration-300 ${
                                viewMode === "grid"
                                    ? "md:p-6 md:transform md:hover:-translate-y-2"
                                    : "md:p-5 hover:border-indigo-300"
                            } ${highlightedMaterialId === String(m._id) ? "ring-2 ring-indigo-500 ring-offset-2" : ""}`}
                        >
                            {isUnreadTargetMaterial(m._id) && (
                                <div className="absolute left-3 top-3 md:left-14 z-20 inline-flex items-center rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">
                                    Unread
                                </div>
                            )}
                            {/* TOP RIBBON */}
                            {(() => {
                                const freeMaterial = isMaterialFree(m);
                                const accessState = getAccessState(m);
                                return (
                            <div className={`absolute top-0 right-0 px-2.5 py-1 md:px-3 md:py-1.5 text-xs font-bold rounded-bl-xl shadow-md ${
                                freeMaterial ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white"
                                    : accessState === "owned" ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white"
                                    : accessState === "package" ? "bg-gradient-to-br from-sky-500 to-cyan-600 text-white"
                                    : "bg-gradient-to-br from-yellow-400 to-orange-500 text-white"}`}>
                                {freeMaterial ? "FREE" : accessState === "owned" ? "OWNED" : accessState === "package" ? "UNLOCKED" : "PAID"}
                            </div>
                                );
                            })()}

                            {/* FAVORITE HEART - desktop only (avoids overlap in mobile list) */}
                            <button
                                onClick={() => toggleFavorite(m._id)}
                                className="hidden md:flex absolute top-3 left-3 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white shadow-md hover:shadow-lg transition-all duration-300 z-10 group/fav"
                                title={isFavorite(m._id) ? "Remove from favorites" : "Add to favorites"}
                            >
                                <Heart className={`w-5 h-5 transition-all duration-300 ${isFavorite(m._id) ? "fill-red-500 text-red-500" : "text-gray-400 group-hover/fav:text-red-400"}`} />
                            </button>

                            {/* ── MOBILE card (always horizontal list style) ── */}
                            <div className="md:hidden flex items-center gap-3 p-3 pr-14">
                                {/* Icon */}
                                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-xl shadow-sm">
                                    📘
                                </div>
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-sm text-gray-900 line-clamp-1">{m.title}</h3>
                                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                        <span className="text-xs text-gray-500 truncate max-w-[100px]">{m.subject}</span>
                                        {m.category && <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100">🏷️ {m.category}</span>}
                                    </div>
                                    <span className={`text-xs font-bold mt-0.5 block ${isMaterialFree(m) ? "text-green-600" : getAccessState(m) === "package" ? "text-sky-600" : hasAccess(m) ? "text-indigo-600" : "text-yellow-700"}`}>
                                        {isMaterialFree(m) ? "✨ Free" : getAccessState(m) === "owned" ? "✓ Purchased" : getAccessState(m) === "package" ? "🔓 Package Access" : `₹${m.price}`}
                                    </span>
                                </div>
                                {/* Action */}
                                <div className="flex-shrink-0 flex flex-col gap-1.5">
                                    {hasAccess(m) ? (
                                        <>
                                            <button onClick={() => handleOpenMaterial(m)}
                                                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs active:scale-95 transition-all shadow-sm whitespace-nowrap">
                                                📖 View
                                            </button>
                                            <button onClick={() => { setPreviewMaterial(m); setShowPreviewModal(true); }}
                                                className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 font-semibold text-xs active:scale-95 transition-all whitespace-nowrap flex items-center justify-center gap-1">
                                                <Eye className="w-3 h-3" /> Info
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={() => handlePurchase(m)}
                                            className="px-3 py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold text-xs active:scale-95 transition-all shadow-sm whitespace-nowrap">
                                            🛒 Buy
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* ── DESKTOP: grid / list views ── */}
                            {viewMode === "grid" ? (
                                <div className="hidden md:block">
                                    <div className="flex justify-center mb-4 relative mt-8">
                                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                                        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-4xl shadow-xl transform group-hover:scale-110 transition-transform duration-300">📘</div>
                                    </div>
                                    <h3 className="text-center font-extrabold text-lg bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent line-clamp-2 mb-2">{m.title}</h3>
                                    <div className="flex flex-col items-center gap-2 mb-3">
                                        <p className="text-center text-sm text-gray-600 font-medium">{m.subject}</p>
                                        {m.category && <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">🏷️ {m.category}</span>}
                                    </div>
                                    <div className="mt-4 flex justify-center">
                                        <span className={`px-4 py-2 rounded-full text-sm font-bold tracking-wide shadow-md ${isMaterialFree(m) ? "bg-green-100 text-green-700 border border-green-200" : getAccessState(m) === "package" ? "bg-sky-100 text-sky-700 border border-sky-200" : hasAccess(m) ? "bg-indigo-100 text-indigo-700 border border-indigo-200" : "bg-yellow-100 text-yellow-800 border border-yellow-200"}`}>
                                            {isMaterialFree(m) ? "Free Access" : getAccessState(m) === "owned" ? "Purchased" : getAccessState(m) === "package" ? "Package Unlocked" : `₹ ${m.price} Only`}
                                        </span>
                                    </div>
                                    <div className="mt-6 space-y-2">
                                        {hasAccess(m) && (
                                            <button onClick={() => { setPreviewMaterial(m); setShowPreviewModal(true); }}
                                                className="w-full py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 transition-all duration-300 flex items-center justify-center gap-2">
                                                <Eye className="w-4 h-4" /> Preview
                                            </button>
                                        )}
                                        {hasAccess(m) ? (
                                            <button onClick={() => handleOpenMaterial(m)}
                                                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105">
                                                📖 View Material
                                            </button>
                                        ) : (
                                            <button onClick={() => handlePurchase(m)}
                                                className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold hover:from-yellow-500 hover:to-orange-600 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105">
                                                🛒 Buy Now
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="hidden md:flex flex-row gap-4 items-center">
                                    <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-3xl shadow-md">📘</div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">{m.title}</h3>
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <span className="text-sm text-gray-600 font-medium">{m.subject}</span>
                                            {m.category && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">🏷️ {m.category}</span>}
                                        </div>
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${isMaterialFree(m) ? "bg-green-100 text-green-700" : getAccessState(m) === "package" ? "bg-sky-100 text-sky-700" : hasAccess(m) ? "bg-indigo-100 text-indigo-700" : "bg-yellow-100 text-yellow-800"}`}>
                                            {isMaterialFree(m) ? "Free" : getAccessState(m) === "owned" ? "Purchased" : getAccessState(m) === "package" ? "Package" : `₹${m.price}`}
                                        </span>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        {hasAccess(m) && (
                                            <button onClick={() => { setPreviewMaterial(m); setShowPreviewModal(true); }}
                                                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 transition-all duration-300 flex items-center gap-2">
                                                <Eye className="w-4 h-4" /> Preview
                                            </button>
                                        )}
                                        {hasAccess(m) ? (
                                            <button onClick={() => handleOpenMaterial(m)}
                                                className="px-6 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-300">
                                                📖 View
                                            </button>
                                        ) : (
                                            <button onClick={() => handlePurchase(m)}
                                                className="px-6 py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold text-sm hover:from-yellow-500 hover:to-orange-600 shadow-md hover:shadow-lg transition-all duration-300">
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
                    userName={user?.name || user?.fullName || "EEC User"}
                    userEmail={user?.email || ""}
                    userId={user?._id || user?.id || ""}
                    onClose={() => setOpenPdf(null)}
                />
            )}

            {/* PREVIEW MODAL → bottom sheet on mobile */}
            {showPreviewModal && previewMaterial && (
                <div className="fixed inset-x-0 top-0 bottom-16 md:bottom-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-[80] p-2 md:p-4">
                    <div className="bg-white w-full md:max-w-2xl rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[calc(100%-0.5rem)] md:max-h-[92vh]">
                        {/* Drag handle */}
                        <div className="md:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
                            <div className="w-10 h-1 rounded-full bg-gray-300" />
                        </div>
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 md:px-8 md:py-6 border-b border-gray-100 flex-shrink-0">
                            <h3 className="text-lg md:text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Eye className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" /> Material Preview
                            </h3>
                            <button onClick={() => { setShowPreviewModal(false); setPreviewMaterial(null); }}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        {/* Body */}
                        <div className="px-5 py-4 md:px-8 md:py-6 overflow-y-auto flex-1 space-y-4 pb-6">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-14 h-14 md:w-20 md:h-20 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-3xl md:text-4xl shadow-md">📘</div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-base md:text-xl font-bold text-gray-900 mb-1.5">{previewMaterial.title}</h4>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="px-2.5 py-1 rounded-full text-xs md:text-sm font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">📚 {previewMaterial.subject}</span>
                                        {previewMaterial.category && <span className="px-2.5 py-1 rounded-full text-xs md:text-sm font-semibold bg-blue-100 text-blue-700 border border-blue-200">🏷️ {previewMaterial.category}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl">
                                <div><p className="text-xs text-gray-500 mb-0.5">Class</p><p className="font-semibold text-gray-900 text-sm">{previewMaterial.class || "N/A"}</p></div>
                                <div><p className="text-xs text-gray-500 mb-0.5">Board</p><p className="font-semibold text-gray-900 text-sm">{previewMaterial.board || "N/A"}</p></div>
                                <div><p className="text-xs text-gray-500 mb-0.5">Type</p><p className="font-semibold text-gray-900 text-sm">{isMaterialFree(previewMaterial) ? "Free Resource" : "Premium Content"}</p></div>
                                <div><p className="text-xs text-gray-500 mb-0.5">Price</p><p className="font-semibold text-gray-900 text-sm">{isMaterialFree(previewMaterial) ? "Free" : `₹${previewMaterial.price}`}</p></div>
                            </div>
                            {previewMaterial.createdAt && (
                                <p className="text-xs text-gray-500">
                                    <span className="font-semibold text-gray-700">Uploaded:</span>{" "}
                                    {new Date(previewMaterial.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                                </p>
                            )}
                        </div>
                        {/* Footer buttons */}
                        <div className="flex gap-3 px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:px-8 md:pb-6 bg-gray-50 border-t border-gray-100 flex-shrink-0">
                            <button onClick={() => { setShowPreviewModal(false); setPreviewMaterial(null); }}
                                className="flex-1 px-4 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 active:scale-[0.98] transition-all">
                                Close
                            </button>
                            {hasAccess(previewMaterial) ? (
                                <button onClick={() => { setShowPreviewModal(false); handleOpenMaterial(previewMaterial); }}
                                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm hover:from-indigo-700 hover:to-purple-700 shadow-lg active:scale-[0.98] transition-all">
                                    📖 Open Material
                                </button>
                            ) : (
                                <button onClick={() => { setShowPreviewModal(false); handlePurchase(previewMaterial); }}
                                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold text-sm hover:from-yellow-500 hover:to-orange-600 shadow-lg active:scale-[0.98] transition-all">
                                    🛒 Purchase Now
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* PAYMENT MODAL → bottom sheet on mobile */}
            {showPaymentModal && selectedMaterial && (
                <div className="fixed inset-x-0 top-0 bottom-16 md:bottom-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-[80] p-2 md:p-4">
                    <div className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[calc(100%-0.5rem)] md:max-h-[92vh]">
                        {/* Drag handle */}
                        <div className="md:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
                            <div className="w-10 h-1 rounded-full bg-gray-300" />
                        </div>
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 md:px-8 md:py-6 border-b border-gray-100 flex-shrink-0">
                            <h3 className="text-lg md:text-2xl font-bold text-gray-900">Choose Payment Method</h3>
                            <button onClick={() => setShowPaymentModal(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        {/* Body */}
                        <div className="px-5 py-4 md:px-8 md:py-6 overflow-y-auto flex-1 space-y-3.5 pb-8 md:pb-6">
                            {/* Material info */}
                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4">
                                <p className="text-xs text-gray-500 mb-1">Purchasing</p>
                                <h4 className="font-bold text-gray-900 text-sm mb-2">{selectedMaterial.title}</h4>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Price</span>
                                    <span className="text-xl md:text-2xl font-bold text-indigo-600">₹{selectedMaterial.price}</span>
                                </div>
                            </div>

                            {/* Wallet balance */}
                            {user?.role === "student" && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Wallet className="w-4 h-4 text-amber-600" />
                                            <span className="text-sm font-semibold text-gray-700">Wallet Balance</span>
                                        </div>
                                        <span className="text-base font-bold text-amber-600">₹{wallet.toFixed(2)}</span>
                                    </div>
                                    {wallet >= selectedMaterial.price ? (
                                        <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                            Sufficient balance available
                                        </p>
                                    ) : (
                                        <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                            Need ₹{(selectedMaterial.price - wallet).toFixed(2)} more
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Payment options */}
                            <div className="space-y-2.5">
                                {user?.role === "student" && wallet >= selectedMaterial.price && (
                                    <button onClick={() => purchaseWithWallet(selectedMaterial)}
                                        className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold shadow-md active:scale-[0.98] transition-all group">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white/20 rounded-lg"><Wallet className="w-5 h-5" /></div>
                                            <div className="text-left">
                                                <p className="font-bold text-sm">Pay with Wallet</p>
                                                <p className="text-xs text-white/80">Instant purchase</p>
                                            </div>
                                        </div>
                                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                )}
                                <button onClick={() => purchaseWithRazorpay(selectedMaterial)}
                                    className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-md active:scale-[0.98] transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white/20 rounded-lg"><CreditCard className="w-5 h-5" /></div>
                                        <div className="text-left">
                                            <p className="font-bold text-sm">Pay with Card/UPI</p>
                                            <p className="text-xs text-white/80">Razorpay secure payment</p>
                                        </div>
                                    </div>
                                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>

                            <p className="text-xs text-gray-400 text-center flex justify-center items-center gap-1">
                                <Lock size={10} /> All transactions are secure and encrypted
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
