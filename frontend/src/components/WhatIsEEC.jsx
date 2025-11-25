// src/components/WhatIsEEC.jsx
import { useEffect, useState } from "react";
import { Sparkles, CheckCircle2, Timer, Shield, Gamepad2, Import } from "lucide-react";

// Icon mapping based on DB values
const ICON_MAP = {
  check: <CheckCircle2 className="h-5 w-5" />,
  timer: <Timer className="h-5 w-5" />,
  gamepad: <Gamepad2 className="h-5 w-5" />,
  shield: <Shield className="h-5 w-5" />,
  sparkles: <Sparkles className="h-5 w-5" />
};

const WhatIsEEC = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/why-eec`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to load Why EEC:", err);
      }
    }
    loadData();
  }, []);

  // If admin hides the section → don't show it
  if (!data || !data.visible) return null;

  return (
    <section id="what-is-eec" className="relative overflow-hidden bg-white py-14 md:py-18">
      {/* Soft background accents */}
      <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-yellow-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl" />

      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-3 py-1 text-[11px] font-semibold text-blue-900/80 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            Overview
          </span>

          <h2 className="mt-3 text-3xl font-extrabold leading-tight text-blue-950 md:text-4xl">
            {data.title?.split(" ").map((w, i) =>
              i === data.title.split(" ").length - 1 ? (
                <span key={i} className="bg-gradient-to-r from-yellow-500 to-amber-500 bg-clip-text text-transparent">
                  {w}
                </span>
              ) : (
                " " + w + " "
              )
            )}
          </h2>

          <p className="mx-auto mt-4 max-w-3xl text-lg leading-relaxed text-blue-900/80">
            {data.description}
          </p>
        </div>

        {/* Quick benefits row */}
        <div className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.features?.map((b) => (
            <div
              key={b.id}
              className="group relative overflow-hidden rounded-2xl border border-blue-100/70 bg-white/80 p-4 shadow-[0_8px_24px_rgba(2,32,71,0.08)] backdrop-blur-md transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-gradient-to-br from-amber-200/60 to-sky-200/60 blur-xl" />
              <div className="mb-2 inline-flex items-center gap-2 rounded-xl border border-yellow-200/80 bg-yellow-100/80 px-2.5 py-1 text-blue-900">
                {ICON_MAP[b.icon] || ICON_MAP["check"]}
                <span className="text-sm font-semibold">{b.title}</span>
              </div>
              <p className="text-sm text-blue-900/80">{b.subtitle}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhatIsEEC;
