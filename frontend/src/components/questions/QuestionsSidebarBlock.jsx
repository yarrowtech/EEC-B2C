// src/components/questions/QuestionsSidebarBlock.jsx
import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  HelpCircle, ChevronDown, CheckSquare, SquareCheckBig, FileText, ListChecks, FilePlus2
} from "lucide-react";

const linkBase =
  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-100 transition-colors";
const linkActive =
  "bg-gradient-to-br from-slate-200 to-slate-100 text-slate-900 shadow-[inset_0_0_0_1px_rgba(2,6,23,0.06)]";

export default function QuestionsSidebarBlock({ role = "student" }) {
  // Admin + Teacher only
  if (role !== "admin" && role !== "teacher") return null;

  const [open, setOpen] = useState(false);

  return (
    <div className="mt-1">
      <button
        onClick={() => setOpen((s) => !s)}
        className={`${linkBase} w-full text-left text-slate-700`}
      >
        <HelpCircle size={18} className="text-slate-700" />
        <span className="flex-1 truncate">Questions</span>
        <ChevronDown
          size={16}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="ml-2 mt-1 pl-2 border-l border-slate-200 space-y-1">
          
          {/* SUBJECTS */}
          <NavLink
            to="/dashboard/add-subject"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : "text-slate-700"}`
            }
          >
            ➤ Subjects
          </NavLink>

          {/* TOPICS */}
          <NavLink
            to="/dashboard/add-topic"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : "text-slate-700"}`
            }
          >
            ➤ Topics
          </NavLink>

          {/* VIEW SUBJECTS */}
          <NavLink
            to="/dashboard/subjects"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : "text-slate-700"}`
            }
          >
            ➤ View Subjects
          </NavLink>

          {/* VIEW TOPICS */}
          <NavLink
            to="/dashboard/topics"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : "text-slate-700"}`
            }
          >
            ➤ View Topics
          </NavLink>

          {/* QUESTIONS INDEX */}
          <NavLink
            to="/dashboard/questions"
            end
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : "text-slate-700"}`
            }
          >
            <ListChecks size={18} />
            <span>Overview</span>
          </NavLink>

          {/* ALL QUESTIONS */}
          <NavLink
            to="/dashboard/questions/list"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : "text-slate-700"}`
            }
          >
            <span className="w-2 h-2 rounded-full border" />
            All Questions
          </NavLink>
        </div>
      </div>
    </div>
  );
}

