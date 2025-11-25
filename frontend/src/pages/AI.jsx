import { Bot, ChartArea, Target } from "lucide-react";
import React from "react";

export default function AI() {
  return (
    <div className="bg-white text-blue-950 selection:bg-yellow-200/60 overflow-x-hidden">
      {/* ===== Hero (Parallax, no text as in your HTML) ===== */}
      <section className="relative flex h-[65vh] w-full max-w-[100vw] overflow-hidden items-center justify-center bg-[url('/ai.jpg')] bg-cover bg-center bg-fixed">
        {/* subtle depth layers */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/25 to-black/40" />
        <div className="absolute inset-0 mix-blend-overlay bg-gradient-to-tr from-sky-500/10 via-fuchsia-400/10 to-amber-400/10" />
        {/* if you want to show title later, place it here */}
        <svg
          className="pointer-events-none absolute -bottom-[1px] left-0 w-full"
          viewBox="0 0 1440 120"
          aria-hidden
        >
          <path
            fill="#ffffff"
            d="M0,64L48,69.3C96,75,192,85,288,85.3C384,85,480,75,576,80C672,85,768,107,864,117.3C960,128,1056,128,1152,117.3C1248,107,1344,85,1392,74.7L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
          />
        </svg>
      </section>

      {/* ===== Overview ===== */}
      <section className="bg-gradient-to-b from-white via-sky-50/60 to-white py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 md:grid-cols-2">
          <div className="group relative">
            <img
              src="/ai1.jpg"
              alt="AI Learning"
              className="relative z-10 w-full rounded-3xl border border-blue-100/60 shadow-xl transition-transform duration-300 ease-out group-hover:scale-[1.01]"
            />
            <div className="absolute inset-0 -z-0 translate-x-3 translate-y-3 rounded-3xl bg-gradient-to-br from-sky-200/40 to-amber-200/40 blur-lg" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">AI-Driven Personalized Learning</h2>
            <div className="mb-4 mt-2 h-[3px] w-24 bg-yellow-400" />
            <p className="leading-relaxed text-blue-900/90">
              EEC’s AI Engine analyzes student behavior and preferences, delivering
              personalized learning paths that evolve continuously to provide the most
              relevant support.
            </p>
          </div>
        </div>
      </section>

      {/* ===== Benefits ===== */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-semibold">Key Benefits of EEC’s AI Engine</h2>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {[
              {
                icon: <Bot />,
                title: "Intelligent Algorithms",
                text:
                  "Real-time personalized learning experiences powered by smart algorithms.",
              },
              {
                icon: <Target />,
                title: "Personalized Paths",
                text:
                  "Tailored content adapts to student behavior and learning patterns.",
              },
              {
                icon: <ChartArea />,
                title: "Continuous Adaptation",
                text:
                  "AI evolves with students to keep education aligned with their progress.",
              },
            ].map((b) => (
              <div
                key={b.title}
                className="group rounded-2xl border border-blue-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="text-3xl">{b.icon}</div>
                <h4 className="mt-3 text-lg font-semibold">{b.title}</h4>
                <p className="mt-2 text-blue-900/90">{b.text}</p>
                <div className="mt-4 h-[2px] w-0 bg-blue-600 transition-all duration-300 group-hover:w-16" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Tailored Education ===== */}
      <section className="bg-gradient-to-b from-white via-sky-50/60 to-white py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 md:grid-cols-2">
          <div className="order-last md:order-last group relative">
            <img
              src="/ai3.jpg"
              alt="Tailored Education"
              className="relative z-10 w-full rounded-3xl border border-blue-100/60 shadow-xl transition duration-300 ease-out group-hover:scale-[1.01]"
            />
            <div className="absolute inset-0 -z-0 translate-x-3 translate-y-3 rounded-3xl bg-gradient-to-br from-amber-200/40 to-fuchsia-200/40 blur-lg" />
          </div>

          <div>
            <h2 className="text-2xl font-semibold">Tailored Education for Every Student</h2>
            <div className="mb-4 mt-2 h-[3px] w-24 bg-yellow-400" />
            <p className="leading-relaxed text-blue-900/90">
              With EEC, harness the power of AI to enhance student engagement and drive
              academic success through learning tailored to each individual’s needs.
            </p>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      {/* <section className="py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-extrabold">
            Ready to Transform Learning with AI?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-blue-900/90">
            Unlock the power of personalized, AI-driven education with EEC’s intelligent
            engine.
          </p>
        </div>
      </section> */}
    </div>
  );
}
