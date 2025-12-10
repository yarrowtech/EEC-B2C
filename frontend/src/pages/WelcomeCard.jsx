import React, { useState, useEffect } from 'react';
import { Sun, Moon, Cloud, Lightbulb, Target, Star, Zap, Heart, Trophy, BookOpen, Rocket, Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';

const WelcomeCard = () => {
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return { text: 'Good Morning', icon: Sun };
        if (hour < 17) return { text: 'Good Afternoon', icon: Sun };
        return { text: 'Good Evening', icon: Moon };
    };

    const greeting = getGreeting();
    const GreetingIcon = greeting.icon;
    const user = JSON.parse(localStorage.getItem('user') || "{}");

    // Dynamic Quick Tips Collection
    const quickTips = [
        {
            text: "Success is the sum of small efforts repeated day in and day out. Keep up the great work!",
            emoji: "🚀",
            icon: Rocket,
            color: "text-yellow-200"
        },
        {
            text: "The future belongs to those who believe in the beauty of their dreams. Dream big today!",
            emoji: "✨",
            icon: Star,
            color: "text-purple-200"
        },
        {
            text: "Learning never exhausts the mind. Every new thing you discover makes you stronger!",
            emoji: "📚",
            icon: BookOpen,
            color: "text-blue-200"
        },
        {
            text: "Your potential is endless. Go do what you were created to do!",
            emoji: "⚡",
            icon: Zap,
            color: "text-orange-200"
        },
        {
            text: "Believe in yourself and all that you are. You're capable of amazing things!",
            emoji: "💪",
            icon: Heart,
            color: "text-pink-200"
        },
        {
            text: "Champions are made from something deep inside them - desire, dream, and vision!",
            emoji: "🏆",
            icon: Trophy,
            color: "text-gold-200"
        },
        {
            text: "Every expert was once a beginner. Every pro was once an amateur. Keep learning!",
            emoji: "🌟",
            icon: Target,
            color: "text-green-200"
        },
        {
            text: "The only way to do great work is to love what you do. Find your passion!",
            emoji: "💝",
            icon: Heart,
            color: "text-red-200"
        },
        {
            text: "Innovation distinguishes between a leader and a follower. Think differently!",
            emoji: "💡",
            icon: Lightbulb,
            color: "text-yellow-200"
        },
        {
            text: "Don't watch the clock; do what it does. Keep going and make every moment count!",
            emoji: "⏰",
            icon: Zap,
            color: "text-cyan-200"
        },
        {
            text: "The beautiful thing about learning is nobody can take it away from you!",
            emoji: "🧠",
            icon: BookOpen,
            color: "text-indigo-200"
        },
        {
            text: "Your limitation—it's only your imagination. Break through and achieve more!",
            emoji: "🦋",
            icon: Star,
            color: "text-violet-200"
        }
    ];

    // State for current tip and controls
    const [currentTip, setCurrentTip] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // Get daily tip based on date to ensure same tip for the day but changes daily
    const getDailyTip = () => {
        const today = new Date();
        const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        return quickTips[dayOfYear % quickTips.length];
    };

    // Change tip every 10 seconds for dynamic experience
    useEffect(() => {
        if (isPaused) return;

        const interval = setInterval(() => {
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentTip(prev => (prev + 1) % quickTips.length);
                setIsAnimating(false);
            }, 200);
        }, 10000); // Change every 10 seconds

        return () => clearInterval(interval);
    }, [isPaused]);

    // Manual tip navigation
    const nextTip = () => {
        setIsAnimating(true);
        setTimeout(() => {
            setCurrentTip(prev => (prev + 1) % quickTips.length);
            setIsAnimating(false);
        }, 200);
    };

    const previousTip = () => {
        setIsAnimating(true);
        setTimeout(() => {
            setCurrentTip(prev => (prev - 1 + quickTips.length) % quickTips.length);
            setIsAnimating(false);
        }, 200);
    };

    const togglePause = () => {
        setIsPaused(!isPaused);
    };

    // Get current tip to display
    const tipToShow = quickTips[currentTip];
    const TipIcon = tipToShow.icon;

    const studentData = {
        name: "Student",
        id: "STU001",
        semester: "Fall 2024",
        avatar: "src/koushik-bala-pp.jpg"
    };

    return (
        <div className="bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 rounded-2xl p-6 text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 right-4 w-32 h-32 bg-white rounded-full"></div>
                <div className="absolute bottom-4 left-4 w-24 h-24 bg-white rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
            </div>

            <div className="relative z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            {user?.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt="Profile"
                                    className="w-16 h-16 rounded-full border-4 border-white/20 shadow-lg object-cover"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.remove(); // Remove broken image element
                                    }}
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-full border-4 border-white/20 shadow-lg bg-indigo-600 flex items-center justify-center">
                                    <span className="text-3xl font-bold text-white">
                                        {(user?.name?.split(" ")[0]?.[0] || "U").toUpperCase()}
                                    </span>
                                </div>
                            )}

                            <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                        </div>

                        <div>
                            <div className="flex items-center space-x-2 mb-1">
                                <GreetingIcon size={20} className="text-yellow-100" />
                                <span className="text-lg font-medium opacity-90">{greeting.text},</span>
                            </div>
                            <h1 className="text-2xl font-bold mb-1">{user.name}!</h1>
                            <p className="text-yellow-100 text-sm">
                                Student ID: {user.id} • {user.semester}
                            </p>
                        </div>
                    </div>

                    <div className="text-right">
                        <p className="text-yellow-100 text-sm mb-2">Today's Date</p>
                        <p className="text-xl font-semibold">
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                            })}
                        </p>
                    </div>
                </div>

                <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 relative overflow-hidden group hover:bg-white/15 transition-all duration-300">
                    {/* Animated Background Glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-full animate-pulse"></div>

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <TipIcon size={16} className={`${tipToShow.color} transition-colors duration-300`} />
                                <p className="text-sm text-yellow-100 font-semibold">Quick Tip</p>
                                <span className="text-xs bg-white/20 px-2 py-1 rounded-full text-white/80">
                                    {currentTip + 1}/{quickTips.length}
                                </span>
                            </div>

                            {/* Control Buttons */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <button
                                    onClick={previousTip}
                                    className="p-1 hover:bg-white/20 rounded-full transition-colors"
                                    title="Previous tip"
                                >
                                    <ChevronLeft size={14} className="text-white/80" />
                                </button>

                                <button
                                    onClick={togglePause}
                                    className="p-1 hover:bg-white/20 rounded-full transition-colors"
                                    title={isPaused ? "Resume auto-change" : "Pause auto-change"}
                                >
                                    {isPaused ? (
                                        <Play size={14} className="text-white/80" />
                                    ) : (
                                        <Pause size={14} className="text-white/80" />
                                    )}
                                </button>

                                <button
                                    onClick={nextTip}
                                    className="p-1 hover:bg-white/20 rounded-full transition-colors"
                                    title="Next tip"
                                >
                                    <ChevronRight size={14} className="text-white/80" />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div
                                key={currentTip} // Key for animation reset
                                className={`flex-1 transition-all duration-500 ${isAnimating ? 'opacity-0 translate-x-2' : 'opacity-100 translate-x-0'
                                    }`}
                            >
                                <p className="text-white font-medium leading-relaxed">
                                    "{tipToShow.text}" {tipToShow.emoji}
                                </p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-3">
                            <div className="w-full bg-white/20 rounded-full h-1.5">
                                <div
                                    className={`bg-gradient-to-r from-white/60 to-white/80 h-1.5 rounded-full transition-all duration-500 ${isPaused ? '' : 'animate-pulse'
                                        }`}
                                    style={{
                                        width: `${((currentTip + 1) / quickTips.length) * 100}%`
                                    }}
                                ></div>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                                <p className="text-xs text-white/60">
                                    {isPaused ? 'Auto-change paused' : 'Changes every 10 seconds'}
                                </p>
                                <div className="flex gap-1">
                                    {quickTips.map((_, index) => (
                                        <div
                                            key={index}
                                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${index === currentTip ? 'bg-white/80 scale-125' : 'bg-white/30'
                                                }`}
                                        ></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Hover Instructions */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="text-xs text-white/60 bg-black/20 px-2 py-1 rounded">
                            Hover to control
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WelcomeCard;