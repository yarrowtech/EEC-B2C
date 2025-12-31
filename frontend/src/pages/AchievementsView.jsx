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

  // Add welcome bonus as the first entry if user exists and has at least 100 points (or is new)
  // Only show welcome bonus if user has points (new users start with 100)
  const welcomeBonus = user?._id && userPoints >= 100 ? [{
    exam: 'Welcome',
    subject: 'Registration Bonus',
    topic: 'New Member Reward',
    pointsEarned: 100,
    date: user.createdAt || new Date().toISOString(),
    isWelcome: true
  }] : [];

  const pointsHistory = [
    ...welcomeBonus,
    ...attempts.map(attempt => ({
      exam: attempt.stage,
      subject: attempt.subjectName || attempt.subject,
      topic: attempt.topicName || attempt.topic,
      pointsEarned: attempt.score,
      date: attempt.createdAt
    }))
  ];

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
    <div className="min-h-screen space-y-6 md:space-y-8 p-4 sm:p-6 md:p-8 bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 relative overflow-hidden">

      {/* Animated Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* HEADER */}
      <div className="relative z-10 overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 p-6 md:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
              <Trophy size={40} className="drop-shadow-lg" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-lg">
                Achievements
              </h1>
              <p className="text-sm md:text-base text-yellow-100 mt-1">
                Track your progress & collect rewards
              </p>
            </div>
          </div>

          <div className="
            flex items-center gap-3
            bg-white/20 backdrop-blur-sm
            px-4 sm:px-5 py-3 rounded-xl md:rounded-2xl
            shadow-lg border border-white/30
          ">
            <div className="bg-white/30 p-2.5 sm:p-3 rounded-xl shadow-inner">
              <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-200" />
            </div>
            <div>
              <p className="text-xs text-white/80">Total Points</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-lg">
                {userPoints}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-xl md:rounded-2xl p-5 md:p-6 shadow-lg border border-gray-200/50 transform hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600 mb-1">Total Achievements</p>
              <p className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">{totalAchievements}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Award className="w-6 h-6 md:w-7 md:h-7 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-xl md:rounded-2xl p-5 md:p-6 shadow-lg border border-gray-200/50 transform hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600 mb-1">Earned</p>
              <p className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{earnedCount}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Medal className="w-6 h-6 md:w-7 md:h-7 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-xl md:rounded-2xl p-5 md:p-6 shadow-lg border border-gray-200/50 transform hover:-translate-y-1 transition-all duration-300 group sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600 mb-1">Not Earned</p>
              <p className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{availableCount}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Lock className="w-6 h-6 md:w-7 md:h-7 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="relative z-10 flex bg-white/80 backdrop-blur-xl p-1.5 rounded-xl md:rounded-2xl shadow-lg border border-gray-200/50">
        {[
          { id: 'history', label: 'Points History', count: pointsHistory.length },
          { id: 'earned', label: 'Earned', count: earnedAchievements.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 py-2.5 md:py-3 rounded-lg md:rounded-xl font-bold text-sm md:text-base transition-all duration-300
              ${activeTab === tab.id
                ? "bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 text-white shadow-xl transform scale-[1.02]"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}
            `}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* CARDS */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {activeTab === "history" &&
          paginatedHistory.map((item, index) => (
            <div
              key={index}
              className={`
                group relative rounded-xl md:rounded-2xl
                shadow-lg hover:shadow-2xl
                p-5 md:p-6
                ${item.isWelcome
                  ? 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-300'
                  : 'bg-white/90 backdrop-blur-sm border border-gray-200/50'
                }
              `}
            >
              <div className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-xl md:rounded-t-2xl ${
                item.isWelcome
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500'
                  : 'bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500'
              }`} />

              {item.isWelcome && (
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                  ✨ BONUS
                </div>
              )}

              <div className="flex items-start justify-between mb-3">
                <h3 className="text-base md:text-lg font-extrabold">
                  {item.isWelcome ? '🎁' : '🎯'} {item.exam?.toUpperCase()}
                </h3>
              </div>

              <div className="space-y-2 mb-3">
                <p className={`text-xs md:text-sm flex items-center gap-2 ${
                  item.isWelcome ? 'text-amber-700' : 'text-gray-700'
                }`}>
                  <Book size={16} className={item.isWelcome ? 'text-amber-500' : 'text-orange-500'} />
                  <span className="font-medium">Subject:</span> {item.subject}
                </p>
                <p className={`text-xs md:text-sm flex items-center gap-2 ${
                  item.isWelcome ? 'text-amber-700' : 'text-gray-700'
                }`}>
                  <PuzzleIcon size={16} className={item.isWelcome ? 'text-amber-500' : 'text-yellow-500'} />
                  <span className="font-medium">Topic:</span> {item.topic}
                </p>
                <p className={`text-xs flex items-center gap-2 ${
                  item.isWelcome ? 'text-amber-600' : 'text-gray-500'
                }`}>
                  <Calendar size={16} className={item.isWelcome ? 'text-amber-500' : 'text-pink-500'} />
                  {formatDate(item.date)}
                </p>
              </div>

              <div className={`flex justify-between items-center pt-3 mt-3 ${
                item.isWelcome ? 'border-t-2 border-amber-200' : 'border-t border-gray-200/50'
              }`}>
                <span className={`text-xs md:text-sm font-medium ${
                  item.isWelcome ? 'text-amber-700' : 'text-gray-600'
                }`}>
                  {item.isWelcome ? 'Welcome Bonus' : 'Points Earned'}
                </span>
                <span className={`
                  text-white font-bold text-xs md:text-sm
                  px-3 py-1.5 rounded-full shadow-md
                  group-hover:shadow-lg group-hover:scale-110 transition-all duration-300
                  ${item.isWelcome
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                    : 'bg-gradient-to-r from-yellow-400 to-orange-500'
                  }
                `}>
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
                className="group relative bg-white/90 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-lg hover:shadow-2xl border border-gray-200/50 p-5 md:p-6 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl mb-3 group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-gray-900">{achievement.title}</h3>
                </div>
              </div>
            );
          })}
      </div>

      {/* PAGINATION */}
      {activeTab === "history" && totalHistoryPages > 1 && (
        <div className="relative z-10 flex justify-center items-center gap-2 md:gap-3 mt-6">
          <button
            disabled={historyPage === 1}
            onClick={() => setHistoryPage(historyPage - 1)}
            className="px-3 md:px-4 py-2 rounded-lg md:rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200/50 text-gray-700 font-medium text-sm md:text-base hover:bg-gradient-to-r hover:from-yellow-400 hover:to-orange-500 hover:text-white hover:border-transparent disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-300"
          >
            Prev
          </button>

          {[...Array(totalHistoryPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setHistoryPage(i + 1)}
              className={`
                px-3 md:px-4 py-2 rounded-lg md:rounded-xl font-bold text-sm md:text-base transition-all duration-300
                ${historyPage === i + 1
                  ? "bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 text-white shadow-lg scale-110"
                  : "bg-white/80 backdrop-blur-sm text-gray-700 border border-gray-200/50 hover:border-orange-300 hover:bg-orange-50 shadow-md hover:shadow-lg"}
              `}
            >
              {i + 1}
            </button>
          ))}

          <button
            disabled={historyPage === totalHistoryPages}
            onClick={() => setHistoryPage(historyPage + 1)}
            className="px-3 md:px-4 py-2 rounded-lg md:rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200/50 text-gray-700 font-medium text-sm md:text-base hover:bg-gradient-to-r hover:from-yellow-400 hover:to-orange-500 hover:text-white hover:border-transparent disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-300"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AchievementsView;
