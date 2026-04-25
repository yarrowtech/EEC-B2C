// // src/layouts/DashboardLayout.jsx
// import React, { useMemo, useState, useEffect } from "react";
// import { Outlet, NavLink, Navigate, useLocation, useNavigate } from "react-router-dom";
// import { Home, Users, CheckCircle2, Library, LogOut, Menu, LayoutGrid } from "lucide-react";
// import QuestionsSidebarBlock from "../components/questions/QuestionsSidebarBlock";
// import ExamSidebarBlock from "../components/exams/ExamSidebarBlock";
// import SettingsSidebarBlock from "../components/settings/SettingsSidebarBlock";
// import Header from "../components/Header";

// /* ---- keep same local guard helpers ---- */
// function getToken() {
//     return localStorage.getItem("jwt") || "";
// }
// function getUser() {
//     try {
//         return JSON.parse(localStorage.getItem("user") || "null");
//     } catch {
//         return null;
//     }
// }

// function isTokenValid(token) {
//     if (!token) return false;
//     try {
//         const { exp } = JSON.parse(atob(token.split(".")[1] || ""));
//         return typeof exp === "number" && Date.now() < exp * 1000;
//     } catch {
//         return false;
//     }
// }

// export default function DashboardLayout() {
//     const token = getToken();
//     const user = getUser();
//     const navigate = useNavigate();
//     const location = useLocation();
//     const [open, setOpen] = useState(false);

//     // auth guard
//     if (!isTokenValid(token) || !user?.role) {
//         localStorage.removeItem("jwt");
//         localStorage.removeItem("user");
//         window.dispatchEvent(new CustomEvent("eec:auth", { detail: { type: "logout" } }));
//         return <Navigate to="/" replace />; ``
//     }

//     const role = String(user.role || "").toLowerCase();

//     // role-based nav items
//     const NAV = useMemo(() => {
//         const base = [
//             { to: "/dashboard", label: "Home", icon: <Home size={18} />, end: true },
//             // { to: "/dashboard/students", label: "Students", icon: <Users size={18} /> },
//         ];
//         if (role === "admin") {
//             base.splice(1, 0, { to: "/dashboard/students", label: "Students", icon: <Users size={18} /> });
//             // base.splice(1, 0, { to: "/dashboard/approvals", label: "Approvals", icon: <CheckCircle2 size={18} /> });
//             base.splice(2, 0, { to: "/dashboard/teachers", label: "Teachers", icon: <Users size={18} /> });
//             base.splice(3, 0, { to: "/dashboard/results", label: "Results", icon: <LayoutGrid size={18} /> });
//             base.splice(4, 0, { to: "/dashboard/study-materials/upload", label: "Upload Study Material", icon: <Library size={18} /> });
//             // base.splice(4, 0, { to: `/dashboard/chat/${user.id}`, label: "Chat", icon: <LayoutGrid size={18} /> });
//         }
//         if (role === "teacher") {
//             // base.splice(1, 0, { to: "/dashboard/classes", label: "Classes", icon: <Library size={18} /> });
//             //  base.splice(1, 0, { to: "/dashboard/teachers", label: "Teachers", icon: <Users size={18} /> });
//             base.splice(2, 0, { to: "/dashboard/results", label: "Results", icon: <LayoutGrid size={18} /> });
//             // base.splice(3, 0, { to: `/dashboard/chat/${user.id}`, label: "Chat", icon: <LayoutGrid size={18} /> });
//         }
//         return base;
//     }, [role]);

//     // close mobile drawer on route change
//     useEffect(() => {
//         setOpen(false);
//     }, [location.pathname]);

//     const linkBase =
//         "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-100 transition-colors";
//     const linkActive =
//         "bg-gradient-to-br from-slate-200 to-slate-100 text-slate-900 shadow-[inset_0_0_0_1px_rgba(2,6,23,0.06)]";

