// import React, { useMemo, useState, useEffect } from 'react';
// import { Bell, Search, Menu, CalendarDays, Coins } from 'lucide-react';
// import { Link, useNavigate } from "react-router-dom";

// const Header = ({ sidebarOpen, setSidebarOpen, onOpenProfile }) => {
//     const [notifications] = useState(3);
//     const [showNotifications, setShowNotifications] = useState(false);

//     const notificationList = [
//         { id: 1, type: 'assignment', message: 'Math Assignment due tomorrow!', time: '2 hours ago' },
//         { id: 2, type: 'exam', message: 'Science Exam scheduled for Friday.', time: '1 day ago' },
//         { id: 3, type: 'general', message: 'School will be closed next Monday.', time: '3 days ago' },
//     ];

//     const user = localStorage.getItem("user")
//         ? JSON.parse(localStorage.getItem("user"))
//         : null;

//     const [profileOpen, setProfileOpen] = useState(false);

//     // Greeting + Date
//     const { greeting, dateLabel } = useMemo(() => {
//         const now = new Date();
//         const hour = now.getHours();
//         const greeting = hour < 12 ? 'Good morning' :
//             hour < 18 ? 'Good afternoon' : 'Good evening';

//         const dateLabel = now.toLocaleDateString(undefined, {
//             weekday: 'long', month: 'short', day: 'numeric'
//         });

//         return { greeting, dateLabel };
//     }, []);

//     const navigate = useNavigate();

//     /* ----------------------------------------------------
//        POINTS — Auto update without refresh
//        ---------------------------------------------------- */
//     const [points, setPoints] = useState(user?.points || 0);

//     // useEffect(() => {
//     //     // 1) Initial load
//     //     const stored = JSON.parse(localStorage.getItem("user") || "{}");
//     //     setPoints(stored.points || 0);

//     //     // 2) Listen for manual point updates (event dispatch)
//     //     const handler = (e) => {
//     //         setPoints(e.detail.points);
//     //     };
//     //     window.addEventListener("points:updated", handler);

//     //     // 3) Listen for user object updates (localStorage change)
//     //     const syncHandler = () => {
//     //         const refreshed = JSON.parse(localStorage.getItem("user") || "{}");
//     //         setPoints(refreshed.points || 0);
//     //     };
//     //     window.addEventListener("storage", syncHandler);

//     //     return () => {
//     //         window.removeEventListener("points:updated", handler);
//     //         window.removeEventListener("storage", syncHandler);
//     //     };
//     // }, []);
//     /* ---------------------------------------------------- */
//     useEffect(() => {
//         // 1) Initial load
//         const stored = JSON.parse(localStorage.getItem("user") || "{}");
//         setPoints(stored.points || 0);

//         // 2) Listen for manual point updates (event dispatch)
//         const handler = (e) => {
//             setPoints(e.detail.points);
//         };
//         window.addEventListener("points:updated", handler);

//         // 3) Listen for user object updates (localStorage change across tabs)
//         const syncHandler = () => {
//             const refreshed = JSON.parse(localStorage.getItem("user") || "{}");
//             setPoints(refreshed.points || 0);
//         };
//         window.addEventListener("storage", syncHandler);

//         // 4) Auto-sync every 1 second for same-tab updates
//         const interval = setInterval(() => {
//             const refreshed = JSON.parse(localStorage.getItem("user") || "{}");
//             setPoints((prev) => {
//                 const newPoints = refreshed.points || 0;
//                 return prev !== newPoints ? newPoints : prev;
//             });
//         }, 1000);

//         return () => {
//             window.removeEventListener("points:updated", handler);
//             window.removeEventListener("storage", syncHandler);
//             clearInterval(interval);
//         };
//     }, []);


//     return (
//         <header className="sticky top-0 z-40 w-full backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/80 border-b border-gray-200">
//             <div className="px-2 sm:px-4">
//                 <div className="flex items-center justify-between gap-3 py-2 sm:py-3">

//                     {/* Left Section */}
//                     <div className="flex items-center gap-3 min-w-0">



//                         {/* Sidebar Toggle Button */}
//                         <button
//                             onClick={() => setSidebarOpen(!sidebarOpen)}
//                             className="p-2 rounded-lg hover:bg-gray-100 transition-colors md:hidden lg:hidden"
//                             aria-label="Toggle sidebar"
//                         >
//                             <Menu size={22} className="text-gray-700" />
//                         </button>
//                         {/* EEC LOGO */}
//                         <img
//                             src="/logo_new.png"
//                             alt="EEC Logo"
//                             className="h-12 w-auto sm:h-9 md:h-12 md:ml-16 object-contain cursor-pointer"
//                             onClick={() => navigate("/")}
//                         />

