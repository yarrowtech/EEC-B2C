import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { BookOpen, ChevronDown } from "lucide-react";

/* Same styles as DashboardLayout */
const linkBase =
  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-orange-800 transition-all";
const linkActive =
  "bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-md";

export default function SyllabusSidebarBlock({ role = "student" }) {
  const [open, setOpen] = useState(false);

  // Only show for students
  if (role !== "student") return null;

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
          <NavLink
            to="/dashboard/syllabus"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : "hover:bg-yellow-100"}`
            }
          >
            <BookOpen size={18} />
            <span>Attempt Now</span>
          </NavLink>
        </div>
      </div>
    </div>
  );
}