//     return (
//         // <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100 selection:bg-blue-600/15">
//         <div className="h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100 selection:bg-blue-600/15">
//             {/* FIXED HEADER (front) */}
//             {/* <header className="fixed inset-x-0 top-0 z-50 border-b border-white/60 bg-white/70 backdrop-blur-md supports-[backdrop-filter]:bg-white/55 shadow-sm">
//                 <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
//                     <div className="flex items-center gap-3">
//                         <div className="size-8 rounded-xl bg-gradient-to-br from-yellow-600 to-orange-600 shadow-sm" />
//                         <div className="leading-tight">
//                             <div className="text-sm font-semibold text-slate-800 tracking-tight">
//                                 Electronic Educare
//                             </div>
//                         </div>
//                     </div>
//                     <div className="hidden sm:flex items-center gap-4">
//                         <div className="relative group">
//                             <button className="flex items-center gap-2 px-2 py-0.5 rounded-full border bg-white/70 backdrop-blur hover:bg-white transition">
//                                 <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-600 to-orange-600 flex items-center justify-center text-white font-semibold">
//                                     {user?.name?.[0] || "U"}
//                                 </div>
//                                 <span className="text-sm font-medium text-slate-800">
//                                     {user?.name || "User"}
//                                 </span>
//                             </button>
//                             <div className="absolute right-0 mt-2 w-40 rounded-lg border bg-white shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
//                                 <button
//                                     onClick={() => navigate("/dashboard/profile")}
//                                     className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100"
//                                 >
//                                     Profile
//                                 </button>

//                                 <button
//                                     onClick={() => {
//                                         localStorage.removeItem("jwt");
//                                         localStorage.removeItem("user");
//                                         window.dispatchEvent(new CustomEvent("eec:auth", { detail: { type: "logout" } }));
//                                         navigate("/", { replace: true });
//                                     }}
//                                     className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100"
//                                 >
//                                     Logout
//                                 </button>
//                             </div>
//                         </div>
//                     </div>
//                     <button
//                         onClick={() => setOpen((s) => !s)}
//                         className="sm:hidden inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm bg-white/70 backdrop-blur hover:bg-white transition-colors"
//                         aria-label="Toggle Menu"
//                         aria-expanded={open}
//                         aria-controls="dashboard-sidebar"
//                     >
//                         <Menu size={18} />
//                     </button>
//                 </div>
//             </header> */}
//             <Header sidebarOpen={open} setSidebarOpen={setOpen} />
//             {/* SHELL */}
//             <div className="pt-0 flex">
//                 {/* Mobile backdrop */}
//                 {open && (
//                     <div className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-[2px] sm:hidden" onClick={() => setOpen(false)} />
//                 )}

//                 {/* SIDEBAR (fixed; under header) */}
//                 <aside
//                     id="dashboard-sidebar"
//                     className={`fixed z-40 top-14 bottom-0 w-72 border-r border-white/70 bg-white/90 backdrop-blur-md transition-transform sm:translate-x-0
//           ${open ? "translate-x-0" : "-translate-x-full"} sm:static`}
//                     aria-label="Sidebar"
//                 >
//                     <div className="h-full overflow-y-auto p-3">
//                         {/* Brand block */}
//                         <div className="mb-3 rounded-xl border border-white/70 bg-white/70 backdrop-blur p-3 flex items-center justify-between">
//                             <div className="flex items-center gap-2">
//                                 <div className="size-7 rounded-lg bg-gradient-to-br from-yellow-600 to-orange-600" />
//                                 <div className="text-sm font-semibold text-slate-800">Dashboard</div>
//                             </div>
//                             <LayoutGrid size={16} className="text-slate-500" />
//                         </div>

//                         {/* Nav */}
//                         <nav className="space-y-1">
//                             {NAV.map((item) => (
//                                 <NavLink
//                                     key={item.to}
//                                     to={item.to}
//                                     end={item.end}
//                                     className={({ isActive }) =>
//                                         `${linkBase} ${isActive ? linkActive : "text-slate-700"}`
//                                     }
//                                 >
//                                     <span className="text-slate-700">{item.icon}</span>
//                                     <span className="truncate">{item.label}</span>
//                                 </NavLink>
//                             ))}
//                             <QuestionsSidebarBlock role={role} />
//                             <ExamSidebarBlock role={role} />
//                             <SettingsSidebarBlock role={role} />
//                         </nav>

