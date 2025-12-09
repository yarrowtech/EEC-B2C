import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  ChevronRight,
  ChevronDown,
  Settings,
  FileText,
  Layers,
  HelpCircle,
} from "lucide-react";

export default function SettingsSidebarBlock({ role }) {
  if (role !== "admin") return null;

  const [openMain, setOpenMain] = useState(false);
  const [openHome, setOpenHome] = useState(false);
  const [openPages, setOpenPages] = useState(false);
  const [openContact, setOpenContact] = useState(false); // NEW: Contact Us dropdown

  const linkBase =
    "block text-sm rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100 transition-colors";
  const linkActive =
    "bg-gradient-to-br from-slate-200 to-slate-100 text-slate-900 shadow-[inset_0_0_0_1px_rgba(2,6,23,0.06)]";

  return (
    <div className="space-y-1">

      {/* MAIN SETTINGS TOGGLE */}
      <button
        onClick={() => setOpenMain(!openMain)}
        className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg hover:bg-slate-100 transition-colors ${
          openMain ? "bg-slate-100" : ""
        }`}
      >
        <span className="flex items-center gap-2">
          <Settings size={17} />
          Settings
        </span>
        {openMain ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* MAIN SETTINGS PANEL */}
      {openMain && (
        <div className="pl-4 space-y-1">

          {/* HOME SETTINGS DROPDOWN */}
          <button
            onClick={() => setOpenHome(!openHome)}
            className="flex w-full items-center justify-between px-3 py-1.5 rounded-md text-sm hover:bg-slate-100"
          >
            <span className="flex items-center gap-2">
              <LayoutGrid size={16} /> Home Settings
            </span>
            {openHome ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {openHome && (
            <div className="pl-6 space-y-1">
              <NavLink
                to="/dashboard/settings/home"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : ""}`
                }
              >
                Hero Section
              </NavLink>

              <NavLink
                to="/dashboard/settings/why-eec"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : ""}`
                }
              >
                Why EEC Section
              </NavLink>

              <NavLink
                to="/dashboard/settings/features"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : ""}`
                }
              >
                Features
              </NavLink>
            </div>
          )}

          {/* PAGE SETTINGS DROPDOWN */}
          <button
            onClick={() => setOpenPages(!openPages)}
            className="flex w-full items-center justify-between px-3 py-1.5 rounded-md text-sm hover:bg-slate-100"
          >
            <span className="flex items-center gap-2">
              <FileText size={16} /> Pages
            </span>
            {openPages ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {openPages && (
            <div className="pl-6 space-y-1">
              <NavLink
                to="/dashboard/settings/about-us"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : ""}`
                }
              >
                About Us Page
              </NavLink>

              {/* CONTACT US MULTI DROPDOWN */}
              <div className="space-y-1">
                <button
                  onClick={() => setOpenContact(!openContact)}
                  className="flex w-full items-center justify-between px-3 py-1.5 rounded-md text-sm hover:bg-slate-100"
                >
                  <span className="flex items-center gap-2">
                    {/* keep same label as before */}
                    Contact Us
                  </span>
                  {openContact ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                </button>

                {openContact && (
                  <div className="pl-6 space-y-1">
                    <NavLink
                      to="/dashboard/settings/contact-career"
                      className={({ isActive }) =>
                        `${linkBase} ${isActive ? linkActive : ""}`
                      }
                    >
                      Career
                    </NavLink>

                    {/* <NavLink
                      to="/dashboard/settings/contact-office"
                      className={({ isActive }) =>
                        `${linkBase} ${isActive ? linkActive : ""}`
                      }
                    >
                      Office
                    </NavLink> */}
                  </div>
                )}
              </div>

              {/* <NavLink
                to="/dashboard/settings/privacy"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : ""}`
                }
              >
                Privacy Policy
              </NavLink> */}
            </div>
          )}
        </div>
      )}
    </div>
  );
}