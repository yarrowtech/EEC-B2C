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
      "group relative rounded-xl px-3 py-2 text-sm font-medium text-blue-900 transition hover:text-blue-950 " +
      (active ? "text-blue-950" : "") +
      " " +
      className
    }
  >
    {children}
    <span
      className={
        "pointer-events-none absolute -bottom-[2px] left-3 h-[2px] w-0 rounded-full bg-gradient-to-r from-yellow-400 to-amber-400 transition-all duration-300 group-hover:w-[calc(100%-1.5rem)] " +
        (active ? "w-[calc(100%-1.5rem)]" : "")
      }
    />
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
        className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium text-blue-900 transition hover:bg-blue-50 hover:text-blue-950"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {label} <ChevronDown className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full -mt-px z-50 w-64 overflow-hidden rounded-2xl border border-blue-100/70 bg-white/90 shadow-xl backdrop-blur-md"
          role="menu"
          onMouseEnter={openNow}
          onMouseLeave={closeSoon}
        >
          <div className="grid gap-1 p-2">{children}</div>
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
      window.dispatchEvent(new CustomEvent("eec:auth", { detail: { type: "logout" } }));
      navigate("/", { replace: true });
      toast.success("Logged out successfully.");
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
    <nav className="sticky top-0 z-40 bg-white/70 shadow-sm backdrop-blur-lg">
      {/* Subtle top glow line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-300 opacity-60" />
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3" onClick={closeMobile}>
          <div className="relative">
            <div className="flex flex-wrap flex-col h-full justify-center items-center gap-1">
            <img
              src="/logo_new.png"
              alt="EEC"
              className="h-10 w-auto drop-shadow-sm transition hover:scale-[1.01]"
            />
            <span className="text-amber-600 font-bold">
              Electronic Educare
            </span>
            </div>
            {/* <span className="pointer-events-none absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-yellow-400/60 blur-[4px]" /> */}
          </div>
          <span className="sr-only">EEC</span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-2 md:flex">
          <RouterLink className="ml-2" to="/" active={isActive("/")}>
            Home
          </RouterLink>
          <RouterLink to="/about" active={isActive("/about")}>
            About Us
          </RouterLink>

          <Dropdown label="EEC">
            <DropItem to="/analytics">Unlock precise analytics</DropItem>
            <DropItem to="/ai">AI Engine guides</DropItem>
            <DropItem to="/product-advantages">Product Advantages</DropItem>
            <DropItem to="/tollered">Tailored Content</DropItem>
            <DropItem to="/e-learn-well">Enhance learning</DropItem>
            <DropItem to="/aim">Best Solutions</DropItem>
          </Dropdown>

          <Dropdown label="Contact Us">
            <DropItem to="/careers">Career</DropItem>
            <DropItem to="/office">Office</DropItem>
          </Dropdown>

          {/* <RouterLink to="/boards" active={isActive("/boards")}>
            Boards
          </RouterLink> */}
          <RouterLink to="/support" active={isActive("/support")}>
            Support
          </RouterLink>
          <RouterLink to="/marketing" active={isActive("/marketing")}>
            Marketing
          </RouterLink>

          {/* <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("eec:open-login"))}
            className="ml-2 inline-flex items-center rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-400 px-4 py-2 text-sm font-semibold text-blue-950 shadow-md ring-1 ring-yellow-300/60 transition hover:shadow-lg hover:saturate-[1.1] active:scale-[.98]"
          >
            Login
          </button> */}

          {currentUser ? (
            <div className="relative ml-2" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((s) => !s)}
                className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-900/90"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border p-0.5">
                  <User className="h-4 w-4" />
                </span>
                <span className="max-w-[10rem] truncate">{currentUser.name}</span>
                <ChevronDown className={`h-4 w-4 transition ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-blue-100 bg-white/95 shadow-lg backdrop-blur-md">
                  <button
                    type="button"
                    onClick={proceedToDashboard}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-blue-900/90 hover:bg-blue-50"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-blue-900/90 hover:bg-blue-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("eec:open-login"))}
              className="ml-2 inline-flex items-center rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-400 px-4 py-2 text-sm font-semibold text-blue-950 shadow-md ring-1 ring-yellow-300/60 transition hover:shadow-lg hover:saturate-[1.1] active:scale-[.98]"
            >
              Login
            </button>
          )}
          <Link
            to="/eec-b2c"
            className="
    ml-3 relative inline-flex items-center justify-center
    px-4 py-2 text-sm font-extrabold text-white tracking-wide
    rounded-2xl 
    bg-gradient-to-r from-fuchsia-500 via-purple-600 to-indigo-600
    shadow-[0_0_25px_rgba(168,85,247,0.9)]
    hover:shadow-[0_0_45px_rgba(168,85,247,1)]
    transition-all duration-300 ease-out
    hover:scale-[1.12] active:scale-[0.96]
    overflow-hidden
    border border-white/20
  "
          >
            {/* Outer Neon Border Animation */}
            <span
              className="
      absolute inset-0 rounded-2xl
      border-2 border-fuchsia-400
      animate-[borderGlow_3s_linear_infinite]
      opacity-70
    "
            ></span>

            {/* Moving Gradient Background */}
            <span
              className="
      absolute inset-0 bg-gradient-to-r from-fuchsia-500 via-purple-600 to-indigo-600
      bg-[length:200%_200%]
      animate-[gradientMove_6s_ease_infinite]
      rounded-2xl opacity-90
    "
            ></span>

            {/* Shine Swipe */}
            <span
              className="
      absolute inset-0 translate-x-[-120%]
      bg-white/20 w-full h-full skew-x-12
      animate-[shine_3s_infinite]
    "
            />

            {/* Floating Glow Balls */}
            <span className="absolute top-0 left-0 w-3 h-3 bg-white/60 rounded-full blur-md animate-ping"></span>
            <span className="absolute bottom-0 right-0 w-4 h-4 bg-fuchsia-300/70 rounded-full blur-xl animate-pulse"></span>

            {/* Button Text */}
            <span className="relative z-10 drop-shadow-xl text-lg">For Institutions</span>
          </Link>

        </div>

        {/* Mobile toggle */}
        <button
          className="inline-flex items-center justify-center rounded-xl border border-blue-200 bg-white/70 p-2 shadow-sm backdrop-blur-md md:hidden"
          onClick={() => setMobileOpen((s) => !s)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-drawer"
        >
          {mobileOpen ? (
            <X className="h-5 w-5 text-blue-900" />
          ) : (
            <Menu className="h-5 w-5 text-blue-900" />
          )}
        </button>
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
        <div className="flex items-center justify-between border-b border-blue-100/70 px-4 py-3">
          <Link to="/" className="flex items-center gap-3" onClick={closeMobile}>
            <img src="/logo_new.png" alt="EEC" className="h-9 w-auto" />
          </Link>
          <button
            className="rounded-xl border border-blue-200 bg-white/80 p-2 backdrop-blur"
            onClick={closeMobile}
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-blue-900" />
          </button>
        </div>

        {/* Drawer content */}
        <div className="p-3">
          <RouterLink to="/" className="!block !px-2" onClick={closeMobile} active={isActive("/")}>
            Home
          </RouterLink>

          {/* EEC group */}
          <details className="rounded-xl p-1 open:bg-blue-50/70">
            <summary className="cursor-pointer rounded-xl px-2 py-2 text-sm font-medium text-blue-900">
              EEC
            </summary>
            <div className="mt-1 grid gap-1 rounded-xl bg-white/90 p-1 backdrop-blur-sm">
              <DropItem to="/analytics" onClick={closeMobile}>
                Unlock precise analytics
              </DropItem>
              <DropItem to="/ai" onClick={closeMobile}>
                AI Engine guides
              </DropItem>
              <DropItem to="/product-advantages" onClick={closeMobile}>
                Product Advantages
              </DropItem>
              <DropItem to="/tollered" onClick={closeMobile}>
                Tailored Content
              </DropItem>
              <DropItem to="/e-learn-well" onClick={closeMobile}>
                Enhance learning
              </DropItem>
              <DropItem to="/aim" onClick={closeMobile}>
                Best Solutions
              </DropItem>
            </div>
          </details>

          {/* Contact group */}
          <details className="rounded-xl p-1 open:bg-blue-50/70">
            <summary className="cursor-pointer rounded-xl px-2 py-2 text-sm font-medium text-blue-900">
              Contact Us
            </summary>
            <div className="mt-1 grid gap-1 rounded-xl bg-white/90 p-1 backdrop-blur-sm">
              <DropItem to="/careers" onClick={closeMobile}>
                Career
              </DropItem>
              <DropItem to="/office" onClick={closeMobile}>
                Office
              </DropItem>
            </div>
          </details>

          <RouterLink
            to="/boards"
            className="!block !px-2"
            onClick={closeMobile}
            active={isActive("/boards")}
          >
            Boards
          </RouterLink>
          <RouterLink
            to="/support"
            className="!block !px-2"
            onClick={closeMobile}
            active={isActive("/support")}
          >
            Support
          </RouterLink>
          <RouterLink
            to="/about"
            className="!block !px-2"
            onClick={closeMobile}
            active={isActive("/about")}
          >
            About Us
          </RouterLink>
          <RouterLink
            to="/marketing"
            className="!block !px-2"
            onClick={closeMobile}
            active={isActive("/marketing")}
          >
            Marketing
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
            <div className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-900/90">
              {currentUser.name}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new Event("eec:open-login"));
                closeMobile();
              }}
              className="mt-3 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-400 px-4 py-2 text-sm font-semibold text-blue-950 shadow-md ring-1 ring-yellow-300/60 transition hover:shadow-lg hover:saturate-[1.1] active:scale-[.98]"
            >
              Login
            </button>
          )}
          {/* MOBILE B2B BUTTON (same effect as desktop) */}
          <Link
            to="/eec-b2c"
            onClick={closeMobile}
            className="
    mt-4 relative inline-flex w-full items-center justify-center
    px-6 py-2.5 text-sm font-extrabold text-white tracking-wide
    rounded-2xl
    bg-gradient-to-r from-fuchsia-500 via-purple-600 to-indigo-600
    shadow-[0_0_25px_rgba(168,85,247,0.9)]
    hover:shadow-[0_0_45px_rgba(168,85,247,1)]
    transition-all duration-300 ease-out
    hover:scale-[1.08] active:scale-[0.96]
    overflow-hidden
    border border-white/20
  "
          >
            {/* Outer Neon Border */}
            <span
              className="
      absolute inset-0 rounded-2xl
      border-2 border-fuchsia-400
      animate-[borderGlow_3s_linear_infinite]
      opacity-70
    "
            ></span>

            {/* Moving Gradient */}
            <span
              className="
      absolute inset-0 bg-gradient-to-r from-fuchsia-500 via-purple-600 to-indigo-600
      bg-[length:200%_200%]
      animate-[gradientMove_6s_ease_infinite]
      rounded-2xl opacity-90
    "
            ></span>

            {/* Shine Swipe */}
            <span
              className="
      absolute inset-0 translate-x-[-120%]
      bg-white/40 w-full h-full skew-x-12
      animate-[shine_3s_infinite]
    "
            />

            {/* Glow Balls */}
            <span className="absolute top-0 left-0 w-3 h-3 bg-white/60 rounded-full blur-md animate-ping"></span>
            <span className="absolute bottom-0 right-0 w-4 h-4 bg-fuchsia-300/70 rounded-full blur-xl animate-pulse"></span>

            {/* Text */}
            <span className="relative z-10 drop-shadow-xl text-lg">For Institution</span>
          </Link>

        </div>
      </aside>
    </nav>
  )
  // );
}
