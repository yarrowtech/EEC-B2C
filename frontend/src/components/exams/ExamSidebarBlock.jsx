import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { GraduationCap, ChevronDown, ListChecks, Lock } from "lucide-react";
import { getJSON } from "../../lib/api";

const linkBase =
  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors";
const linkActive =
  "bg-gradient-to-br from-slate-200 to-slate-100 text-slate-900 shadow-[inset_0_0_0_1px_rgba(2,6,23,0.06)]";

const stageNames = {
  1: "Basic Level",
  2: "Intermediate Level",
  3: "Advanced Level",
};

export default function ExamSidebarBlock({ role = "student" }) {
  const [open, setOpen] = useState(false);
  const [stages, setStages] = useState([]);

  // ----------------------------------------------------------------
  // 🔥 ADMIN SIDEBAR (Results + Achievements)
  // ----------------------------------------------------------------
  if (role === "admin") {
    return (
      <div className="mt-1">

        {/* RESULTS MENU */}
        <NavLink
          to="/dashboard/results"
          className={({ isActive }) =>
            `${linkBase} ${
              isActive
                ? "bg-gradient-to-br from-yellow-200 to-yellow-100 text-yellow-900 shadow-[inset_0_0_0_1px_rgba(2,6,23,0.06)]"
                : "text-slate-700 hover:bg-yellow-50"
            }`
          }
        >
          <svg
            className="w-5 h-5 text-yellow-600"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M3 4h18M3 10h18M3 16h18M3 20h18" />
          </svg>
          <span>Results</span>
        </NavLink>

        {/* ACHIEVEMENTS MENU */}
        {/* <NavLink
          to="/dashboard/achievements"
          className={({ isActive }) =>
            `${linkBase} ${
              isActive
                ? "bg-gradient-to-br from-yellow-200 to-yellow-100 text-yellow-900 shadow-[inset_0_0_0_1px_rgba(2,6,23,0.06)]"
                : "text-slate-700 hover:bg-yellow-50"
            }`
          }
        >
          <svg
            className="w-5 h-5 text-yellow-600"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M3 4h18M3 10h18M3 16h18M3 20h18" />
          </svg>
          <span>Achievements</span>
        </NavLink> */}
      </div>
    );
  }

  // ----------------------------------------------------------------
  // 🔥 STUDENT SIDEBAR (Exams + Achievements)
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
        className={`${linkBase} w-full text-left text-slate-700`}
        aria-expanded={open}
        aria-controls="emenu"
      >
        <GraduationCap size={18} className="text-slate-700" />
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
        <div className="ml-2 mt-1 pl-2 border-l border-slate-200 space-y-1">

          {stages.length === 0 && (
            <div className={`${linkBase} text-slate-400`}>No exam stages available</div>
          )}

          {/* Render dynamic stages */}
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
                    isActive
                      ? linkActive
                      : "text-slate-700 hover:bg-slate-100"
                  }`
                }
              >
                <ListChecks size={18} className="text-slate-700" />
                <span>{label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* STUDENT → RESULTS */}
      <NavLink
        to="/dashboard/result"
        className={({ isActive }) =>
          `${linkBase} ${
            isActive
              ? "bg-gradient-to-br from-yellow-200 to-yellow-100 text-yellow-900 shadow-[inset_0_0_0_1px_rgba(2,6,23,0.06)]"
              : "text-slate-700 hover:bg-yellow-50"
          }`
        }
      >
        <svg
          className="w-5 h-5 text-yellow-600"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M3 4h18M3 10h18M3 16h18M3 20h18" />
        </svg>
        <span>My Results</span>
      </NavLink>

      {/* STUDENT → ACHIEVEMENTS */}
      <NavLink
        to="/dashboard/achievements"
        className={({ isActive }) =>
          `${linkBase} ${
            isActive
              ? "bg-gradient-to-br from-yellow-200 to-yellow-100 text-yellow-900 shadow-[inset_0_0_0_1px_rgba(2,6,23,0.06)]"
              : "text-slate-700 hover:bg-yellow-50"
          }`
        }
      >
        <svg
          className="w-5 h-5 text-yellow-600"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M3 4h18M3 10h18M3 16h18M3 20h18" />
        </svg>
        <span>Achievements</span>
      </NavLink>

    </div>
  );
}