//                         {/* Logout */}
//                         <div className="mt-6 border-t pt-3">
//                             <button
//                                 onClick={() => {
//                                     localStorage.removeItem("jwt");
//                                     localStorage.removeItem("user");
//                                     window.dispatchEvent(new CustomEvent("eec:auth", { detail: { type: "logout" } }));
//                                     navigate("/", { replace: true });
//                                 }}
//                                 className="w-full inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
//                             >
//                                 <LogOut size={16} />
//                                 Logout
//                             </button>
//                         </div>
//                     </div>
//                 </aside>

//                 {/* MAIN CONTENT (pushed right of fixed sidebar on sm+) */}
//                 <main className="h-[calc(100vh-56px)] overflow-y-auto w-full">
//                     <div className="mx-auto max-w-7xl px-4 py-6">
//                         <Outlet />
//                     </div>
//                 </main>

//             </div>
//         </div>
//     );
// }

// src/layouts/DashboardLayout.jsx
import React, { useMemo, useState, useEffect } from "react";
import { Outlet, NavLink, Navigate, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Home,
    Users,
    Library,
    LogOut,
    LayoutGrid,
    Gift,
    ShoppingCart,
    CreditCard,
    BarChart3,
    BookOpen,
    ListChecks,
    Trophy,
    User,
    BriefcaseBusiness,
} from "lucide-react";

import QuestionsSidebarBlock from "../components/questions/QuestionsSidebarBlock";
import ExamSidebarBlock from "../components/exams/ExamSidebarBlock";
import SettingsSidebarBlock from "../components/settings/SettingsSidebarBlock";
import SyllabusSidebarBlock from "../components/syllabus/SyllabusSidebarBlock";
import TeacherVerification from "../components/TeacherVerification";
import { toast } from "react-toastify";
import { confirmAndLogout } from "../lib/confirmLogout";

/* ---- auth helpers (UNCHANGED) ---- */
function getToken() {
    return localStorage.getItem("jwt") || "";
}
function getUser() {
    try {
        return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
        return null;
    }
}
function isTokenValid(token) {
    if (!token) return false;
    try {
        const { exp } = JSON.parse(atob(token.split(".")[1] || ""));
        return typeof exp === "number" && Date.now() < exp * 1000;
    } catch {
        return false;
    }
}

