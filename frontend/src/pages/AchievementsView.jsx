import React, { useState, useEffect } from 'react';
import { Trophy, Award, Medal, Target, Lock, Calendar, BookOpen, CheckCircle, XCircle, Star, TrendingUp } from 'lucide-react';

const ACHIEVEMENTS_CACHE_PREFIX = "eec:achievements-cache:v1";

function getCacheKey(section, userKey = "anonymous") {
  return `${ACHIEVEMENTS_CACHE_PREFIX}:${userKey}:${section}`;
}

function readCache(section, userKey, ttlMs) {
  try {
    const raw = localStorage.getItem(getCacheKey(section, userKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.ts !== "number") return null;
    if (Date.now() - parsed.ts > ttlMs) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(section, userKey, data) {
  try {
    localStorage.setItem(
      getCacheKey(section, userKey),
      JSON.stringify({ ts: Date.now(), data })
    );
  } catch {}
}

const AchievementsView = () => {
  const [activeTab, setActiveTab] = useState('history');
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userPoints = user.points;
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [attempts, setAttempts] = useState([]);
  const [dailyAttempts, setDailyAttempts] = useState([]);

  useEffect(() => {
    async function fetchAttempts() {
      if (!user?._id) return;

      const userKey = String(user._id || user.id || user.email || "anonymous");
      const cachedExamAttempts = readCache("exam-attempts", userKey, 2 * 60 * 1000);
      const cachedDailyAttempts = readCache("daily-attempts", userKey, 60 * 1000);

      if (cachedExamAttempts) setAttempts(Array.isArray(cachedExamAttempts) ? cachedExamAttempts : []);
      if (cachedDailyAttempts) setDailyAttempts(Array.isArray(cachedDailyAttempts) ? cachedDailyAttempts : []);

      try {
        const headers = {
          "Authorization": `Bearer ${localStorage.getItem("jwt")}`,
          "Content-Type": "application/json"
        };

        const [examRes, dailyRes] = await Promise.all([
          fetch(`${API}/api/exams/user-results/${user._id}`, { headers }),
          fetch(`${API}/api/daily-challenge/attempts`, { headers }),
        ]);

        const examData = await examRes.json().catch(() => ({}));
        const dailyData = await dailyRes.json().catch(() => ({}));

        if (examRes.ok) {
          const next = examData.results || [];
          setAttempts(next);
          writeCache("exam-attempts", userKey, next);
        } else if (!cachedExamAttempts) setAttempts([]);

        if (dailyRes.ok) {
          const next = Array.isArray(dailyData.items) ? dailyData.items : [];
          setDailyAttempts(next);
          writeCache("daily-attempts", userKey, next);
        } else if (!cachedDailyAttempts) setDailyAttempts([]);
      } catch {
        if (!cachedExamAttempts) setAttempts([]);
        if (!cachedDailyAttempts) setDailyAttempts([]);
      }
    }

    fetchAttempts();
  }, [API, user?._id]);

  const welcomeBonus = user?._id && userPoints >= 100 ? [{
    exam: 'Welcome Bonus',
    subject: 'Registration Bonus',
    topic: 'New Member Reward',
    pointsEarned: 100,
    date: user.createdAt || new Date().toISOString(),
    isWelcome: true
  }] : [];

  const pointsHistory = [
    ...welcomeBonus,
    ...attempts.map((attempt) => {
      const stageLabel = attempt.stage ? `Stage Test – ${attempt.stage}` : "Exam";
      return {
        exam: attempt.examName || attempt.exam || stageLabel,
        subject: attempt.subjectName || attempt.subject?.name || attempt.subject || "Unknown Subject",
        topic: attempt.topicName || attempt.topic?.name || attempt.topic || "Unknown Topic",
        pointsEarned: attempt.score,
        date: attempt.createdAt,
      };
    }),
    ...dailyAttempts.map((attempt) => ({
      exam: "Daily Challenge",
      subject: attempt.subject || "Daily Practice",
      topic: attempt.topic || "Board / Class Daily Question",
      pointsEarned: Number(attempt.pointsAwarded || 0),
      date: attempt.submittedAt || attempt.createdAt,
      isDaily: true,
      questionType: attempt.questionType || "mcq",
      resultLabel: attempt.isCorrect ? "Correct" : "Incorrect",
      streakAfter: Number(attempt.streakAfter || 0),
      badgeAfter: String(attempt.badgeAfter || "none"),
      dateKey: attempt.dateKey || "",
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalAchievements = pointsHistory.length;
  const earnedCount = pointsHistory.filter(item => item.pointsEarned > 0).length;
  const availableCount = totalAchievements - earnedCount;

  const achievements = [];
  const earnedAchievements = achievements.filter(a => a.earned);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });

  const [historyPage, setHistoryPage] = useState(1);
  const historyPerPage = 8;
  const totalHistoryPages = Math.ceil(pointsHistory.length / historyPerPage);
  const paginatedHistory = pointsHistory.slice(
    (historyPage - 1) * historyPerPage,
    historyPage * historyPerPage
  );

  const tabs = [
    { id: 'history', label: 'Points History', count: pointsHistory.length },
    { id: 'earned', label: 'Earned Badges', count: earnedAchievements.length },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── PAGE HEADER ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-xl">
              <Trophy size={28} className="text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Achievements</h1>
              <p className="text-sm text-gray-500 mt-0.5">Track your progress and earned rewards</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-indigo-600 text-white px-5 py-3 rounded-xl shadow-sm">
            <Star size={18} className="text-indigo-200" />
            <div>
              <p className="text-xs text-indigo-200 leading-none">Total Points</p>
              <p className="text-2xl font-bold leading-tight">{userPoints ?? "—"}</p>
            </div>
          </div>
        </div>

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: "Total Entries",
              value: totalAchievements,
              icon: <TrendingUp size={20} className="text-indigo-600" />,
              bg: "bg-indigo-50",
              text: "text-indigo-700",
            },
            {
              label: "Points Earned",
              value: earnedCount,
              icon: <CheckCircle size={20} className="text-emerald-600" />,
              bg: "bg-emerald-50",
              text: "text-emerald-700",
            },
            {
              label: "Zero-Point Entries",
              value: availableCount,
              icon: <Lock size={20} className="text-slate-500" />,
              bg: "bg-slate-50",
              text: "text-slate-700",
            },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className={`text-3xl font-bold mt-1 ${s.text}`}>{s.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${s.bg}`}>{s.icon}</div>
            </div>
          ))}
        </div>

        {/* ── TABS ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-1 flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
                ${activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
            >
              {tab.label}
              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium
                ${activeTab === tab.id ? "bg-indigo-500 text-indigo-100" : "bg-gray-100 text-gray-600"}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* ── HISTORY TABLE ── */}
        {activeTab === "history" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {paginatedHistory.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <Trophy size={40} className="mx-auto mb-3 text-gray-200" />
                <p className="font-medium">No history yet</p>
                <p className="text-sm mt-1">Complete exams or daily challenges to see your progress here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Activity</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Topic</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginatedHistory.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              item.isWelcome ? "bg-amber-50" :
                              item.isDaily ? "bg-blue-50" : "bg-indigo-50"
                            }`}>
                              {item.isWelcome
                                ? <Award size={16} className="text-amber-600" />
                                : item.isDaily
                                  ? <Target size={16} className="text-blue-600" />
                                  : <BookOpen size={16} className="text-indigo-600" />
                              }
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">{item.exam}</p>
                              {item.isDaily && (
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full
                                    ${item.resultLabel === "Correct"
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-red-50 text-red-600"
                                    }`}>
                                    {item.resultLabel === "Correct"
                                      ? <CheckCircle size={10} />
                                      : <XCircle size={10} />
                                    }
                                    {item.resultLabel}
                                  </span>
                                  <span className="text-xs text-gray-400">Streak: {item.streakAfter}</span>
                                </div>
                              )}
                              {item.isWelcome && (
                                <span className="text-xs text-amber-600 font-medium">Welcome Bonus</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-gray-600">{item.subject}</td>
                        <td className="px-5 py-4 text-gray-600 max-w-[200px] truncate">{item.topic}</td>
                        <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-gray-400" />
                            {formatDate(item.date)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className={`inline-block font-bold text-sm px-3 py-1 rounded-full
                            ${item.pointsEarned > 0
                              ? "bg-indigo-50 text-indigo-700"
                              : "bg-gray-100 text-gray-400"
                            }`}>
                            {item.pointsEarned > 0 ? `+${item.pointsEarned}` : "0"} pts
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalHistoryPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Showing <span className="font-medium text-gray-700">{(historyPage - 1) * historyPerPage + 1}–{Math.min(historyPage * historyPerPage, pointsHistory.length)}</span> of <span className="font-medium text-gray-700">{pointsHistory.length}</span> entries
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={historyPage === 1}
                    onClick={() => setHistoryPage(p => p - 1)}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-lg">
                    {historyPage} / {totalHistoryPages}
                  </span>
                  <button
                    disabled={historyPage === totalHistoryPages}
                    onClick={() => setHistoryPage(p => p + 1)}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── EARNED BADGES ── */}
        {activeTab === "earned" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            {earnedAchievements.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <Medal size={40} className="mx-auto mb-3 text-gray-200" />
                <p className="font-medium">No badges earned yet</p>
                <p className="text-sm mt-1">Keep completing activities to unlock badges.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {earnedAchievements.map((achievement) => {
                  const IconComponent = achievement.icon;
                  return (
                    <div
                      key={achievement.id}
                      className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors"
                    >
                      <div className="p-3 bg-indigo-50 rounded-xl shrink-0">
                        <IconComponent className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{achievement.title}</p>
                        {achievement.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{achievement.description}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default AchievementsView;
