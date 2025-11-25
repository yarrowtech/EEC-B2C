import { useEffect, useState, useMemo } from "react";
import {
  BookOpen, Pencil, Headphones, GraduationCap,
  ArrowUpCircle, Trophy, Brain, Volume2, Users,
} from "lucide-react";

/* ---------- ICON MAP BASED ON DB VALUE ---------- */
const ICON_MAP = {
  book: <BookOpen className="h-6 w-6" />,
  pen: <Pencil className="h-6 w-6" />,
  headphones: <Headphones className="h-6 w-6" />,
  graduation: <GraduationCap className="h-6 w-6" />,
  target: <ArrowUpCircle className="h-6 w-6" />,
  trophy: <Trophy className="h-6 w-6" />,
  brain: <Brain className="h-6 w-6" />,
  speaker: <Volume2 className="h-6 w-6" />,
  dashboard: <Users className="h-6 w-6" />,
};

/* ---------- Card Component (unchanged UI) ---------- */
const Card = ({ f }) => (
  <article className="relative overflow-hidden rounded-3xl border border-blue-100/70 bg-white/80 p-5 backdrop-blur-md shadow-[0_10px_30px_rgba(2,32,71,0.08)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl">
    <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br from-yellow-200/60 to-sky-200/60 blur-2xl" />

    <div className="mb-3 inline-flex items-center justify-center rounded-2xl border border-yellow-200/80 bg-yellow-100/80 p-3 text-blue-900 shadow-sm">
      {ICON_MAP[f.icon] || ICON_MAP["book"]}
    </div>

    <h3 className="text-lg font-semibold text-blue-950">{f.title}</h3>
    <p className="mt-2 text-sm leading-relaxed text-blue-900/80">{f.description}</p>
  </article>
);

export default function EECFeaturesSection() {
  const [data, setData] = useState(null);
  const [paused, setPaused] = useState(false);

  // moved hooks ABOVE the conditional return
  const reduceMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  }, []);

  const features = data?.features || [];
  const doubled = useMemo(() => [...features, ...features], [features]);

  useEffect(() => {
    async function loadSection() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/features`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to load features:", err);
      }
    }
    loadSection();
  }, []);

  // ❗ This conditional return is fine NOW because no hooks appear after it
  if (!data || !data.visible) return null;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-sky-50 via-white to-blue-50 py-16">
      {/* Decorative Blobs */}
      <div className="pointer-events-none absolute -left-24 top-0 h-56 w-56 rounded-full bg-amber-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4">
        {/* Heading (Now From DB) */}
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <span className="inline-block rounded-full border border-blue-200 bg-white/60 px-3 py-1 text-[11px] font-semibold text-blue-900/80 backdrop-blur">
            Feature Highlights
          </span>

          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-blue-950 md:text-4xl">
            {data.title?.split("(")[0]}{" "}
            <span className="bg-gradient-to-r from-yellow-500 to-amber-500 bg-clip-text text-transparent">
              ({data.title?.split("(")[1] || ""})
            </span>
          </h2>

          <p className="mt-3 text-blue-900/80">{data.subtitle}</p>
        </div>

        {/* ===== Mobile: marquee scrolling ===== */}
        <div className="relative md:hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent" />

          <div
            className="overflow-hidden no-scrollbar"
            onTouchStart={() => setPaused(true)}
            onTouchEnd={() => setPaused(false)}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div
              className={`flex w-max gap-4 pr-4 ${
                reduceMotion ? "" : "animate-[eec-marquee_26s_linear_infinite]"
              }`}
              style={paused ? { animationPlayState: "paused" } : undefined}
            >
              {doubled.map((f, i) => (
                <div key={i} className="w-[280px] sm:w-[300px]">
                  <Card f={f} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== Desktop Grid (unchanged) ===== */}
        <div className="hidden sm:grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Card f={f} key={i} />
          ))}
        </div>
      </div>

      {/* Local marquee animation */}
      <style>{`
        @keyframes eec-marquee {
          0% { transform: translateX(0) }
          100% { transform: translateX(-50%) }
        }
      `}</style>
    </section>
  );
}
