// src/components/EECStages.jsx
import { useEffect, useMemo, useRef, useState } from "react";

/* --------------------------- Data (unchanged) --------------------------- */
const STAGES = [
  {
    label: "Stage 1",
    title: "Signup + Input/Output Understanding",
    desc: (
      <>
        Unlock Dashboard{" "}
        <a
          href="login.html"
          className="font-semibold underline decoration-yellow-400 underline-offset-2 hover:text-yellow-600"
        >
          click here
        </a>
      </>
    ),
    bg: "from-sky-100 via-white to-blue-50",
  },
  {
    label: "Stage 2",
    title: "AI begins tracking performance and learning habits",
    desc: "Personalized insights start here.",
    bg: "from-blue-100 via-white to-sky-50",
  },
  {
    label: "Stage 3",
    title: "Skill tryouts unlocked (Easy → Arduous)",
    desc: "Level up with targeted challenges across three tiers.",
    bg: "from-indigo-100 via-white to-sky-50",
  },
  {
    label: "Stage 4–5",
    title: "AI feedback loops + confidence building",
    desc: "Sharper feedback with targeted practice to build confidence.",
    bg: "from-cyan-100 via-white to-emerald-50",
  },
  {
    label: "Stage 6+",
    title: "Deep subject intelligence, assessments, reasoning",
    desc: "High-rigor assessments and reasoning modules.",
    bg: "from-blue-50 via-white to-violet-50",
  },
];

/* ------------------------ InView helper (unchanged) ------------------------ */
function useInView(threshold = 0.55) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

