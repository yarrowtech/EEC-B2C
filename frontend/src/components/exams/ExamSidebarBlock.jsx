import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  GraduationCap,
  ChevronDown,
  ListChecks,
  GraduationCapIcon,
  Table2
} from "lucide-react";
import { getJSON } from "../../lib/api";

/* 🔥 SAME STYLES AS DashboardLayout */
const linkBase =
  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-orange-800 transition-all";
const linkActive =
  "bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-md";

const stageNames = {
  1: "Basic Level",
  2: "Intermediate Level",
  3: "Advanced Level",
};

export default function ExamSidebarBlock({ role = "student" }) {
  const [open, setOpen] = useState(false);
  const [stages, setStages] = useState([]);

  // ----------------------------------------------------------------
  // 🔥 ADMIN SIDEBAR (UNCHANGED)
  // ----------------------------------------------------------------
  if (role === "admin") {
    return <div className="mt-1" />;
  }

  // ----------------------------------------------------------------
  // 🔥 STUDENT SIDEBAR
  // ----------------------------------------------------------------
  if (role !== "student") return null;

  useEffect(() => {
    loadStages();
  }, []);

  async function loadStages() {
    try {
      const res = await getJSON("/api/questions/stages");
      setStages(res.stages || []);
    } catch (err) {
      console.error("Failed loading stages", err);
    }
  }

  return (
    <div className="mt-1">
      {/* EXAMS DROPDOWN */}
      <button
        onClick={() => setOpen((s) => !s)}
        className={`${linkBase} w-full text-left hover:bg-yellow-100`}
        aria-expanded={open}
        aria-controls="emenu"
      >
        <GraduationCap size={18} />
        <span className="flex-1 truncate">Exams</span>
        <ChevronDown
          size={16}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        id="emenu"
        className={`overflow-hidden transition-[max-height,opacity] duration-300 ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="ml-2 mt-1 pl-2 border-l border-yellow-200 space-y-1">
          {stages.length === 0 && (
            <div className={`${linkBase} text-slate-400`}>
              No exam stages available
            </div>
          )}

          {/* STAGES */}
          {stages.map((stage) => {
            const label = stageNames[stage] || `Stage ${stage}`;
            const url =
              stage === 1 ? "/dashboard/exams" : `/dashboard/exams/${stage}`;

            return (
              <NavLink
                key={stage}
                to={url}
                className={({ isActive }) =>
                  `${linkBase} ${
                    isActive ? linkActive : "hover:bg-yellow-100"
                  }`
                }
              >
                <ListChecks size={18} />
                <span>{label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* MY RESULTS */}
      <NavLink
        to="/dashboard/result"
        className={({ isActive }) =>
          `${linkBase} ${
            isActive ? linkActive : "hover:bg-yellow-100"
          }`
        }
      >
        <ListChecks size={18} />
        <span>My Results</span>
      </NavLink>

      {/* ACHIEVEMENTS */}
      <NavLink
        to="/dashboard/achievements"
        className={({ isActive }) =>
          `${linkBase} ${
            isActive ? linkActive : "hover:bg-yellow-100"
          }`
        }
      >
        <ListChecks size={18} />
        <span>Achievements</span>
      </NavLink>

      {/* STUDY MATERIALS */}
      <NavLink
        to="/dashboard/study-materials"
        className={({ isActive }) =>
          `${linkBase} ${
            isActive ? linkActive : "hover:bg-yellow-100"
          }`
        }
      >
        <GraduationCapIcon size={18} />
        <span>Study Materials</span>
      </NavLink>
      <NavLink
        to="/dashboard/leaderboard"
        className={({ isActive }) =>
          `${linkBase} ${
            isActive ? linkActive : "hover:bg-yellow-100"
          }`
        }
      >
        <Table2 size={18} />
        <span>Leaderboard</span>
      </NavLink>
    </div>
  );
}
