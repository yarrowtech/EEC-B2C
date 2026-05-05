// src/components/HomePurposeSection.jsx
// BBC Bitesize-style: "what can I study" — subject cards + grade levels + boards
import { motion } from "framer-motion";

const SUBJECTS = [
  { name: "Mathematics",          icon: "calculate",        color: "#4ECDC4", bg: "rgba(78,205,196,0.12)"  },
  { name: "Science",              icon: "science",          color: "#6C63FF", bg: "rgba(108,99,255,0.12)" },
  { name: "English",              icon: "menu_book",        color: "#F4736E", bg: "rgba(244,115,110,0.12)"},
  { name: "Social Studies",       icon: "public",           color: "#FF9F1C", bg: "rgba(255,159,28,0.12)"  },
  { name: "Hindi",                icon: "translate",        color: "#F4736E", bg: "rgba(244,115,110,0.10)"},
  { name: "Geography",            icon: "travel_explore",   color: "#4ECDC4", bg: "rgba(78,205,196,0.10)"  },
  { name: "EVS",                  icon: "eco",              color: "#22c55e", bg: "rgba(34,197,94,0.10)"   },
  { name: "Computer Science",     icon: "computer",         color: "#6C63FF", bg: "rgba(108,99,255,0.10)" },
];

const GRADES = [
  { label: "Primary",   range: "Grades 3 – 5",  color: "#F4736E", icon: "child_care"  },
  { label: "Middle",    range: "Grades 6 – 8",  color: "#4ECDC4", icon: "school"      },
  { label: "Secondary", range: "Grades 9 – 10", color: "#6C63FF", icon: "workspace_premium" },
];

const BOARDS = ["CBSE", "ICSE", "IB", "State Boards"];

export default function HomePurposeSection() {
  return (
    <section className="py-16 md:py-24 bg-[#FEF4E8] overflow-hidden relative">
      <div className="pointer-events-none absolute top-0 right-0 w-96 h-96 rounded-full bg-[#FFD23F]/20 blur-3xl -translate-y-1/2" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-72 h-72 rounded-full bg-[#4ECDC4]/15 blur-3xl translate-y-1/2" />

      <div className="mx-auto max-w-7xl px-4 md:px-8 relative">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[#F4736E]/30 bg-white px-4 py-1.5 text-sm font-bold text-[#F4736E] mb-4 shadow-sm">
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1,'wght' 700,'GRAD' 0,'opsz' 24" }}>explore</span>
            What Can You Study?
          </div>
          <h2
            className="text-3xl md:text-5xl font-black text-[#1B1F3B] leading-tight mb-4"
            style={{ fontFamily: "'Balsamiq Sans', cursive" }}
          >
            Every Subject.{" "}
            <span className="text-[#F4736E]">Every Grade.</span>{" "}
            One Platform.
          </h2>
          <p className="text-base md:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            From Class 3 to Class 10 — practice, revise, and get better at every subject your board covers. Aligned to the latest syllabus, always.
          </p>
        </motion.div>

        {/* ── Subject cards (BBC Bitesize style) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mb-12">
          {SUBJECTS.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className="group flex flex-col items-center gap-3 rounded-2xl md:rounded-3xl border-2 border-white bg-white p-5 md:p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default"
              style={{ borderColor: s.color + "30" }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: s.bg }}
              >
                <span
                  className="material-symbols-outlined text-3xl"
                  style={{ color: s.color, fontVariationSettings: "'FILL' 1,'wght' 600,'GRAD' 0,'opsz' 40" }}
                >
                  {s.icon}
                </span>
              </div>
              <span className="text-sm md:text-base font-black text-[#1B1F3B] text-center leading-tight" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
                {s.name}
              </span>
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ color: s.color, background: s.bg }}
              >
                All Grades
              </span>
            </motion.div>
          ))}
        </div>

        {/* ── Grade level strip ── */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10"
        >
          {GRADES.map((g) => (
            <div
              key={g.label}
              className="flex items-center gap-4 rounded-2xl bg-white border-2 px-5 py-4 shadow-sm"
              style={{ borderColor: g.color + "40" }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: g.color + "18" }}
              >
                <span
                  className="material-symbols-outlined text-2xl"
                  style={{ color: g.color, fontVariationSettings: "'FILL' 1,'wght' 600,'GRAD' 0,'opsz' 24" }}
                >
                  {g.icon}
                </span>
              </div>
              <div>
                <p className="font-black text-[#1B1F3B] text-base" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>{g.label}</p>
                <p className="text-sm font-semibold" style={{ color: g.color }}>{g.range}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* ── Boards + CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <span className="text-sm font-bold text-slate-500 tracking-wide">Boards covered:</span>
          {BOARDS.map((b, i) => {
            const colors = ["#F4736E", "#4ECDC4", "#6C63FF", "#FF9F1C"];
            return (
              <span
                key={b}
                className="rounded-full px-4 py-1.5 text-sm font-black"
                style={{ border: `2px solid ${colors[i]}`, color: colors[i], background: colors[i] + "12" }}
              >
                {b}
              </span>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
