import { motion } from "framer-motion";

const STEPS = [
  {
    num: "1",
    bg: "#FFD23F",
    textColor: "text-slate-900",
    rotate: "-6deg",
    icon: "map",
    iconColor: "#FF6B6B",
    title: "Pick Your Map",
    body: "Tell us your Board and Class. We'll show you the perfect treasure trove of content!",
    delay: 0,
  },
  {
    num: "2",
    bg: "#4ECDC4",
    textColor: "text-slate-900",
    rotate: "6deg",
    icon: "download_for_offline",
    iconColor: "#FFD23F",
    title: "Grab Your Gear",
    body: "Download colorful Smart PDFs with expert solutions that act like a friendly guide.",
    delay: 0.15,
  },
  {
    num: "3",
    bg: "#6C63FF",
    textColor: "text-white",
    rotate: "-3deg",
    icon: "workspace_premium",
    iconColor: "#4ECDC4",
    title: "Win the Game!",
    body: "Practice with joy and see your scores soar like a rocket to the moon!",
    delay: 0.3,
  },
];

export default function VictoryPathSection() {
  return (
    <section className="py-24 overflow-hidden bg-[#FEF4E8] relative">

      {/* Static glow blobs */}
      <div className="pointer-events-none absolute -top-20 -right-20 w-80 h-80 rounded-full bg-[#FFD23F]/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-[#4ECDC4]/12 blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[#4ECDC4]/40 bg-[#4ECDC4]/10 px-4 py-1.5 text-sm font-bold text-[#4ECDC4] mb-5">
            <span
              className="material-symbols-outlined text-base"
              style={{ fontVariationSettings: "'FILL' 1,'wght' 700,'GRAD' 0,'opsz' 24" }}
            >
              route
            </span>
            3 Simple Steps
          </div>
          <h2
            className="text-4xl lg:text-6xl font-bold mb-4 text-slate-900"
            style={{ fontFamily: "'Balsamiq Sans', cursive" }}
          >
            Your 3-Step{" "}
            <span className="text-[#4ECDC4]">Victory Path</span>
          </h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto font-medium">
            Three moves from confused to confident. It really is that simple.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative flex flex-col md:flex-row justify-between items-center md:items-start gap-16">

          {/* Dashed connector — draws itself once on scroll */}
          <div className="pointer-events-none absolute left-0 right-0 top-24 z-0 hidden md:block">
            <svg className="w-full h-10" viewBox="0 0 1200 40" preserveAspectRatio="none" aria-hidden="true">
              <motion.g
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                style={{ transformOrigin: "0% 50%" }}
                transition={{ duration: 1.1, ease: "easeOut", delay: 0.3 }}
              >
                <path
                  d="M20 20 H1180"
                  fill="none"
                  stroke="#FFD23F"
                  opacity="0.75"
                  strokeWidth="8"
                  strokeDasharray="14 18"
                  strokeLinecap="round"
                />
                <path d="M8 20 L18 14 L18 26 Z" fill="#FFD23F" opacity="0.75" />
                <path d="M1192 20 L1182 14 L1182 26 Z" fill="#FFD23F" opacity="0.75" />
              </motion.g>
            </svg>
          </div>

          {STEPS.map((s) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 48 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: s.delay }}
              className="flex flex-col items-center text-center max-w-xs w-full"
            >
              {/* Step badge */}
              <div className="relative mb-10 z-10">
                <motion.div
                  className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center text-5xl font-black shadow-xl ${s.textColor}`}
                  style={{ background: s.bg, rotate: s.rotate, fontFamily: "'Balsamiq Sans', cursive" }}
                  whileHover={{ rotate: "0deg", scale: 1.08, transition: { duration: 0.25 } }}
                >
                  {s.num}
                </motion.div>

                {/* Icon badge pops in */}
                <motion.div
                  className="absolute -bottom-4 -right-4 bg-white p-3 rounded-2xl shadow-lg"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 320, damping: 20, delay: s.delay + 0.3 }}
                >
                  <span
                    className="material-symbols-outlined text-3xl"
                    style={{ color: s.iconColor, fontVariationSettings: "'FILL' 1,'wght' 600,'GRAD' 0,'opsz' 32" }}
                  >
                    {s.icon}
                  </span>
                </motion.div>

                {/* Static glow behind badge */}
                <div
                  className="absolute inset-0 rounded-[2.5rem] -z-10"
                  style={{ background: s.bg, filter: "blur(18px)", opacity: 0.22 }}
                />
              </div>

              <motion.h4
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: s.delay + 0.2 }}
                className="text-2xl font-bold mb-4 text-slate-900"
                style={{ fontFamily: "'Balsamiq Sans', cursive" }}
              >
                {s.title}
              </motion.h4>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: s.delay + 0.3 }}
                className="text-slate-600 font-medium"
              >
                {s.body}
              </motion.p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
