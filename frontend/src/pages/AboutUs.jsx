// src/pages/AboutUs.jsx
// Dynamic About Us – content from DB, layout unchanged.

import { useEffect, useState } from "react";
import { Handshake, Target, Lock, Zap } from "lucide-react";
import EECFooter from "../components/EECFooter";

export default function AboutUs() {
  const [sections, setSections] = useState([]);

  const API_BASE = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    async function loadAbout() {
      try {
        const res = await fetch(`${API_BASE}/api/about-us`);
        const data = await res.json();
        setSections(data.sections || []);
      } catch (err) {
        console.error("Failed to load About Us:", err);
      }
    }
    loadAbout();
  }, [API_BASE]);

  const hero = sections.find((s) => s.type === "hero");
  const vision = sections.find((s) => s.type === "vision");
  const brand = sections.find((s) => s.type === "brand");
  const values = sections.find((s) => s.type === "values");
  const mission = sections.find((s) => s.type === "mission");

  const heroTitle =
    hero?.title || "Our Aim: To Provide the Best Solutions";
  const heroSubtitle =
    hero?.subtitle || "High-quality education — all through a digital media platform.";

  const visionDesc =
    vision?.description ||
    "Our vision is to reach out to every student across different states and districts, solving the educational challenges they face. We aim to meet their learning requirements, especially for those unable to access proper education due to lack of guidance or attention in schools. EEC bridges the gap between parents, students, and educators — ensuring collaborative, value-based growth and holistic development.";

  const visionBullets =
    vision?.bullets?.length
      ? vision.bullets
      : [
          "Personalized progression & holistic growth",
          "Teacher enablement & workload relief",
          "Parent visibility & engagement",
        ];

  const brandDesc =
    brand?.description ||
    "EEC is a digital learning platform designed to deliver high-quality education to all learners. We help students adapt to modern learning methods while empowering them to develop skills, confidence, and curiosity for their bright futures.";

  const brandChips =
    brand?.chips?.length
      ? brand.chips
      : ["Consistent Visual System", "Trust & Accessibility", "Mobile-first"];

  const valuesDesc =
    values?.description ||
    "EEC doesn’t just upgrade academic performance — it builds stronger bonds between parents, children, and teachers. The platform helps teachers manage workloads efficiently, giving them more time to focus on each learner’s unique needs and helping them truly understand and support every student.";

  const valuesChips =
    values?.chips?.length
      ? values.chips
      : ["Outcome-oriented", "Inclusive by design", "Privacy-minded", "Low-friction UX"];

  const missionDesc1 =
    mission?.description ||
    "Our mission is to ensure every learner receives the best educational assistance possible — building strong foundations in learning, retention, and reflection.";

  const missionDesc2 =
    mission?.subtitle ||
    "We go beyond traditional education. EEC strives to be a transformative solution provider, supporting institutions with real-time insights, AI-driven feedback, and simplified digital-age learning systems.";

  const missionChips =
    mission?.chips?.length
      ? mission.chips
      : ["Real-time Insights", "AI Feedback Loops", "Teacher Tools"];

  const visionImg = vision?.image || "/goal1.jpg";
  const brandImg = brand?.image || "/brandvalue.jpg";
  const valuesImg = values?.image || "/login1.jpg";
  const missionImg = mission?.image || "/image-1.jpg";
  const heroBgImage = hero?.image || "/about-hero.jpg";

  const valuesIcons = [Target, Handshake, Lock, Zap];

  return (
    <div className="overflow-hidden bg-white text-blue-950 selection:bg-yellow-200/60">
      {/* =========================
          HERO (Parallax + Glass)
      ========================== */}
      <section
        className="relative flex h-[68vh] items-center justify-center bg-cover bg-center bg-fixed text-white"
        style={{ backgroundImage: `url('${heroBgImage}')` }}
      >
        {/* layered gradients for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-black/50" />
        <div className="absolute inset-0 mix-blend-overlay bg-gradient-to-tr from-sky-500/10 via-fuchsia-400/10 to-amber-400/10" />

        {/* floating orbs */}
        <div className="pointer-events-none absolute -left-24 top-24 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-16 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl" />

        {/* glass headline card */}
        <div className="relative z-10 mx-6 w-full max-w-4xl">
          <div className="rounded-3xl border border-white/15 bg-white/10 p-8 backdrop-blur-xl shadow-[0_20px_80px_-10px_rgba(0,0,0,0.45)]">
            <h1 className="text-center text-3xl font-extrabold tracking-tight drop-shadow md:text-5xl">
              {heroTitle}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-center text-blue-50/90 md:text-xl">
              {heroSubtitle}
            </p>

            {/* mini highlights (kept static for now) */}
            <div className="mt-6 grid grid-cols-2 gap-3 text-center text-sm text-blue-50/90 md:grid-cols-4">
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 backdrop-blur">
                Student-first
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 backdrop-blur">
                AI-assisted
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 backdrop-blur">
                Insight-driven
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 backdrop-blur">
                Scalable
              </span>
            </div>
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

      {/* =========================
          VISION (Text + Image)
      ========================== */}
      <section className="relative bg-gradient-to-b from-white via-sky-50/60 to-white py-20">
        <div className="absolute -top-10 right-10 h-40 w-40 rounded-full bg-sky-300/20 blur-2xl" />
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mx-auto mb-12 w-fit rounded-full bg-gradient-to-r from-sky-100 to-amber-100 px-5 py-2 text-center text-sm font-semibold text-blue-900 shadow-sm">
            OUR VISION
          </h2>

          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <h3 className="text-2xl font-semibold">Vision Goals</h3>
              <div className="mb-5 mt-2 h-[3px] w-24 bg-yellow-400" />
              <p className="leading-relaxed text-blue-900/90">
                {visionDesc}
              </p>

              {/* tiny bullets */}
              <ul className="mt-6 space-y-2 text-blue-900/90">
                {visionBullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1 inline-block h-2 w-2 rounded-full bg-sky-500" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            <div className="group relative">
              <img
                src={visionImg}
                alt="Vision Goals"
                className="relative z-10 w-full scale-[1.01] rounded-3xl border border-blue-100/60 shadow-xl transition-transform duration-300 ease-out group-hover:scale-[1.015]"
              />
              <div className="absolute inset-0 -z-0 translate-x-3 translate-y-3 rounded-3xl bg-gradient-to-br from-sky-200/40 to-amber-200/40 blur-lg" />
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          BRAND IDENTITY
      ========================== */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl grid items-center gap-10 px-6 md:grid-cols-2">
          <div className="group relative order-last md:order-first">
            <img
              src={brandImg}
              alt="Brand Identity"
              className="relative z-10 w-full rounded-3xl border border-blue-100/60 shadow-xl transition duration-300 ease-out group-hover:scale-[1.01]"
            />
            <div className="absolute inset-0 -z-0 translate-x-3 translate-y-3 rounded-3xl bg-gradient-to-br from-fuchsia-200/40 to-sky-200/40 blur-lg" />
          </div>

          <div>
            <h3 className="text-2xl font-semibold">Brand Identity</h3>
            <div className="mb-4 mt-2 h-[3px] w-24 bg-yellow-400" />
            <p className="leading-relaxed text-blue-900/90">
              {brandDesc}
            </p>

            {/* stat chips */}
            <div className="mt-6 flex flex-wrap gap-3">
              {brandChips.map((chip, i) => (
                <span
                  key={i}
                  className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm shadow-sm"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          VALUES
      ========================== */}
      <section className="bg-gradient-to-b from-white via-sky-50/60 to-white py-20">
        <div className="mx-auto max-w-6xl grid items-center gap-10 px-6 md:grid-cols-2">
          <div>
            <h3 className="text-2xl font-semibold">Values</h3>
            <div className="mb-4 mt-2 h-[3px] w-24 bg-yellow-400" />
            <p className="leading-relaxed text-blue-900/90">
              {valuesDesc}
            </p>

            {/* value points */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {valuesChips.slice(0, 4).map((text, idx) => {
                const Icon = valuesIcons[idx] || Target;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm flex items-center gap-2"
                  >
                    <Icon className="inline-block" />
                    <span>{text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="group relative">
            <img
              src={valuesImg}
              alt="Values"
              className="relative z-10 w-full rounded-3xl border border-blue-100/60 shadow-xl transition duration-300 ease-out group-hover:scale-[1.01]"
            />
            <div className="absolute inset-0 -z-0 translate-x-3 translate-y-3 rounded-3xl bg-gradient-to-br from-amber-200/40 to-fuchsia-200/40 blur-lg" />
          </div>
        </div>
      </section>

      {/* =========================
          MISSION
      ========================== */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl grid items-center gap-10 px-6 md:grid-cols-2">
          <div className="group relative">
            <img
              src={missionImg}
              alt="Mission of EEC"
              className="relative z-10 w-full rounded-3xl border border-blue-100/60 shadow-xl transition duration-300 ease-out group-hover:scale-[1.01]"
            />
            <div className="absolute inset-0 -z-0 translate-x-3 translate-y-3 rounded-3xl bg-gradient-to-br from-sky-200/40 to-amber-200/40 blur-lg" />
          </div>

          <div>
            <h3 className="text-2xl font-semibold">Mission of EEC</h3>
            <div className="mb-4 mt-2 h-[3px] w-24 bg-yellow-400" />
            <p className="mb-3 leading-relaxed text-blue-900/90">
              {missionDesc1}
            </p>
            <p className="leading-relaxed text-blue-900/90">
              {missionDesc2}
            </p>

            {/* mission chips */}
            <div className="mt-6 flex flex-wrap gap-3">
              {missionChips.map((chip, i) => (
                <span
                  key={i}
                  className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm shadow-sm"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer is handled globally */}
      {/* <EECFooter /> */}
    </div>
  );
}
