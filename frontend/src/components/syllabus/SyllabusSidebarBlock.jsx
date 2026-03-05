import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { BookOpen, ChevronDown, ChevronRight, Lock } from "lucide-react";

/* Same styles as DashboardLayout */
const linkBase =
  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-orange-800 transition-all";
const linkActive =
  "bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-md";

export default function SyllabusSidebarBlock({ role = "student" }) {
  const [open, setOpen] = useState(false);
  const [stagesOpen, setStagesOpen] = useState(false);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unlockedStages, setUnlockedStages] = useState([1]); // Stage 1 is always unlocked
  const location = useLocation();

  // Only show for students
  if (role !== "student") return null;

  // Auto-expand stages when on syllabus page
  useEffect(() => {
    if (location.pathname.includes('/syllabus')) {
      setOpen(true);
      setStagesOpen(true);
    }
  }, [location]);

  // Fetch available stages when "Attempt Now" is expanded
  useEffect(() => {
    if (stagesOpen && stages.length === 0) {
      fetchStages();
      fetchUnlockedStages();
    }
  }, [stagesOpen]);

  async function fetchStages() {
    try {
      setLoading(true);
      const token = localStorage.getItem("jwt");

      const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(
        `${API}/api/questions/stages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();

      // Sort stages numerically
      const sortedStages = [...new Set([1, ...(data.stages || [])])]
        .map((s) => Number(s))
        .filter((s) => Number.isFinite(s) && s >= 1)
        .sort((a, b) => a - b);
      setStages(sortedStages);
    } catch (err) {
      console.error("Failed to fetch stages", err);
      setStages([1]); // Default to Stage 1 if fetch fails
    } finally {
      setLoading(false);
    }
  }

  async function fetchUnlockedStages() {
    try {
      const token = localStorage.getItem("jwt");
      const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

      // Fetch user's unlocked stages from backend
      const res = await fetch(`${API}/api/users/unlocked-stages`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        // Stage 1 is always unlocked, merge with purchased stages
        const unlocked = [1, ...(data.unlockedStages || [])];
        setUnlockedStages([...new Set(unlocked)].sort((a, b) => a - b));
      }
    } catch (err) {
      console.error("Failed to fetch unlocked stages", err);
      // Default to Stage 1 only
      setUnlockedStages([1]);
    }
  }

  function handleStageClick(stage, e) {
    if (!unlockedStages.includes(stage)) {
      e.preventDefault();
      // Show payment modal or redirect to payment page
      alert(`Stage ${stage} is locked! Please purchase to unlock this stage.`);
    }
  }

  return (
    <div className="mt-1">
      {/* SYLLABUS DROPDOWN */}
      <button
        onClick={() => setOpen((s) => !s)}
        className={`${linkBase} w-full text-left hover:bg-yellow-100`}
        aria-expanded={open}
        aria-controls="syllabus-menu"
      >
        <BookOpen size={18} />
        <span className="flex-1 truncate">Exams</span>
        <ChevronDown
          size={16}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        id="syllabus-menu"
        className={`overflow-hidden transition-[max-height,opacity] duration-300 ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="ml-2 mt-1 pl-2 border-l border-yellow-200 space-y-1">
          {/* Attempt Now - Expandable for Stages */}
          <div>
            <button
              onClick={() => setStagesOpen((s) => !s)}
              className={`${linkBase} w-full text-left hover:bg-yellow-100`}
            >
              <BookOpen size={18} />
              <span className="flex-1 truncate">Attempt Now</span>
              <ChevronRight
                size={16}
                className={`transition-transform ${stagesOpen ? "rotate-90" : ""}`}
              />
            </button>

            {/* Stages Submenu */}
            <div
              className={`overflow-hidden transition-[max-height,opacity] duration-300 ${
                stagesOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="ml-6 mt-1 space-y-1">
                {loading ? (
                  <div className="px-4 py-2 text-xs text-gray-500">Loading stages...</div>
                ) : stages.length === 0 ? (
                  <div className="px-4 py-2 text-xs text-gray-500">No stages available</div>
                ) : (
                  stages.map((stage) => {
                    const isLocked = !unlockedStages.includes(stage);

                    if (isLocked) {
                      // Locked stage - show as disabled button
                      return (
                        <button
                          key={stage}
                          onClick={(e) => handleStageClick(stage, e)}
                          className={`${linkBase} text-xs bg-gray-100 text-gray-400 cursor-not-allowed opacity-60`}
                        >
                          <span className="w-6 h-6 rounded-lg bg-gray-300 text-gray-500 text-xs font-bold flex items-center justify-center relative">
                            <Lock size={12} className="absolute" />
                          </span>
                          <span className="flex-1 text-left">Stage {stage} (Locked)</span>
                        </button>
                      );
                    }

                    // Unlocked stage - show as NavLink
                    return (
                      <NavLink
                        key={stage}
                        to={`/dashboard/syllabus?stage=${stage}`}
                        className={({ isActive }) =>
                          `${linkBase} ${isActive ? linkActive : "hover:bg-yellow-100"} text-xs`
                        }
                      >
                        <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-400 to-yellow-500 text-white text-xs font-bold flex items-center justify-center">
                          {stage}
                        </span>
                        <span>Stage {stage} {stage === 1 ? "(Free Questions)" : ""}</span>
                      </NavLink>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
