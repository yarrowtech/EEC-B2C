import React, { useEffect, useState } from "react";
import { Trophy, Filter, Award, TrendingUp, MapPin, Crown, Zap, Star } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const LEADERBOARD_CACHE_PREFIX = "eec:leaderboard-cache:v1";

function getCacheKey(section, userKey = "anonymous") {
    return `${LEADERBOARD_CACHE_PREFIX}:${userKey}:${section}`;
}
function readCache(section, userKey, ttlMs) {
    try {
        const raw = localStorage.getItem(getCacheKey(section, userKey));
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed.ts !== "number") return null;
        if (Date.now() - parsed.ts > ttlMs) return null;
        return parsed.data;
    } catch { return null; }
}
function writeCache(section, userKey, data) {
    try {
        localStorage.setItem(getCacheKey(section, userKey), JSON.stringify({ ts: Date.now(), data }));
    } catch {}
}

/* ── Avatar ── */
const AVATAR_GRADIENTS = [
    "from-pink-400 to-rose-500",
    "from-violet-400 to-purple-500",
    "from-blue-400 to-indigo-500",
    "from-emerald-400 to-teal-500",
    "from-amber-400 to-orange-500",
    "from-fuchsia-400 to-pink-500",
    "from-cyan-400 to-blue-500",
    "from-lime-400 to-green-500",
];
function avatarGradient(name = "") {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_GRADIENTS.length;
    return AVATAR_GRADIENTS[h];
}
function Avatar({ name = "?", size = "md" }) {
    const cls = size === "xl" ? "w-20 h-20 text-3xl" : size === "lg" ? "w-14 h-14 text-2xl" : "w-10 h-10 text-sm";
    return (
        <div className={`${cls} rounded-full bg-linear-to-br ${avatarGradient(name)} flex items-center justify-center font-black text-white shadow-lg shrink-0 select-none`}>
            {name.charAt(0).toUpperCase()}
        </div>
    );
}

/* ── Podium Card (Top 3) ── */
const PODIUM = {
    1: { order: "order-2", lift: "mb-0",    blockH: "h-28", blockBg: "from-yellow-400 to-amber-500",  ring: "ring-4 ring-yellow-400",  crown: true,  scale: "scale-105", label: "text-yellow-600" },
    2: { order: "order-1", lift: "mb-0",    blockH: "h-20", blockBg: "from-slate-300 to-slate-500",   ring: "ring-4 ring-slate-300",   crown: false, scale: "",          label: "text-slate-500"  },
    3: { order: "order-3", lift: "mb-0",    blockH: "h-14", blockBg: "from-orange-300 to-amber-600",  ring: "ring-4 ring-orange-300",  crown: false, scale: "",          label: "text-orange-500" },
};
const MEDALS = { 1: "🥇", 2: "🥈", 3: "🥉" };

