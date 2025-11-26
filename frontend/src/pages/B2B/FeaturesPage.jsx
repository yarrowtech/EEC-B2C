// FeaturesPage.jsx
import React from "react";
import { motion } from "framer-motion";
// import { Helmet } from "react-helmet";


// ===== Image path (put Features.jpg into /public as features-hero.jpg) =====
const HERO_IMAGE = "/Features.jpg";

// Animate on mount
const fade = (d = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: "easeOut", delay: d },
});

// --- Your existing features (kept as-is) ---
const DEFAULT_FEATURES = [
  {
    title: "AI – Powered Personalization",
    desc:
      "Learning paths are tailored using AI, ensuring every child gets content, quizzes, and support that match their pace and strengths.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7">
        <path d="M8 10h8M8 14h5M4 9a8 8 0 1116 0v6a8 8 0 11-16 0V9z"
          fill="none" stroke="currentColor" strokeWidth="1.6"
          strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    accent: "text-blue-600",
    dot: "bg-blue-500",
  },
  {
    title: "Emotional Well-being Integration",
    desc:
      "Built-in tools for mindfulness, stress tracking, and counseling support help nurture happier and more balanced students.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7">
        <path d="M12 3v18M5 8l7-5 7 5M5 16l7 5 7-5"
          fill="none" stroke="currentColor" strokeWidth="1.6"
          strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    accent: "text-violet-600",
    dot: "bg-violet-500",
  },
  {
    title: "Adapts to Each Child’s Learning Style",
    desc:
      "Whether visual, auditory, or hands-on learners—EEC adjusts lessons and assessments to fit how each child learns best.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7">
        <rect x="6" y="2" width="12" height="20" rx="2" ry="2"
          stroke="currentColor" strokeWidth="1.6" fill="none" />
        <circle cx="12" cy="18" r="1" fill="currentColor" />
      </svg>
    ),
    accent: "text-slate-700",
    dot: "bg-slate-600",
  },
  {
    title: "One App for Everything",
    desc:
      "All academic, administrative, and communication needs in a single secure platform—no need for multiple apps.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7">
        <path d="M4 19V5m0 9 4-4 4 4 6-6m-2 0h2v2"
          fill="none" stroke="currentColor" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    accent: "text-green-600",
    dot: "bg-green-500",
  },
  {
    title: "Bridge Between School & Home",
    desc:
      "Parents stay updated in real time on progress, assignments, and emotional health, creating a transparent school–home connection.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7">
        <path d="M4 19V5m0 9 4-4 4 4 6-6m-2 0h2v2"
          fill="none" stroke="currentColor" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    accent: "text-green-600",
    dot: "bg-green-500",
  },
  {
    title: "Reduces Dependence on Private Tutors",
    desc:
      "Personalized guidance and built-in doubt-solving reduce the need for extra tuition, saving both time and money.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7">
        <path d="M4 19V5m0 9 4-4 4 4 6-6m-2 0h2v2"
          fill="none" stroke="currentColor" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    accent: "text-green-600",
    dot: "bg-green-500",
  },
  {
    title: "Paperless & Eco-Friendly",
    desc:
      "Digital assignments, reports, and communication minimize paper use—making learning sustainable and environmentally responsible.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7">
        <path d="M4 19V5m0 9 4-4 4 4 6-6m-2 0h2v2"
          fill="none" stroke="currentColor" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    accent: "text-green-600",
    dot: "bg-green-500",
  },
];

