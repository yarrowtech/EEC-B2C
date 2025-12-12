import React, { useMemo, useState, useEffect } from 'react';
import { Bell, Search, Menu, CalendarDays, Coins } from 'lucide-react';
import { useNavigate } from "react-router-dom";

const Header = ({ sidebarOpen, setSidebarOpen, onOpenProfile }) => {
    const [notifications] = useState(3);
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationList = [
        {
            id: 1,
            type: 'assignment',
            message: 'Math Assignment due tomorrow!',
            time: '2 hours ago',
        },
        {
            id: 2,
            type: 'exam',
            message: 'Science Exam scheduled for Friday.',
            time: '1 day ago',
        },
        {
            id: 3,
            type: 'general',
            message: 'School will be closed next Monday.',
            time: '3 days ago',
        },
    ];
    const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
    const [profileOpen, setProfileOpen] = useState(false);
    // Greeting and date
    const { greeting, dateLabel } = useMemo(() => {
        const now = new Date();
        const hour = now.getHours();
        const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
        const dateLabel = now.toLocaleDateString(undefined, {
            weekday: 'long', month: 'short', day: 'numeric'
        });
        return { greeting, dateLabel };
    }, []);

    //   const studentData = {
    //     name: "Koushik Bala",
    //     avatar: "src/koushik-bala-pp.jpg"
    //   };
    const navigate = useNavigate();
    const [points, setPoints] = useState(user?.points || 0);
    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        setPoints(stored.points || 0);

        const handler = (e) => {
            setPoints(e.detail.points);
        };

        window.addEventListener("points:updated", handler);
        return () => window.removeEventListener("points:updated", handler);
    }, []);


    return (
        <header className="sticky top-0 z-40 w-full backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/80 border-b border-gray-200">
            <div className="px-2 sm:px-4">
                <div className="flex items-center justify-between gap-3 py-2 sm:py-3">
                    {/* Left: Sidebar toggle + Greeting */}
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label="Toggle sidebar"
                        >
                            <Menu size={22} className="text-gray-700" />
                        </button>
                        <div className="hidden xs:block">
                            <div className="text-sm sm:text-base font-semibold text-gray-900 truncate">{greeting}, {user.name.split(' ')[0]}</div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                <CalendarDays size={14} />
                                <span>{dateLabel}</span>
                            </div>
                        </div>
                    </div>

                    {/* Center: Search */}
                    {/* <div className="flex-1 max-w-xl">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search courses, assignments, or results"
                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm"
                            />
                        </div>
                    </div> */}

                    {/* Right: Notifications + Profile */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* <div className="relative">
                            <button
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
                                onClick={() => setShowNotifications((prev) => !prev)}
                                aria-label="Show notifications"
                            >
                                <Bell size={20} className="text-gray-700" />
                                {notifications > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                                        {notifications}
                                    </span>
                                )}
                            </button>
                            {showNotifications && (
                                <div className="absolute right-0 mt-2 w-80 max-w-xs bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                                    <div className="p-3 border-b bg-gray-50 font-semibold text-gray-800">Notifications</div>
                                    <ul className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                                        {notificationList.map((n) => (
                                            <li key={n.id} className="px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                                                <span className={`mt-1 w-2 h-2 rounded-full ${n.type === 'assignment' ? 'bg-yellow-500' : n.type === 'exam' ? 'bg-blue-500' : 'bg-gray-400'}`}></span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm text-gray-800 truncate">{n.message}</div>
                                                    <div className="text-xs text-gray-400 mt-1">{n.time}</div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                    {notificationList.length === 0 && (
                                        <div className="p-4 text-gray-500 text-sm text-center">No new notifications</div>
                                    )}
                                </div>
                            )}
                        </div> */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-200/80 text-amber-900 font-semibold shadow-sm">
                            <Coins className="w-5 h-5 text-amber-700" />
                            <span>{points} Points</span>
                        </div>

                        <div className="relative">
                            <button
                                className="flex items-center gap-2 rounded-lg p-1 hover:bg-gray-100"
                                onClick={() => setProfileOpen(!profileOpen)}
                                aria-label="Open profile menu"
                            >
                                {user?.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt="Profile"
                                        className="w-9 h-9 rounded-full border-2 border-gray-200 object-cover"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.remove(); // remove broken img
                                        }}
                                    />
                                ) : (
                                    <div className="w-9 h-9 rounded-full border-2 border-gray-200 bg-indigo-600 flex items-center justify-center text-white font-semibold">
                                        {(user?.name?.split(" ")[0]?.[0] || "U").toUpperCase()}
                                    </div>
                                )}

                                <div className="hidden sm:block text-left">
                                    <div className="text-sm font-semibold text-gray-900 leading-tight">{user.name}</div>
                                    <div className="text-[11px] text-gray-500 -mt-0.5">{user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                                    </div>
                                </div>
                            </button>
                            {profileOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                                    <div className="px-4 py-3 border-b">
                                        <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                                        <div className="text-xs text-gray-500">{user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                                        </div>
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
                                        <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Settings</button>
                                    </div>
                                    <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 border-t" onClick={() => {
                                        localStorage.removeItem("jwt");
                                        localStorage.removeItem("user");
                                        window.dispatchEvent(new CustomEvent("eec:auth", { detail: { type: "logout" } }));
                                        navigate("/", { replace: true });
                                    }}>Logout</button>
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