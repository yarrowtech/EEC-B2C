// src/components/HomeFeaturesSection.jsx
// Quizlet-style: "how you study" — large study mode cards + teacher section
import { motion } from "framer-motion";

const MODES = [
  {
    icon: "quiz",
    title: "Practice Tests",
    tag: "Most Popular",
    tagColor: "#F4736E",
    color: "#F4736E",
    gradient: "from-[#F4736E] to-[#ff9a8b]",
    lightBg: "rgba(244,115,110,0.06)",
    border: "rgba(244,115,110,0.2)",
    desc: "Take subject-wise mock tests across 3 difficulty levels — Basic, Intermediate, and Advanced — aligned to your board and grade.",
    bullets: [
      "8+ question types (MCQ, essay, match, cloze…)",
      "Instant result with detailed score breakdown",
      "Weak topic identification after every test",
    ],
    visual: (
      <div className="flex flex-col gap-2">
        {["Basic Level", "Intermediate", "Advanced"].map((l, i) => (
          <div key={l} className="flex items-center gap-2">
            <div className="h-2 rounded-full bg-[#F4736E]/20 flex-1">
              <div
                className="h-2 rounded-full bg-[#F4736E]"
                style={{ width: `${[45, 70, 90][i]}%` }}
              />
            </div>
            <span className="text-xs font-bold text-[#F4736E] w-24 shrink-0">{l}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: "style",
    title: "Smart Flashcards",
    tag: "Quick Revision",
    tagColor: "#6C63FF",
    color: "#6C63FF",
    gradient: "from-[#6C63FF] to-[#a78bfa]",
    lightBg: "rgba(108,99,255,0.06)",
    border: "rgba(108,99,255,0.2)",
    desc: "Swipe through topic-specific revision cards that test your recall without the pressure of a full exam. Perfect for last-minute prep.",
    bullets: [
      "Topic-wise card sets for every subject",
      "Flip cards to reveal answers",
      "Catalogue by board, grade, and subject",
    ],
    visual: (
      <div className="relative h-24 flex items-center justify-center">
        {[2, 1, 0].map((z) => (
          <div
            key={z}
            className="absolute rounded-2xl bg-white border-2 shadow-lg flex items-center justify-center"
            style={{
              width: `${100 - z * 10}%`,
              height: "72px",
              borderColor: "rgba(108,99,255,0.25)",
              transform: `translateY(${z * 6}px) rotate(${[-3, 1.5, 0][z]}deg)`,
              zIndex: 3 - z,
            }}
          >
            {z === 0 && (
              <span className="material-symbols-outlined text-3xl" style={{ color: "#6C63FF", fontVariationSettings: "'FILL' 1,'wght' 600,'GRAD' 0,'opsz' 40" }}>style</span>
            )}
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: "local_fire_department",
    title: "Daily Challenge",
    tag: "Build Streaks",
    tagColor: "#FF9F1C",
    color: "#FF9F1C",
    gradient: "from-[#FF9F1C] to-[#FFD23F]",
    lightBg: "rgba(255,159,28,0.06)",
    border: "rgba(255,159,28,0.2)",
    desc: "One new question unlocked every day, matched to your board and grade. Answer it correctly to keep your streak alive and earn badges.",
    bullets: [
      "New question every 24 hours",
      "Streak counter + daily badge system",
      "Miss a day and your streak resets",
    ],
    visual: (
      <div className="flex gap-1.5 justify-center flex-wrap">
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
            style={{
              background: i < 10 ? "rgba(255,159,28,0.9)" : "rgba(255,159,28,0.15)",
              color: i < 10 ? "#fff" : "#FF9F1C",
            }}
          >
            {i < 10 ? "🔥" : "·"}
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: "sports_esports",
    title: "Brain Games",
    tag: "Learn by Playing",
    tagColor: "#4ECDC4",
    color: "#4ECDC4",
    gradient: "from-[#4ECDC4] to-[#67e8f9]",
    lightBg: "rgba(78,205,196,0.06)",
    border: "rgba(78,205,196,0.2)",
    desc: "Memory puzzles, pattern matching, and logic games that feel like play but build the same skills you need for exams.",
    bullets: [
      "Memory match & pattern recall games",
      "Score points and beat your own best",
      "Great for short study breaks",
    ],
    visual: (
      <div className="grid grid-cols-4 gap-1.5">
        {["calculate", "science", "menu_book", "public", "translate", "eco", "computer", "travel_explore"].map((ic, i) => (
          <div
            key={ic}
            className="aspect-square rounded-xl flex items-center justify-center"
            style={{ background: i % 2 === 0 ? "rgba(78,205,196,0.15)" : "rgba(78,205,196,0.05)" }}
          >
            <span
              className="material-symbols-outlined text-lg"
              style={{ color: "#4ECDC4", fontVariationSettings: "'FILL' 1,'wght' 500,'GRAD' 0,'opsz' 20" }}
            >
              {ic}
            </span>
          </div>
        ))}
      </div>
    ),
  },
];

const STUDENT_FEATURES = [
  { icon: "area_chart",          text: "See exactly where you're weak — auto-detected after every test", color: "#F4736E" },
  { icon: "local_fire_department",text: "Build daily streaks and never break your study habit",           color: "#FF9F1C" },
  { icon: "military_tech",       text: "Earn badges and points for every milestone you hit",             color: "#6C63FF" },
  { icon: "leaderboard",         text: "Track your rank on the live leaderboard",                       color: "#4ECDC4" },
  { icon: "history_edu",         text: "Review all past results and scores anytime",                    color: "#F4736E" },
  { icon: "menu_book",           text: "Download study materials from your teachers instantly",          color: "#4ECDC4" },
];

export default function HomeFeaturesSection() {
  return (
    <>
      {/* ══ STUDY MODES SECTION (Quizlet style) ══ */}
      <section className="py-16 md:py-24 bg-white overflow-hidden relative">
        <div className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#F4736E]/6 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#6C63FF]/6 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 md:px-8">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-[#6C63FF]/30 bg-[#6C63FF]/8 px-4 py-1.5 text-sm font-bold text-[#6C63FF] mb-4">
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1,'wght' 700,'GRAD' 0,'opsz' 24" }}>auto_awesome</span>
              4 Ways to Learn
            </div>
            <h2
              className="text-3xl md:text-5xl font-black text-[#1B1F3B] leading-tight mb-4"
              style={{ fontFamily: "'Balsamiq Sans', cursive" }}
            >
              Pick How You{" "}
              <span className="text-[#6C63FF]">Want to Study</span>
            </h2>
            <p className="text-base md:text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
              Not everyone learns the same way. Edify Eight gives you four powerful modes — so you can study however works best for you.
            </p>
          </motion.div>

          {/* Mode cards — alternating layout like Quizlet feature sections */}
          <div className="space-y-6 md:space-y-8">
            {MODES.map((m, i) => (
              <motion.div
                key={m.title}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55 }}
                className={`flex flex-col ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} gap-0 rounded-3xl border-2 overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300`}
                style={{ borderColor: m.border, background: m.lightBg }}
              >
                {/* Text side */}
                <div className="flex-1 p-7 md:p-10 flex flex-col justify-center gap-4">
                  {/* Tag */}
                  <span
                    className="self-start text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full"
                    style={{ background: m.color + "18", color: m.color }}
                  >
                    {m.tag}
                  </span>

                  {/* Icon + Title */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-linear-to-br ${m.gradient} flex items-center justify-center shadow-md shrink-0`}
                    >
                      <span
                        className="material-symbols-outlined text-2xl text-white"
                        style={{ fontVariationSettings: "'FILL' 1,'wght' 600,'GRAD' 0,'opsz' 24" }}
                      >
                        {m.icon}
                      </span>
                    </div>
                    <h3
                      className="text-2xl md:text-3xl font-black text-[#1B1F3B]"
                      style={{ fontFamily: "'Balsamiq Sans', cursive" }}
                    >
                      {m.title}
                    </h3>
                  </div>

                  <p className="text-slate-600 text-sm md:text-base leading-relaxed">{m.desc}</p>

                  <ul className="space-y-2">
                    {m.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2.5 text-sm font-semibold text-slate-700">
                        <span
                          className="material-symbols-outlined text-[18px] shrink-0 mt-0.5"
                          style={{ color: m.color, fontVariationSettings: "'FILL' 1,'wght' 600,'GRAD' 0,'opsz' 20" }}
                        >
                          check_circle
                        </span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Visual side */}
                <div
                  className="w-full md:w-72 lg:w-80 flex items-center justify-center p-8"
                  style={{ background: m.color + "10" }}
                >
                  <div className="w-full max-w-[220px]">{m.visual}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FOR STUDENTS SECTION ══ */}
      <section
        className="py-16 md:py-24 overflow-hidden relative"
        style={{ background: "linear-gradient(135deg, #1B1F3B 0%, #2d3561 100%)" }}
      >
        {/* Dot pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }}
        />

        <div className="mx-auto max-w-7xl px-4 md:px-8 relative">
          <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, x: -28 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
              className="flex-1"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-[#FFD23F]/40 bg-[#FFD23F]/10 px-4 py-1.5 text-sm font-bold text-[#FFD23F] mb-5">
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1,'wght' 700,'GRAD' 0,'opsz' 24" }}>emoji_events</span>
                Built for Students
              </div>

              <h2
                className="text-3xl md:text-4xl font-black text-white leading-tight mb-4"
                style={{ fontFamily: "'Balsamiq Sans', cursive" }}
              >
                Everything You Need to{" "}
                <span style={{ color: "#FFD23F" }}>Score Higher</span>
              </h2>

              <p className="text-slate-300 text-base leading-relaxed mb-8 max-w-md">
                Track your progress, fix weak spots, build daily habits, and watch your scores climb — all from one dashboard.
              </p>

              <ul className="space-y-3">
                {STUDENT_FEATURES.map((f) => (
                  <li key={f.text} className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: f.color + "25" }}
                    >
                      <span
                        className="material-symbols-outlined text-xl"
                        style={{ color: f.color, fontVariationSettings: "'FILL' 1,'wght' 600,'GRAD' 0,'opsz' 24" }}
                      >
                        {f.icon}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-slate-200">{f.text}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Student dashboard preview card */}
            <motion.div
              initial={{ opacity: 0, x: 28 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
              className="flex-1 flex items-center justify-center w-full"
            >
              <div className="relative w-full max-w-sm">
                <div className="relative z-10 bg-white rounded-3xl p-6 shadow-2xl">

                  {/* Student header */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#FFD23F] to-[#F4736E] flex items-center justify-center text-white font-black text-lg" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>A</div>
                    <div>
                      <p className="text-sm font-black text-slate-900">Arjun S.</p>
                      <p className="text-xs text-[#4ECDC4] font-semibold">Grade 8 · CBSE</p>
                    </div>
                    <span className="ml-auto text-xs font-black bg-[#FFD23F]/20 text-[#FF9F1C] px-2 py-1 rounded-full">Explorer</span>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    {[
                      { label: "Streak",  value: "12🔥", color: "#FF9F1C" },
                      { label: "Points",  value: "840",  color: "#6C63FF" },
                      { label: "Rank",    value: "#14",  color: "#4ECDC4" },
                    ].map((s) => (
                      <div key={s.label} className="text-center rounded-2xl py-3 px-2" style={{ background: s.color + "12" }}>
                        <p className="text-base font-black" style={{ color: s.color, fontFamily: "'Balsamiq Sans', cursive" }}>{s.value}</p>
                        <p className="text-[10px] font-bold text-slate-500">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Weak areas */}
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Weak Areas</p>
                  <div className="space-y-2 mb-4">
                    {[
                      { subject: "Science – Light & Optics", pct: 38, color: "#F4736E" },
                      { subject: "Math – Fractions",         pct: 55, color: "#FF9F1C" },
                    ].map((w) => (
                      <div key={w.subject}>
                        <div className="flex justify-between text-xs font-semibold text-slate-600 mb-0.5">
                          <span>{w.subject}</span>
                          <span style={{ color: w.color }}>{w.pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-1.5 rounded-full" style={{ width: `${w.pct}%`, background: w.color }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Daily challenge chip */}
                  <div className="flex items-center gap-2 rounded-2xl bg-[#4ECDC4]/10 border border-[#4ECDC4]/25 px-3 py-2.5">
                    <span className="material-symbols-outlined text-base" style={{ color: "#4ECDC4", fontVariationSettings: "'FILL' 1,'wght' 700,'GRAD' 0,'opsz' 20" }}>check_circle</span>
                    <span className="text-xs font-bold text-slate-700">Daily challenge completed! +10 pts</span>
                  </div>
                </div>

                {/* Floating badge */}
                <div className="absolute -bottom-5 -right-5 bg-[#F4736E] text-white rounded-2xl px-4 py-3 shadow-xl z-20 text-center">
                  <p className="text-2xl font-black" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>🥇</p>
                  <p className="text-xs font-bold opacity-90">Gold Badge</p>
                </div>
              </div>
            </motion.div>

          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="mt-16 text-center"
          >
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("eec:open-login"))}
              className="inline-flex items-center gap-2 rounded-full bg-[#FFD23F] px-8 py-4 text-base font-black text-[#1B1F3B] shadow-[0_8px_28px_rgba(255,210,63,0.3)] hover:brightness-105 hover:scale-105 transition-all duration-300"
            >
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1,'wght' 700,'GRAD' 0,'opsz' 24" }}>rocket_launch</span>
              Start Learning Free Today
            </button>
          </motion.div>
        </div>
      </section>
    </>
  );
}
