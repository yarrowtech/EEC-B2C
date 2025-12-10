import React, { useState } from 'react';
import { Trophy, Award, Medal, Star, Target, Calendar, CheckCircle, Lock, TrendingUp, Users, Clock, Book } from 'lucide-react';

const AchievementsView = () => {
  const [activeTab, setActiveTab] = useState('earned'); // earned, available, progress

  // Sample achievements data
  const achievements = [
    {
      id: 1,
      title: "First Assignment Submitted",
      description: "Submit your first assignment successfully",
      category: "academic",
      type: "milestone",
      icon: CheckCircle,
      earned: true,
      earnedDate: "2025-03-15",
      points: 50,
      rarity: "common",
      progress: 100,
      requirement: "Submit 1 assignment"
    },
    {
      id: 2,
      title: "Perfect Attendance",
      description: "Attend all classes for a full month",
      category: "attendance",
      type: "streak",
      icon: Calendar,
      earned: true,
      earnedDate: "2025-04-01",
      points: 100,
      rarity: "uncommon",
      progress: 100,
      requirement: "100% attendance for 30 days"
    },
    {
      id: 3,
      title: "High Achiever",
      description: "Score 90% or above in 5 assignments",
      category: "academic",
      type: "performance",
      icon: Trophy,
      earned: false,
      points: 200,
      rarity: "rare",
      progress: 60,
      requirement: "Score 90%+ in 5 assignments",
      currentProgress: "3/5 assignments"
    },
    {
      id: 4,
      title: "Course Completion Master",
      description: "Complete 3 courses with distinction",
      category: "academic",
      type: "milestone",
      icon: Award,
      earned: false,
      points: 300,
      rarity: "epic",
      progress: 33,
      requirement: "Complete 3 courses with distinction",
      currentProgress: "1/3 courses"
    },
    {
      id: 5,
      title: "Early Bird",
      description: "Join 10 classes 5 minutes early",
      category: "attendance",
      type: "habit",
      icon: Clock,
      earned: true,
      earnedDate: "2025-05-10",
      points: 75,
      rarity: "common",
      progress: 100,
      requirement: "Join 10 classes early"
    },
    {
      id: 6,
      title: "Study Streak",
      description: "Study for 7 consecutive days",
      category: "study",
      type: "streak",
      icon: TrendingUp,
      earned: false,
      points: 150,
      rarity: "uncommon",
      progress: 71,
      requirement: "Study 7 days in a row",
      currentProgress: "5/7 days"
    },
    {
      id: 7,
      title: "Collaboration Champion",
      description: "Participate in 5 group projects",
      category: "social",
      type: "collaboration",
      icon: Users,
      earned: false,
      points: 120,
      rarity: "uncommon",
      progress: 40,
      requirement: "Complete 5 group projects",
      currentProgress: "2/5 projects"
    },
    {
      id: 8,
      title: "Knowledge Seeker",
      description: "Read 50 course materials",
      category: "study",
      type: "exploration",
      icon: Book,
      earned: false,
      points: 100,
      rarity: "common",
      progress: 86,
      requirement: "Read 50 course materials",
      currentProgress: "43/50 materials"
    }
  ];

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100 border-gray-300';
      case 'uncommon': return 'text-green-600 bg-green-100 border-green-300';
      case 'rare': return 'text-blue-600 bg-blue-100 border-blue-300';
      case 'epic': return 'text-purple-600 bg-purple-100 border-purple-300';
      case 'legendary': return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      default: return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'academic': return 'text-blue-600 bg-blue-100';
      case 'attendance': return 'text-green-600 bg-green-100';
      case 'study': return 'text-purple-600 bg-purple-100';
      case 'social': return 'text-pink-600 bg-pink-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const earnedAchievements = achievements.filter(a => a.earned);
  const availableAchievements = achievements.filter(a => !a.earned);
  const inProgressAchievements = achievements.filter(a => !a.earned && a.progress > 0);

  const getFilteredAchievements = () => {
    switch (activeTab) {
      case 'earned': return earnedAchievements;
      case 'available': return availableAchievements;
      case 'progress': return inProgressAchievements;
      default: return achievements;
    }
  };

  const totalPoints = earnedAchievements.reduce((sum, achievement) => sum + achievement.points, 0);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Achievements</h1>
          <p className="text-gray-600">Track your progress and unlock new achievements</p>
        </div>
        
        <div className="text-right">
          <p className="text-sm text-gray-600">Total Points</p>
          <p className="text-2xl font-bold text-yellow-600">{totalPoints}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Achievements</p>
              <p className="text-2xl font-bold text-gray-900">{achievements.length}</p>
            </div>
            <Trophy className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Earned</p>
              <p className="text-2xl font-bold text-green-600">{earnedAchievements.length}</p>
            </div>
            <Award className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{inProgressAchievements.length}</p>
            </div>
            <Target className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Available</p>
              <p className="text-2xl font-bold text-purple-600">{availableAchievements.length}</p>
            </div>
            <Medal className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'earned', label: 'Earned', count: earnedAchievements.length },
          { id: 'progress', label: 'In Progress', count: inProgressAchievements.length },
          { id: 'available', label: 'Available', count: availableAchievements.length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getFilteredAchievements().map((achievement) => {
          const IconComponent = achievement.icon;
          return (
            <div
              key={achievement.id}
              className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative overflow-hidden ${
                !achievement.earned ? 'opacity-90' : ''
              }`}
            >
              {/* Rarity Border */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${
                achievement.rarity === 'common' ? 'bg-gray-400' :
                achievement.rarity === 'uncommon' ? 'bg-green-400' :
                achievement.rarity === 'rare' ? 'bg-blue-400' :
                achievement.rarity === 'epic' ? 'bg-purple-400' :
                'bg-yellow-400'
              }`}></div>

              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${
                  achievement.earned ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  {achievement.earned ? (
                    <IconComponent className="w-6 h-6 text-blue-600" />
                  ) : (
                    <Lock className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                
                <div className="text-right">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRarityColor(achievement.rarity)}`}>
                    {achievement.rarity}
                  </span>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {achievement.points} pts
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {achievement.title}
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  {achievement.description}
                </p>
                
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(achievement.category)}`}>
                    {achievement.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    {achievement.type}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              {!achievement.earned && achievement.progress > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{achievement.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${achievement.progress}%` }}
                    ></div>
                  </div>
                  {achievement.currentProgress && (
                    <p className="text-xs text-gray-500 mt-1">
                      {achievement.currentProgress}
                    </p>
                  )}
                </div>
              )}

              {/* Earned Date */}
              {achievement.earned && achievement.earnedDate && (
                <div className="flex items-center justify-between text-sm text-gray-600 border-t border-gray-100 pt-3">
                  <span>Earned on</span>
                  <span className="font-medium">{formatDate(achievement.earnedDate)}</span>
                </div>
              )}

              {/* Requirement */}
              {!achievement.earned && (
                <div className="text-sm text-gray-600 border-t border-gray-100 pt-3">
                  <p className="font-medium">Requirement:</p>
                  <p>{achievement.requirement}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {getFilteredAchievements().length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No achievements found</h3>
          <p className="text-gray-600">No achievements match your current filter.</p>
        </div>
      )}
    </div>
  );
};

export default AchievementsView;