//                         {/* Greeting Text */}
//                         <div className="hidden xs:block">
//                             <div className="text-sm sm:text-base font-semibold text-gray-900 truncate">
//                                 {greeting}, {user?.name?.split(' ')[0]}
//                             </div>

//                             <div className="flex items-center gap-1 text-xs text-gray-500">
//                                 <CalendarDays size={14} />
//                                 <span>{dateLabel}</span>
//                             </div>
//                         </div>
//                     </div>


//                     {/* Right Section */}
//                     <div className="flex items-center gap-2 sm:gap-3">

//                         {/* POINTS DISPLAY */}
//                         {user && user.role === 'student' && (
//                         <Link to="/dashboard/achievements" className="hidden sm:inline-flex">
//                             <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-200/80 text-amber-900 font-semibold shadow-sm">
//                                 <Coins className="w-5 h-5 text-amber-700" />
//                                 <span>{points} Points</span>
//                             </div>
//                         </Link>
//                         )}

//                         {/* Profile */}
//                         <div className="relative">
//                             <button
//                                 className="flex items-center gap-2 rounded-lg p-1 hover:bg-gray-100"
//                                 onClick={() => setProfileOpen(!profileOpen)}
//                             >
//                                 {user?.avatar ? (
//                                     <img
//                                         src={user.avatar}
//                                         alt="Profile"
//                                         className="w-9 h-9 rounded-full border-2 border-gray-200 object-cover"
//                                         onError={(e) => {
//                                             e.target.onerror = null;
//                                             e.target.remove();
//                                         }}
//                                     />
//                                 ) : (
//                                     <div className="w-9 h-9 rounded-full border-2 border-gray-200 bg-indigo-600 flex items-center justify-center text-white font-semibold">
//                                         {(user?.name?.split(" ")[0]?.[0] || "U").toUpperCase()}
//                                     </div>
//                                 )}

//                                 <div className="hidden sm:block text-left">
//                                     <div className="text-sm font-semibold text-gray-900 leading-tight">
//                                         {user?.name}
//                                     </div>
//                                     <div className="text-[11px] text-gray-500 -mt-0.5">
//                                         {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
//                                     </div>
//                                 </div>
//                             </button>

//                             {profileOpen && (
//                                 <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
//                                     <div className="px-4 py-3 border-b">
//                                         <div className="text-sm font-semibold text-gray-900">{user?.name}</div>
//                                         <div className="text-xs text-gray-500">{user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}</div>
//                                     </div>

//                                     <div className="py-1">
//                                         <button
//                                             className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
//                                             onClick={() => {
//                                                 navigate("/dashboard/profile");
//                                                 setProfileOpen(false);
//                                             }}
//                                         >
//                                             Profile
//                                         </button>
//                                         {/* <button
//                                             className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
//                                         >
//                                             Settings
//                                         </button> */}
//                                     </div>

//                                     <button
//                                         className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 border-t"
//                                         onClick={() => {
//                                             localStorage.removeItem("jwt");
//                                             localStorage.removeItem("user");
//                                             window.dispatchEvent(new CustomEvent("eec:auth", { detail: { type: "logout" } }));
//                                             navigate("/", { replace: true });
//                                         }}
//                                     >
//                                         Logout
//                                     </button>
//                                 </div>
//                             )}
//                         </div>
//                     </div>

//                 </div>
//             </div>
//         </header>
//     );
// };

// export default Header;

