import React from 'react';
import { useNavigate } from 'react-router-dom';

const DailyQuestCard = () => {
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [loading, setLoading] = React.useState(true);
  const [summary, setSummary] = React.useState({
    streak: 0,
    badge: "none",
    alreadyAttempted: false,
    isCorrect: null,
    streakBroken: false,
  });

  React.useEffect(() => {
    let mounted = true;
    async function loadDailySummary() {
      try {
        const res = await fetch(`${API}/api/daily-challenge/today`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("jwt") || ""}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || "Failed to load daily challenge");
        if (!mounted) return;
        setSummary({
          streak: Number(data?.streak || 0),
          badge: data?.badge || "none",
          alreadyAttempted: Boolean(data?.alreadyAttempted),
          isCorrect: data?.isCorrect ?? null,
          streakBroken: Boolean(data?.streakBroken),
        });
      } catch {
        if (mounted) {
          setSummary({
            streak: 0,
            badge: "none",
            alreadyAttempted: false,
            isCorrect: null,
            streakBroken: false,
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadDailySummary();
    return () => {
      mounted = false;
    };
  }, [API]);

  const canStartToday = !loading && !summary.alreadyAttempted;
  const badgeLabel = summary.badge === "none" ? "Novice" : String(summary.badge || "Novice");

  return (
    <div
      onClick={() => {
        if (canStartToday) navigate('/dashboard/daily-challenge');
      }}
      className={`bg-[#e7c555]/10 rounded-3xl p-6 border-2 border-dashed border-[#e7c555] relative overflow-hidden transition-all ${
        canStartToday ? "cursor-pointer hover:scale-[1.01]" : "cursor-not-allowed opacity-90"
      }`}
    >
      <div className="relative z-10 flex flex-col gap-4">
        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase self-start ${
          summary.alreadyAttempted
            ? "bg-emerald-500 text-white"
            : "bg-[#e7c555] text-slate-900"
        }`}>
          {summary.alreadyAttempted ? "Challenge Completed" : "Daily Quest"}
        </span>
        <h3 className="text-2xl font-black leading-tight text-slate-900">
          {loading ? "Loading Daily Challenge..." : "Start Your Next Challenge!"}
        </h3>
        <p className="text-sm text-slate-600 font-medium">
          {loading
            ? "Preparing your one-question challenge..."
            : summary.alreadyAttempted
            ? summary.isCorrect
              ? `Great work! Current streak: ${summary.streak} day(s).`
              : "Today's answer was incorrect. Streak is reset."
            : summary.streakBroken
            ? "Streak uncompleted. Attempt today to start again."
            : `Current streak: ${summary.streak} day(s). Keep it going!`}
        </p>
        {!loading && (
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            Badge: <span className="capitalize">{badgeLabel}</span>
          </p>
        )}
        <button
          onClick={() => {
            if (canStartToday) navigate('/dashboard/daily-challenge');
          }}
          disabled={!canStartToday}
          className={`w-full py-3 rounded-full font-black text-slate-900 ${
            canStartToday
              ? "bg-[#e7c555] shadow-lg shadow-[#e7c555]/30 hover:scale-[1.02] transition-transform"
              : "bg-slate-200 text-slate-500"
          }`}
        >
          {summary.alreadyAttempted ? "Completed Today" : "Start Daily Challenge"}
        </button>
      </div>
      <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-9xl text-[#e7c555]/20 -rotate-12 select-none pointer-events-none">
        rocket
      </span>
    </div>
  );
};

export default DailyQuestCard;