export default function DashboardLayout() {
    const token = getToken();
    const user = getUser();
    const role = String(user?.role || "").toLowerCase();
    const navigate = useNavigate();
    const location = useLocation();
    const isExamTakeRoute = location.pathname.startsWith("/dashboard/exams/take/");
    const [open, setOpen] = useState(false);
    const [online, setOnline] = useState(
        typeof navigator !== "undefined" ? navigator.onLine : true
    );
    const [showTeacherVerification, setShowTeacherVerification] = useState(false);
    const [studyMaterialsUnreadIds, setStudyMaterialsUnreadIds] = useState([]);
    const [dailyChallenge, setDailyChallenge] = useState({
        loading: false,
        hasQuestion: false,
        alreadyAttempted: false,
        isCorrect: null,
        streak: 0,
        streakBroken: false,
        badge: "none",
    });

    useEffect(() => {
        const goOnline = () => {
            setOnline(true);
            toast.success("Back online");
        };
        const goOffline = () => {
            setOnline(false);
            toast.warn("You are offline. Try to connect to the internet.");
        };

        window.addEventListener("online", goOnline);
        window.addEventListener("offline", goOffline);
        return () => {
            window.removeEventListener("online", goOnline);
            window.removeEventListener("offline", goOffline);
        };
    }, []);

    useEffect(() => {
        if (role !== "student" || !token) {
            setStudyMaterialsUnreadIds([]);
            return;
        }

        const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const currentUserId = String(user?._id || user?.id || "");
        if (!currentUserId) return;
        let cancelled = false;

        async function loadStudyMaterialUnread() {
            try {
                const res = await fetch(`${API}/api/notifications`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json().catch(() => []);
                if (!res.ok || cancelled) return;

                const unreadIds = (Array.isArray(data) ? data : [])
                    .filter((n) => {
                        if (n?.source !== "study-material") return false;
                        const readByIds = Array.isArray(n?.readBy)
                            ? n.readBy.map((id) => String(id))
                            : [];
                        return !readByIds.includes(currentUserId);
                    })
                    .map((n) => n._id)
                    .filter(Boolean);

                setStudyMaterialsUnreadIds(unreadIds);
            } catch {
                if (!cancelled) setStudyMaterialsUnreadIds([]);
            }
        }

        loadStudyMaterialUnread();

        const onServiceWorkerMessage = (event) => {
            if (event?.data?.type === "NOTIFICATION_RECEIVED") {
                loadStudyMaterialUnread();
            }
        };
        const onAuthOrNotificationUpdate = () => loadStudyMaterialUnread();

        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.addEventListener("message", onServiceWorkerMessage);
        }
        window.addEventListener("eec:auth", onAuthOrNotificationUpdate);

        return () => {
            cancelled = true;
            if ("serviceWorker" in navigator) {
                navigator.serviceWorker.removeEventListener("message", onServiceWorkerMessage);
            }
            window.removeEventListener("eec:auth", onAuthOrNotificationUpdate);
        };
    }, [role, token, user?._id, user?.id]);

    useEffect(() => {
        if (role !== "student" || !token) return;
        if (!location.pathname.startsWith("/dashboard/study-materials")) return;
        if (studyMaterialsUnreadIds.length === 0) return;

        const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
        let cancelled = false;

        async function markStudyMaterialAsRead() {
            try {
                await Promise.all(
                    studyMaterialsUnreadIds.map((id) =>
                        fetch(`${API}/api/notifications/${id}/read`, {
                            method: "POST",
                            headers: { Authorization: `Bearer ${token}` },
                        })
                    )
                );
                if (!cancelled) setStudyMaterialsUnreadIds([]);
            } catch {
                // Keep badge if marking as read fails.
            }
        }

        markStudyMaterialAsRead();
        return () => {
            cancelled = true;
        };
    }, [role, token, location.pathname, studyMaterialsUnreadIds]);

    // Check if teacher needs verification
    useEffect(() => {
        if (user?.role === "teacher" && !user?.isTeacherVerified) {
            setShowTeacherVerification(true);
        }
    }, [user]);

    useEffect(() => {
        if (role !== "student" || !token) return;
        let mounted = true;

        async function loadDailyChallenge() {
            setDailyChallenge((prev) => ({ ...prev, loading: true }));
            try {
                const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
                const res = await fetch(`${API}/api/daily-challenge/today`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json().catch(() => ({}));
                if (!mounted) return;

                if (!res.ok) {
                    setDailyChallenge({
                        loading: false,
                        hasQuestion: false,
                        alreadyAttempted: false,
                        isCorrect: null,
                        streak: 0,
                        streakBroken: false,
                        badge: "none",
                    });
                    return;
                }

                setDailyChallenge({
                    loading: false,
                    hasQuestion: Boolean(data?.question?._id),
                    alreadyAttempted: Boolean(data?.alreadyAttempted),
                    isCorrect: data?.isCorrect ?? null,
                    streak: Number(data?.streak || 0),
                    streakBroken: Boolean(data?.streakBroken),
                    badge: String(data?.badge || "none").toLowerCase(),
                });
            } catch {
                if (!mounted) return;
                setDailyChallenge({
                    loading: false,
                    hasQuestion: false,
                    alreadyAttempted: false,
                    isCorrect: null,
                    streak: 0,
                    streakBroken: false,
                    badge: "none",
                });
            }
        }

        loadDailyChallenge();
        return () => {
            mounted = false;
        };
    }, [role, token, location.pathname]);

    /* ---- auth guard (UNCHANGED) ---- */
    if (!isTokenValid(token) || !user?.role) {
        localStorage.removeItem("jwt");
        localStorage.removeItem("user");
        window.dispatchEvent(new CustomEvent("eec:auth", { detail: { type: "logout" } }));
        return <Navigate to="/" replace />;
    }

    /* ---- role-based nav (UNCHANGED) ---- */
    const NAV = useMemo(() => {
        const base = [
            { to: "/dashboard", label: "Dashboard", icon: <Home size={18} />, end: true },
        ];

        // Add Self Study for all users (students, teachers, admins)
        // base.push(
        //     { to: "/dashboard/self-study", label: "Self Study", icon: <Library size={18} /> }
        // );

        if (role === "admin") {
            base.push(
                { to: "/dashboard/students", label: "Students", icon: <Users size={18} /> },
                { to: "/dashboard/teachers", label: "Teachers", icon: <Users size={18} /> },
                { to: "/dashboard/student-analytics", label: "Student Analytics", icon: <BarChart3 size={18} /> },
                { to: "/dashboard/teacher-analytics", label: "Teacher Analytics", icon: <BarChart3 size={18} /> },
                { to: "/dashboard/job-applications", label: "Job Applications", icon: <BriefcaseBusiness size={18} /> },
                { to: "/dashboard/results", label: "Results", icon: <LayoutGrid size={18} /> },
                { to: "/dashboard/study-materials/upload", label: "Upload Materials", icon: <Library size={18} /> },
                { to: "/dashboard/notifications/create", label: "Send Notifications", icon: <LayoutGrid size={18} /> },
                { to : "/dashboard/gift-cards", label: "Gift Cards", icon: <Gift size={18} /> },
                { to : "/dashboard/purchases", label: "Purchases", icon: <ShoppingCart size={18} /> },
                { to: "/dashboard/subscriptions", label: "Subscriptions", icon: <CreditCard size={18} /> },
                { to: "/dashboard/packages/manage", label: "Manage Packages", icon: <CreditCard size={18} /> }
            );
        }

        if (role === "student") {
            base.push(
                // { to: "/dashboard/packages", label: "Packages", icon: <CreditCard size={18} /> }
            );
        }

        if (role === "teacher") {
            base.push(
                { to: "/dashboard/study-materials/upload", label: "Upload Materials", icon: <Library size={18} /> }
            );
        }

        return base;
    }, [role]);

    useEffect(() => {
        setOpen(false);
    }, [location.pathname]);

    const blockOfflineNavigation = (e) => {
        if (online) return;
        e.preventDefault();
        toast.warn("You are offline. Try to connect to the internet.");
    };

    async function handleLogout() {
        const didLogout = await confirmAndLogout();
        if (didLogout) {
            setOpen(false);
        }
    }

    const challengeProgress = dailyChallenge.loading
        ? 0
        : dailyChallenge.alreadyAttempted
            ? 100
            : 0;

    const challengeMessage = dailyChallenge.loading
        ? "Loading today's challenge..."
        : !dailyChallenge.hasQuestion
            ? "No daily challenge available for your class and board."
            : dailyChallenge.alreadyAttempted
                ? dailyChallenge.isCorrect
                    ? `Completed today. Streak: ${dailyChallenge.streak} day(s).`
                    : "Completed today. Incorrect answer, streak reset."
                : dailyChallenge.streakBroken
                    ? "Streak uncompleted. Attempt today to restart."
                    : `Attempt today to continue your ${dailyChallenge.streak} day streak.`;

    return (
        // <div className="h-screen overflow-hidden bg-[#FFFBEA]">
        <div className="h-screen overflow-hidden">
            <div className="flex">
                {/* MOBILE BACKDROP */}
                <AnimatePresence>
                    {open && !isExamTakeRoute && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="fixed inset-0 z-30 bg-black/40 md:hidden"
                            onClick={() => setOpen(false)}
                        />
                    )}
                </AnimatePresence>

                {/* SIDEBAR */}
                <aside
                    className={`fixed z-40 top-0 bottom-0 w-80
  bg-white border-r border-slate-200 shadow-sm
  transition-transform duration-300 ease-in-out
  ${open ? "translate-x-0" : "-translate-x-full"}
  md:translate-x-0
  ${isExamTakeRoute ? "hidden" : ""}`}
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                    <div className="h-full flex flex-col p-6 overflow-x-hidden">
                        {/* SCROLLABLE NAVIGATION */}
                        <div className="flex-1 overflow-y-auto overflow-x-hidden sidebar-scroll pr-2">
                                {!online && (
                                    <div className="mx-1 mb-2 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                                        You are offline. Connect to continue.
                                    </div>
                                )}

                                <nav className="flex flex-col gap-2 w-full overflow-x-hidden">
                                    {NAV.map((item, idx) => {
                                        // Cycle through colors for each nav item
                                        const iconColors = ['text-[#FFD23F]', 'text-[#4ECDC4]', 'text-[#FF6B6B]'];
                                        const iconColor = iconColors[idx % iconColors.length];

                                        return (
                                            <NavLink
                                                key={item.to}
                                                to={item.to}
                                                end={item.end}
                                                onClick={blockOfflineNavigation}
                                                className={({ isActive }) =>
                                                    `flex items-center gap-4 px-4 py-3 rounded-full font-bold transition-all duration-300 hover:scale-[1.02] hover:shadow-sm whitespace-nowrap overflow-hidden ${
                                                        !online
                                                            ? "text-slate-400 bg-slate-100 cursor-not-allowed"
                                                            : isActive
                                                            ? "bg-[#e7c555] text-[#211d11] shadow-md shadow-[#e7c555]/30"
                                                            : "text-slate-600 hover:bg-slate-100"
                                                    }`
                                                }
                                            >
                                                {({ isActive }) => (
                                                    <>
                                                        <span className={`material-symbols-outlined ${isActive ? '' : iconColor}`}>
                                                            {item.to === '/dashboard' ? 'grid_view' :
                                                             item.to.includes('student') ? 'groups' :
                                                             item.to.includes('teacher') ? 'school' :
                                                             item.to.includes('result') ? 'leaderboard' :
                                                             item.to.includes('package') ? 'inventory_2' :
                                                             item.to.includes('gift') ? 'card_giftcard' :
                                                             item.to.includes('purchase') ? 'shopping_cart' :
                                                             item.to.includes('subscription') ? 'credit_card' :
                                                             item.to.includes('upload') || item.to.includes('material') ? 'menu_book' :
                                                             item.to.includes('notification') ? 'notifications' :
                                                             'description'}
                                                        </span>
                                                        <span className="text-sm truncate">{item.label}</span>
                                                    </>
                                                )}
                                            </NavLink>
                                        );
                                    })}

                                    <div className={online ? "" : "opacity-40 pointer-events-none select-none"}>
                                        <SyllabusSidebarBlock role={role} />
                                        <ExamSidebarBlock
                                            role={role}
                                            studyMaterialsUnreadCount={studyMaterialsUnreadIds.length}
                                        />
                                        <QuestionsSidebarBlock role={role} />
                                        <SettingsSidebarBlock role={role} />
                                    </div>
                                </nav>
                        </div>

                        {/* USER PROFILE & LOGOUT */}
                        <div className="flex-shrink-0 flex flex-col gap-4 border-t border-slate-100 pt-6 mt-4">
                            {/* DAILY CHALLENGE - Students Only */}
                            {role === "student" && (
                                <div
                                    onClick={() => {
                                        if (dailyChallenge.hasQuestion && !dailyChallenge.alreadyAttempted) {
                                            navigate("/dashboard/daily-challenge");
                                        }
                                    }}
                                    className={`p-4 bg-[#e7c555]/5 rounded-2xl border border-[#e7c555]/20 transition-all duration-300 ${
                                        dailyChallenge.hasQuestion && !dailyChallenge.alreadyAttempted
                                            ? "cursor-pointer hover:bg-[#e7c555]/10 hover:border-[#e7c555]/30"
                                            : "opacity-95"
                                    }`}
                                >
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-bold text-slate-800">Daily Challenge</p>
                                            {!dailyChallenge.loading && dailyChallenge.hasQuestion && (
                                                <span
                                                    className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                                                        dailyChallenge.alreadyAttempted
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : "bg-[#e7c555]/30 text-slate-800"
                                                    }`}
                                                >
                                                    {dailyChallenge.alreadyAttempted ? "Completed" : "Pending"}
                                                </span>
                                            )}
                                        </div>
                                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${challengeProgress}%` }}
                                                transition={{ duration: 0.8, ease: "easeOut" }}
                                                className="bg-[#e7c555] h-full"
                                            ></motion.div>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            {challengeMessage}
                                        </p>
                                        {!dailyChallenge.loading && dailyChallenge.hasQuestion && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (dailyChallenge.alreadyAttempted) return;
                                                    navigate("/dashboard/daily-challenge");
                                                }}
                                                disabled={dailyChallenge.alreadyAttempted}
                                                className={`w-full rounded-full px-3 py-2 text-xs font-bold transition ${
                                                    dailyChallenge.alreadyAttempted
                                                        ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                                                        : "bg-[#e7c555] text-slate-900 hover:brightness-95"
                                                }`}
                                            >
                                                {dailyChallenge.alreadyAttempted ? "Completed Today" : "Start Challenge"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* PROFILE CARD */}
                            <div className="flex items-center gap-3 px-2">
                                <div className="h-12 w-12 rounded-full border-4 border-[#4ECDC4] overflow-hidden">
                                    {user?.avatar ? (
                                        <img
                                            className="h-full w-full object-cover"
                                            src={user.avatar}
                                            alt="User avatar"
                                        />
                                    ) : (
                                        <div className="h-full w-full bg-gradient-to-br from-[#FFD23F] to-[#FF6B6B] flex items-center justify-center text-white font-bold text-lg">
                                            {user?.name?.[0]?.toUpperCase() || "U"}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-sm font-bold text-slate-900 leading-tight truncate max-w-[160px]" title={user?.name || "User"}>
                                        {user?.name || "User"}
                                    </p>
                                    <p className="text-xs font-medium text-[#4ECDC4]">
                                        {online ? "Online" : "Offline"}
                                    </p>
                                </div>
                            </div>

                            {/* LOGOUT BUTTON */}
                            <button
                                onClick={handleLogout}
                                className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-100 py-3 text-sm font-bold text-[#FF6B6B] transition-all duration-300 hover:bg-[#FF6B6B] hover:text-white hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <span className="material-symbols-outlined text-lg">logout</span>
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </aside>

                {/* MAIN CONTENT */}
                <main
                    className={`
            ml-0 ${isExamTakeRoute ? "" : "md:ml-80"}
            h-screen
            overflow-y-auto
            w-full
            ${role === "student" && !isExamTakeRoute ? "pb-16 md:pb-0" : ""}
          `}
                >
                    <div className="mx-auto max-w-7xl">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* MOBILE / TABLET FOOTER NAV — students only, visible below md */}
            {role === "student" && !isExamTakeRoute && (
                <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#FFF7DB] border-t-2 border-yellow-300 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
                    <div className="flex items-stretch h-16">
                        {[
                            { to: "/dashboard", label: "Home", icon: <Home size={22} />, end: true },
                            { to: "/dashboard/syllabus?stage=1", label: "Exam", icon: <BookOpen size={22} /> },
                            { to: "/dashboard/study-materials", label: "Study", icon: <Library size={22} /> },
                            { to: "/dashboard/result", label: "Results", icon: <ListChecks size={22} /> },
                            { to: "/dashboard/leaderboard", label: "Ranks", icon: <Trophy size={22} /> },
                            { to: "/dashboard/profile", label: "Profile", icon: <User size={22} /> },
                        ].map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                onClick={blockOfflineNavigation}
                                className={({ isActive }) =>
                                    `flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-all duration-300 ${
                                        !online
                                            ? "text-slate-400"
                                            : isActive
                                            ? "text-orange-600"
                                            : "text-orange-800/50 hover:text-orange-700 active:scale-95"
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <span className={`relative transition-transform duration-300 ${isActive ? "scale-110" : ""}`}>
                                            {item.icon}
                                            {item.to === "/dashboard/study-materials" &&
                                                studyMaterialsUnreadIds.length > 0 && (
                                                    <span className="absolute -right-2 -top-2 min-w-[16px] h-4 px-1 rounded-full bg-emerald-500 text-white text-[9px] leading-4 text-center font-bold shadow">
                                                        {studyMaterialsUnreadIds.length > 99 ? "99+" : studyMaterialsUnreadIds.length}
                                                    </span>
                                                )}
                                        </span>
                                        <span className="transition-all duration-300">{item.label}</span>
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </div>
                </nav>
            )}

            {/* Teacher Verification Modal */}
            {showTeacherVerification && user?.role === "teacher" && (
                <TeacherVerification
                    onComplete={() => {
                        setShowTeacherVerification(false);
                        // Refresh user data
                        const updatedUser = { ...user, isTeacherVerified: true };
                        localStorage.setItem("user", JSON.stringify(updatedUser));
                        window.location.reload();
                    }}
                />
            )}

        </div>
    );
}
