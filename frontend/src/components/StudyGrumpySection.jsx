import { motion } from "framer-motion";

const CARDS = [
  {
    icon: "sentiment_dissatisfied",
    title: 'The “Boring” Search',
    body: "No more endless scrolling through dusty old websites looking for practice papers.",
    color: "#FF6B6B",
    bg: "rgba(255,107,107,0.08)",
    border: "#FF6B6B",
    floatDelay: 0,
  },
  {
    icon: "mystery",
    title: "Confusing Puzzles",
    body: "Textbooks can be like secret codes. We give you the key to unlock every chapter!",
    color: "#4ECDC4",
    bg: "rgba(78,205,196,0.08)",
    border: "#4ECDC4",
    floatDelay: 0.4,
  },
  {
    icon: "alarm_off",
    title: "Clock Crushing",
    body: "Struggling to finish on time? Our fun mock tests help you race the clock and win!",
    color: "#FFD23F",
    bg: "rgba(255,210,63,0.10)",
    border: "#FFD23F",
    floatDelay: 0.8,
  },
];

const FLOATS = [
  { x: "8%",  y: "18%", size: 14, color: "rgba(255,107,107,0.2)",  dur: 4.2, delay: 0    },
  { x: "92%", y: "12%", size: 10, color: "rgba(78,205,196,0.2)",   dur: 3.8, delay: 0.7  },
  { x: "85%", y: "70%", size: 18, color: "rgba(255,210,63,0.18)",  dur: 5.0, delay: 0.3  },
  { x: "5%",  y: "75%", size: 12, color: "rgba(108,99,255,0.18)",  dur: 4.5, delay: 1.1  },
  { x: "50%", y: "6%",  size: 8,  color: "rgba(255,107,107,0.15)", dur: 3.5, delay: 0.5  },
  { x: "72%", y: "88%", size: 10, color: "rgba(78,205,196,0.15)",  dur: 4.8, delay: 1.4  },
];

export default function StudyGrumpySection() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Curved top edge matching the section above */}
      <div className="absolute top-0 left-0 w-full h-12 bg-[#FEF4E8] rounded-b-[100%]" />

      {/* Soft bg glow blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#FF6B6B]/8 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-[#4ECDC4]/8 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#FFD23F]/5 blur-3xl" />

      {/* Floating decorative dots */}
      {FLOATS.map((f, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute rounded-full"
          style={{ left: f.x, top: f.y, width: f.size, height: f.size, background: f.color }}
          animate={{ y: [0, -14, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: f.dur, repeat: Infinity, ease: "easeInOut", delay: f.delay }}
        />
      ))}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FF6B6B]/30 bg-[#FF6B6B]/8 px-4 py-1.5 text-sm font-bold text-[#FF6B6B] mb-5">
            <span
              className="material-symbols-outlined text-base"
              style={{ fontVariationSettings: "'FILL' 1,'wght' 700,'GRAD' 0,'opsz' 24" }}
            >
              sentiment_satisfied
            </span>
            We've Got the Fix
          </div>

          <h2
            className="text-4xl lg:text-6xl font-bold mb-6 text-slate-900"
            style={{ fontFamily: "'Balsamiq Sans', cursive" }}
          >
            Is Studying Getting{" "}
            <motion.span
              className="text-[#FF6B6B] underline decoration-[#FFD23F] underline-offset-8 inline-block"
              initial={{ rotate: 0 }}
              whileInView={{ rotate: [0, -4, 4, -3, 3, 0] }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.5, ease: "easeInOut" }}
            >
              A Bit Grumpy?
            </motion.span>
          </h2>

          <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium">
            We turn those study-frowns upside down with tools that actually make sense!
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {CARDS.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 52 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 220, damping: 22, delay: i * 0.14 }}
              className="bg-[#FFFDF7] p-10 rounded-[2rem] shadow-sm hover:shadow-2xl transition-all border-4 border-transparent group text-center"
              style={{ "--hover-border": c.border }}
              whileHover={{ scale: 1.03, borderColor: c.border + "80" }}
            >
              {/* Floating icon wrapper */}
              <motion.div
                className="w-20 h-20 rounded-full flex items-center justify-center mb-8 mx-auto"
                style={{ background: c.bg, color: c.color }}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: c.floatDelay }}
              >
                <span className="material-symbols-outlined text-5xl">{c.icon}</span>
              </motion.div>

              <h3
                className="text-2xl font-bold mb-4 text-slate-900"
                style={{ fontFamily: "'Balsamiq Sans', cursive" }}
              >
                {c.title}
              </h3>
              <p className="text-slate-600 font-medium">{c.body}</p>

              {/* Bottom accent line */}
              <motion.div
                className="mt-6 h-1 rounded-full mx-auto"
                style={{ background: c.color, width: 0 }}
                whileInView={{ width: "48px" }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.14 }}
              />
            </motion.div>
          ))}
        </div>

        {/* Bottom decorative wave SVG */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 flex justify-center"
        >
          <svg width="200" height="24" viewBox="0 0 200 24" fill="none" aria-hidden="true">
            <path
              d="M0 12 C25 0, 50 24, 75 12 S125 0, 150 12 S175 24, 200 12"
              stroke="#FF6B6B"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              opacity="0.4"
            />
            <path
              d="M0 12 C25 0, 50 24, 75 12 S125 0, 150 12 S175 24, 200 12"
              stroke="#FFD23F"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              opacity="0.3"
              strokeDasharray="6 8"
            />
          </svg>
        </motion.div>
      </div>
    </section>
  );
}
