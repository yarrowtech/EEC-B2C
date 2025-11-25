// src/components/EECUnique.jsx
// Revamped: ultra-modern asymmetric layout, sticky overview rail, glassy cards,
// conic-gradient borders, subtle motion (prefers-reduced-motion aware).

import { useEffect, useMemo } from "react";
import {
  Brain,
  Headphones,
  Sparkles,
  ShieldCheck,
  Gauge,
  Target,
  UserCheck,
  Users,
} from "lucide-react";

const blocks = [
  {
    tag: "Smart Learning",
    icon: Sparkles,
    lead:
      "Right practice, right time — adaptive loops with instant audio+text clarifications.",
    points: [
      [Brain, "AI-adaptive pathways"],
      [Headphones, "Instant audio & text help"],
      [Target, "Skill progression logic"],
      [Gauge, "No video dependency"],
      [ShieldCheck, "Safe, distraction-free UX"],
    ],
    accent: "from-yellow-200 via-white to-sky-100",
  },
  {
    tag: "For Students",
    icon: UserCheck,
    lead:
      "Small wins → big confidence. Evolving sets, clear feedback, steady focus.",
    points: [
      [Gauge, "Learn faster with feedback"],
      [Headphones, "Understand with audio help"],
      [Target, "Easy → Arduous challenges"],
      [Brain, "Boost focus & reasoning"],
      [Sparkles, "Track self-progress"],
    ],
    accent: "from-sky-200 via-white to-indigo-100",
  },
  {
    tag: "For Parents",
    icon: Users,
    lead:
      "Clarity without micromanaging — calm analytics and exam readiness.",
    points: [
      [Gauge, "Subject-wise growth reports"],
      [Target, "Strengths & weak-zone insights"],
      [ShieldCheck, "Stress-free exam prep"],
      [Brain, "Clutter-free, safe platform"],
      [Sparkles, "Start free, upgrade later"],
    ],
    accent: "from-indigo-100 via-white to-emerald-100",
  },
];

function Ring({ className = "" }) {
  return (
    <span
      aria-hidden
      className={
        "pointer-events-none absolute inset-0 rounded-[28px] p-[1px] [background:conic-gradient(var(--tw-gradient-stops))] from-yellow-400 via-blue-400 to-indigo-500 opacity-60 " +
        className
      }
      style={{
        mask:
          "linear-gradient(#000,#000) content-box,linear-gradient(#000,#000)",
        WebkitMask:
          "linear-gradient(#000,#000) content-box,linear-gradient(#000,#000)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
      }}
    />
  );
}

function Card({ tag, icon: Icon, lead, points, accent }) {
  return (
    <article className="relative isolate rounded-[28px] border border-blue-100/70 bg-white/70 px-5 py-6 shadow-[0_18px_60px_rgba(2,32,71,0.10)] backdrop-blur-md ring-1 ring-white/60 transition-transform duration-300 hover:-translate-y-[3px]">
      <Ring />

      {/* header */}
      <div className="mb-3 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-yellow-100 to-blue-50 text-blue-900 shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-extrabold tracking-tight text-blue-950">
          {tag}
        </h3>
      </div>

      {/* lead */}
      <p className="mb-4 text-[15px] leading-relaxed text-blue-900/85">
        {lead}
      </p>

      {/* list */}
      <ul className="grid gap-2">
        {points.map(([Ico, text], idx) => (
          <li
            key={idx}
            className="flex items-center gap-2 text-[15px] text-blue-900/90"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 ring-1 ring-blue-100">
              <Ico className="h-4 w-4" />
            </span>
            <span className="leading-tight">{text}</span>
          </li>
        ))}
      </ul>

      {/* top accent gradient */}
      <div
        className={`pointer-events-none absolute inset-x-0 -top-px h-[3px] rounded-t-[28px] bg-gradient-to-r ${accent}`}
      />

      {/* soft glow */}
      <div
        className="pointer-events-none absolute -inset-8 -z-10 rounded-[40px] opacity-0 blur-2xl transition-opacity duration-300 hover:opacity-100"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 0%, rgba(234,179,8,0.22) 0%, rgba(59,130,246,0.18) 45%, transparent 80%)",
        }}
      />
    </article>
  );
}

export default function EECUnique() {
  const reduceMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches,
    []
  );

  useEffect(() => {
    // lightweight entrance animation using CSS only
    document?.querySelectorAll?.("[data-anim='rise']").forEach((el, i) => {
      el?.classList?.add("opacity-0", "translate-y-3");
      // force reflow
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      el?.offsetHeight;
      const delay = reduceMotion ? 0 : i * 60;
      el?.style?.setProperty(
        "transition",
        `opacity 320ms cubic-bezier(.2,.8,.2,1) ${delay}ms, transform 320ms cubic-bezier(.2,.8,.2,1) ${delay}ms`
      );
      requestAnimationFrame(() => {
        el?.classList?.remove("opacity-0", "translate-y-3");
      });
    });
  }, [reduceMotion]);

  return (
    <section className="relative overflow-hidden bg-[radial-gradient(1200px_600px_at_90%_-10%,rgba(59,130,246,0.08),transparent_60%),radial-gradient(900px_500px_at_10%_110%,rgba(234,179,8,0.10),transparent_60%)] py-16">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 md:grid-cols-12">
        {/* Sticky left rail */}
        <div className="md:col-span-4 lg:col-span-3">
          <div className="sticky top-24 space-y-3">
            <h2 className="text-3xl font-black tracking-tight text-blue-950 md:text-4xl">
              What Makes <span className="text-yellow-500">EEC</span> Unique
            </h2>
            <p className="text-blue-900/80">
              Designed for clarity, built for outcomes — a focused learning loop
              for students and peace of mind for parents.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <a
                href="#try"
                className="rounded-2xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-800 active:scale-[0.99]"
              >
                Start Free
              </a>
              <a
                href="#what-is-eec"
                className="rounded-2xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-50"
              >
                Learn how it works
              </a>
            </div>
          </div>
        </div>

        {/* Right content: asymmetric modern grid */}
        <div className="md:col-span-8 lg:col-span-9 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Tall hero card */}
          <div data-anim="rise" className="sm:col-span-2 lg:row-span-2">
            <Card {...blocks[0]} />
          </div>

          {/* Two balanced cards */}
          <div data-anim="rise">
            <Card {...blocks[1]} />
          </div>
          <div data-anim="rise">
            <Card {...blocks[2]} />
          </div>

          {/* Accent stripe (optional) */}
          {/*
          <div
            data-anim="rise"
            className="sm:col-span-2 rounded-3xl border border-blue-100/60 bg-gradient-to-r from-yellow-50 via-white to-sky-50 p-5 text-sm text-blue-900/80 shadow-[0_12px_40px_rgba(2,32,71,0.06)]"
          >
            Built with a tight study loop → practice → feedback → insight. Minimal clicks, maximum focus.
          </div>
          */}
        </div>
      </div>

      {/* bottom curve echo */}
      <div className="pointer-events-none mt-14 h-16">
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="h-full w-full"
        >
          <path
            fill="currentColor"
            className="text-white"
            d="M0,64L48,58.7C96,53,192,43,288,48C384,53,480,75,576,80C672,85,768,75,864,58.7C960,43,1056,21,1152,21.3C1248,21,1344,43,1392,53.3L1440,64V120H0Z"
          />
        </svg>
      </div>
    </section>
  );
}
