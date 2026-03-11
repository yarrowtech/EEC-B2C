// src/components/Navbar.jsx
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, User, X, LogOut, LayoutDashboard } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";


/* -------- Router-styled link with active underline -------- */
const RouterLink = ({ to, children, className = "", onClick, active }) => (
  <Link
    to={to}
    onClick={onClick}
    className={
      "text-sm font-bold transition-colors px-2 py-1 " +
      (active ? "text-[#F4736E]" : "text-slate-800 hover:text-[#F4736E]") +
      " " +
      className
    }
  >
    {children}
  </Link>
);

/* -------- Dropdown item: router-aware (internal vs external) -------- */
const DropItem = ({ to, href, onClick, children, icon }) => {
  const base =
    "group flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-blue-900 transition hover:bg-blue-50";
  const Inner = (
    <>
      {icon ? <span className="grid h-5 w-5 place-items-center">{icon}</span> : null}
      <span className="transition group-hover:translate-x-0.5">{children}</span>
    </>
  );
  return to ? (
    <Link to={to} onClick={onClick} className={base}>
      {Inner}
    </Link>
  ) : (
    <a href={href || "#"} onClick={onClick} className={base}>
      {Inner}
    </a>
  );
};

/* ---------- Desktop dropdown with hover + click toggle ---------- */
function Dropdown({ label, children }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef(null);

  const openNow = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const closeSoon = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  };
  const toggle = () => setOpen((o) => !o);

  return (
    <div className="relative" onMouseEnter={openNow} onMouseLeave={closeSoon}>
      <button
        type="button"
        className="inline-flex items-center gap-1 text-sm font-bold text-slate-800 hover:text-[#F4736E] transition-colors"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {label}
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-2 z-50 min-w-[180px] overflow-hidden rounded-2xl border-2 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.08)]"
          style={{ borderColor: "rgba(255,210,63,0.3)" }}
          role="menu"
          onMouseEnter={openNow}
          onMouseLeave={closeSoon}
        >
          <div className="p-2">{children}</div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  // Hide the Navbar on unified dashboard routes
  const shouldHide = location.pathname.startsWith("/dashboard");

  // Track logged-in user (from localStorage)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  // Update when login happens or storage changes (another tab, logout elsewhere, etc.)
  useEffect(() => {
    const refreshUser = () => {
      try {
        setCurrentUser(JSON.parse(localStorage.getItem("user") || "null"));
      } catch {
        setCurrentUser(null);
      }
    };

    const onAuth = () => refreshUser();
    window.addEventListener("eec:auth", onAuth);
    window.addEventListener("storage", refreshUser);
    return () => {
      window.removeEventListener("eec:auth", onAuth);
      window.removeEventListener("storage", refreshUser);
    };
  }, []);

  const proceedToDashboard = () => {
    navigate(currentUser?.role === "admin" ? "/admin-dashboard" : "/student-dashboard", { replace: true });
    setUserMenuOpen(false);
  }

  function handleLogout() {
    try {
      localStorage.removeItem("jwt");
      localStorage.removeItem("user");
      // notify the app (Navbar listens to this in your earlier setup)
      window.dispatchEvent(new CustomEvent("eec:auth", { detail: { type: "manual-logout" } }));
      navigate("/", { replace: true });
      toast.success("Logged out successfully");
    } finally {
      setUserMenuOpen(false);
    }
  }

  // close on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);


  // Smooth scroll to top on every route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = mobileOpen ? "hidden" : original || "";
    return () => {
      document.body.style.overflow = original;
    };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  // Helper to check active path (startsWith for groups if desired)
  const isActive = (path) => location.pathname === path;

  // return (
  return shouldHide ? null : (
    <nav className="sticky top-0 z-40 w-full border-b-4 bg-white/90 backdrop-blur-md" style={{ borderBottomColor: "rgba(255,210,63,0.25)" }}>
      <style>{`
        @keyframes wiggle {
          0%,100% { transform: rotate(-2deg); }
          50%      { transform: rotate(2deg);  }
        }
        .wiggle { animation: wiggle 1.2s ease-in-out infinite; }
        .wiggle:hover { animation-play-state: paused; }
      `}</style>
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 md:px-8">
        {/* Brand — code.html style: coral bg, rotate-3, auto_stories icon */}
        <Link to="/" className="flex items-center gap-3" onClick={closeMobile}>
          <div className="flex items-center justify-center rounded-2xl bg-[#F4736E] p-2 rotate-3 shadow-lg text-white">
            <span className="material-symbols-outlined text-2xl font-bold" style={{ fontFamily: "'Material Symbols Outlined'", fontVariationSettings: "'FILL' 1, 'wght' 700, 'GRAD' 0, 'opsz' 24" }}>auto_stories</span>
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>EEC</span>
        </Link>

        {/* Desktop nav links — centered */}
        <div className="hidden items-center gap-8 md:flex">
          <RouterLink className="ml-2" to="/" active={isActive("/")}>
            Home
          </RouterLink>
          <RouterLink to="/about" active={isActive("/about")}>
            About Us
          </RouterLink>

          <Dropdown label="Study Tools">
            <DropItem to="/dashboard/syllabus?stage=1">Tryouts</DropItem>
          </Dropdown>

          <RouterLink to="/contact-us" active={isActive("/contact-us") || isActive("/office")}>
            Contact Us
          </RouterLink>
          <RouterLink to="/careers" active={isActive("/careers")}>
            Careers
          </RouterLink>
        </div>

        {/* Desktop right side */}
        <div className="hidden items-center gap-2 md:flex">
          {currentUser ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((s) => !s)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#1B1F3B] transition hover:border-slate-300 hover:bg-slate-50"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#F4736E]/10 text-[#F4736E]">
                  <User className="h-3.5 w-3.5" />
                </span>
                <span className="max-w-[10rem] truncate">{currentUser.name}</span>
                <ChevronDown className={`h-4 w-4 transition ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
                  <button
                    type="button"
                    onClick={proceedToDashboard}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-[#1B1F3B] hover:bg-slate-50"
                  >
                    <LayoutDashboard className="h-4 w-4 text-slate-400" />
                    Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-[#1B1F3B] hover:bg-slate-50"
                  >
                    <LogOut className="h-4 w-4 text-slate-400" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : null}
          {/* Claim Free Gift — exact code.html style: rounded-2xl, 3D shadow, wiggle */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("eec:open-login"))}
            className="wiggle inline-flex items-center bg-[#FFD23F] hover:bg-yellow-400 text-slate-900 font-bold py-3 px-6 rounded-2xl transition-all hover:scale-105 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] text-sm"
          >
            Join Now 🎁
          </button>
        </div>

        {/* Mobile: Claim Free Gift + Hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => { window.dispatchEvent(new Event("eec:open-login")); closeMobile(); }}
            className="inline-flex items-center bg-[#FFD23F] text-slate-900 font-bold py-2 px-4 rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)] text-xs hover:bg-yellow-400 transition-all hover:scale-105"
          >
            Claim Free Gift! 🎁
          </button>
          <button
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 shadow-sm"
            onClick={() => setMobileOpen((s) => !s)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-drawer"
          >
            {mobileOpen ? (
              <X className="h-5 w-5 text-[#1B1F3B]" />
            ) : (
              <Menu className="h-5 w-5 text-[#1B1F3B]" />
            )}
          </button>
        </div>
      </div>

      {/* ======= Mobile Drawer + Overlay ======= */}
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 md:hidden ${mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
        onClick={closeMobile}
      />

      {/* Drawer */}
      <aside
        id="mobile-drawer"
        className={`fixed left-0 top-0 z-50 h-screen w-80 max-w-[85%] transform bg-white/95 shadow-2xl backdrop-blur-md transition-transform duration-300 ease-out md:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        role="dialog"
        aria-modal="true"
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5" onClick={closeMobile}>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F4736E] text-white">
              <span className="text-base leading-none">📖</span>
            </div>
            <span className="text-base font-extrabold text-[#1B1F3B]">EEC</span>
          </Link>
          <button
            className="rounded-xl border border-slate-200 bg-white p-2"
            onClick={closeMobile}
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-[#1B1F3B]" />
          </button>
        </div>

        {/* Drawer content */}
        <div className="p-3">
          <RouterLink to="/" className="!block !px-2" onClick={closeMobile} active={isActive("/")}>
            Home
          </RouterLink>
          <RouterLink
            to="/about"
            className="!block !px-2"
            onClick={closeMobile}
            active={isActive("/about")}
          >
            About Us
          </RouterLink>

          {/* Study Tools group */}
          <details className="rounded-xl p-1 open:bg-blue-50/70">
            <summary className="cursor-pointer rounded-xl px-2 py-2 text-sm font-medium text-blue-900">
              Study Tools
            </summary>
            <div className="mt-1 grid gap-1 rounded-xl bg-white/90 p-1 backdrop-blur-sm">
              <DropItem to="/dashboard/syllabus?stage=1" onClick={closeMobile}>
                Tryouts
              </DropItem>
            </div>
          </details>

          <RouterLink
            to="/contact-us"
            className="!block !px-2"
            onClick={closeMobile}
            active={isActive("/contact-us") || isActive("/office")}
          >
            Contact Us
          </RouterLink>
          <RouterLink
            to="/careers"
            className="!block !px-2"
            onClick={closeMobile}
            active={isActive("/careers")}
          >
            Careers
          </RouterLink>

          {/* <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new Event("eec:open-login"));
              closeMobile();
            }}
            className="mt-3 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-400 px-4 py-2 text-sm font-semibold text-blue-950 shadow-md ring-1 ring-yellow-300/60 transition hover:shadow-lg hover:saturate-[1.1] active:scale-[.98]"
          >
            Login
          </button> */}
          {currentUser ? (
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F4736E]/10 text-[#F4736E]">
                <User className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold text-[#1B1F3B] truncate">{currentUser.name}</span>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => { window.dispatchEvent(new Event("eec:open-login")); closeMobile(); }}
            className="mt-2 flex w-full items-center justify-center bg-[#FFD23F] hover:bg-yellow-400 text-slate-900 font-bold py-3 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] text-sm transition-all hover:scale-105"
          >
            Claim Free Gift! 🎁
          </button>

        </div>
      </aside>
    </nav>
  )
  // );
}
