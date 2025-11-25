import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { GraduationCap, ChevronDown, ListChecks } from "lucide-react";

const linkBase = "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-100 transition-colors";
const linkActive = "bg-gradient-to-br from-slate-200 to-slate-100 text-slate-900 shadow-[inset_0_0_0_1px_rgba(2,6,23,0.06)]";

export default function ExamSidebarBlock({ role = "student" }) {
  if (role !== "student") return null;
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-1">
      <button
        onClick={() => setOpen((s) => !s)}
        className={`${linkBase} w-full text-left text-slate-700`}
        aria-expanded={open}
        aria-controls="emenu"
      >
        <GraduationCap size={18} className="text-slate-700" />
        <span className="flex-1 truncate">Exams</span>
        <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <div
        id="emenu"
        className={`overflow-hidden transition-[max-height,opacity] duration-300 ${open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="ml-2 mt-1 pl-2 border-l border-slate-200 space-y-1">
          <NavLink to="/dashboard/exams" end className={({ isActive }) => `${linkBase} ${isActive ? linkActive : "text-slate-700"}`}>
            <ListChecks size={18} className="text-slate-700" />
            <span>Stage 1</span>
          </NavLink>
          {/* If you add Stage 2/3 later, add more parents similar to this */}
        </div>
      </div>
    </div>
  );
}
