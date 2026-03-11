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
} from "lucide-react";

import QuestionsSidebarBlock from "../components/questions/QuestionsSidebarBlock";
import ExamSidebarBlock from "../components/exams/ExamSidebarBlock";
import SettingsSidebarBlock from "../components/settings/SettingsSidebarBlock";
import SyllabusSidebarBlock from "../components/syllabus/SyllabusSidebarBlock";
import Header from "../components/Header";
import TeacherVerification from "../components/TeacherVerification";
import { toast } from "react-toastify";

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
    const navigate = useNavigate();
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const [online, setOnline] = useState(
        typeof navigator !== "undefined" ? navigator.onLine : true
    );
    const [showTeacherVerification, setShowTeacherVerification] = useState(false);

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

    // Check if teacher needs verification
    useEffect(() => {
        if (user?.role === "teacher" && !user?.isTeacherVerified) {
            setShowTeacherVerification(true);
        }
    }, [user]);

    /* ---- auth guard (UNCHANGED) ---- */
    if (!isTokenValid(token) || !user?.role) {
        localStorage.removeItem("jwt");
        localStorage.removeItem("user");
        window.dispatchEvent(new CustomEvent("eec:auth", { detail: { type: "logout" } }));
        return <Navigate to="/" replace />;
    }

    const role = String(user.role || "").toLowerCase();

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
                { to: "/dashboard/packages", label: "Packages", icon: <CreditCard size={18} /> }
            );
        }

        if (role === "teacher") {
            base.push(
                { to: "/dashboard/student-analytics", label: "Student Analytics", icon: <BarChart3 size={18} /> },
                { to: "/dashboard/study-materials/upload", label: "Upload Materials", icon: <Library size={18} /> },
                { to: "/dashboard/notifications/create", label: "Send Notifications", icon: <LayoutGrid size={18} /> }
            );
        }

        return base;
    }, [role]);

    useEffect(() => {
        setOpen(false);
    }, [location.pathname]);

    /* ---- SIDEBAR LINK STYLES (SCREENSHOT MATCHED) ---- */
    const linkBase =
        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-orange-800 transition-all";

    const linkActive =
        "bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-md";

    const blockOfflineNavigation = (e) => {
        if (online) return;
        e.preventDefault();
        toast.warn("You are offline. Try to connect to the internet.");
    };

    return (
        // <div className="h-screen overflow-hidden bg-[#FFFBEA]">
        <div className="h-screen overflow-hidden">
            {/* HEADER */}
            <Header sidebarOpen={open} setSidebarOpen={setOpen} />

            <div className="flex">
                {/* MOBILE BACKDROP */}
                {open && (
                    <div
                        className="fixed inset-0 z-30 bg-black/40 md:hidden"
                        onClick={() => setOpen(false)}
                    />
                )}

                {/* SIDEBAR */}
                <aside
                    className={`fixed z-40 top-16 md:top-18 bottom-0 w-72
  bg-[#FFF7DB] border-r border-yellow-200
  transition-transform
  ${open ? "translate-x-0" : "-translate-x-full"}
  md:translate-x-0`}
                >
                    {/* <div className="h-full overflow-y-auto px-3 py-4"> */}
                    <div className="h-full flex flex-col px-3 py-4">

                        {/* SIDEBAR HEADER */}
                        <div className="flex items-center gap-3 px-3 py-3 mb-4 border-b border-yellow-200">
                            <div className="w-9 h-9 rounded-full bg-white shadow flex items-center justify-center">
                                🎓
                            </div>
                            <span className="text-lg font-bold text-orange-700">
                                {user.role === "admin" ? "Admin" : user.role === "teacher" ? "Teacher" : "Student"} Portal
                            </span>
                        </div>

                        {/* MAIN NAV */}
                        {/* SCROLLABLE AREA */}
                        <div className="flex-1 overflow-y-auto">
                            {!online && (
                                <div className="mx-1 mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                                    You are offline. Try to connect to the internet.
                                </div>
                            )}
                            <nav className="space-y-1">
                                {NAV.map((item) => (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        end={item.end}
                                        onClick={blockOfflineNavigation}
                                        className={({ isActive }) =>
                                            `${linkBase} ${
                                                !online
                                                    ? "text-slate-400 bg-slate-100 cursor-not-allowed"
                                                    : isActive
                                                    ? linkActive
                                                    : "hover:bg-yellow-100"
                                            }`
                                        }
                                    >
                                        {item.icon}
                                        <span>{item.label}</span>
                                    </NavLink>
                                ))}

                                <div className={online ? "" : "opacity-40 pointer-events-none select-none"}>
                                    <SyllabusSidebarBlock role={role} />
                                    <ExamSidebarBlock role={role} />
                                    <QuestionsSidebarBlock role={role} />
                                    <SettingsSidebarBlock role={role} />
                                </div>
                            </nav>
                        </div>

                        {/* BOTTOM SECTION */}
                        {/* BOTTOM SECTION */}
                        <div className="pt-4 border-t border-yellow-200 space-y-3">

                            {/* PROFILE CARD */}
                            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white shadow-sm">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center text-white font-bold">
                                    {user?.avatar ? (
                                        <img
                                            src={user.avatar}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        user?.name?.[0]?.toUpperCase() || "U"
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 truncate" title={user?.name || "User"}>
                                        {user?.name || "User"}
                                    </p>
                                    <p className="text-xs text-slate-500 truncate" title={user?.email || "user@email.com"}>
                                        {user?.email || "user@email.com"}
                                    </p>
                                </div>

                                {/* ONLINE STATUS */}
                                <div className="flex items-center gap-1 text-xs font-medium">
                                    <span
                                        className={`w-2 h-2 rounded-full ${online ? "bg-green-500" : "bg-gray-400"
                                            }`}
                                    />
                                    <span className={online ? "text-green-600" : "text-gray-500"}>
                                        {online ? "Online" : "Offline"}
                                    </span>
                                </div>
                            </div>

                            {/* LOGOUT */}
                            <button
                                onClick={() => {
                                    localStorage.removeItem("jwt");
                                    localStorage.removeItem("user");
                                    window.dispatchEvent(new CustomEvent("eec:auth", { detail: { type: "manual-logout" } }));
                                    toast.success("Logged out successfully");
                                    navigate("/", { replace: true });
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 font-semibold hover:bg-red-50 transition"
                                title="Logout"
                            >
                                <LogOut size={18} />
                                Logout
                            </button>
                        </div>
                    </div>
                </aside>

                {/* MAIN CONTENT */}
                <main
                    className={`
            ml-0 md:ml-72
            h-[calc(100vh-56px)]
            overflow-y-auto
            w-full
            ${role === "student" ? "pb-16 md:pb-0" : ""}
          `}
                >
                    <div className="mx-auto max-w-7xl">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* MOBILE / TABLET FOOTER NAV — students only, visible below md */}
            {role === "student" && (
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
                                    `flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors ${
                                        !online
                                            ? "text-slate-400"
                                            : isActive
                                            ? "text-orange-600"
                                            : "text-orange-800/50 hover:text-orange-700"
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <span className={`transition-transform ${isActive ? "scale-110" : ""}`}>
                                            {item.icon}
                                        </span>
                                        <span>{item.label}</span>
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
