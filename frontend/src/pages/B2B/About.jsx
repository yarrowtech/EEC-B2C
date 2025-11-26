import React from "react";
import { motion } from "framer-motion";
// import { Helmet } from "react-helmet";

const HERO_IMAGE = "/about-hero.jpg";

const fade = (d = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut", delay: d },
});

export default function About() {
  return (
    <div className="min-h-screen w-full">

      {/* ===== SEO USING REACT HELMET ===== */}
      {/* <Helmet>
        <title>About EEC – Electronic Educare | Our Story, Vision & Mission</title>
        <meta
          name="description"
          content="Learn about Electronic Educare (EEC) – our story, our mission to transform education, and our vision to empower schools with AI-powered, holistic learning technology."
        />
        <meta name="keywords" content="About EEC, Electronic Educare, School LMS, School ERP, AI Learning, Vision Mission" />
        <meta property="og:title" content="About EEC – Electronic Educare" />
        <meta
          property="og:description"
          content="Discover the story, mission, and vision behind EEC, the AI-powered school ecosystem designed to empower schools, teachers, parents, and students."
        />
        <meta property="og:type" content="website" />
      </Helmet> */}

      {/* ===== HERO ===== */}
      <section className="relative h-[56vh] md:h-[30vh]">
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{
            backgroundImage: `url(${HERO_IMAGE})`,
            backgroundAttachment: "fixed",
          }}
        />
        <div className="absolute inset-0 bg-slate-900/5" />

        <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center justify-center px-6">
          <motion.div {...fade(0)}>
            <h1
              className="text-3xl md:text-6xl font-extrabold tracking-tight text-white antialiased text-center md:text-center"
              style={{ textShadow: "0 2px 10px rgba(0,0,0,0.35)" }}
            >
              About <span className="text-amber-400">EEC</span>
            </h1>
          </motion.div>
        </div>

        <div className="pointer-events-none absolute -bottom-1 left-0 right-0 h-10 bg-gradient-to-b from-transparent to-white" />
      </section>

      {/* ===== MAIN CONTENT ===== */}
      <main className="mx-auto max-w-7xl px-6 pb-16 md:pb-24 pt-10 md:pt-14">
        <motion.section {...fade(0.1)} className="space-y-10">

          {/* ⭐ OUR STORY (Upgraded UI) */}
          <div
            className="
              group relative overflow-hidden rounded-3xl
              border border-amber-200/70 bg-white/90 backdrop-blur-xl
              p-8 shadow-[0_8px_26px_rgba(0,0,0,0.06)]
              transition-all duration-300
              hover:shadow-[0_14px_36px_rgba(0,0,0,0.10)]
              hover:-translate-y-1
            "
          >
            {/* Glow */}
            <div
              className="
                pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100
                transition duration-500
                bg-[radial-gradient(circle_at_60%_-10%,rgba(251,191,36,0.22),transparent_60%)]
              "
            />

            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Our Story
            </h2>

            <p className="mt-4 text-slate-700 leading-relaxed">
              <span className="font-extrabold text-amber-500">Electronic Educare (EEC),{" "} </span>
              we believe education goes beyond textbooks and exams. Schools today need a partner that not only supports academic excellence but also nurtures emotional well-being and builds stronger connections between students, teachers, and parents.
            </p>
            <p className="mt-4 text-slate-700 leading-relaxed">
              EEC is more than an LMS — it’s a complete AI-powered school ecosystem. From classrooms to staff rooms, from parents to principals, EEC unites every stakeholder on one secure, paperless, and intelligent platform.
            </p>
            <p className="mt-4 text-slate-700 leading-relaxed">
              Guided by our unique 4R Philosophy — Reflect, Revise, Retrieve, Repeat — EEC ensures learning is continuous, adaptive, and meaningful. With features like personalized AI learning, smart administration, advanced LMS, and well-being monitoring, we help schools create confident learners, empowered teachers, and satisfied parents.
            </p>
          </div>

          {/* ⭐ OUR VISION (Upgraded UI) */}
          <div
            className="
              group relative overflow-hidden rounded-3xl
              border border-amber-200/70 bg-white/90 backdrop-blur-xl
              p-8 shadow-[0_8px_26px_rgba(0,0,0,0.06)]
              transition-all duration-300
              hover:shadow-[0_14px_36px_rgba(0,0,0,0.12)]
              hover:-translate-y-1
            "
          >
            {/* Glow */}
            <div
              className="
                pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100
                transition duration-500
                bg-[radial-gradient(circle_at_80%_0%,rgba(251,191,36,0.28),transparent_60%)]
              "
            />

            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Our Vision
            </h2>

            <p className="mt-4 text-slate-700 leading-relaxed">
              At EEC, we envision a future where education transcends boundaries — a world where every learner, every teacher, and every institution is empowered with technology that makes learning smarter, seamless, and truly transformative. Our vision is to be the catalyst of change in the education ecosystem, uniting schools and students through a platform that fosters knowledge, creativity, well-being, and growth. We aim to shape a generation of learners who are not only academically excellent but also confident, emotionally strong, and future-ready.
            </p>
          </div>

          {/* ⭐ OUR MISSION (Upgraded UI) */}
          <div
            className="
              group relative overflow-hidden rounded-3xl
              border border-amber-200/70 bg-white/90 backdrop-blur-xl
              p-8 shadow-[0_8px_26px_rgba(0,0,0,0.06)]
              transition-all duration-300
              hover:shadow-[0_14px_36px_rgba(0,0,0,0.12)]
              hover:-translate-y-1
            "
          >
            {/* Glow */}
            <div
              className="
                pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100
                transition duration-500
                bg-[radial-gradient(circle_at_10%_0%,rgba(251,191,36,0.20),transparent_60%)]
              "
            />

            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Our Mission
            </h2>

            <p className="mt-4 text-slate-700 leading-relaxed">
              Our mission is to redefine learning and institutional growth by building an intelligent, inclusive, and integrated education ecosystem. We are committed to:
            </p>

            <ul className="mt-5 space-y-3 pl-6 text-slate-700">
              {[
                "Empowering Institutions: Delivering powerful LMS & ERP solutions that simplify operations, enhance teaching, and optimize academic outcomes.",
                "Empowering Institutions: Delivering powerful LMS & ERP solutions that simplify operations, enhance teaching, and optimize academic outcomes.",
                "Seamless Collaboration: Bridging the gap between schools, teachers, parents, and students with transparent communication and real-time tracking.",
                "Holistic Education: Encouraging not just knowledge acquisition but also critical thinking, creativity, mental wellness, and life skills.",
                "Scalable & Inclusive Innovation: Offering solutions that are affordable, flexible, and impactful, ensuring quality education for learners across all backgrounds.",
                "Future-Driven Excellence: Preparing institutions and learners to thrive in a rapidly changing digital-first world, where education is not just taught but truly experienced.",
              ].map((item, idx) => (
                <li
                  key={idx}
                  className="
                    relative pl-5
                    before:absolute before:left-0 before:top-2 before:h-2 before:w-2
                    before:rounded-full before:bg-amber-500
                  "
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

        </motion.section>
      </main>
    </div>
  );
}
