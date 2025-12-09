// src/layouts/DashboardLayout.jsx
import React, { useMemo, useState, useEffect } from "react";
import { Outlet, NavLink, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Home, Users, CheckCircle2, Library, LogOut, Menu, LayoutGrid } from "lucide-react";
import QuestionsSidebarBlock from "../components/questions/QuestionsSidebarBlock";
import ExamSidebarBlock from "../components/exams/ExamSidebarBlock";
import SettingsSidebarBlock from "../components/settings/SettingsSidebarBlock";

/* ---- keep same local guard helpers ---- */
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

    // auth guard
    if (!isTokenValid(token) || !user?.role) {
        localStorage.removeItem("jwt");
        localStorage.removeItem("user");
        window.dispatchEvent(new CustomEvent("eec:auth", { detail: { type: "logout" } }));
        return <Navigate to="/" replace />; ``
    }

    const role = String(user.role || "").toLowerCase();

    // role-based nav items
    const NAV = useMemo(() => {
        const base = [
            { to: "/dashboard", label: "Home", icon: <Home size={18} />, end: true },
            // { to: "/dashboard/students", label: "Students", icon: <Users size={18} /> },
        ];
        if (role === "admin") {
            base.splice(1, 0, { to: "/dashboard/students", label: "Students", icon: <Users size={18} /> });
            // base.splice(1, 0, { to: "/dashboard/approvals", label: "Approvals", icon: <CheckCircle2 size={18} /> });
            base.splice(2, 0, { to: "/dashboard/teachers", label: "Teachers", icon: <Users size={18} /> });
            base.splice(3, 0, { to: "/dashboard/results", label: "Results", icon: <LayoutGrid size={18} /> });
            // base.splice(4, 0, { to: `/dashboard/chat/${user.id}`, label: "Chat", icon: <LayoutGrid size={18} /> });
        }
        if (role === "teacher") {
            // base.splice(1, 0, { to: "/dashboard/classes", label: "Classes", icon: <Library size={18} /> });
            //  base.splice(1, 0, { to: "/dashboard/teachers", label: "Teachers", icon: <Users size={18} /> });
            base.splice(2, 0, { to: "/dashboard/results", label: "Results", icon: <LayoutGrid size={18} /> });
            // base.splice(3, 0, { to: `/dashboard/chat/${user.id}`, label: "Chat", icon: <LayoutGrid size={18} /> });
        }
        return base;
    }, [role]);

    // close mobile drawer on route change
    useEffect(() => {
        setOpen(false);
    }, [location.pathname]);

    const linkBase =
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-100 transition-colors";
    const linkActive =
        "bg-gradient-to-br from-slate-200 to-slate-100 text-slate-900 shadow-[inset_0_0_0_1px_rgba(2,6,23,0.06)]";

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100 selection:bg-blue-600/15">
            {/* FIXED HEADER (front) */}
            <header className="fixed inset-x-0 top-0 z-50 border-b border-white/60 bg-white/70 backdrop-blur-md supports-[backdrop-filter]:bg-white/55 shadow-sm">
                <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-xl bg-gradient-to-br from-yellow-600 to-orange-600 shadow-sm" />
                        <div className="leading-tight">
                            {/* <div className="text-[11px] text-slate-500/90">Welcome</div> */}
                            <div className="text-sm font-semibold text-slate-800 tracking-tight">
                                {/* {user?.name || "User"} — <span className="capitalize">{role}</span> */}
                                Electronic Educare
                            </div>
                        </div>
                    </div>

                    {/* Header actions (role-aware) */}
                    {/* Header actions + Profile */}
                    <div className="hidden sm:flex items-center gap-4">

                        {/* Role-based action button */}
                        {/* {role === "admin" && (
                            <button className="px-3 py-2 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                                New Notice
                            </button>
                        )}
                        {role === "teacher" && (
                            <button className="px-3 py-2 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
                                Create Assignment
                            </button>
                        )} */}
                        {role === "student" && (
                            // <button className="px-3 py-2 text-xs rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                            //     Join Class
                            // </button>
                            <></>
                        )}

                        {/* PROFILE BLOCK */}
                        <div className="relative group">
                            <button className="flex items-center gap-2 px-2 py-0.5 rounded-full border bg-white/70 backdrop-blur hover:bg-white transition">
                                {/* Profile Avatar */}
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-600 to-orange-600 flex items-center justify-center text-white font-semibold">
                                    {user?.name?.[0] || "U"}
                                </div>

                                {/* User Name */}
                                <span className="text-sm font-medium text-slate-800">
                                    {user?.name || "User"}
                                </span>
                            </button>

                            {/* Dropdown */}
                            <div className="absolute right-0 mt-2 w-40 rounded-lg border bg-white shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                                <button
                                    onClick={() => navigate("/dashboard/profile")}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100"
                                >
                                    Profile
                                </button>

                                <button
                                    onClick={() => {
                                        localStorage.removeItem("jwt");
                                        localStorage.removeItem("user");
                                        window.dispatchEvent(new CustomEvent("eec:auth", { detail: { type: "logout" } }));
                                        navigate("/", { replace: true });
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>


                    {/* Mobile hamburger */}
                    <button
                        onClick={() => setOpen((s) => !s)}
                        className="sm:hidden inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm bg-white/70 backdrop-blur hover:bg-white transition-colors"
                        aria-label="Toggle Menu"
                        aria-expanded={open}
                        aria-controls="dashboard-sidebar"
                    >
                        <Menu size={18} />
                    </button>
                </div>
            </header>

            {/* SHELL */}
            <div className="pt-14 flex">
                {/* Mobile backdrop */}
                {open && (
                    <div className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-[2px] sm:hidden" onClick={() => setOpen(false)} />
                )}

                {/* SIDEBAR (fixed; under header) */}
                <aside
                    id="dashboard-sidebar"
                    className={`fixed z-40 top-14 bottom-0 w-72 border-r border-white/70 bg-white/90 backdrop-blur-md transition-transform sm:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"} sm:static`}
                    aria-label="Sidebar"
                >
                    <div className="h-full overflow-y-auto p-3">
                        {/* Brand block */}
                        <div className="mb-3 rounded-xl border border-white/70 bg-white/70 backdrop-blur p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="size-7 rounded-lg bg-gradient-to-br from-yellow-600 to-orange-600" />
                                <div className="text-sm font-semibold text-slate-800">Dashboard</div>
                            </div>
                            <LayoutGrid size={16} className="text-slate-500" />
                        </div>

                        {/* Nav */}
                        <nav className="space-y-1">
                            {NAV.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.end}
                                    className={({ isActive }) =>
                                        `${linkBase} ${isActive ? linkActive : "text-slate-700"}`
                                    }
                                >
                                    <span className="text-slate-700">{item.icon}</span>
                                    <span className="truncate">{item.label}</span>
                                </NavLink>
                            ))}
                            <QuestionsSidebarBlock role={role} />
                            <ExamSidebarBlock role={role} />
                            <SettingsSidebarBlock role={role} />
                        </nav>

                        {/* Logout */}
                        <div className="mt-6 border-t pt-3">
                            <button
                                onClick={() => {
                                    localStorage.removeItem("jwt");
                                    localStorage.removeItem("user");
                                    window.dispatchEvent(new CustomEvent("eec:auth", { detail: { type: "logout" } }));
                                    navigate("/", { replace: true });
                                }}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
                            >
                                <LogOut size={16} />
                                Logout
                            </button>
                        </div>
                    </div>
                </aside>

                {/* MAIN CONTENT (pushed right of fixed sidebar on sm+) */}
                <main className="min-h-[calc(100vh-56px)] w-full">
                    <div className="mx-auto max-w-7xl px-4 py-6">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
