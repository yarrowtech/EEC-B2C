// src/components/questions/QuestionsSidebarBlock.jsx
import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  HelpCircle,
  ChevronDown,
  ListChecks,
} from "lucide-react";

/* MATCH DASHBOARD SIDEBAR STYLE */
const linkBase =
  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-orange-800 transition-all";

const linkActive =
  "bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-md";

export default function QuestionsSidebarBlock({ role = "student" }) {
  // Admin + Teacher only
  if (role !== "admin" && role !== "teacher") return null;

  const [open, setOpen] = useState(false);

  return (
    <div className="mt-2">

      {/* PARENT BUTTON */}
      <button
        onClick={() => setOpen((s) => !s)}
        className={`${linkBase} w-full hover:bg-yellow-100`}
      >
        <HelpCircle size={18} />
        <span className="flex-1 text-left font-semibold">Questions</span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* DROPDOWN */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? "max-h-[500px] opacity-100 mt-1" : "max-h-0 opacity-0"
        }`}
      >
        <div className="ml-4 pl-3 border-l-2 border-yellow-300 space-y-1">

          {/* CLASSES */}
          <NavLink
            to="/dashboard/add-class"
            className={({ isActive }) =>
              `${linkBase} ${
                isActive ? linkActive : "hover:bg-yellow-100"
              }`
            }
          >
            Classes
          </NavLink>

          {/* BOARDS */}
          <NavLink
            to="/dashboard/add-board"
            className={({ isActive }) =>
              `${linkBase} ${
                isActive ? linkActive : "hover:bg-yellow-100"
              }`
            }
          >
            Boards
          </NavLink>

          {/* SUBJECTS */}
          <NavLink
            to="/dashboard/add-subject"
            className={({ isActive }) =>
              `${linkBase} ${
                isActive ? linkActive : "hover:bg-yellow-100"
              }`
            }
          >
            Subjects
          </NavLink>

          {/* TOPICS */}
          <NavLink
            to="/dashboard/add-topic"
            className={({ isActive }) =>
              `${linkBase} ${
                isActive ? linkActive : "hover:bg-yellow-100"
              }`
            }
          >
            Topics
          </NavLink>

          {/* QUESTIONS OVERVIEW */}
          <NavLink
            to="/dashboard/questions"
            end
            className={({ isActive }) =>
              `${linkBase} ${
                isActive ? linkActive : "hover:bg-yellow-100"
              }`
            }
          >
            <ListChecks size={18} />
            <span>Add Questionss</span>
          </NavLink>

          {/* ALL QUESTIONS */}
          <NavLink
            to="/dashboard/questions/list"
            className={({ isActive }) =>
              `${linkBase} ${
                isActive ? linkActive : "hover:bg-yellow-100"
              }`
            }
          >
            <span className="w-2 h-2 rounded-full bg-orange-400" />
            All Questions
          </NavLink>

        </div>
      </div>
    </div>
  );
}
