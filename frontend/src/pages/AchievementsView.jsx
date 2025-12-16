import React, { useState, useEffect } from 'react';
import { Trophy, Award, Medal, Target, Lock } from 'lucide-react';

const AchievementsView = () => {
  const [activeTab, setActiveTab] = useState('history');
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userPoints = user.points;
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [attempts, setAttempts] = useState([]);

  // useEffect(() => {
  //   async function fetchAttempts() {
  //     if (!user?._id) return;

  //     const res = await fetch(`${API}/api/attempt/user/${user._id}`);
  //     const data = await res.json();

  //     if (res.ok) {
  //       setAttempts(data.attempts || []);
  //     }
  //   }

  //   fetchAttempts();
  // }, []);

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
          // setAttempts(data.attempts || []);
          setAttempts(data.results || []);
        } else {
          console.error("ATTEMPT FETCH ERROR:", data);
          setAttempts([]);
        }
      } catch (err) {
        console.error("ATTEMPT FETCH ERROR:", err);
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
  // Points-based Achievements Recalculation
  const totalAchievements = pointsHistory.length;

  // Consider "earned" as any exam where score > 0
  const earnedCount = pointsHistory.filter(item => item.pointsEarned > 0).length;

  // In progress means attempt exists, but maybe below 100%
  const inProgressCount = pointsHistory.filter(item => item.pointsEarned < item.total).length;

  // Available = Total - Earned
  const availableCount = totalAchievements - earnedCount;


  // Achievements intentionally empty because you commented them out.
  const achievements = [];

  const earnedAchievements = achievements.filter(a => a.earned);
  const availableAchievements = achievements.filter(a => !a.earned);
  const inProgressAchievements = achievements.filter(a => !a.earned && a.progress > 0);

  const getFilteredAchievements = () => {
    switch (activeTab) {
      case 'earned': return earnedAchievements;
      case 'available': return availableAchievements;
      case 'progress': return inProgressAchievements;
      case 'history': return [];
      default: return achievements;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Pagination for points history cards
  const [historyPage, setHistoryPage] = useState(1);
  const historyPerPage = 6;

  const totalHistoryPages = Math.ceil(pointsHistory.length / historyPerPage);

  const paginatedHistory = pointsHistory.slice(
    (historyPage - 1) * historyPerPage,
    historyPage * historyPerPage
  );


  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Achievements</h1>
          <p className="text-gray-600">Track your progress and unlock new achievements</p>
        </div>

        <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-xl border shadow-sm">
          <div className="bg-yellow-100 p-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg"
              className="w-7 h-7 text-yellow-600"
              fill="none" viewBox="0 0 24 24"
              strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 14.25c-.621 0-1.21-.138-1.738-.385A3.752 3.752 0 019 9.75m6 
          4.5c-.621 0-1.21-.138-1.738-.385A3.752 3.752 0 0015 9.75M12 
          6.75v2.25m0 6v2.25m9-6c0 3.728-4.03 6.75-9 
          6.75S3 15.728 3 12s4.03-6.75 9-6.75 9 
          3.022 9 6.75z" />
            </svg>
          </div>

          <div className="text-left">
            <p className="text-sm text-gray-600">Total Points</p>
            <p className="text-2xl font-bold text-yellow-600">
              {userPoints}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Total Achievements</p>
          <p className="text-2xl font-bold text-gray-900">{totalAchievements}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Earned</p>
          <p className="text-2xl font-bold text-green-600">{earnedCount}</p>
        </div>

        {/* <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-600">In Progress</p>
          <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Available</p>
          <p className="text-2xl font-bold text-purple-600">{availableCount}</p>
        </div> */}
      </div>

      {/* TABS */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'history', label: 'Points History', count: pointsHistory.length },
          { id: 'earned', label: 'Earned', count: earnedAchievements.length },
          // { id: 'progress', label: 'In Progress', count: inProgressAchievements.length },
          // { id: 'available', label: 'Available', count: availableAchievements.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* CARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* HISTORY TAB */}
        {activeTab === "history" &&
          paginatedHistory.map((item, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border-gray-200 border p-6 relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-400"></div>

              <h3 className="text-lg font-bold text-gray-900 mb-2">{item.exam?.toUpperCase()}</h3>

              <p className="text-gray-700 text-sm">Subject: {item.subject}</p>
              <p className="text-gray-700 text-sm">Topic: {item.topic}</p>

              <p className="text-gray-500 text-xs mt-2">{formatDate(item.date)}</p>

              <div className="flex justify-between items-center border-t pt-3 mt-3">
                <span className="text-sm text-gray-600">Points Earned</span>
                <span className="text-yellow-600 font-bold text-sm md:text-lg lg:text-lg bg-yellow-100 px-2 md:px-1.5 lg:px-1.5 rounded-full">+{item.pointsEarned} pts</span>
              </div>
            </div>
          ))
        }

        {/* ACHIEVEMENT CARDS */}
        {activeTab !== "history" &&
          getFilteredAchievements().map((achievement) => {
            const IconComponent = achievement.icon;
            return (
              <div
                key={achievement.id}
                className="bg-white rounded-xl shadow-sm border-gray-200 border p-6 relative"
              >
                <IconComponent className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-bold mt-3">{achievement.title}</h3>
              </div>
            );
          })
        }

      </div>
      {/* Pagination for Points History */}
      {activeTab === "history" && totalHistoryPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-6">

          {/* Previous */}
          <button
            className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
            disabled={historyPage === 1}
            onClick={() => setHistoryPage(historyPage - 1)}
          >
            Previous
          </button>

          {/* Page Numbers */}
          {[...Array(totalHistoryPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setHistoryPage(i + 1)}
              className={`px-3 py-1 rounded-lg border text-sm ${historyPage === i + 1
                  ? "bg-yellow-500 text-white"
                  : "bg-white text-gray-700"
                }`}
            >
              {i + 1}
            </button>
          ))}

          {/* Next */}
          <button
            className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
            disabled={historyPage === totalHistoryPages}
            onClick={() => setHistoryPage(historyPage + 1)}
          >
            Next
          </button>

        </div>
      )}
    </div>
  );
};

export default AchievementsView;
