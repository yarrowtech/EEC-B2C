// src/pages/Analytics.jsx
import { Lightbulb, ChartArea, Settings } from "lucide-react";
import React, { useEffect, useState } from "react";

export default function Analytics() {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    // preserve your current behavior (popup not auto-opened)
    // setShowPopup(true);
  }, []);

  return (
    <div className="bg-white text-blue-950 selection:bg-yellow-200/60">
      {/* ===== Popup Form (unchanged behavior, restyled) ===== */}
      {showPopup && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-blue-950/40 backdrop-blur-sm p-4"
        >
          <div className="relative w-full max-w-md rounded-2xl border border-white/20 bg-white/95 p-6 shadow-[0_24px_80px_rgba(2,32,71,0.35)]">
            <button
              aria-label="Close"
              onClick={() => setShowPopup(false)}
              className="absolute right-3 top-3 rounded-full px-2 text-lg leading-none text-blue-900/70 hover:bg-blue-50"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold text-blue-950">Get Started with EEC</h2>

            <form
              className="mt-4 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setShowPopup(false);
              }}
            >
              <div>
                <label htmlFor="name" className="mb-1 block text-sm font-medium">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  placeholder="Your Name"
                  className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 outline-none ring-blue-300 focus:ring"
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="Your Email"
                  className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 outline-none ring-blue-300 focus:ring"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===== Hero (Parallax + Glass card + accents) ===== */}
      <section
        className="relative flex h-[60vh] w-full max-w-[100vw] overflow-hidden items-center justify-center bg-[url('/analytics.jpg')] bg-cover bg-center bg-fixed text-white"
      >
        {/* layered gradients for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/55" />
        <div className="absolute inset-0 mix-blend-overlay bg-gradient-to-tr from-sky-500/10 via-fuchsia-400/10 to-amber-400/10" />

        {/* floating light orbs */}
        <div className="pointer-events-none absolute left-0 top-24 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="pointer-events-none absolute right-0 bottom-16 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl" />

        {/* glass headline card */}
        <div className="relative z-10 mx-6 w-full max-w-4xl">
          <div className="rounded-3xl border border-white/15 bg-white/10 p-8 backdrop-blur-xl shadow-[0_20px_80px_-10px_rgba(0,0,0,0.45)]">
            <h1 className="text-center text-3xl font-extrabold tracking-tight drop-shadow md:text-5xl">
              Unlock Precise Analytics Technology
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-center text-blue-50/90 md:text-lg">
              Real-time insights that power smarter, faster decisions.
            </p>

            {/* mini chips */}
            <div className="mt-6 grid grid-cols-2 gap-3 text-center text-xs text-blue-50/90 md:grid-cols-4">
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 backdrop-blur">
                Performance
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 backdrop-blur">
                Predictions
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 backdrop-blur">
                Reporting
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 backdrop-blur">
                Scale
              </span>
            </div>

            {/* <div className="mt-6 text-center">
              <button
                onClick={() => setShowPopup(true)}
                className="inline-flex items-center rounded-xl bg-white/90 px-4 py-2 text-sm font-semibold text-blue-900 shadow hover:bg-white"
              >
                Get Started
              </button>
            </div> */}
          </div>
        </div>

        {/* wave divider */}
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

      {/* ===== Analytics Overview (elevated image + copy) ===== */}
      <section className="py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 md:grid-cols-2">
          <div className="group relative">
            <img
              src="/image-1.jpg"
              alt="Data-Driven Insights"
              className="relative z-10 w-full rounded-3xl border border-blue-100/60 shadow-xl transition-transform duration-300 ease-out group-hover:scale-[1.01]"
            />
            <div className="absolute inset-0 -z-0 translate-x-3 translate-y-3 rounded-3xl bg-gradient-to-br from-sky-200/40 to-amber-200/40 blur-lg" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Transforming Learning with Data-Driven Insights</h2>
            <div className="mb-4 mt-2 h-[3px] w-24 bg-yellow-400" />
            <p className="leading-relaxed text-blue-900/90">
              EEC&apos;s analytics technology enhances the learning experience by giving
              educators real-time, actionable insights. Adjust strategies and deliver
              better results through informed teaching.
            </p>
          </div>
        </div>
      </section>

      {/* ===== Key Features (micro-interactions) ===== */}
      <section className="bg-gradient-to-b from-white via-sky-50/60 to-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-semibold">Key Features of EEC&apos;s Analytics Technology</h2>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {[
              { icon: <ChartArea />, title: "Performance Insights", text: "Track student progress and identify strengths and areas for improvement." },
              { icon: <Settings />, title: "Customizable Reports", text: "Generate detailed insights to help educators make informed decisions." },
              { icon: <Lightbulb />, title: "Predictive Analytics", text: "Forecast student outcomes and tailor teaching strategies for success." },
            ].map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-blue-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="text-3xl">{f.icon}</div>
                <h3 className="mt-3 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-blue-900/90">{f.text}</p>
                <div className="mt-4 h-[2px] w-0 bg-blue-600 transition-all duration-300 group-hover:w-16" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Benefits (mirrored layout) ===== */}
      <section className="py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 md:grid-cols-2">
          <div className="order-last md:order-last group relative">
            <img
              src="/empowering.jpg"
              alt="Empowering Students"
              className="relative z-10 w-full rounded-3xl border border-blue-100/60 shadow-xl transition duration-300 ease-out group-hover:scale-[1.01]"
            />
            <div className="absolute inset-0 -z-0 translate-x-3 translate-y-3 rounded-3xl bg-gradient-to-br from-amber-200/40 to-fuchsia-200/40 blur-lg" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Empowering Students and Educators</h2>
            <div className="mb-4 mt-2 h-[3px] w-24 bg-yellow-400" />
            <p className="leading-relaxed text-blue-900/90">
              EEC analyzes learning behaviors to deliver personalized, measurable
              success. Teachers get tailored insights, and students receive the support
              they need.
            </p>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      {/* <section className="bg-gradient-to-b from-white via-sky-50/60 to-white py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-extrabold">Ready to Experience the Future of Education?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-blue-900/90">
            Unlock your potential with EEC’s cutting-edge analytics technology.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowPopup(true)}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow hover:bg-blue-700"
            >
              Start Now
            </button>
          </div>
        </div>
      </section> */}
    </div>
  );
}
