import React, { useEffect, useState } from "react";
import {
    Trophy,
    Medal,
    Crown,
    Filter,
    Search,
    TrendingUp,
    Users,
    Award,
    Star,
    ChevronDown,
    X,
    Target,
    Zap,
    BarChart3,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Leaderboard() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const [leaderboard, setLeaderboard] = useState([]);
    const [filteredLeaderboard, setFilteredLeaderboard] = useState([]);
    const [view, setView] = useState("class"); // class | board | all
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedState, setSelectedState] = useState("All States");
    const [showStateFilter, setShowStateFilter] = useState(false);
    const [stats, setStats] = useState({
        totalStudents: 0,
        yourRank: 0,
        topScore: 0,
        avgScore: 0,
    });

    // Get unique states from leaderboard
    const states = ["All States", ...new Set(leaderboard.map((s) => s.state).filter(Boolean))];

    useEffect(() => {
        fetchLeaderboard();
    }, [view]);

    useEffect(() => {
        filterLeaderboard();
    }, [search, selectedState, leaderboard]);

    async function fetchLeaderboard() {
        setLoading(true);

        const params =
            view === "class"
                ? `board=${user.board}&className=${user.className}`
                : view === "board"
                    ? `board=${user.board}`
                    : "";

        const res = await fetch(`${API}/api/exams/leaderboard?${params}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("jwt")}`,
            },
        });

        const data = await res.json();
        if (data.success) {
            setLeaderboard(data.leaderboard);
            calculateStats(data.leaderboard);
        }

        setLoading(false);
    }

    function calculateStats(data) {
        const totalStudents = data.length;
        const yourRank = data.findIndex((s) => s._id === user._id) + 1;
        const topScore = data[0]?.totalScore || 0;
        const avgScore =
            data.reduce((sum, s) => sum + s.totalScore, 0) / (totalStudents || 1);

        setStats({ totalStudents, yourRank, topScore, avgScore: Math.round(avgScore) });
    }

    function filterLeaderboard() {
        let filtered = [...leaderboard];

        // Filter by search
        if (search) {
            filtered = filtered.filter((s) =>
                s.name.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Filter by state
        if (selectedState !== "All States") {
            filtered = filtered.filter((s) => s.state === selectedState);
        }

        setFilteredLeaderboard(filtered);
    }

    function getRankColor(rank) {
        if (rank === 1) return "text-yellow-500";
        if (rank === 2) return "text-gray-400";
        if (rank === 3) return "text-amber-600";
        return "text-gray-700";
    }

    function getRankBadge(rank) {
        if (rank === 1)
            return (
                <div className="flex items-center gap-1">
                    <Crown className="w-5 h-5 text-yellow-500 animate-pulse" />
                    <span className="text-xs font-bold text-yellow-600">Champion</span>
                </div>
            );
        if (rank === 2)
            return (
                <div className="flex items-center gap-1">
                    <Medal className="w-5 h-5 text-gray-400" />
                    <span className="text-xs font-bold text-gray-600">Elite</span>
                </div>
            );
        if (rank === 3)
            return (
                <div className="flex items-center gap-1">
                    <Award className="w-5 h-5 text-amber-600" />
                    <span className="text-xs font-bold text-amber-700">Master</span>
                </div>
            );
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 pb-12">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
                <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
                <div className="absolute top-40 right-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
            </div>

            <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 md:py-8 relative z-10">
                {/* HEADER */}
                <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 p-6 md:p-8 text-white shadow-2xl mb-6 md:mb-8 transform hover:scale-[1.01] transition-transform duration-300">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 relative z-10">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                            <Trophy size={40} className="drop-shadow-lg" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-lg">
                                Global Leaderboard
                            </h1>
                            <p className="text-sm md:text-base text-white/90 mt-1">
                                Compete with students across the nation
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 sm:px-4 py-2 shadow-lg">
                                <div className="text-xs text-white/80">Your Rank</div>
                                <div className="text-xl sm:text-2xl font-bold">
                                    {stats.yourRank > 0 ? `#${stats.yourRank}` : "—"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* STATS CARDS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
                    <div className="bg-white/80 backdrop-blur-xl rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                        <div className="flex items-center gap-3">
                            <div className="p-2 md:p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                                <Users className="w-5 h-5 md:w-6 md:h-6 text-white" />
                            </div>
                            <div>
                                <div className="text-xs md:text-sm text-gray-600 font-medium">Total Students</div>
                                <div className="text-xl md:text-2xl font-bold text-gray-900">
                                    {stats.totalStudents}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xl rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                        <div className="flex items-center gap-3">
                            <div className="p-2 md:p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl">
                                <Crown className="w-5 h-5 md:w-6 md:h-6 text-white" />
                            </div>
                            <div>
                                <div className="text-xs md:text-sm text-gray-600 font-medium">Top Score</div>
                                <div className="text-xl md:text-2xl font-bold text-gray-900">
                                    {stats.topScore}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xl rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                        <div className="flex items-center gap-3">
                            <div className="p-2 md:p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                                <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-white" />
                            </div>
                            <div>
                                <div className="text-xs md:text-sm text-gray-600 font-medium">Avg Score</div>
                                <div className="text-xl md:text-2xl font-bold text-gray-900">
                                    {stats.avgScore}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xl rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                        <div className="flex items-center gap-3">
                            <div className="p-2 md:p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                                <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-white" />
                            </div>
                            <div>
                                <div className="text-xs md:text-sm text-gray-600 font-medium">Your Rank</div>
                                <div className="text-xl md:text-2xl font-bold text-gray-900">
                                    {stats.yourRank > 0 ? `#${stats.yourRank}` : "—"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FILTERS & SEARCH */}
                <div className="bg-white/80 backdrop-blur-xl rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-gray-200/50 mb-6">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                        {/* View Tabs */}
                        <div className="flex flex-wrap gap-2 md:gap-3">
                            <button
                                onClick={() => setView("class")}
                                className={`px-4 md:px-6 py-2 md:py-2.5 rounded-xl font-semibold transition-all duration-300 text-sm md:text-base ${view === "class"
                                        ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg transform scale-105"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md"
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Target className="w-4 h-4" />
                                    My Class
                                </div>
                            </button>

                            <button
                                onClick={() => setView("board")}
                                className={`px-4 md:px-6 py-2 md:py-2.5 rounded-xl font-semibold transition-all duration-300 text-sm md:text-base ${view === "board"
                                        ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg transform scale-105"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md"
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Award className="w-4 h-4" />
                                    My Board
                                </div>
                            </button>

                            <button
                                onClick={() => setView("all")}
                                className={`px-4 md:px-6 py-2 md:py-2.5 rounded-xl font-semibold transition-all duration-300 text-sm md:text-base ${view === "all"
                                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg transform scale-105"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md"
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4" />
                                    All Students
                                </div>
                            </button>
                        </div>

                        {/* Search & Filters */}
                        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                            {/* Search */}
                            <div className="relative flex-1 lg:flex-initial">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search by name..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full lg:w-64 pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 transition-all duration-300 text-sm md:text-base"
                                />
                            </div>

                            {/* State Filter */}
                            <div className="relative z-30">
                                <button
                                    onClick={() => setShowStateFilter(!showStateFilter)}
                                    className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-xl font-semibold text-gray-700 flex items-center justify-between gap-2 transition-all duration-300 shadow-md hover:shadow-lg text-sm md:text-base"
                                >
                                    <Filter className="w-4 h-4" />
                                    <span className="truncate">{selectedState}</span>
                                    <ChevronDown
                                        className={`w-4 h-4 transition-transform duration-300 ${showStateFilter ? "rotate-180" : ""
                                            }`}
                                    />
                                </button>

                                {/* Dropdown */}
                                {showStateFilter && (
                                    <div className="absolute right-0 mt-2 w-full sm:w-56 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 max-h-64 overflow-y-auto">
                                        {states.map((state) => (
                                            <button
                                                key={state}
                                                onClick={() => {
                                                    setSelectedState(state);
                                                    setShowStateFilter(false);
                                                }}
                                                className={`w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors text-sm md:text-base ${selectedState === state
                                                        ? "bg-yellow-50 text-yellow-700 font-semibold"
                                                        : "text-gray-700"
                                                    }`}
                                            >
                                                {state}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Clear Filters */}
                            {(search || selectedState !== "All States") && (
                                <button
                                    onClick={() => {
                                        setSearch("");
                                        setSelectedState("All States");
                                    }}
                                    className="px-4 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg text-sm md:text-base z-30"
                                >
                                    <X className="w-4 h-4" />
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* LEADERBOARD TABLE */}
                {/* <div className="bg-white/80 backdrop-blur-xl rounded-xl md:rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden z-10"> */}
                <div className="bg-white/80 backdrop-blur-xl rounded-xl md:rounded-2xl shadow-2xl border border-gray-200/50 overflow-visible z-10">
                    {loading ? (
                        <div className="p-10 md:p-16 text-center">
                            <div className="w-16 h-16 md:w-20 md:h-20 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600 font-medium text-sm md:text-base">Loading leaderboard...</p>
                        </div>
                    ) : filteredLeaderboard.length === 0 ? (
                        <div className="p-10 md:p-16 text-center">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trophy className="w-8 h-8 md:w-10 md:h-10 text-gray-400" />
                            </div>
                            <p className="text-lg md:text-xl font-bold text-gray-700 mb-2">
                                No Results Found
                            </p>
                            <p className="text-sm md:text-base text-gray-500">
                                {leaderboard.length === 0
                                    ? "Attempt exams to appear on the leaderboard"
                                    : "Try adjusting your filters"}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[700px]">
                                <thead className="sticky top-0 z-10 bg-gradient-to-r from-gray-800 to-gray-900 text-white">
                                    <tr>
                                        <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-bold uppercase tracking-wider">
                                            Rank
                                        </th>
                                        <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-bold uppercase tracking-wider">
                                            Student
                                        </th>
                                        <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-bold uppercase tracking-wider">
                                            State
                                        </th>
                                        <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-bold uppercase tracking-wider">
                                            Accuracy
                                        </th>
                                        <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-bold uppercase tracking-wider">
                                            Score
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-200">
                                    {filteredLeaderboard.map((s, i) => {
                                        const isMe = s._id === user._id;
                                        const rank = leaderboard.findIndex((item) => item._id === s._id) + 1;

                                        return (
                                            <tr
                                                key={s._id}
                                                className={`transition-all duration-300 ${isMe
                                                        ? "bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 shadow-md"
                                                        : rank <= 3
                                                            ? "bg-gradient-to-r from-yellow-50 to-amber-50"
                                                            : i % 2 === 0
                                                                ? "bg-white hover:bg-gray-50"
                                                                : "bg-gray-50/50 hover:bg-gray-100"
                                                    }`}
                                            >
                                                {/* RANK */}
                                                <td className="px-4 md:px-6 py-3 md:py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div
                                                            className={`text-xl md:text-2xl font-bold ${getRankColor(
                                                                rank
                                                            )}`}
                                                        >
                                                            #{rank}
                                                        </div>
                                                        {getRankBadge(rank)}
                                                    </div>
                                                </td>

                                                {/* STUDENT */}
                                                <td className="px-4 md:px-6 py-3 md:py-4">
                                                    <div className="flex items-center gap-3">
                                                        {/* Avatar */}
                                                        <div
                                                            className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white font-bold text-base md:text-lg shadow-lg ${rank === 1
                                                                    ? "bg-gradient-to-br from-yellow-400 to-orange-500"
                                                                    : rank === 2
                                                                        ? "bg-gradient-to-br from-gray-300 to-gray-500"
                                                                        : rank === 3
                                                                            ? "bg-gradient-to-br from-amber-400 to-amber-600"
                                                                            : "bg-gradient-to-br from-blue-400 to-blue-600"
                                                                }`}
                                                        >
                                                            {s.name?.charAt(0)?.toUpperCase() || "?"}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-900 text-sm md:text-base">
                                                                {s.name}
                                                            </div>
                                                            {isMe && (
                                                                <span className="inline-block mt-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-2 py-0.5 text-xs font-bold text-white shadow-md">
                                                                    You
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* STATE */}
                                                <td className="px-4 md:px-6 py-3 md:py-4">
                                                    {s.state ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-100 to-red-100 px-3 py-1 text-xs md:text-sm font-semibold text-orange-800 shadow-sm">
                                                            <Star className="w-3 h-3" />
                                                            {s.state}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">—</span>
                                                    )}
                                                </td>

                                                {/* ACCURACY */}
                                                <td className="px-4 md:px-6 py-3 md:py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 bg-gray-200 rounded-full h-2 md:h-2.5 overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-500 ${s.avgPercent >= 80
                                                                        ? "bg-gradient-to-r from-green-500 to-emerald-500"
                                                                        : s.avgPercent >= 60
                                                                            ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                                                                            : "bg-gradient-to-r from-red-500 to-pink-500"
                                                                    }`}
                                                                style={{ width: `${s.avgPercent || 0}%` }}
                                                            ></div>
                                                        </div>
                                                        <span
                                                            className={`font-bold text-sm md:text-base min-w-[3rem] text-right ${s.avgPercent >= 80
                                                                    ? "text-green-600"
                                                                    : s.avgPercent >= 60
                                                                        ? "text-orange-600"
                                                                        : "text-red-600"
                                                                }`}
                                                        >
                                                            {s.avgPercent?.toFixed(0) || 0}%
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* SCORE */}
                                                <td className="px-4 md:px-6 py-3 md:py-4">
                                                    <div className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                        {s.totalScore}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Results Count */}
                {filteredLeaderboard.length > 0 && (
                    <div className="mt-4 md:mt-6 text-center text-sm md:text-base text-gray-600 font-medium">
                        Showing {filteredLeaderboard.length} of {leaderboard.length} students
                    </div>
                )}
            </div>
        </div>
    );
}