/* -------------------- LEFT stair scene (person PNG only) ------------------- */
/** Uses a PNG character (place /public/person.png). Extra headroom prevents clipping. */
function StairScene({ currentIndex }) {
  const steps = STAGES.length;
  const stairW = 120,
    stairH = 80,
    gap = 8,
    baseX = 40;

  // Headroom + base
  const CANVAS_H = 600;
  const baseY = 600;
  const personOffsetX = 36,
    personOffsetY = 26;
  const totalWidth = baseX + (stairW + gap) * steps + 60;

  const px = baseX + currentIndex * (stairW + gap) + personOffsetX;
  const py = baseY - (currentIndex + 1) * stairH - personOffsetY;

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${CANVAS_H}`}
      className="h-[62vh] w-full overflow-visible"
      role="img"
      aria-label="A character climbs stairs to represent learning stages"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="rgba(2,32,71,0.10)" />
        </pattern>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.25" />
        </filter>
      </defs>

      <rect x="0" y="0" width={totalWidth} height={CANVAS_H} fill="url(#dots)" />

      {Array.from({ length: steps }).map((_, i) => {
        const x = baseX + i * (stairW + gap);
        const y = baseY - (i + 1) * stairH;
        const active = i <= currentIndex;
        return (
          <g key={i} filter="url(#shadow)">
            <rect
              x={x}
              y={y}
              width={stairW}
              height={stairH}
              rx="10"
              className={active ? "fill-sky-300" : "fill-blue-100"}
            />
            <text
              x={x + stairW / 2}
              y={y + stairH / 2 + 6}
              textAnchor="middle"
              className="fill-blue-900"
              style={{ fontSize: 16, fontWeight: 700 }}
            >
              {STAGES[i].label}
            </text>
          </g>
        );
      })}

      {/* Character PNG */}
      <image
        href="/person.png"
        x={px - 80}
        y={py - 145}
        width="200"
        height="200"
        style={{ transition: "transform 420ms ease-out" }}
        className="pointer-events-none select-none"
      />
    </svg>
  );
}

/* ----------------------- Main layout (left sticky) ----------------------- */
export default function EECStages() {
  const reduceMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false
    );
  }, []);

  const [active, setActive] = useState(0);

  // Ref to right scroll container so stage dots can scroll to sections (if needed)
  const rightPaneRef = useRef(null);
  const scrollToStage = (i) => {
    const pane = rightPaneRef.current;
    const el = pane?.querySelector?.(`#stage-${i}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative min-h-screen">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-6 md:grid-cols-2">
        {/* LEFT: sticky stair card (fixed-in-place visual) */}
        <div className="order-2 md:order-1 md:sticky md:top-16 md:h-[calc(100vh-4rem)]">
          <div className="flex h-full flex-col rounded-3xl border border-blue-100 bg-white/90 p-3 shadow-xl backdrop-blur">
            <StairScene currentIndex={active} />
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-blue-900/70">
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-3 w-5 rounded bg-sky-300" />{" "}
                Completed step
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-3 w-5 rounded bg-blue-100" />{" "}
                Upcoming step
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: scrollable stages with soft gradients & reveals */}
        <div
          ref={rightPaneRef}
          className="no-scrollbar relative order-1 h-screen overflow-y-auto border-l border-blue-100/60 bg-gradient-to-b from-white/60 via-white/30 to-transparent scroll-smooth backdrop-blur-[2px] md:order-2 md:h-[calc(100vh-0rem)]"
        >
          {/* Optional: right-edge progress rail (clickable) */}
          {/*
          <div className="pointer-events-auto hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 flex-col items-center gap-2">
            <div className="h-44 w-[2px] rounded-full bg-gradient-to-b from-blue-200 via-blue-400 to-blue-200" />
            <div className="absolute inset-0 flex flex-col justify-between py-1">
              {STAGES.map((_, i) => (
                <button
                  key={`dot-${i}`}
                  type="button"
                  onClick={() => scrollToStage(i)}
                  className={[
                    "mx-auto block h-3 w-3 rounded-full ring-2 ring-white/70 transition-all duration-300",
                    i === active
                      ? "bg-blue-500 shadow-[0_0_0_6px_rgba(59,130,246,0.25)] scale-110"
                      : "bg-blue-300/70 hover:bg-blue-400/90",
                  ].join(" ")}
                  title={`Go to ${STAGES[i].label}`}
                />
              ))}
            </div>
          </div>
          */}

          {/* Floating “scroll down” indicator (auto-hides on last stage) */}
          <div
            className={[
              "pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 flex flex-col items-center gap-1 transition-opacity duration-300",
              active < STAGES.length - 1 ? "opacity-100" : "opacity-0",
            ].join(" ")}
          >
            <span className="text-[11px] font-semibold tracking-wide text-blue-900/70">
              Scroll down
            </span>
            <svg
              className="h-5 w-5 animate-bounce"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M6 9l6 6 6-6" className="text-blue-700/70" />
            </svg>
          </div>

          {/* CONTENT SECTIONS */}
          {STAGES.map((s, idx) => {
            const [contentRef, inView] = useInView(0.6);
            // Update active when a section is in view (drives PNG position)
            useEffect(() => {
              if (inView) setActive(idx);
            }, [inView, idx]);

            return (
              <section
                id={`stage-${idx}`}
                key={s.label}
                className={`relative flex h-screen w-full items-center bg-gradient-to-br ${s.bg} snap-always snap-start`}
              >
                {/* Subtle top & bottom fades */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/70 to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white/70 to-transparent" />

                <div className="relative z-10 w-full px-3 sm:px-6">
                  {/* Tiny breadcrumb/tag */}
                  <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/60 px-2 py-1 text-[11px] font-semibold text-blue-900/70 ring-1 ring-blue-200/60 backdrop-blur">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-yellow-400" />
                    Stages of Learning at EEC
                  </span>

                  {/* Title + lead */}
                  <div
                    ref={contentRef}
                    className={[
                      "max-w-2xl px-2 transition-all duration-500 ease-out",
                      reduceMotion
                        ? ""
                        : inView
                        ? "translate-y-0 opacity-100"
                        : "translate-y-4 opacity-0",
                    ].join(" ")}
                  >
                    <h3 className="text-3xl font-extrabold leading-tight md:text-4xl">
                      <span className="bg-gradient-to-r from-blue-900 via-blue-700 to-indigo-700 bg-clip-text text-transparent drop-shadow-sm">
                        {s.title}
                      </span>
                    </h3>
                    <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-blue-900/85">
                      {s.desc}
                    </p>

                    {/* Info card with soft glow */}
                    <div
                      className={[
                        "mt-6 max-w-md rounded-2xl border border-blue-200/60 bg-white/85 p-4 text-sm text-blue-900 shadow-xl ring-1 ring-white/60 backdrop-blur",
                        "transition-all duration-500 ease-out delay-100",
                        reduceMotion
                          ? ""
                          : inView
                          ? "translate-y-0 opacity-100"
                          : "translate-y-3 opacity-0",
                      ].join(" ")}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="text-[12px] font-extrabold text-blue-700">
                          {s.label}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="h-1.5 w-20 rounded-full bg-gradient-to-r from-blue-300 via-blue-500 to-indigo-400" />
                        </div>
                      </div>
                      <div className="leading-relaxed">{s.desc}</div>
                    </div>

                    {/* Optional hint chip on first stage */}
                    {idx === 0 && (
                      <p
                        className={[
                          "mt-4 inline-flex items-center gap-2 rounded-full border border-yellow-300/60 bg-yellow-50/90 px-3 py-1.5 text-xs font-semibold text-yellow-800 shadow-sm backdrop-blur",
                          "transition-all duration-500 ease-out delay-150",
                          reduceMotion
                            ? ""
                            : inView
                            ? "translate-y-0 opacity-100"
                            : "translate-y-2 opacity-0",
                        ].join(" ")}
                      >
                        <span className="inline-block h-2 w-2 rounded-full bg-yellow-400" />
                        Stages 1–5 are absolutely free to try!
                      </p>
                    )}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </section>
  );
}
