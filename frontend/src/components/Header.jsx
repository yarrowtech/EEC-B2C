import React, { useMemo, useState, useEffect } from 'react';
import { Bell, Search, Menu, CalendarDays, Coins } from 'lucide-react';
import { useNavigate } from "react-router-dom";

const Header = ({ sidebarOpen, setSidebarOpen, onOpenProfile }) => {
    const [notifications] = useState(3);
    const [showNotifications, setShowNotifications] = useState(false);

    const notificationList = [
        { id: 1, type: 'assignment', message: 'Math Assignment due tomorrow!', time: '2 hours ago' },
        { id: 2, type: 'exam', message: 'Science Exam scheduled for Friday.', time: '1 day ago' },
        { id: 3, type: 'general', message: 'School will be closed next Monday.', time: '3 days ago' },
    ];

    const user = localStorage.getItem("user")
        ? JSON.parse(localStorage.getItem("user"))
        : null;

    const [profileOpen, setProfileOpen] = useState(false);

    // Greeting + Date
    const { greeting, dateLabel } = useMemo(() => {
        const now = new Date();
        const hour = now.getHours();
        const greeting = hour < 12 ? 'Good morning' :
            hour < 18 ? 'Good afternoon' : 'Good evening';

        const dateLabel = now.toLocaleDateString(undefined, {
            weekday: 'long', month: 'short', day: 'numeric'
        });

        return { greeting, dateLabel };
    }, []);

    const navigate = useNavigate();

    /* ----------------------------------------------------
       POINTS — Auto update without refresh
       ---------------------------------------------------- */
    const [points, setPoints] = useState(user?.points || 0);

    useEffect(() => {
        // 1) Initial load
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        setPoints(stored.points || 0);

        // 2) Listen for manual point updates (event dispatch)
        const handler = (e) => {
            setPoints(e.detail.points);
        };
        window.addEventListener("points:updated", handler);

        // 3) Listen for user object updates (localStorage change)
        const syncHandler = () => {
            const refreshed = JSON.parse(localStorage.getItem("user") || "{}");
            setPoints(refreshed.points || 0);
        };
        window.addEventListener("storage", syncHandler);

        return () => {
            window.removeEventListener("points:updated", handler);
            window.removeEventListener("storage", syncHandler);
        };
    }, []);
    /* ---------------------------------------------------- */


    return (
        <header className="sticky top-0 z-40 w-full backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/80 border-b border-gray-200">
            <div className="px-2 sm:px-4">
                <div className="flex items-center justify-between gap-3 py-2 sm:py-3">

                    {/* Left Section */}
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label="Toggle sidebar"
                        >
                            <Menu size={22} className="text-gray-700" />
                        </button>

                        <div className="hidden xs:block">
                            <div className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                                {greeting}, {user?.name?.split(' ')[0]}
                            </div>

                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                <CalendarDays size={14} />
                                <span>{dateLabel}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-2 sm:gap-3">

                        {/* POINTS DISPLAY */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-200/80 text-amber-900 font-semibold shadow-sm">
                            <Coins className="w-5 h-5 text-amber-700" />
                            <span>{points} Points</span>
                        </div>

                        {/* Profile */}
                        <div className="relative">
                            <button
                                className="flex items-center gap-2 rounded-lg p-1 hover:bg-gray-100"
                                onClick={() => setProfileOpen(!profileOpen)}
                            >
                                {user?.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt="Profile"
                                        className="w-9 h-9 rounded-full border-2 border-gray-200 object-cover"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.remove();
                                        }}
                                    />
                                ) : (
                                    <div className="w-9 h-9 rounded-full border-2 border-gray-200 bg-indigo-600 flex items-center justify-center text-white font-semibold">
                                        {(user?.name?.split(" ")[0]?.[0] || "U").toUpperCase()}
                                    </div>
                                )}

                                <div className="hidden sm:block text-left">
                                    <div className="text-sm font-semibold text-gray-900 leading-tight">
                                        {user?.name}
                                    </div>
                                    <div className="text-[11px] text-gray-500 -mt-0.5">
                                        {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                                    </div>
                                </div>
                            </button>

                            {profileOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                                    <div className="px-4 py-3 border-b">
                                        <div className="text-sm font-semibold text-gray-900">{user?.name}</div>
                                        <div className="text-xs text-gray-500">{user?.role}</div>
                                    </div>

                                    <div className="py-1">
                                        <button
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            onClick={() => {
                                                navigate("/dashboard/profile");
                                                setProfileOpen(false);
                                            }}
                                        >
                                            Profile
                                        </button>
                                        <button
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            Settings
                                        </button>
                                    </div>

                                    <button
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 border-t"
                                        onClick={() => {
                                            localStorage.removeItem("jwt");
                                            localStorage.removeItem("user");
                                            window.dispatchEvent(new CustomEvent("eec:auth", { detail: { type: "logout" } }));
                                            navigate("/", { replace: true });
                                        }}
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </header>
    );
};

export default Header;
