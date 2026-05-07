import { motion } from "framer-motion";

const CARDS = [
  {
    icon: "sentiment_dissatisfied",
    title: 'The "Boring" Search',
    body: "No more endless scrolling through dusty old websites looking for practice papers.",
    color: "#FF6B6B",
    bg: "rgba(255,107,107,0.08)",
    border: "#FF6B6B",
  },
  {
    icon: "mystery",
    title: "Confusing Puzzles",
    body: "Textbooks can be like secret codes. We give you the key to unlock every chapter!",
    color: "#4ECDC4",
    bg: "rgba(78,205,196,0.08)",
    border: "#4ECDC4",
  },
  {
    icon: "alarm_off",
    title: "Clock Crushing",
    body: "Struggling to finish on time? Our fun mock tests help you race the clock and win!",
    color: "#FFD23F",
    bg: "rgba(255,210,63,0.10)",
    border: "#FFD23F",
  },
];

export default function StudyGrumpySection() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-12 bg-[#FEF4E8] rounded-b-[100%]" />

      {/* Static glow blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#FF6B6B]/8 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-[#4ECDC4]/8 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
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
              transition={{ duration: 0.7, delay: 0.4 }}
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
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.12 }}
              whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
              className="bg-[#FFFDF7] p-10 rounded-[2rem] shadow-sm hover:shadow-2xl transition-shadow border-4 border-transparent text-center"
              style={{ borderColor: c.border + "00" }}
            >
              {/* Icon — CSS float, not JS-driven */}
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mb-8 mx-auto"
                style={{
                  background: c.bg,
                  color: c.color,
                  animation: `floatY ${3.5 + i * 0.5}s ease-in-out ${i * 0.4}s infinite`,
                }}
              >
                <span className="material-symbols-outlined text-5xl">{c.icon}</span>
              </div>

              <h3
                className="text-2xl font-bold mb-4 text-slate-900"
                style={{ fontFamily: "'Balsamiq Sans', cursive" }}
              >
                {c.title}
              </h3>
              <p className="text-slate-600 font-medium">{c.body}</p>

              {/* Accent underline — scaleX avoids layout cost */}
              <motion.div
                className="mt-6 h-1 rounded-full mx-auto"
                style={{
                  background: c.color,
                  width: "48px",
                  transformOrigin: "center",
                  scaleX: 0,
                }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.2 + i * 0.12 }}
              />
            </motion.div>
          ))}
        </div>

        {/* Static wave decoration */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 flex justify-center"
        >
          <svg width="200" height="24" viewBox="0 0 200 24" fill="none" aria-hidden="true">
            <path d="M0 12 C25 0, 50 24, 75 12 S125 0, 150 12 S175 24, 200 12" stroke="#FF6B6B" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.35" />
            <path d="M0 12 C25 0, 50 24, 75 12 S125 0, 150 12 S175 24, 200 12" stroke="#FFD23F" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.25" strokeDasharray="6 8" />
          </svg>
        </motion.div>
      </div>
    </section>
  );
}