import React, { useState, useEffect, useMemo } from "react";
import { Bell, Menu, Coins } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const Header = ({ sidebarOpen, setSidebarOpen }) => {
    /* ---------------- CONFIG ---------------- */
    const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

    const user = localStorage.getItem("user")
        ? JSON.parse(localStorage.getItem("user"))
        : null;

    const navigate = useNavigate();

    /* ---------------- STATE ---------------- */
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    /* ---------------- LOAD NOTIFICATIONS ---------------- */
    useEffect(() => {
        async function load() {
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
        load();
    }, [API]);

    /* ---------------- UNREAD COUNT ---------------- */
    const unreadCount = notifications.filter(
        (n) => !n.readBy?.includes(user?._id)
    ).length;

    /* ---------------- MARK AS READ ---------------- */
    async function markRead(id) {
        try {
            await fetch(`${API}/api/notifications/${id}/read`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
            });

            setNotifications((prev) =>
                prev.map((n) =>
                    n._id === id
                        ? { ...n, readBy: [...(n.readBy || []), user._id] }
                        : n
                )
            );
        } catch (err) {
            console.error("Mark read failed", err);
        }
    }

    /* ---------------- CLEAR ALL ---------------- */
    async function clearAll() {
        try {
            await fetch(`${API}/api/notifications/clear-all`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
            });

            setNotifications((prev) =>
                prev.map((n) => ({
                    ...n,
                    readBy: [...(n.readBy || []), user._id],
                }))
            );
        } catch (err) {
            console.error("Clear all failed", err);
        }
    }

    /* ---------------- POINTS ---------------- */
    const [points, setPoints] = useState(user?.points || 0);

    useEffect(() => {
        const sync = () => {
            const refreshed = JSON.parse(localStorage.getItem("user") || "{}");
            setPoints(refreshed.points || 0);
        };
        sync();
        const interval = setInterval(sync, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <header className="sticky top-0 z-40 w-full backdrop-blur bg-white/80 border-b border-gray-200">
            <div className="px-2 sm:px-4">
                <div className="flex items-center justify-between py-2 sm:py-3">

                    {/* LEFT */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 rounded-lg hover:bg-gray-100 md:hidden"
                        >
                            <Menu size={22} />
                        </button>

                        <img
                            src="/logo_new.png"
                            alt="EEC Logo"
                            className="h-12 w-auto md:ml-16 cursor-pointer"
                            onClick={() => navigate("/")}
                        />
                    </div>

                    {/* RIGHT */}
                    <div className="flex items-center gap-3">

                        {/* POINTS */}
                        {user?.role === "student" && (
                            <Link to="/dashboard/achievements" className="hidden sm:inline-flex">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-200/80 text-amber-900 font-semibold">
                                    <Coins size={18} />
                                    {points} Points
                                </div>
                            </Link>
                        )}

                        {/* 🔔 NOTIFICATIONS */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setShowNotifications(!showNotifications);
                                    setProfileOpen(false);
                                }}
                                className="relative p-2 rounded-lg hover:bg-gray-100"
                            >
                                <Bell size={22} />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {showNotifications && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl z-50 overflow-hidden">

                                    {/* HEADER */}
                                    <div className="px-5 py-4 border-b flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                        Updates
                                        </h3>
                                        <button
                                            onClick={clearAll}
                                            className="text-xs text-blue-500 hover:underline"
                                        >
                                            Read all
                                        </button>
                                    </div>

                                    {/* LIST */}
                                    <div className="divide-y max-h-80 overflow-y-auto">
                                        {notifications.length === 0 && (
                                            <div className="px-5 py-6 text-sm text-gray-500 text-center">
                                                No Updates available
                                            </div>
                                        )}

                                        {notifications.map((n) => {
                                            const isRead = n.readBy?.includes(user?._id);

                                            return (
                                                <div
                                                    key={n._id}
                                                    onClick={() => {
                                                        markRead(n._id);
                                                        navigate(`/dashboard/notification/${n._id}`);
                                                        setShowNotifications(false);
                                                    }}
                                                    className="flex gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 transition"
                                                >
                                                    {/* DOT */}
                                                    <span
                                                        className={`mt-2 w-2.5 h-2.5 rounded-full ${isRead ? "bg-gray-300" : "bg-yellow-400"
                                                            }`}
                                                    />

                                                    {/* CONTENT */}
                                                    <div className="flex-1">
                                                        <p
                                                            className={`text-sm ${isRead ? "text-gray-600" : "font-semibold text-gray-900"
                                                                }`}
                                                        >
                                                            {n.message}
                                                        </p>

                                                        {/* POSTED BY */}
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Posted by{" "}
                                                            <span className="font-medium text-gray-700">
                                                                {n.createdBy?.name || "Admin"}
                                                            </span>
                                                        </p>

                                                        <p className="text-xs text-gray-400 mt-0.5">
                                                            {new Date(n.createdAt).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* PROFILE */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setProfileOpen(!profileOpen);
                                    setShowNotifications(false);
                                }}
                                className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100"
                            >
                                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold">
                                    {(user?.name?.[0] || "U").toUpperCase()}
                                </div>

                                <div className="hidden sm:block text-left">
                                    <div className="text-sm font-semibold">{user?.name}</div>
                                    <div className="text-xs text-gray-500">{user?.role}</div>
                                </div>
                            </button>

                            {profileOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-xl shadow-xl z-50">
                                    <button
                                        className="w-full text-left px-4 py-2 hover:bg-gray-50"
                                        onClick={() => navigate("/dashboard/profile")}
                                    >
                                        Profile
                                    </button>
                                    <button
                                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-50 border-t"
                                        onClick={() => {
                                            localStorage.removeItem("jwt");
                                            localStorage.removeItem("user");
                                            window.dispatchEvent(
                                                new CustomEvent("eec:auth", { detail: { type: "logout" } })
                                            );
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