export default function FeaturesPage({ items = DEFAULT_FEATURES }) {
  return (
    <div className="min-h-screen w-full">
      {/* <Helmet>
        <title>Features Page – Electronic Educare | Explore our features</title>
        <meta name="description" content="Educare provides academic resources for educators worldwide." />
        <meta property="og:title" content="Features Page – Electronic Educare | Explore our features" />
        <meta property="og:description" content="Educare provides academic resources for educators worldwide." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/logo_new.png" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet> */}
      {/* ===== PARALLAX HERO ===== */}
      <section className="relative h-[54vh] md:h-[30vh]">
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{
            backgroundImage: `url(${HERO_IMAGE})`,
            backgroundAttachment: "fixed", // native parallax
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#120f08]/30 via-[#0b0a09]/10 to-transparent" />
        <div className="relative z-10 mx-auto flex h-full w-full items-center justify-center px-6">
          <motion.div {...fade(0)} className="w-full">
            <h1
              className="mt-3 text-3xl md:text-6xl font-extrabold tracking-tight text-white antialiased text-center w-full"
              style={{ textShadow: "0 2px 10px rgba(0,0,0,0.35)" }}
            >
              Features of <span className="text-amber-400">EEC</span>
            </h1>
          </motion.div>

        </div>
        <div className="pointer-events-none absolute -bottom-1 left-0 right-0 h-10 bg-gradient-to-b from-transparent to-white" />
      </section>

      {/* ===== FEATURE “CAPSULES” (non-card design) ===== */}
      <section className="mx-auto max-w-7xl px-6 py-10 md:py-14">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
          {items.map((f, i) => {
            const isLastOdd =
              items.length % 3 === 1 && i === items.length - 1; // last card of incomplete row

            return (
              <div
                key={i}
                className={isLastOdd ? "flex justify-center lg:col-span-3" : ""}
              >
                {/* your card */}
                <motion.article
                  {...fade(0.06 * (i + 1))}
                  className="
  relative group isolate overflow-hidden rounded-3xl
  bg-white/70 backdrop-blur-xl
  shadow-[0_8px_30px_rgba(0,0,0,0.08)]
  ring-1 ring-amber-300/40
  hover:ring-amber-400/80
  hover:shadow-[0_18px_44px_rgba(0,0,0,0.12)]
  transition-all duration-300
  hover:-translate-y-1 hover:scale-[1.02]
"

                >
                  {/* Amber ribbon at left (EEC theme) */}
                  <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600" />

                  {/* Soft aurora glow on hover */}
                  <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity
                              [background:radial-gradient(380px_120px_at_20%_0%,rgba(251,191,36,0.18),transparent_60%)]" />

                  {/* Floating “coin” icon */}
                  <div
                    className="
    absolute -top-3 -left-3 h-16 w-16 rounded-3xl
    bg-gradient-to-br from-amber-400 to-amber-600
    text-white shadow-xl shadow-amber-500/40
    grid place-items-center ring-2 ring-amber-200/60
    group-hover:scale-105 transition-all duration-300
  "
                  >

                    <div className="w-7 h-7 opacity-95 ml-2">{f.icon}</div>
                  </div>

                  {/* Content */}
                  <div className="relative z-10 p-7 pt-12 md:pt-8 lg:pt-8 pl-10 sm:pl-12 md:pl-20 lg:pl-20">
                    <h3 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 
  group-hover:text-amber-700 transition-colors duration-300">
                      {f.title}
                    </h3>
                    <p className="mt-3 text-sm md:text-[15px] leading-relaxed text-slate-700 
  group-hover:text-slate-900 transition-colors duration-300">
                      {f.desc}
                    </p>

                    {/* Bottom shadow puck => “floating capsule” */}
                    {/* <div className="mt-6 h-6 rounded-2xl bg-gradient-to-b from-transparent to-black/5 blur-[6px] opacity-70" /> */}
                  </div>

                  {/* Decorative amber dots (unique look, not a card) */}
                  <div className="absolute right-3 top-3 h-2 w-2 rounded-full bg-amber-400/80" />
                  <div className="absolute right-6 top-7 h-1.5 w-1.5 rounded-full bg-amber-500/80" />
                  <div className="absolute right-9 top-11 h-1.5 w-1.5 rounded-full bg-amber-600/70" />
                  <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 
  transition duration-500 
  bg-[radial-gradient(circle_at_50%_120%,rgba(251,191,36,0.08),transparent_60%)]" />

                </motion.article>
              </div>
            );
          })}
        </div>

      </section>

      {/* ===== CTA ===== */}
      {/* <section className="mx-auto max-w-7xl px-6 pb-14">
        <motion.div
          {...fade(0.1)}
          className="rounded-2xl border border-amber-300/70 bg-white/85 p-6 md:p-8 shadow-md backdrop-blur"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h4 className="text-xl md:text-2xl font-bold text-slate-900">
                Want a tailored feature set for your institute?
              </h4>
              <p className="text-slate-700">
                We’ll map EEC modules to your exact workflows and roll out fast.
              </p>
            </div>
            <a
              href="mailto:eec@electroniceducare.com"
              className="inline-flex items-center justify-center rounded-xl bg-amber-600 px-5 py-3 text-white font-semibold shadow-lg shadow-amber-500/25 hover:bg-amber-700 transition"
            >
              Get a Demo
            </a>
          </div>
        </motion.div>
      </section> */}
    </div>
  );
}
