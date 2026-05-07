import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const STARS = Array.from({ length: 45 }, (_, i) => ({
  id: i,
  x: (i * 97 + 11) % 100,
  y: (i * 71 + 23) % 100,
  size: 1.2 + (i % 3) * 0.8,
  delay: (i * 0.19) % 4,
  dur: 2 + (i % 3),
}));

const float = (y = 16, rotate = 6, dur = 4, delay = 0) => ({
  animate: { y: [0, -y, 0], rotate: [-rotate, rotate, -rotate] },
  transition: { duration: dur, repeat: Infinity, ease: "easeInOut", delay },
});

function AstronautSVG({ badgeText = "Edify Eight" }) {
  return (
    <svg
      width="220"
      height="240"
      viewBox="0 0 220 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="helmetGrad" cx="38%" cy="33%" r="65%">
          <stop offset="0%" stopColor="#dde3f6" />
          <stop offset="100%" stopColor="#8a98c5" />
        </radialGradient>
        <radialGradient id="planetGrad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#3a4175" />
          <stop offset="100%" stopColor="#1e2347" />
        </radialGradient>
        <radialGradient id="glowOrb" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F4736E" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#F4736E" stopOpacity="0" />
        </radialGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Planet / Moon base */}
      <ellipse cx="110" cy="220" rx="78" ry="20" fill="url(#planetGrad)" />
      <ellipse cx="110" cy="216" rx="78" ry="20" fill="#2d3561" />
      <ellipse cx="68" cy="217" rx="11" ry="5" fill="#232850" />
      <ellipse cx="140" cy="219" rx="8" ry="3.5" fill="#232850" />
      <ellipse cx="110" cy="221" rx="5" ry="2.5" fill="#232850" />

      {/* Body suit */}
      <rect x="80" y="148" width="60" height="70" rx="16" fill="#e7c555" />

      {/* EEC chest patch */}
      <rect x="89" y="158" width="42" height="26" rx="7" fill="#F4736E" opacity="0.92" filter="url(#glow)" />
      <text
        x="110"
        y="174"
        textAnchor="middle"
        fill="white"
        fontSize={badgeText.length > 12 ? "7" : badgeText.length > 9 ? "8" : "9"}
        fontWeight="800"
        fontFamily="'Balsamiq Sans', sans-serif"
        letterSpacing="0.5"
      >
        {badgeText}
      </text>

      {/* Collar ring */}
      <ellipse cx="110" cy="160" rx="24" ry="8" fill="#b8c2e0" />

      {/* Helmet */}
      <circle cx="110" cy="122" r="42" fill="url(#helmetGrad)" />

      {/* Visor */}
      <ellipse cx="110" cy="124" rx="27" ry="25" fill="#1B1F3B" opacity="0.88" />

      {/* Visor shine */}
      <ellipse cx="99" cy="113" rx="8" ry="6" fill="white" opacity="0.15" />
      <ellipse cx="96" cy="110" rx="4" ry="3" fill="white" opacity="0.18" />

      {/* Eyes (visible through visor) */}
      <circle cx="102" cy="124" r="4.5" fill="white" />
      <circle cx="118" cy="124" r="4.5" fill="white" />
      <circle cx="103.2" cy="125" r="3" fill="#1B1F3B" />
      <circle cx="119.2" cy="125" r="3" fill="#1B1F3B" />
      {/* Eye gleam */}
      <circle cx="104" cy="123.5" r="1" fill="white" opacity="0.7" />
      <circle cx="120" cy="123.5" r="1" fill="white" opacity="0.7" />

      {/* Confused mouth (slight frown) */}
      <path
        d="M 102 135 Q 110 132 118 135"
        stroke="white"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* Helmet ring */}
      <ellipse cx="110" cy="161" rx="26" ry="9" fill="#a8b3d4" />

      {/* Left arm */}
      <rect
        x="44"
        y="152"
        width="36"
        height="15"
        rx="7.5"
        fill="#c8cfed"
        transform="rotate(-18 44 152)"
      />
      {/* Left glove */}
      <circle cx="42" cy="165" r="10" fill="#F4736E" filter="url(#glow)" />

      {/* Right arm */}
      <rect
        x="140"
        y="152"
        width="36"
        height="15"
        rx="7.5"
        fill="#c8cfed"
        transform="rotate(18 140 152)"
      />
      {/* Right glove (holding question mark) */}
      <circle cx="178" cy="165" r="10" fill="#F4736E" filter="url(#glow)" />
      <text
        x="178"
        y="170"
        textAnchor="middle"
        fill="white"
        fontSize="12"
        fontWeight="900"
        fontFamily="sans-serif"
      >
        ?
      </text>

      {/* Jetpack */}
      <rect x="130" y="148" width="20" height="40" rx="7" fill="#a29bfe" />
      <rect x="134" y="158" width="12" height="7" rx="3.5" fill="#e7c555" />
      <rect x="134" y="170" width="12" height="5" rx="2.5" fill="#e7c555" opacity="0.6" />
      {/* Jetpack flame */}
      <ellipse cx="140" cy="192" rx="5" ry="8" fill="#F4736E" opacity="0.6" />
      <ellipse cx="140" cy="194" rx="3" ry="5" fill="#e7c555" opacity="0.5" />

      {/* Legs */}
      <rect x="90" y="213" width="16" height="12" rx="8" fill="#b8c2e0" />
      <rect x="114" y="213" width="16" height="12" rx="8" fill="#b8c2e0" />

      {/* Boots */}
      <ellipse cx="98" cy="226" rx="13" ry="7" fill="#F4736E" />
      <ellipse cx="122" cy="226" rx="13" ry="7" fill="#F4736E" />

      {/* Glow orb behind astronaut */}
      <circle cx="110" cy="130" r="70" fill="url(#glowOrb)" />
    </svg>
  );
}

