import React, { useState, useEffect } from 'react';
import { Trophy, Award, Medal, Target, Lock, Calendar, Book, PuzzleIcon } from 'lucide-react';

const AchievementsView = () => {
  const [activeTab, setActiveTab] = useState('history');
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userPoints = user.points;
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [attempts, setAttempts] = useState([]);

  useEffect(() => {
    async function fetchAttempts() {
      if (!user?._id) return;

      try {
        const res = await fetch(
          `${API}/api/exams/user-results/${user._id}`,
          {
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("jwt")}`,
              "Content-Type": "application/json"
            }
          }
        );

        const data = await res.json();

        if (res.ok) {
          setAttempts(data.results || []);
        } else {
          setAttempts([]);
        }
      } catch {
        setAttempts([]);
      }
    }

    fetchAttempts();
  }, []);

  const pointsHistory = attempts.map(attempt => ({
    exam: attempt.stage,
    subject: attempt.subjectName || attempt.subject,
    topic: attempt.topicName || attempt.topic,
    pointsEarned: attempt.score,
    date: attempt.createdAt
  }));

  const totalAchievements = pointsHistory.length;
  const earnedCount = pointsHistory.filter(item => item.pointsEarned > 0).length;
  const availableCount = totalAchievements - earnedCount;

  const achievements = [];
  const earnedAchievements = achievements.filter(a => a.earned);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

  const [historyPage, setHistoryPage] = useState(1);
  const historyPerPage = 6;
  const totalHistoryPages = Math.ceil(pointsHistory.length / historyPerPage);
  const paginatedHistory = pointsHistory.slice(
    (historyPage - 1) * historyPerPage,
    historyPage * historyPerPage
  );

  return (
    <div className="
      space-y-8 p-6 rounded-[2.5rem]
      bg-gradient-to-br from-yellow-50 via-pink-50 to-indigo-50
      shadow-[0_25px_70px_rgba(0,0,0,0.15)]
      relative overflow-hidden
    ">

      {/* Decorative blobs */}
      <div className="absolute -top-20 -right-20 w-72 h-72 bg-yellow-300/30 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-pink-300/30 rounded-full blur-3xl" />

      {/* HEADER */}
      <div className="relative z-10 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 flex items-center gap-2">
            🏆 Achievements
          </h1>
          <p className="text-gray-600 text-sm">
            Track your progress & collect rewards ✨
          </p>
        </div>

        <div className="
          flex items-center gap-4
          bg-white/80 backdrop-blur
          px-5 py-3 rounded-2xl
          shadow-lg border border-white
        ">
          <div className="bg-yellow-100 p-3 rounded-xl shadow-inner">
            <Trophy className="w-7 h-7 text-yellow-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Points</p>
            <p className="text-3xl font-extrabold text-yellow-600">
              {userPoints}
            </p>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        <div className="bg-white/80 rounded-2xl p-6 shadow-lg border border-white">
          <p className="text-sm text-gray-600">Total Achievements</p>
          <p className="text-3xl font-extrabold text-gray-900">{totalAchievements}</p>
        </div>

        <div className="bg-white/80 rounded-2xl p-6 shadow-lg border border-white">
          <p className="text-sm text-gray-600">Earned</p>
          <p className="text-3xl font-extrabold text-green-600">{earnedCount}</p>
        </div>

        <div className="bg-white/80 rounded-2xl p-6 shadow-lg border border-white">
          <p className="text-sm text-gray-600">Not Earned</p>
          <p className="text-3xl font-extrabold text-purple-600">{availableCount}</p>
        </div>
      </div>

      {/* TABS */}
      <div className="relative z-10 flex bg-white/70 backdrop-blur p-1 rounded-2xl shadow-md">
        {[
          { id: 'history', label: 'Points History', count: pointsHistory.length },
          { id: 'earned', label: 'Earned', count: earnedAchievements.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 py-2 rounded-xl font-bold transition-all
              ${activeTab === tab.id
                ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg"
                : "text-gray-600 hover:text-gray-900"}
            `}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* CARDS */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === "history" &&
          paginatedHistory.map((item, index) => (
            <div
              key={index}
              className="
                relative bg-white/85 rounded-2xl
                shadow-lg border border-white
                p-6 hover:scale-[1.03]
                transition-all
              "
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-t-2xl" />

              <h3 className="text-lg font-extrabold text-gray-900 mb-2">
                🎯 {item.exam?.toUpperCase()}
              </h3>

              <p className="text-sm text-gray-700"><Book className='inline' size={15} /> Subject: {item.subject}</p>
              <p className="text-sm text-gray-700"><PuzzleIcon className='inline' size={15} /> Topic: {item.topic}</p>

              <p className="text-xs text-gray-500 mt-2">
                <Calendar className='inline' size={15} /> {formatDate(item.date)}
              </p>

              <div className="flex justify-between items-center border-t pt-3 mt-3">
                <span className="text-sm text-gray-600">Points Earned</span>
                <span className="
                  bg-gradient-to-r from-yellow-300 to-orange-400
                  text-white font-bold text-sm
                  px-3 py-1 rounded-full shadow
                ">
                  +{item.pointsEarned} pts
                </span>
              </div>
            </div>
          ))
        }

        {activeTab !== "history" &&
          earnedAchievements.map((achievement) => {
            const IconComponent = achievement.icon;
            return (
              <div
                key={achievement.id}
                className="bg-white rounded-2xl shadow-lg border border-white p-6"
              >
                <IconComponent className="w-8 h-8 text-blue-600" />
                <h3 className="text-lg font-bold mt-3">{achievement.title}</h3>
              </div>
            );
          })}
      </div>

      {/* PAGINATION */}
      {activeTab === "history" && totalHistoryPages > 1 && (
        <div className="relative z-10 flex justify-center items-center gap-3 mt-6">
          <button
            disabled={historyPage === 1}
            onClick={() => setHistoryPage(historyPage - 1)}
            className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            Prev
          </button>

          {[...Array(totalHistoryPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setHistoryPage(i + 1)}
              className={`
                px-3 py-1 rounded-xl font-bold
                ${historyPage === i + 1
                  ? "bg-yellow-500 text-white shadow"
                  : "bg-white text-gray-700 border"}
              `}
            >
              {i + 1}
            </button>
          ))}

          <button
            disabled={historyPage === totalHistoryPages}
            onClick={() => setHistoryPage(historyPage + 1)}
            className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AchievementsView;
