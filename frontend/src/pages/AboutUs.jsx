// src/pages/AboutUs.jsx
// Dynamic About Us – content from DB, layout unchanged.

import { useEffect, useState } from "react";
import { Handshake, Target, Lock, Zap } from "lucide-react";

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
    <div className="overflow-hidden bg-[#f6f6f8] text-[#1f3557] selection:bg-[#ffe68a]/60">
      <section
        className="relative flex min-h-[58vh] items-center justify-center overflow-hidden bg-cover bg-center px-4 py-20"
        style={{ backgroundImage: `url('${heroBgImage}')` }}
      >
        <div className="absolute inset-0 bg-[#091a38]/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#091a38]/25 to-[#091a38]/75" />
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white/95">
            About EEC
          </div>
          <h1
            className="mt-6 text-4xl font-bold leading-tight text-white md:text-6xl"
            style={{ fontFamily: "'Balsamiq Sans', cursive" }}
          >
            {heroTitle}
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-lg text-white/90 md:text-2xl">
            {heroSubtitle}
          </p>
        </div>
      </section>

      <section className="relative py-20 sm:py-24">
        <div className="absolute left-0 right-0 top-0 h-14 bg-[#fff3cc]" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
          <article className="grid items-center gap-8 rounded-[2rem] border border-[#dbe1eb] bg-[#fffefa] p-6 shadow-[0_16px_30px_rgba(31,53,87,0.08)] md:grid-cols-2 md:p-10">
            <div>
              <h2
                className="text-3xl font-bold text-[#102a4f]"
                style={{ fontFamily: "'Balsamiq Sans', cursive" }}
              >
                Vision Goals
              </h2>
              <div className="mt-3 h-1 w-24 rounded-full bg-[#f6c945]" />
              <p className="mt-5 text-lg leading-relaxed text-[#425f84]">{visionDesc}</p>
              <ul className="mt-6 space-y-3">
                {visionBullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-3 text-base text-[#365274]">
                    <span className="mt-2 inline-block h-2.5 w-2.5 rounded-full bg-[#4ecdc4]" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[1.75rem] border border-[#e8edf4] bg-white p-3 shadow-md">
              <img
                src={visionImg}
                alt="Vision Goals"
                className="h-full max-h-[420px] w-full rounded-[1.25rem] object-cover"
              />
            </div>
          </article>

          <article className="grid items-center gap-8 rounded-[2rem] border border-[#dbe1eb] bg-[#fffefa] p-6 shadow-[0_16px_30px_rgba(31,53,87,0.08)] md:grid-cols-2 md:p-10">
            <div className="order-2 md:order-1">
              <div className="rounded-[1.75rem] border border-[#e8edf4] bg-white p-3 shadow-md">
                <img
                  src={brandImg}
                  alt="Brand Identity"
                  className="h-full max-h-[420px] w-full rounded-[1.25rem] object-cover"
                />
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h2
                className="text-3xl font-bold text-[#102a4f]"
                style={{ fontFamily: "'Balsamiq Sans', cursive" }}
              >
                Brand Identity
              </h2>
              <div className="mt-3 h-1 w-24 rounded-full bg-[#ff6b6b]" />
              <p className="mt-5 text-lg leading-relaxed text-[#425f84]">{brandDesc}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {brandChips.map((chip, i) => (
                  <span
                    key={i}
                    className="rounded-2xl border border-[#e1e7ef] bg-[#f9fbfe] px-4 py-2 text-sm font-semibold text-[#365274]"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </article>

          <article className="grid items-center gap-8 rounded-[2rem] border border-[#dbe1eb] bg-[#fffefa] p-6 shadow-[0_16px_30px_rgba(31,53,87,0.08)] md:grid-cols-2 md:p-10">
            <div>
              <h2
                className="text-3xl font-bold text-[#102a4f]"
                style={{ fontFamily: "'Balsamiq Sans', cursive" }}
              >
                Values
              </h2>
              <div className="mt-3 h-1 w-24 rounded-full bg-[#4ecdc4]" />
              <p className="mt-5 text-lg leading-relaxed text-[#425f84]">{valuesDesc}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {valuesChips.slice(0, 4).map((text, idx) => {
                  const Icon = valuesIcons[idx] || Target;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3 rounded-2xl border border-[#e1e7ef] bg-[#f9fbfe] px-4 py-3"
                    >
                      <Icon className="h-4 w-4 text-[#1f3557]" />
                      <span className="text-sm font-semibold text-[#365274]">{text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="rounded-[1.75rem] border border-[#e8edf4] bg-white p-3 shadow-md">
              <img
                src={valuesImg}
                alt="Values"
                className="h-full max-h-[420px] w-full rounded-[1.25rem] object-cover"
              />
            </div>
          </article>

          <article className="grid items-center gap-8 rounded-[2rem] border border-[#dbe1eb] bg-[#fffefa] p-6 shadow-[0_16px_30px_rgba(31,53,87,0.08)] md:grid-cols-2 md:p-10">
            <div className="order-2 md:order-1">
              <div className="rounded-[1.75rem] border border-[#e8edf4] bg-white p-3 shadow-md">
                <img
                  src={missionImg}
                  alt="Mission of EEC"
                  className="h-full max-h-[420px] w-full rounded-[1.25rem] object-cover"
                />
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h2
                className="text-3xl font-bold text-[#102a4f]"
                style={{ fontFamily: "'Balsamiq Sans', cursive" }}
              >
                Mission of EEC
              </h2>
              <div className="mt-3 h-1 w-24 rounded-full bg-[#6c63ff]" />
              <p className="mt-5 text-lg leading-relaxed text-[#425f84]">{missionDesc1}</p>
              <p className="mt-4 text-lg leading-relaxed text-[#425f84]">{missionDesc2}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {missionChips.map((chip, i) => (
                  <span
                    key={i}
                    className="rounded-2xl border border-[#e1e7ef] bg-[#f9fbfe] px-4 py-2 text-sm font-semibold text-[#365274]"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