function BookSVG({ color = "#F4736E", spineColor = "#c8584d" }) {
  return (
    <svg width="48" height="62" viewBox="0 0 48 62" fill="none" aria-hidden="true">
      <rect x="4" y="2" width="40" height="58" rx="5" fill={color} />
      <rect x="9" y="9" width="28" height="4" rx="2" fill="white" opacity="0.45" />
      <rect x="9" y="17" width="20" height="3" rx="1.5" fill="white" opacity="0.35" />
      <rect x="9" y="23" width="25" height="3" rx="1.5" fill="white" opacity="0.35" />
      <rect x="9" y="29" width="17" height="3" rx="1.5" fill="white" opacity="0.3" />
      <rect x="4" y="2" width="7" height="58" rx="4" fill={spineColor} />
    </svg>
  );
}

function GradCapSVG() {
  return (
    <svg width="60" height="52" viewBox="0 0 60 52" fill="none" aria-hidden="true">
      <polygon points="30,4 60,18 30,32 0,18" fill="#a29bfe" />
      <rect x="47" y="16" width="5" height="24" rx="2.5" fill="#a29bfe" />
      <ellipse cx="49.5" cy="41" rx="7" ry="5" fill="#e7c555" />
      <rect x="23" y="27" width="14" height="18" rx="7" fill="#7c72d4" />
      <polygon points="30,18 60,18 30,32 0,18" fill="#c0b8fa" opacity="0.5" />
    </svg>
  );
}

function PencilSVG() {
  return (
    <svg width="18" height="74" viewBox="0 0 18 74" fill="none" aria-hidden="true">
      <rect x="4" y="6" width="10" height="52" fill="#e7c555" />
      <rect x="4" y="6" width="10" height="6" fill="#bbb" />
      <rect x="4" y="2" width="10" height="5" rx="2" fill="#F4736E" />
      <polygon points="4,58 14,58 9,74" fill="#f8c4a0" />
      <line x1="9" y1="62" x2="9" y2="72" stroke="#888" strokeWidth="1.5" />
    </svg>
  );
}

