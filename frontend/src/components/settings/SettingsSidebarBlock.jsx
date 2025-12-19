import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  ChevronRight,
  ChevronDown,
  Settings,
  FileText,
} from "lucide-react";

/* MATCH DASHBOARD SIDEBAR STYLE */
const linkBase =
  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-orange-800 transition-all";

const linkActive =
  "bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-md";

export default function SettingsSidebarBlock({ role }) {
  if (role !== "admin") return null;

  const [openMain, setOpenMain] = useState(false);
  const [openHome, setOpenHome] = useState(false);
  const [openPages, setOpenPages] = useState(false);
  const [openContact, setOpenContact] = useState(false);

  return (
    <div className="mt-2 space-y-1">

      {/* MAIN SETTINGS TOGGLE */}
      <button
        onClick={() => setOpenMain(!openMain)}
        className={`${linkBase} w-full justify-between hover:bg-yellow-100 ${
          openMain ? "bg-yellow-100" : ""
        }`}
      >
        <span className="flex items-center gap-3 font-semibold">
          <Settings size={18} />
          Settings
        </span>
        {/* {openMain ? <ChevronDown size={16} /> : <ChevronRight size={16} />} */}
        <ChevronDown
                  size={16}
                  className={`transition-transform duration-300 ${
                    openMain ? "rotate-180" : ""
                  }`}
                />
      </button>

      {/* MAIN SETTINGS PANEL */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          openMain ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="ml-4 pl-3 border-l-2 border-yellow-300 space-y-1">

          {/* HOME SETTINGS */}
          <button
            onClick={() => setOpenHome(!openHome)}
            className={`${linkBase} w-full justify-between hover:bg-yellow-100`}
          >
            <span className="flex items-center gap-3">
              <LayoutGrid size={16} />
              Home Settings
            </span>
            {openHome ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {openHome && (
            <div className="ml-4 pl-3 border-l border-yellow-200 space-y-1">
              <NavLink
                to="/dashboard/settings/home"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : "hover:bg-yellow-100"}`
                }
              >
                Hero Section
              </NavLink>

              <NavLink
                to="/dashboard/settings/why-eec"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : "hover:bg-yellow-100"}`
                }
              >
                Why EEC Section
              </NavLink>

              <NavLink
                to="/dashboard/settings/features"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : "hover:bg-yellow-100"}`
                }
              >
                Features
              </NavLink>
            </div>
          )}

          {/* PAGE SETTINGS */}
          <button
            onClick={() => setOpenPages(!openPages)}
            className={`${linkBase} w-full justify-between hover:bg-yellow-100`}
          >
            <span className="flex items-center gap-3">
              <FileText size={16} />
              Pages
            </span>
            {openPages ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {openPages && (
            <div className="ml-4 pl-3 border-l border-yellow-200 space-y-1">
              <NavLink
                to="/dashboard/settings/about-us"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : "hover:bg-yellow-100"}`
                }
              >
                About Us
              </NavLink>

              {/* CONTACT US */}
              <button
                onClick={() => setOpenContact(!openContact)}
                className={`${linkBase} w-full justify-between hover:bg-yellow-100`}
              >
                <span>Contact Us</span>
                {openContact ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
              </button>

              {openContact && (
                <div className="ml-4 pl-3 border-l border-yellow-200 space-y-1">
                  <NavLink
                    to="/dashboard/settings/contact-career"
                    className={({ isActive }) =>
                      `${linkBase} ${
                        isActive ? linkActive : "hover:bg-yellow-100"
                      }`
                    }
                  >
                    Career
                  </NavLink>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
