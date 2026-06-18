import React from "react";
import { NavLink } from "react-router-dom";
import { BookOpen } from "lucide-react";

const linkBase =
  "flex items-center gap-3 px-4 py-3 rounded-full text-sm font-bold text-slate-600 transition-all";
const linkActive =
  "bg-[#e7c555] text-[#211d11] shadow-md shadow-[#e7c555]/30";

export default function SyllabusSidebarBlock({ role = "student" }) {
  if (role !== "student") return null;

  return (
    <div className="mt-1">
      <NavLink
        to="/dashboard/syllabus"
        className={({ isActive }) =>
          `${linkBase} ${isActive ? linkActive : "hover:bg-slate-100"}`
        }
      >
        <BookOpen size={18} />
        <span>Practice Now</span>
      </NavLink>
    </div>
  );
}
