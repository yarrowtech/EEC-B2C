import React, { useEffect, useState } from "react";
import { Trophy } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Leaderboard() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const [leaderboard, setLeaderboard] = useState([]);
    const [view, setView] = useState("class"); // class | board
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchLeaderboard();
    }, [view]);

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
        if (data.success) setLeaderboard(data.leaderboard);

        setLoading(false);
    }

    return (
        <div className="space-y-8">

            {/* HEADER */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 p-6 text-white shadow-lg">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
                <div className="flex items-center gap-4 relative z-10">
                    <Trophy size={36} className="drop-shadow-lg" />
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">
                            Leaderboard
                        </h1>
                        <p className="text-sm text-white/90">
                            See how you rank among others
                        </p>
                    </div>
                </div>
            </div>

            {/* FILTER */}
            {/* <div className="flex gap-4">
                <button
                    onClick={() => setView("class")}
                    className={`px-6 py-2 rounded-xl font-semibold transition shadow ${view === "class"
                            ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-white"
                            : "bg-white border hover:bg-yellow-50"
                        }`}
                >
                    My Class
                </button>

                <button
                    onClick={() => setView("board")}
                    className={`px-6 py-2 rounded-xl font-semibold transition shadow ${view === "board"
                            ? "bg-gradient-to-r from-orange-400 to-red-400 text-white"
                            : "bg-white border hover:bg-orange-50"
                        }`}
                >
                    My Board
                </button>
            </div> */}

            {/* CONTENT */}
            <div className="bg-white shadow-lg overflow-hidden">

                {loading ? (
                    <div className="p-10 text-center text-gray-500 font-medium">
                        Loading leaderboard…
                    </div>
                ) : leaderboard.length === 0 ? (
                    <div className="p-10 text-center text-gray-500">
                        <p className="text-lg font-semibold">No leaderboard data found</p>
                        <p className="text-sm mt-1">
                            Attempt exams to appear on the leaderboard
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gradient-to-r from-yellow-100 to-orange-100">
                            <tr>
                                <th className="px-4 py-3 text-left font-bold">Rank</th>
                                <th className="px-4 py-3 text-left font-bold">Student</th>
                                {/* <th className="px-4 py-3 text-left font-bold">State</th> */}
                                <th className="px-4 py-3 text-left font-bold">Avg %</th>
                                <th className="px-4 py-3 text-left font-bold">Score</th>
                            </tr>
                        </thead>

                        <tbody>
                            {leaderboard.map((s, i) => {
                                const isMe = s._id === user._id;

                                return (
                                    <tr
                                        key={s._id}
                                        className={`border-b transition ${isMe
                                                ? "font-bold"
                                                : "hover:bg-yellow-50"
                                            }`}
                                    >
                                        {/* RANK + MEDAL */}
                                        <td className="px-4 py-3 font-bold flex items-center gap-2">
                                            <span>{i + 1}</span>

                                            {i === 0 && <span>🥇</span>}
                                            {i === 1 && <span>🥈</span>}
                                            {i === 2 && <span>🥉</span>}
                                        </td>

                                        {/* STUDENT */}
                                        <td className="px-4 py-3">
                                            <span className="flex items-center gap-2">
                                                {s.name}
                                                {isMe && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-200 text-green-800">
                                                        You
                                                    </span>
                                                )}
                                            </span>
                                        </td>
                                        {/* <td className="px-4 py-3 font-semibold text-orange-600">
                                            {s.state || "—"}
                                        </td> */}

                                        {/* AVG % */}
                                        <td className="px-4 py-3 font-semibold text-green-600">
                                            {s.avgPercent?.toFixed(0)}%
                                        </td>

                                        {/* SCORE */}
                                        <td className="px-4 py-3 font-extrabold text-gray-800">
                                            {s.totalScore}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
