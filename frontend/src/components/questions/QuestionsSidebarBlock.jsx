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
  // show only for admin (you can later allow teacher as well)
  if (role !== "admin") return null;

  const [open, setOpen] = useState(false);

  return (
    <div className="mt-1">
      {/* Parent item */}
      <button
        onClick={() => setOpen((s) => !s)}
        className={`${linkBase} w-full text-left text-slate-700`}
        aria-expanded={open}
        aria-controls="qmenu"
      >
        <HelpCircle size={18} className="text-slate-700" />
        <span className="flex-1 truncate">Questions</span>
        <ChevronDown
          size={16}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Children */}
      <div
        id="qmenu"
        className={`overflow-hidden transition-[max-height,opacity] duration-300 ${open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
      >
        <div className="ml-2 mt-1 pl-2 border-l border-slate-200 space-y-1">
          <NavLink
            to="/dashboard/questions"
            end
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : "text-slate-700"}`
            }
          >
            <ListChecks size={18} className="text-slate-700" />
            <span>Overview</span>
          </NavLink>
          <NavLink
            to="/dashboard/questions/list"
            className={({ isActive }) => `${linkBase} ${isActive ? linkActive : "text-slate-700"}`}
          >
            <span className="w-2 h-2 rounded-full border" />
            <span>All Questions</span>
          </NavLink>


          {/* <NavLink
            to="/dashboard/questions/mcq-single"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : "text-slate-700"}`
            }
          >
            <CheckSquare size={18} className="text-slate-700" />
            <span>MCQ — Single Correct</span>
          </NavLink>

          <NavLink
            to="/dashboard/questions/mcq-multi"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : "text-slate-700"}`
            }
          >
            <SquareCheckBig size={18} className="text-slate-700" />
            <span>MCQ — Multiple Correct</span>
          </NavLink>

          <NavLink
            to="/dashboard/questions/true-false"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : "text-slate-700"}`
            }
          >
            <FileText size={18} className="text-slate-700" />
            <span>True / False</span>
          </NavLink>

          <NavLink
            to="/dashboard/questions/import"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : "text-slate-700"}`
            }
          >
            <FilePlus2 size={18} className="text-slate-700" />
            <span>Import Question Bank</span>
          </NavLink> */}
        </div>
      </div>
    </div>
  );
}
