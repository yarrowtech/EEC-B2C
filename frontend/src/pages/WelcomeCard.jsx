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


    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-white rounded-full"></div>
                <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
            </div>

            <div className="relative z-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="relative">
                            {user?.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt="Profile"
                                    className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full border-2 sm:border-4 border-white/20 shadow-lg object-cover"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.remove(); // Remove broken image element
                                    }}
                                />
                            ) : (
                                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full border-2 sm:border-4 border-white/20 shadow-lg bg-indigo-600 flex items-center justify-center">
                                    <span className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                                        {(user?.name?.split(" ")[0]?.[0] || "U").toUpperCase()}
                                    </span>
                                </div>
                            )}

                            <div className="absolute bottom-0 right-0 sm:bottom-1 sm:right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-400 border-2 border-white rounded-full"></div>
                        </div>

                        <div>
                            <div className="flex items-center space-x-1.5 sm:space-x-2 mb-0.5 sm:mb-1">
                                <GreetingIcon size={16} className="text-yellow-100 sm:w-5 sm:h-5" />
                                <span className="text-sm sm:text-base md:text-lg font-medium opacity-90">{greeting.text},</span>
                            </div>
                            <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-0.5 sm:mb-1">{user.name}!</h1>
                            <p className="text-yellow-100 text-xs sm:text-sm break-all">
                                <span className="hidden sm:inline">{user.email} • </span>
                                <span className="sm:hidden block">{user.email}</span>
                                <span className="block sm:inline sm:mt-0">
                                    {user.role === "student"
                                        ? (user.className || "No Class Assigned")
                                        : (user.role?.charAt(0).toUpperCase() + user.role?.slice(1))
                                    }
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="text-left sm:text-right w-full sm:w-auto">
                        <p className="text-yellow-100 text-xs sm:text-sm mb-1 sm:mb-2">Today's Date & Time</p>

                        <p className="text-base sm:text-lg md:text-xl font-semibold">
                            {currentTime.toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                            })}
                        </p>

                        <p className="text-sm sm:text-base md:text-lg font-medium text-yellow-200 mt-0.5 sm:mt-1">
                            {currentTime.toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: 'numeric',
                                second: 'numeric',
                                hour12: true
                            })}
                        </p>
                    </div>
                </div>
                {user.role === 'student' && (
                    <div className="mt-4 sm:mt-5 md:mt-6 p-3 sm:p-4 bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl border border-white/20 relative overflow-hidden group hover:bg-white/15 transition-all duration-300">
                        {/* Animated Background Glow */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-full animate-pulse"></div>

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-2 sm:mb-3">
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <TipIcon size={14} className={`${tipToShow.color} transition-colors duration-300 sm:w-4 sm:h-4`} />
                                    <p className="text-xs sm:text-sm text-yellow-100 font-semibold">Quick Tip</p>
                                    <span className="text-xs bg-white/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-white/80">
                                        {currentTip + 1}/{quickTips.length}
                                    </span>
                                </div>

                                {/* Control Buttons - Always visible on mobile, hidden on desktop until hover */}
                                <div className="flex items-center gap-0.5 sm:gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
                                    <button
                                        onClick={previousTip}
                                        className="p-1 hover:bg-white/20 rounded-full transition-colors touch-manipulation"
                                        title="Previous tip"
                                        aria-label="Previous tip"
                                    >
                                        <ChevronLeft size={16} className="text-white/80 sm:w-3.5 sm:h-3.5" />
                                    </button>

                                    <button
                                        onClick={togglePause}
                                        className="p-1 hover:bg-white/20 rounded-full transition-colors touch-manipulation"
                                        title={isPaused ? "Resume auto-change" : "Pause auto-change"}
                                        aria-label={isPaused ? "Resume auto-change" : "Pause auto-change"}
                                    >
                                        {isPaused ? (
                                            <Play size={16} className="text-white/80 sm:w-3.5 sm:h-3.5" />
                                        ) : (
                                            <Pause size={16} className="text-white/80 sm:w-3.5 sm:h-3.5" />
                                        )}
                                    </button>

                                    <button
                                        onClick={nextTip}
                                        className="p-1 hover:bg-white/20 rounded-full transition-colors touch-manipulation"
                                        title="Next tip"
                                        aria-label="Next tip"
                                    >
                                        <ChevronRight size={16} className="text-white/80 sm:w-3.5 sm:h-3.5" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-start gap-2 sm:gap-3">
                                <div
                                    key={currentTip} // Key for animation reset
                                    className={`flex-1 transition-all duration-500 ${isAnimating ? 'opacity-0 translate-x-2' : 'opacity-100 translate-x-0'
                                        }`}
                                >
                                    <p className="text-white text-sm sm:text-base font-medium leading-relaxed">
                                        "{tipToShow.text}" {tipToShow.emoji}
                                    </p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-2 sm:mt-3">
                                <div className="w-full bg-white/20 rounded-full h-1 sm:h-1.5">
                                    <div
                                        className={`bg-gradient-to-r from-white/60 to-white/80 h-1 sm:h-1.5 rounded-full transition-all duration-500 ${isPaused ? '' : 'animate-pulse'
                                            }`}
                                        style={{
                                            width: `${((currentTip + 1) / quickTips.length) * 100}%`
                                        }}
                                    ></div>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                    <p className="text-xs text-white/60">
                                        {isPaused ? 'Auto-change paused' : (<><span className="hidden sm:inline">Changes every 10 seconds</span><span className="sm:hidden">Auto-change</span></>)}
                                    </p>
                                    <div className="flex gap-0.5 sm:gap-1">
                                        {quickTips.map((_, index) => (
                                            <div
                                                key={index}
                                                className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full transition-all duration-300 ${index === currentTip ? 'bg-white/80 scale-125' : 'bg-white/30'
                                                    }`}
                                            ></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Hover Instructions - Hidden on mobile */}
                        <div className="hidden sm:block absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="text-xs text-white/60 bg-black/20 px-2 py-1 rounded">
                                Hover to control
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WelcomeCard;