function PodiumCard({ student, rank, isMe }) {
    const c = PODIUM[rank];
    if (!student) return <div className={`${c.order} w-28 sm:w-36`} />;
    return (
        <div className={`${c.order} ${c.scale} flex flex-col items-center transition-transform`}>
            {c.crown && (
                <div className="mb-1 animate-bounce">
                    <Crown size={26} className="text-yellow-400 drop-shadow-lg" fill="currentColor" />
                </div>
            )}
            <div className={`relative ${c.ring} ring-offset-2 rounded-full`}>
                <Avatar name={student.name} size="xl" />
                <span className="absolute -bottom-2 -right-2 text-2xl leading-none">{MEDALS[rank]}</span>
            </div>
            <div className="mt-4 text-center px-2 max-w-[110px]">
                <p className={`font-extrabold text-sm text-gray-800 leading-tight truncate ${isMe ? "underline decoration-dotted underline-offset-2" : ""}`}>
                    {student.name}
                </p>
                {isMe && <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full font-bold">You</span>}
                <p className={`text-xs font-bold ${c.label} mt-1`}>{student.totalScore ?? 0} pts</p>
                <p className="text-xs text-gray-400">{student.avgPercent?.toFixed(0) ?? 0}% avg</p>
            </div>
            {/* Podium block */}
            <div className={`mt-3 w-24 sm:w-32 ${c.blockH} bg-linear-to-b ${c.blockBg} rounded-t-2xl shadow-xl flex items-center justify-center`}>
                <span className="text-white font-black text-2xl drop-shadow-md">#{rank}</span>
            </div>
        </div>
    );
}

/* ── Main Component ── */
export default function Leaderboard() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("jwt") || "";

    const [leaderboard, setLeaderboard] = useState([]);
    const [filteredLeaderboard, setFilteredLeaderboard] = useState([]);
    const [view, setView] = useState("class");
    const [selectedState, setSelectedState] = useState("All States");
    const [selectedClass] = useState("All Classes");
    const [loading, setLoading] = useState(false);

    const availableStates = React.useMemo(() => {
        const states = new Set(leaderboard.map(s => s.state).filter(Boolean));
        return ["All States", ...Array.from(states).sort()];
    }, [leaderboard]);

    useEffect(() => { fetchLeaderboard(); }, [view, user?._id, user?.board, user?.className]);

    useEffect(() => {
        let filtered = leaderboard;
        if (selectedState !== "All States") filtered = filtered.filter(s => s.state === selectedState);
        if (selectedClass !== "All Classes") filtered = filtered.filter(s => s.className === selectedClass);
        setFilteredLeaderboard(filtered);
    }, [selectedState, selectedClass, leaderboard]);

    async function fetchLeaderboard() {
        if (!user?.board || !token) { setLeaderboard([]); setFilteredLeaderboard([]); setLoading(false); return; }

        const params = view === "class"
            ? `board=${encodeURIComponent(user.board)}&className=${encodeURIComponent(user.className || "")}`
            : `board=${encodeURIComponent(user.board)}`;
        const userKey = String(user?._id || user?.id || user?.email || "anonymous");
        const cacheSection = `list:${view}:${params}`;
        const cached = readCache(cacheSection, userKey, 60 * 1000);

        if (cached) {
            setLeaderboard(Array.isArray(cached) ? cached : []);
            setFilteredLeaderboard(Array.isArray(cached) ? cached : []);
            setLoading(false);
        } else {
            setLoading(true);
        }

        try {
            const res = await fetch(`${API}/api/exams/leaderboard?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json().catch(() => ({}));
            if (data.success) {
                const next = Array.isArray(data.leaderboard) ? data.leaderboard : [];
                setLeaderboard(next);
                setFilteredLeaderboard(next);
                writeCache(cacheSection, userKey, next);
            } else if (!cached) {
                setLeaderboard([]); setFilteredLeaderboard([]);
            }
        } catch {
            if (!cached) { setLeaderboard([]); setFilteredLeaderboard([]); }
        } finally {
            setLoading(false);
        }
    }

    const userIndex = filteredLeaderboard.findIndex(s => s._id === user._id);
    const userRank = userIndex !== -1 ? userIndex + 1 : null;
    const top3 = filteredLeaderboard.slice(0, 3);

    return (
        <div className="min-h-screen bg-linear-to-br from-indigo-100 via-purple-50 to-pink-100 p-3 sm:p-5 md:p-8">

            {/* Decorative stars */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden z-0 select-none">
                {[...Array(14)].map((_, i) => (
                    <Star
                        key={i}
                        size={8 + (i % 4) * 5}
                        className="absolute text-yellow-300 opacity-25"
                        style={{ top: `${(i * 41 + 8) % 92}%`, left: `${(i * 57 + 4) % 96}%`, transform: `rotate(${i * 25}deg)` }}
                        fill="currentColor"
                    />
                ))}
            </div>

            <div className="relative z-10 max-w-5xl mx-auto space-y-5 md:space-y-7">

                {/* ── HERO BANNER ── */}
                <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-violet-600 via-purple-600 to-indigo-600 p-6 sm:p-8 text-white shadow-2xl">
                    <div className="absolute -top-14 -right-14 w-52 h-52 bg-white/10 rounded-full" />
                    <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-white/10 rounded-full" />
                    <div className="absolute top-5 right-28 w-5 h-5 bg-yellow-300/60 rounded-full" />
                    <div className="absolute bottom-8 right-14 w-3 h-3 bg-pink-300/60 rounded-full" />

                    <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                                <Trophy size={38} className="text-yellow-300 drop-shadow-lg" />
                            </div>
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-lg">Leaderboard</h1>
                                <p className="text-purple-200 text-sm mt-0.5">Compete, rise &amp; claim your crown! 🏆</p>
                            </div>
                        </div>

                        {userRank && (
                            <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm px-5 py-3 rounded-2xl border border-white/30 shadow-lg self-start sm:self-auto">
                                <Zap size={20} className="text-yellow-300" />
                                <div>
                                    <p className="text-white/70 text-xs font-semibold">Your Rank</p>
                                    <p className="text-2xl font-black leading-none">#{userRank}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── FILTERS ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-4 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 text-purple-700 font-bold text-sm">
                        <Filter size={15} /> Filters
                    </div>
                    <button
                        onClick={() => setView("class")}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                            view === "class"
                                ? "bg-linear-to-r from-violet-500 to-purple-600 text-white shadow-md shadow-purple-200"
                                : "bg-gray-100 text-gray-600 hover:bg-purple-50"
                        }`}
                    >
                        <Award size={13} className="inline mr-1.5" />My Class
                    </button>
                    <div className="ml-auto flex items-center gap-2">
                        <MapPin size={14} className="text-purple-500" />
                        <select
                            value={selectedState}
                            onChange={e => setSelectedState(e.target.value)}
                            className="border-2 border-purple-100 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                        >
                            {availableStates.map(s => <option key={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                {/* ── STATES ── */}
                {loading ? (
                    <div className="bg-white rounded-3xl shadow-sm p-16 flex flex-col items-center gap-4">
                        <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
                        <p className="text-purple-600 font-bold text-lg">Loading champions…</p>
                    </div>
                ) : filteredLeaderboard.length === 0 ? (
                    <div className="bg-white rounded-3xl shadow-sm p-16 flex flex-col items-center gap-4 text-center">
                        <div className="p-5 bg-purple-50 rounded-full">
                            <Trophy size={48} className="text-purple-300" />
                        </div>
                        <p className="text-xl font-bold text-gray-700">No champions yet!</p>
                        <p className="text-gray-400 text-sm max-w-xs">
                            {selectedState !== "All States"
                                ? "No students found for this state. Try changing the filter."
                                : "Be the first! Attempt exams to appear on the leaderboard."}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* ── TOP 3 PODIUM ── */}
                        <div className="bg-linear-to-br from-white via-purple-50/60 to-indigo-50/60 rounded-3xl shadow-lg border border-purple-100 px-4 py-8 sm:px-8">
                            <div className="flex items-center justify-center gap-2 mb-8">
                                <Crown size={18} className="text-yellow-500" fill="currentColor" />
                                <h2 className="text-base font-black text-gray-700 uppercase tracking-widest">Top Champions</h2>
                                <Crown size={18} className="text-yellow-500" fill="currentColor" />
                            </div>
                            <div className="flex items-end justify-center gap-4 sm:gap-10">
                                <PodiumCard student={top3[1]} rank={2} isMe={top3[1]?._id === user._id} />
                                <PodiumCard student={top3[0]} rank={1} isMe={top3[0]?._id === user._id} />
                                <PodiumCard student={top3[2]} rank={3} isMe={top3[2]?._id === user._id} />
                            </div>
                        </div>

                        {/* ── FULL RANKINGS TABLE ── */}
                        <div className="bg-white rounded-3xl shadow-lg border border-purple-100 overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                                <TrendingUp size={17} className="text-indigo-500" />
                                <h2 className="font-bold text-gray-700">All Rankings</h2>
                                <span className="ml-auto text-xs text-gray-400 font-medium bg-gray-100 px-2.5 py-1 rounded-full">
                                    {filteredLeaderboard.length} students
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-linear-to-r from-violet-600 to-indigo-600 text-white">
                                            <th className="px-4 sm:px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Rank</th>
                                            <th className="px-4 sm:px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Student</th>
                                            <th className="px-4 sm:px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider hidden sm:table-cell">State</th>
                                            <th className="px-4 sm:px-6 py-3.5 text-center text-xs font-bold uppercase tracking-wider">Avg %</th>
                                            <th className="px-4 sm:px-6 py-3.5 text-right text-xs font-bold uppercase tracking-wider">Score</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredLeaderboard.map((s, i) => {
                                            const isMe = s._id === user._id;
                                            const rowBg = isMe
                                                ? "bg-linear-to-r from-green-50 to-emerald-50 ring-2 ring-inset ring-green-300"
                                                : i % 2 === 0 ? "bg-white hover:bg-purple-50/40" : "bg-slate-50/60 hover:bg-purple-50/40";

                                            return (
                                                <tr key={s._id} className={`transition-colors ${rowBg}`}>

                                                    {/* Rank */}
                                                    <td className="px-4 sm:px-6 py-3.5">
                                                        {i === 0 ? <span className="text-2xl">🥇</span>
                                                          : i === 1 ? <span className="text-2xl">🥈</span>
                                                          : i === 2 ? <span className="text-2xl">🥉</span>
                                                          : (
                                                            <span className={`w-8 h-8 rounded-full inline-flex items-center justify-center text-xs font-black
                                                                ${isMe ? "bg-green-500 text-white" : "bg-indigo-50 text-indigo-600"}`}>
                                                                {i + 1}
                                                            </span>
                                                          )}
                                                    </td>

                                                    {/* Student */}
                                                    <td className="px-4 sm:px-6 py-3.5">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar name={s.name} size="sm" />
                                                            <div>
                                                                <p className={`font-bold leading-tight ${isMe ? "text-green-700" : "text-gray-800"}`}>
                                                                    {s.name}
                                                                </p>
                                                                {isMe && (
                                                                    <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
                                                                        You
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* State */}
                                                    <td className="px-4 sm:px-6 py-3.5 hidden sm:table-cell">
                                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                                                            <MapPin size={10} />{s.state || "—"}
                                                        </span>
                                                    </td>

                                                    {/* Avg % */}
                                                    <td className="px-4 sm:px-6 py-3.5 text-center">
                                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold
                                                            ${s.avgPercent >= 75 ? "bg-green-100 text-green-700"
                                                              : s.avgPercent >= 50 ? "bg-yellow-100 text-yellow-700"
                                                              : "bg-red-50 text-red-600"}`}>
                                                            <TrendingUp size={10} />{s.avgPercent?.toFixed(0) ?? 0}%
                                                        </span>
                                                    </td>

                                                    {/* Score */}
                                                    <td className="px-4 sm:px-6 py-3.5 text-right">
                                                        <span className="font-black text-base bg-linear-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                                                            {s.totalScore}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
