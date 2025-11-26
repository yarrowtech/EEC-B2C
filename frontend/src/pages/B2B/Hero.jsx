// Hero.jsx
import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Typewriter } from "react-simple-typewriter";
// import hero1 from "/hero.jpg";
import hero1 from "/Home.jpg";
// import hero2 from "/hero2.jpeg";
import hero2 from "/LMS System.jpg";
// import hero3 from "/hero3.jpeg";
import hero3 from "/ERP.jpg";

const IMAGES = [
  // "https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=1200&auto=format&fit=crop",
  hero1,
  // "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=1200&auto=format&fit=crop",
  hero2,
  // "https://images.unsplash.com/photo-1552581234-26160f608093?q=80&w=1200&auto=format&fit=crop",
  hero3,
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};
const up = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};
const fade = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.6, ease: "easeOut" } } };

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Amber auras */}
      <div className="pointer-events-none absolute -top-28 -left-24 h-72 w-72 rounded-full bg-gradient-to-tr from-yellow-200 via-yellow-300 to-yellow-200 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-24 h-72 w-72 rounded-full bg-gradient-to-tr from-yellow-200 via-yellow-300 to-yellow-200 blur-3xl" />

      {/* CHANGED: animate on mount instead of whileInView */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={container}
        className="relative mx-auto max-w-7xl px-6 pt-16 pb-8 sm:pt-10"
      >
        <div className="grid items-center gap-10 md:grid-cols-2">
          {/* Copy */}
          <div className="text-center md:text-left">
            <motion.span
              variants={up}
              className="inline-block rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-medium tracking-wide text-amber-800"
            >
              Trusted by partners
            </motion.span>

            <motion.h1 variants={up} className="mt-4 text-4xl font-extrabold leading-tight text-slate-900 md:text-5xl">
              EEC — Educate. Empower. Connect
            </motion.h1>

            <motion.p variants={up} className="mt-2 text-3xl font-medium text-amber-700">
              <Typewriter
                words={["AI-Powered Insights", "Seamless School Management", "Smart Learning Solutions", "Future-Ready Education"]}
                loop
                cursor
                cursorStyle="|"
                typeSpeed={100}
                deleteSpeed={40}
                delaySpeed={2000}
              />
            </motion.p>

            <motion.p variants={up} className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">
              Where learning is not memorized, but truly lived — adaptive modules, holistic growth, and smart school solutions
            </motion.p>

            <motion.div variants={up} className="mt-6 flex flex-col items-center gap-3 sm:flex-row md:justify-start">
              {/* <Link
                to="/enquiry"
                // className="inline-flex items-center justify-center rounded bg-gradient-to-tr from-yellow-300 via-yellow-400 to-yellow-600 text-slate-900 px-5 py-3 font-semibold shadow-lg transition hover:bg-amber-500"
                className="inline-flex items-center justify-center rounded bg-amber-400 text-slate-900 px-5 py-3 font-semibold shadow-lg transition hover:bg-amber-500"
              >
                Get a Demo
              </Link> */}
              <Link
                target="_blank"
                to="https://docs.google.com/forms/d/e/1FAIpQLSfazcYIEEoStrgJnXDHat2UJItsOU-MFicqIRw9LfrLLwEczg/viewform?usp=header"
                // className="inline-flex items-center justify-center rounded border border-amber-600/30 bg-white/70 px-5 py-3 font-semibold text-slate-900 backdrop-blur transition hover:bg-white hover:border-amber-600/60"
                className="inline-flex items-center justify-center rounded bg-amber-400 text-slate-900 px-5 py-3 font-semibold shadow-lg transition hover:bg-amber-500"
              >
                Get a Demo →
              </Link>
            </motion.div>
          </div>

          {/* Collage */}
          <motion.div variants={fade} className="relative mx-auto grid max-w-xl grid-cols-3 gap-3 md:max-w-none">
            {/* CHANGED: use animate on mount for tiles */}
            <motion.div
              initial={{ opacity: 0, y: 30, rotate: -2 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="col-span-1 row-span-2 rounded-2xl border border-amber-200 bg-white/70 p-2 backdrop-blur shadow hidden md:block"
            >
              <img src={IMAGES[0]} alt="Platform overview" className="h-full w-full rounded-xl object-cover" loading="lazy" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30, rotate: 1.5 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ duration: 0.6, delay: 0.08, ease: "easeOut" }}
              className="col-span-3 md:col-span-2 rounded-2xl border border-amber-200 bg-white/70 p-2 backdrop-blur shadow"
            >
              <img src={IMAGES[1]} alt="Analytics dashboard" className="h-48 w-full rounded-xl object-cover md:h-60" loading="lazy" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30, rotate: -1 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ duration: 0.6, delay: 0.16, ease: "easeOut" }}
              className="col-span-3 md:col-span-2 rounded-2xl border border-amber-200 bg-white/70 p-2 backdrop-blur shadow"
            >
              <img src={IMAGES[2]} alt="Mobile experience" className="h-40 w-full rounded-xl object-cover md:h-52" loading="lazy" />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
