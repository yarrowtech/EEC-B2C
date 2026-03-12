// src/pages/AboutUs.jsx
// Dynamic About Us with refreshed UI inspired by provided reference.

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Handshake, Target, Lock, Zap } from "lucide-react";

export default function AboutUs() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    async function loadAbout() {
      try {
        setLoading(true);

        // Check cache first
        const CACHE_KEY = 'eec:about-us:cache';
        const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData);
            if (parsed && typeof parsed.ts === 'number' && Date.now() - parsed.ts < CACHE_TTL) {
              // Use cached data
              setSections(parsed.data.sections || []);
              setLoading(false);
              return;
            }
          } catch (e) {
            // Invalid cache, continue to fetch
          }
        }

        // Fetch from API
        const res = await fetch(`${API_BASE}/api/about-us`);
        const data = await res.json();

        // Cache the data
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          ts: Date.now(),
          data: data
        }));

        // Add a small delay for smooth transition
        await new Promise(resolve => setTimeout(resolve, 500));
        setSections(data.sections || []);
      } catch (err) {
        console.error("Failed to load About Us:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAbout();
  }, [API_BASE]);

  const hero = sections.find((s) => s.type === "hero");
  const vision = sections.find((s) => s.type === "vision");
  const brand = sections.find((s) => s.type === "brand");
  const values = sections.find((s) => s.type === "values");
  const mission = sections.find((s) => s.type === "mission");

  const heroTitle = hero?.title || "Our Aim: To Provide the Best Solutions";
  const heroSubtitle =
    hero?.subtitle || "High-quality education — all through a digital media platform.";

  const visionDesc =
    vision?.description ||
    "Our vision is to reach out to every student across different states and districts, solving the educational challenges they face. We aim to meet their learning requirements, especially for those unable to access proper education due to lack of guidance or attention in schools. EEC bridges the gap between parents, students, and educators — ensuring collaborative, value-based growth and holistic development.";

  const visionBullets = vision?.bullets?.length
    ? vision.bullets
    : [
        "Personalized progression & holistic growth",
        "Teacher enablement & workload relief",
        "Parent visibility & engagement",
      ];

  const brandDesc =
    brand?.description ||
    "EEC is a digital learning platform designed to deliver high-quality education to all learners. We help students adapt to modern learning methods while empowering them to develop skills, confidence, and curiosity for their bright futures.";

  const brandChips = brand?.chips?.length
    ? brand.chips
    : ["Consistent Visual System", "Trust & Accessibility", "Mobile-first"];

  const valuesDesc =
    values?.description ||
    "EEC doesn’t just upgrade academic performance — it builds stronger bonds between parents, children, and teachers. The platform helps teachers manage workloads efficiently, giving them more time to focus on each learner’s unique needs and helping them truly understand and support every student.";

  const valuesChips = values?.chips?.length
    ? values.chips
    : ["Outcome-oriented", "Inclusive by design", "Privacy-minded", "Low-friction UX"];

  const valuesPillars = values?.pillars?.length
    ? values.pillars
    : [
        {
          title: "Stronger Bonds",
          description:
            "Fostering deeper connections between parents and children through shared learning experiences.",
        },
        {
          title: "Efficient Workload",
          description:
            "Streamlining management for teachers so every moment can be spent on what truly matters — mentoring learners.",
        },
        {
          title: "Inclusive Design",
          description:
            "Ensuring a warm, adaptive platform that welcomes every learner, regardless of background or ability.",
        },
      ];

  const missionDesc1 =
    mission?.description ||
    "Our mission is to ensure every learner receives the best educational assistance possible — building strong foundations in learning, retention, and reflection.";

  const missionDesc2 =
    mission?.subtitle ||
    "We go beyond traditional education. EEC strives to be a transformative solution provider, supporting institutions with real-time insights, AI-driven feedback, and simplified digital-age learning systems.";

  const missionChips = mission?.chips?.length
    ? mission.chips
    : ["Real-time Insights", "AI Feedback Loops", "Teacher Tools"];

  const visionImg = vision?.image || "/goal1.jpg";
  const brandImg = brand?.image || "/brandvalue.jpg";
  const missionImg = mission?.image || "/image-1.jpg";
  const heroBgImage = hero?.image || "/about-hero.jpg";

  const valuesIcons = [Target, Handshake, Lock, Zap];

  // Loading component
  if (loading) {
    return (
      <>
        <style>
          {`
            .heart-loader {
              width: 60px;
              aspect-ratio: 1;
              background: linear-gradient(#dc1818 0 0) bottom/100% 0% no-repeat #f5e6c8;
              -webkit-mask:
                radial-gradient(circle at 60% 65%, #000 62%, #0000 65%) top left,
                radial-gradient(circle at 40% 65%, #000 62%, #0000 65%) top right,
                linear-gradient(to bottom left, #000 42%, #0000 43%) bottom left,
                linear-gradient(to bottom right, #000 42%, #0000 43%) bottom right;
              -webkit-mask-size: 50% 50%;
              -webkit-mask-repeat: no-repeat;
              mask:
                radial-gradient(circle at 60% 65%, #000 62%, #0000 65%) top left,
                radial-gradient(circle at 40% 65%, #000 62%, #0000 65%) top right,
                linear-gradient(to bottom left, #000 42%, #0000 43%) bottom left,
                linear-gradient(to bottom right, #000 42%, #0000 43%) bottom right;
              mask-size: 50% 50%;
              mask-repeat: no-repeat;
              animation: heart-fill 2s infinite linear;
            }
            @keyframes heart-fill {
              90%, 100% { background-size: 100% 100%; }
            }
          `}
        </style>
        <div className="min-h-screen bg-[#fffdf7] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="heart-loader" />
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg font-semibold text-[#14233b]"
            >
              Loading About Us...
            </motion.p>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-[#fffdf7] text-[#14233b] selection:bg-[#ffe68a]/60"
    >
      {/* Hero */}
      <section className="bg-gradient-to-b from-[#fffdf2] to-[#fff5dc] px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="relative grid overflow-hidden rounded-[32px] bg-[#122844] text-white shadow-[0_25px_60px_rgba(13,28,52,0.45)] md:grid-cols-2">
            <div className="relative z-10 px-8 py-12 sm:px-12 sm:py-16">
              <span className="inline-flex items-center rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em]">
                Our Aim
              </span>
              <h1
                className="mt-6 text-4xl font-bold leading-tight md:text-5xl"
                style={{ fontFamily: "'Balsamiq Sans', cursive" }}
              >
                {heroTitle}
              </h1>
              <p className="mt-4 text-lg text-white/90 md:text-xl">{heroSubtitle}</p>
              <p className="mt-4 text-sm text-white/70">
                Empowering learners with high-quality education and innovative tools for a brighter future.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <button className="rounded-full bg-[#ffd861] px-6 py-3 text-sm font-semibold text-[#1c2430] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#ffe07d]">
                  Explore More
                </button>
                <button className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                  Watch Video
                </button>
              </div>
            </div>
            <div className="relative min-h-[260px]">
              <div className="absolute inset-0 bg-gradient-to-tl from-black/20 to-transparent" />
              <img src={heroBgImage} alt="About EEC" className="h-full w-full object-cover" />
              <div className="pointer-events-none absolute -right-16 top-12 hidden h-44 w-44 rounded-full bg-white/10 blur-3xl md:block" />
            </div>
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="bg-white px-4 py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2 md:gap-16">
          <div className="space-y-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.4em] text-[#f4a259]">Vision Goals</span>
              <h2
                className="mt-3 text-3xl font-bold text-[#0f1f32]"
                style={{ fontFamily: "'Balsamiq Sans', cursive" }}
              >
                Building bridges for every learner
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#4c5b73]">{visionDesc}</p>
            </div>
            <div className="space-y-4">
              {visionBullets.map((item, index) => {
                const badgeStyles = [
                  { ring: "ring-[#ffd861]", bg: "bg-[#fff8e1]" },
                  { ring: "ring-[#4ecdc4]", bg: "bg-[#e9fbf8]" },
                  { ring: "ring-[#ff9fb2]", bg: "bg-[#ffeef2]" },
                ];
                const colors = badgeStyles[index % badgeStyles.length];
                return (
                  <div
                    key={item}
                    className={`flex items-center gap-4 rounded-2xl ${colors.bg} px-5 py-4 ring-1 ${colors.ring} shadow-[0_12px_30px_rgba(31,38,60,0.08)]`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-semibold text-[#0f1f32]">
                      {index + 1}
                    </div>
                    <p className="text-base font-semibold text-[#21324a]">{item}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="relative">
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-b from-[#2c4f59] to-[#1b373f] p-10 text-white shadow-[0_35px_50px_rgba(17,34,45,0.35)]">
              <p className="text-xs uppercase tracking-[0.5em] text-white/70">Learning Vision</p>
              <h3 className="mt-4 text-2xl font-bold">
                Tailored experiences that connect parents, teachers, and young explorers.
              </h3>
              <p className="mt-4 text-sm text-white/80">
                Success is measured through clarity, transparency, and the confidence we build together.
              </p>
              <div className="mt-6 inline-flex items-center gap-3 rounded-full bg-white/10 px-5 py-2 text-sm font-semibold">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#4ecdc4]" />
                {missionChips[0] || "Real-time Insights"}
              </div>
              <img src={visionImg} alt="Learning Vision" className="mt-8 h-56 w-full rounded-[24px] object-cover" />
            </div>
            <div className="absolute -bottom-6 -right-6 hidden rounded-3xl bg-white/80 px-4 py-3 text-sm font-semibold text-[#1d2735] shadow-lg md:flex">
              95% engagement focus
            </div>
          </div>
        </div>
      </section>

      {/* Brand / Modern learning */}
      <section className="bg-[#fff8ee] px-4 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2 md:gap-16">
          <div className="relative">
            <div className="rounded-[32px] bg-gradient-to-br from-[#fdd3bc] to-[#fbb68c] p-5 shadow-[0_30px_60px_rgba(249,177,131,0.35)]">
              <div className="rounded-[26px] bg-white/80 p-5 backdrop-blur">
                <img
                  src={brandImg}
                  alt="Modern Approach"
                  className="h-full max-h-[420px] w-full rounded-[22px] object-cover"
                />
              </div>
            </div>
            <div className="absolute -bottom-8 left-1/2 w-max -translate-x-1/2 rounded-full bg-white/90 px-6 py-3 text-xs font-semibold uppercase tracking-[0.4em] text-[#f38b37] shadow-lg">
              Brand Identity
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.4em] text-[#f38b37]">Brand Identity</span>
            <h2
              className="mt-4 text-3xl font-bold text-[#0f1f32]"
              style={{ fontFamily: "'Balsamiq Sans', cursive" }}
            >
              Modern-era learning that feels friendly
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#4c5b73]">{brandDesc}</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {brandChips.map((chip) => (
                <div
                  key={chip}
                  className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#28374d] shadow-sm"
                >
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#ffd861]" />
                  {chip}
                </div>
              ))}
            </div>
            <button className="mt-10 rounded-full border border-[#0f1f32] px-6 py-3 text-sm font-semibold text-[#0f1f32] shadow-sm transition hover:bg-[#0f1f32] hover:text-white">
              Learn our story
            </button>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-white px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.4em] text-[#6c7da4]">What We Value</span>
          <h2
            className="mt-4 text-3xl font-bold text-[#0f1f32]"
            style={{ fontFamily: "'Balsamiq Sans', cursive" }}
          >
            Culture built on kindness, trust, and impact
          </h2>
          <p className="mt-4 text-base text-[#4c5b73]">{valuesDesc}</p>
        </div>
        <div className="mx-auto mt-12 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {valuesPillars.map((pillar, idx) => {
            const Icon = valuesIcons[idx] || Target;
            return (
              <div
                key={pillar.title}
                className="rounded-[28px] border border-[#eef0f5] bg-[#fefbf5] p-6 text-center shadow-[0_18px_40px_rgba(15,31,50,0.07)]"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#f4a259] shadow">
                  <Icon size={24} />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-[#15253c]">{pillar.title}</h3>
                <p className="mt-2 text-sm text-[#4c5b73]">{pillar.description}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-12 flex flex-wrap justify-center gap-3">
          {valuesChips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-[#e3e7f1] bg-[#f8faff] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#79809a]"
            >
              {chip}
            </span>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="bg-gradient-to-b from-[#ffe1b5] via-[#ffc58a] to-[#ffab7b] px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl rounded-[36px] bg-white/90 p-8 shadow-[0_30px_60px_rgba(255,137,92,0.35)] md:p-12">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.4em] text-[#ff8b5c]">Mission</span>
              <h2
                className="mt-4 text-3xl font-bold text-[#0f1f32]"
                style={{ fontFamily: "'Balsamiq Sans', cursive" }}
              >
                The Mission of EEC
              </h2>
              <p className="mt-4 text-base text-[#4c5b73]">{missionDesc1}</p>
              <p className="mt-3 text-sm text-[#51607a]">{missionDesc2}</p>
              <ul className="mt-6 space-y-4">
                {missionChips.map((chip) => (
                  <li key={chip} className="flex items-center gap-3 text-sm font-semibold text-[#233143]">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#ffe9d0] text-[#f28c4c]">
                      •
                    </span>
                    {chip}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative flex items-center justify-center">
              <div className="relative h-72 w-72 rounded-full bg-gradient-to-br from-[#21323f] via-[#1b2f39] to-[#17242f] shadow-[0_35px_60px_rgba(23,36,47,0.6)]">
                <div className="absolute inset-6 rounded-full border-2 border-white/10" />
                <div className="absolute inset-12 rounded-full border border-white/5" />
                <img
                  src={missionImg}
                  alt="Mission"
                  className="absolute inset-8 h-[calc(100%-4rem)] w-[calc(100%-4rem)] rounded-full object-cover"
                />
                <div className="absolute -bottom-4 right-6 rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-[#17242f] shadow">
                  Future
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
