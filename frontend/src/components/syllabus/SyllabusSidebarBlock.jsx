import React, { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { BookOpen, ChevronDown, Lock, Sparkles } from "lucide-react";

const linkBase =
  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-orange-800 transition-all";
const linkActive =
  "bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-md";

export default function SyllabusSidebarBlock({ role = "student" }) {
  const [open, setOpen] = useState(false);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unlockedStages, setUnlockedStages] = useState([1]);
  const location = useLocation();
  const navigate = useNavigate();
  const currentStageFromQuery = Number(new URLSearchParams(location.search).get("stage") || 1);

  if (role !== "student") return null;

  useEffect(() => {
    if (location.pathname.includes("/syllabus")) {
      setOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    fetchStages();
    fetchUnlockedStages();
  }, [open]);

  async function fetchStages() {
    try {
      setLoading(true);
      const token = localStorage.getItem("jwt");
      const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${API}/api/questions/stages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      const sortedStages = [...new Set([1, ...(data.stages || [])])]
        .map((s) => Number(s))
        .filter((s) => Number.isFinite(s) && s >= 1)
        .sort((a, b) => a - b);

      setStages(sortedStages);
    } catch (err) {
      console.error("Failed to fetch stages", err);
      setStages([1, 2, 3]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUnlockedStages() {
    try {
      const token = localStorage.getItem("jwt");
      const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${API}/api/users/unlocked-stages`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setUnlockedStages([1]);
        return;
      }

      const data = await res.json();
      const unlocked = [1, ...(data.unlockedStages || [])]
        .map((s) => Number(s))
        .filter((s) => Number.isFinite(s) && s >= 1);
      setUnlockedStages([...new Set(unlocked)].sort((a, b) => a - b));
    } catch (err) {
      console.error("Failed to fetch unlocked stages", err);
      setUnlockedStages([1]);
    }
  }

  const visibleStages = stages.length ? stages : [1, 2, 3];

  return (
    <div className="mt-1">
      <button
        onClick={() => setOpen((s) => !s)}
        className={`${linkBase} w-full text-left hover:bg-yellow-100`}
        aria-expanded={open}
        aria-controls="attempt-exam-menu"
      >
        <BookOpen size={18} />
        <span className="flex-1 truncate">Practice Now</span>
        <ChevronDown
          size={16}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        id="attempt-exam-menu"
        className={`overflow-hidden transition-[max-height,opacity] duration-300 ${
          open ? "max-h-[520px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="ml-2 mt-1 pl-2 border-l border-yellow-200 space-y-1">
          {loading ? (
            <div className="px-4 py-2 text-xs text-gray-500">Loading stages...</div>
          ) : (
            visibleStages.map((stage) => {
              const isUnlocked = unlockedStages.includes(stage);
              const isFree = stage === 1;

              if (!isUnlocked) {
                return (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => navigate("/dashboard/packages")}
                    className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 transition"
                  >
                    <span className="w-6 h-6 rounded-lg bg-slate-300 text-slate-600 text-xs font-bold flex items-center justify-center">
                      <Lock size={12} />
                    </span>
                    <span className="flex-1 text-left">Stage {stage}</span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">Paid</span>
                  </button>
                );
              }

              return (
                <NavLink
                  key={stage}
                  to={`/dashboard/syllabus?stage=${stage}`}
                  className={() =>
                    `${linkBase} ${currentStageFromQuery === stage ? linkActive : "hover:bg-yellow-100"} text-xs`
                  }
                >
                  <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-400 to-yellow-500 text-white text-xs font-bold flex items-center justify-center">
                    {stage}
                  </span>
                  <span className="flex-1">Stage {stage}</span>
                  {isFree ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Free</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 inline-flex items-center gap-1">
                      <Sparkles size={10} /> Unlocked
                    </span>
                  )}
                </NavLink>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
