import React, { useEffect, useState } from "react";
import { Trophy, Filter, Users, Award, TrendingUp, MapPin } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Indian states list
const INDIAN_STATES = [
    "All States",
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
];

export default function Leaderboard() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const [leaderboard, setLeaderboard] = useState([]);
    const [filteredLeaderboard, setFilteredLeaderboard] = useState([]);
    const [view, setView] = useState("class"); // class | board
    const [selectedState, setSelectedState] = useState("All States");
    const [selectedClass, setSelectedClass] = useState("All Classes");
    const [loading, setLoading] = useState(false);

    // Get unique states from current leaderboard
    const availableStates = React.useMemo(() => {
        const states = new Set(leaderboard.map(s => s.state).filter(Boolean));
        return ["All States", ...Array.from(states).sort()];
    }, [leaderboard]);

    // Get unique classes from current leaderboard
    const availableClasses = React.useMemo(() => {
        const classes = new Set(leaderboard.map(s => s.className).filter(Boolean));
        return ["All Classes", ...Array.from(classes).sort()];
    }, [leaderboard]);

    useEffect(() => {
        fetchLeaderboard();
    }, [view]);

    // Filter by state and class whenever selection changes
    useEffect(() => {
        let filtered = leaderboard;

        // Apply state filter
        if (selectedState !== "All States") {
            filtered = filtered.filter((student) => student.state === selectedState);
        }

        // Apply class filter
        if (selectedClass !== "All Classes") {
            filtered = filtered.filter((student) => student.className === selectedClass);
        }

        setFilteredLeaderboard(filtered);
    }, [selectedState, selectedClass, leaderboard]);

    async function fetchLeaderboard() {
        setLoading(true);

        const params =
            view === "class"
                ? `board=${user.board}&className=${user.className}`
                : `board=${user.board}`;

        const res = await fetch(`${API}/api/exams/leaderboard?${params}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("jwt")}`,
            },
        });

        const data = await res.json();
        if (data.success) {
            setLeaderboard(data.leaderboard);
            setFilteredLeaderboard(data.leaderboard);
        }

        setLoading(false);
    }

    const userIndex = filteredLeaderboard.findIndex(s => s._id === user._id);
                    const userRank = userIndex !== -1 ? userIndex + 1 : null;
                    const userData = userIndex !== -1 ? filteredLeaderboard[userIndex] : null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-96 h-96 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

            <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 md:py-8 space-y-6 md:space-y-8">

                {/* HEADER */}
                <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 p-6 md:p-8 text-white shadow-2xl transform hover:shadow-3xl transition-all duration-500">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
                    <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mt-32"></div>
                    <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mb-24"></div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 relative z-10">
                        <div className="bg-white/20 backdrop-blur-sm p-3 md:p-4 rounded-2xl shadow-lg">
                            <Trophy size={36} className="drop-shadow-lg text-white" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-lg">
                                Leaderboard
                            </h1>
                            <p className="text-sm md:text-base text-white/90 drop-shadow mt-1">
                                See how you rank among others and compete for the top spot
                            </p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                            <div className="flex items-center gap-2">
                                {/* <Users className="w-5 h-5" /> */}
                                <span className="font-bold text-sm md:text-base"># {userRank}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CURRENT USER STATS */}
                {/* {filteredLeaderboard.length > 0 && (() => {
                    const userIndex = filteredLeaderboard.findIndex(s => s._id === user._id);
                    const userRank = userIndex !== -1 ? userIndex + 1 : null;
                    const userData = userIndex !== -1 ? filteredLeaderboard[userIndex] : null;

                    return userRank && userData ? (
                        <div className="bg-white/90 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-xl border border-green-200/50 p-4 md:p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Award className="w-5 h-5 text-green-600" />
                                <h2 className="text-lg md:text-xl font-bold text-gray-800">Your Performance</h2>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                               
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Trophy className="w-4 h-4 text-green-600" />
                                        <p className="text-xs font-semibold text-green-700">Your Rank</p>
                                    </div>
                                    <p className="text-2xl md:text-3xl font-extrabold text-green-600">#{userRank}</p>
                                    <p className="text-xs text-green-600 mt-1">out of {filteredLeaderboard.length}</p>
                                </div>

                                
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                                    <div className="flex items-center gap-2 mb-1">
                                        <TrendingUp className="w-4 h-4 text-blue-600" />
                                        <p className="text-xs font-semibold text-blue-700">Avg Score</p>
                                    </div>
                                    <p className="text-2xl md:text-3xl font-extrabold text-blue-600">{userData.avgPercent?.toFixed(0)}%</p>
                                </div>

                                
                                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border-2 border-amber-200">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Award className="w-4 h-4 text-amber-600" />
                                        <p className="text-xs font-semibold text-amber-700">Total Score</p>
                                    </div>
                                    <p className="text-2xl md:text-3xl font-extrabold text-amber-600">{userData.totalScore}</p>
                                </div>

                                
                                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
                                    <div className="flex items-center gap-2 mb-1">
                                        <MapPin className="w-4 h-4 text-purple-600" />
                                        <p className="text-xs font-semibold text-purple-700">Location</p>
                                    </div>
                                    <p className="text-sm md:text-base font-bold text-purple-600 truncate">{userData.state || "—"}</p>
                                </div>
                            </div>
                        </div>
                    ) : null;
                })()} */}

                {/* FILTERS */}
                <div className="bg-white/90 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-xl border border-yellow-200/50 p-4 md:p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="w-5 h-5 text-amber-600" />
                        <h2 className="text-lg md:text-xl font-bold text-gray-800">Filters</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                        {/* View Filter */}
                        <div className="sm:col-span-2 lg:col-span-1">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                View By
                            </label>
                            <div className="flex gap-2 sm:gap-3">
                                <button
                                    onClick={() => setView("class")}
                                    className={`flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold transition-all duration-300 shadow-md transform hover:scale-105 text-sm sm:text-base ${view === "class"
                                        ? "bg-gradient-to-r from-yellow-400 to-amber-400 text-white shadow-lg shadow-yellow-200"
                                        : "bg-white border-2 border-gray-200 hover:bg-yellow-50 hover:border-yellow-300"
                                    }`}
                                >
                                    <Award className="w-4 h-4 inline mr-1.5" />
                                    My Class
                                </button>

                                {/* <button
                                    onClick={() => setView("board")}
                                    className={`flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold transition-all duration-300 shadow-md transform hover:scale-105 text-sm sm:text-base ${view === "board"
                                        ? "bg-gradient-to-r from-orange-400 to-red-400 text-white shadow-lg shadow-orange-200"
                                        : "bg-white border-2 border-gray-200 hover:bg-orange-50 hover:border-orange-300"
                                    }`}
                                >
                                    <TrendingUp className="w-4 h-4 inline mr-1.5" />
                                    My Board
                                </button> */}
                            </div>
                        </div>

                        {/* Class Filter */}
                        {/* <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <Award className="w-4 h-4 inline mr-1" />
                                Filter by Class
                            </label>
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="w-full px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl shadow-sm transition-all duration-200 outline-none hover:border-amber-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 bg-white text-sm sm:text-base font-medium"
                            >
                                {availableClasses.map((className) => (
                                    <option key={className} value={className}>
                                        {className}
                                    </option>
                                ))}
                            </select>
                        </div> */}

                        {/* State Filter */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <MapPin className="w-4 h-4 inline mr-1" />
                                Filter by State
                            </label>
                            <select
                                value={selectedState}
                                onChange={(e) => setSelectedState(e.target.value)}
                                className="w-full px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl shadow-sm transition-all duration-200 outline-none hover:border-amber-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 bg-white text-sm sm:text-base font-medium"
                            >
                                {availableStates.map((state) => (
                                    <option key={state} value={state}>
                                        {state}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="bg-white/90 backdrop-blur-xl shadow-2xl overflow-hidden border border-yellow-200/50">

                    {loading ? (
                        <div className="p-10 md:p-16 text-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-gray-600 font-semibold text-base md:text-lg">Loading leaderboard…</p>
                            </div>
                        </div>
                    ) : filteredLeaderboard.length === 0 ? (
                        <div className="p-10 md:p-16 text-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="bg-gradient-to-br from-yellow-100 to-amber-100 p-6 rounded-full">
                                    <Trophy className="w-12 h-12 md:w-16 md:h-16 text-amber-600" />
                                </div>
                                <p className="text-lg md:text-xl font-bold text-gray-800">No leaderboard data found</p>
                                <p className="text-sm md:text-base text-gray-500 max-w-md">
                                    {selectedState !== "All States" || selectedClass !== "All Classes"
                                        ? `No students found matching your filter criteria. Try adjusting the filters.`
                                        : "Attempt exams to appear on the leaderboard and compete with others!"
                                    }
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm md:text-base">
                                <thead className="bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 text-white">
                                    <tr>
                                        <th className="px-3 sm:px-4 md:px-6 py-3 md:py-4 text-left font-bold text-sm md:text-base">Rank</th>
                                        <th className="px-3 sm:px-4 md:px-6 py-3 md:py-4 text-left font-bold text-sm md:text-base">Student</th>
                                        <th className="px-3 sm:px-4 md:px-6 py-3 md:py-4 text-left font-bold text-sm md:text-base">State</th>
                                        <th className="px-3 sm:px-4 md:px-6 py-3 md:py-4 text-left font-bold text-sm md:text-base">Avg %</th>
                                        <th className="px-3 sm:px-4 md:px-6 py-3 md:py-4 text-left font-bold text-sm md:text-base">Score</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredLeaderboard.map((s, i) => {
                                        const isMe = s._id === user._id;
                                        const isTopThree = i < 3;

                                        return (
                                            <tr
                                                key={s._id}
                                                className={`border-b border-gray-200 transition-all duration-300 ${
                                                    isMe
                                                        ? "bg-gradient-to-r from-green-100 via-emerald-100 to-teal-100 font-bold shadow-lg ring-2 ring-green-400 ring-inset"
                                                        : isTopThree
                                                        ? "bg-gradient-to-r from-yellow-50 to-amber-50 hover:from-yellow-100 hover:to-amber-100"
                                                        : "hover:bg-yellow-50"
                                                }`}
                                            >
                                                {/* RANK + MEDAL */}
                                                <td className="px-3 sm:px-4 md:px-6 py-3 md:py-4">
                                                    <div className="flex items-center gap-2 md:gap-3">
                                                        <span className={`font-bold text-base md:text-lg ${
                                                            i === 0 ? "text-yellow-600" :
                                                            i === 1 ? "text-gray-500" :
                                                            i === 2 ? "text-orange-600" :
                                                            "text-gray-700"
                                                        }`}>
                                                            #{i + 1}
                                                        </span>

                                                        {i === 0 && <span className="text-2xl md:text-3xl animate-bounce">🥇</span>}
                                                        {i === 1 && <span className="text-2xl md:text-3xl">🥈</span>}
                                                        {i === 2 && <span className="text-2xl md:text-3xl">🥉</span>}
                                                    </div>
                                                </td>

                                                {/* STUDENT */}
                                                <td className="px-3 sm:px-4 md:px-6 py-3 md:py-4">
                                                    <div className="flex items-center gap-2">
                                                        {isMe && (
                                                            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 animate-pulse shadow-lg"></div>
                                                        )}
                                                        <span className={`${isMe ? "font-extrabold text-green-800" : "font-medium text-gray-800"}`}>
                                                            {s.name}
                                                        </span>
                                                        {isMe && (
                                                            <span className="text-xs px-2 sm:px-3 py-1 rounded-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white font-bold shadow-lg animate-pulse">
                                                                You
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* STATE */}
                                                <td className="px-3 sm:px-4 md:px-6 py-3 md:py-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
                                                        <span className="font-semibold text-orange-600 text-xs sm:text-sm md:text-base">
                                                            {s.state || "—"}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* AVG % */}
                                                <td className="px-3 sm:px-4 md:px-6 py-3 md:py-4">
                                                    <div className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full bg-gradient-to-r from-green-100 to-emerald-100">
                                                        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                                                        <span className="font-bold text-green-700 text-xs sm:text-sm md:text-base">
                                                            {s.avgPercent?.toFixed(0)}%
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* SCORE */}
                                                <td className="px-3 sm:px-4 md:px-6 py-3 md:py-4">
                                                    <span className="font-extrabold text-transparent bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-base md:text-lg">
                                                        {s.totalScore}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