function MathSymbolSVG() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <circle cx="22" cy="22" r="20" stroke="#4ecdc4" strokeWidth="2.5" strokeDasharray="5 3" />
      <text
        x="22"
        y="29"
        textAnchor="middle"
        fill="#4ecdc4"
        fontSize="20"
        fontWeight="900"
        fontFamily="'Balsamiq Sans', sans-serif"
      >
        ∞
      </text>
    </svg>
  );
}

export default function NotFound() {
  const navigate = useNavigate();
  const [siteName, setSiteName] = useState("Edify Eight");
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    let active = true;

    async function loadWebsiteSettings() {
      try {
        const res = await fetch(`${API_BASE}/api/website-settings`);
        const data = await res.json().catch(() => ({}));
        if (!active) return;
        setSiteName(String(data?.siteName || "Edify Eight").trim() || "Edify Eight");
      } catch {
        // Keep fallback brand value on fetch errors.
      }
    }

    loadWebsiteSettings();

    const onWebsiteSettingsUpdated = (e) => {
      const data = e?.detail || {};
      setSiteName(String(data?.siteName || "Edify Eight").trim() || "Edify Eight");
    };

    window.addEventListener("website:settings-updated", onWebsiteSettingsUpdated);
    return () => {
      active = false;
      window.removeEventListener("website:settings-updated", onWebsiteSettingsUpdated);
    };
  }, [API_BASE]);

  const badgeText = useMemo(() => {
    const cleaned = String(siteName || "").trim();
    if (!cleaned) return "Edify Eight";
    return cleaned.length > 16 ? `${cleaned.slice(0, 16)}` : cleaned;
  }, [siteName]);

  const handleDashboardClick = () => {
    const token = localStorage.getItem("jwt") || "";
    let isLoggedIn = false;
    try {
      const { exp } = JSON.parse(atob(token.split(".")[1] || ""));
      isLoggedIn = typeof exp === "number" && Date.now() < exp * 1000;
    } catch {
      isLoggedIn = false;
    }

    if (isLoggedIn) {
      navigate("/dashboard");
      return;
    }

    sessionStorage.setItem("redirectAfterLogin", "/dashboard");
    window.dispatchEvent(new Event("eec:open-login"));
  };

  return (
    <div className="relative overflow-hidden bg-[#1B1F3B] flex flex-col items-center justify-center px-4 py-20 min-h-[calc(100vh-80px)]">

      {/* Background radial glows */}
      <div
        className="pointer-events-none absolute left-[-8%] top-[-12%] h-[420px] w-[420px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(244,115,110,0.22) 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute bottom-[-10%] right-[-6%] h-[360px] w-[360px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(231,197,85,0.18) 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute top-[35%] right-[8%] h-[280px] w-[280px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(78,205,196,0.12) 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute bottom-[20%] left-[10%] h-[200px] w-[200px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(162,155,254,0.12) 0%, transparent 70%)" }}
      />

      {/* Twinkling stars */}
      {STARS.map((s) => (
        <motion.span
          key={s.id}
          className="pointer-events-none absolute rounded-full bg-white"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size }}
          animate={{ opacity: [0.15, 0.9, 0.15], scale: [1, 1.3, 1] }}
          transition={{ duration: s.dur, repeat: Infinity, delay: s.delay }}
        />
      ))}

      {/* ── Floating decorative elements ── */}

      {/* Book 1 — top left */}
      <motion.div
        className="pointer-events-none absolute left-[6%] top-[12%] hidden sm:block"
        {...float(14, 8, 4.2, 0)}
      >
        <BookSVG color="#F4736E" spineColor="#c8584d" />
      </motion.div>

      {/* Book 2 — top right */}
      <motion.div
        className="pointer-events-none absolute right-[7%] top-[18%] hidden sm:block"
        {...float(12, 10, 3.8, 1.2)}
      >
        <BookSVG color="#e7c555" spineColor="#b89a35" />
      </motion.div>

      {/* Graduation cap — upper center-right */}
      <motion.div
        className="pointer-events-none absolute right-[18%] top-[8%] hidden md:block"
        {...float(18, 7, 5, 0.5)}
      >
        <GradCapSVG />
      </motion.div>

      {/* Pencil — bottom left */}
      <motion.div
        className="pointer-events-none absolute bottom-[22%] left-[10%] hidden sm:block"
        animate={{ y: [0, -12, 0], rotate: [25, 35, 25] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
      >
        <PencilSVG />
      </motion.div>

      {/* Infinity / math symbol — bottom right */}
      <motion.div
        className="pointer-events-none absolute bottom-[26%] right-[9%] hidden sm:block"
        {...float(16, 12, 6, 2)}
      >
        <MathSymbolSVG />
      </motion.div>

      {/* Large ghost "?" — far left mid */}
      <motion.div
        className="pointer-events-none absolute left-[2%] top-[40%] hidden lg:block select-none"
        style={{
          fontSize: 80,
          fontWeight: 900,
          fontFamily: "'Balsamiq Sans', sans-serif",
          color: "#F4736E",
          opacity: 0.08,
        }}
        animate={{ opacity: [0.06, 0.14, 0.06] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        ?
      </motion.div>

      {/* Large ghost "!" — far right mid */}
      <motion.div
        className="pointer-events-none absolute right-[2%] top-[50%] hidden lg:block select-none"
        style={{
          fontSize: 70,
          fontWeight: 900,
          fontFamily: "'Balsamiq Sans', sans-serif",
          color: "#e7c555",
          opacity: 0.08,
        }}
        animate={{ opacity: [0.05, 0.12, 0.05] }}
        transition={{ duration: 3.5, repeat: Infinity, delay: 1 }}
      >
        !
      </motion.div>

      {/* ── Main content ── */}
      <div className="relative z-10 flex flex-col items-center text-center">

        {/* Astronaut illustration */}
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 3, -3, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          className="mb-2"
        >
          <AstronautSVG badgeText={badgeText} />
        </motion.div>

        {/* 404 number */}
        <motion.h1
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 18, delay: 0.15 }}
          className="select-none text-[7rem] sm:text-[9rem] font-extrabold leading-none tracking-tight"
          style={{
            background: "linear-gradient(130deg, #F4736E 0%, #e7c555 55%, #F4736E 100%)",
            backgroundSize: "200% 200%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            animation: "gradientMove 4s ease infinite",
          }}
        >
          404
        </motion.h1>

        {/* Tag line */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-1 text-xs font-bold tracking-[0.22em] uppercase text-[#F4736E]"
        >
          Houston, we have a problem!
        </motion.p>

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.48 }}
          className="mt-3 text-2xl font-extrabold text-white sm:text-3xl"
        >
          Page Not Found
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-4 max-w-md text-base leading-relaxed text-slate-400"
        >
          Looks like this page drifted off into space. The URL you're looking for doesn't exist or may have been moved.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.72 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            to="/"
            className="group inline-flex items-center gap-2.5 rounded-full px-7 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-[0_0_24px_rgba(244,115,110,0.45)]"
            style={{ background: "linear-gradient(130deg, #F4736E, #e05e5a)" }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
              <polyline points="9 21 9 12 15 12 15 21" />
            </svg>
            Back to Home
          </Link>

          <button
            type="button"
            onClick={handleDashboardClick}
            className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/8 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:border-[#e7c555]/60 hover:text-[#e7c555]"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Go to Dashboard
          </button>
        </motion.div>

        {/* Divider with orbit dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-10 flex items-center gap-2"
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="rounded-full"
              style={{ width: i === 1 ? 8 : 5, height: i === 1 ? 8 : 5, background: i === 1 ? "#F4736E" : "#e7c555" }}
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
