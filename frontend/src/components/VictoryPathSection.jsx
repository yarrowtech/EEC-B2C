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
    delay: 0.18,
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
    delay: 0.36,
  },
];

const SPARKLES = [
  { x: "6%",  y: "20%", size: 10, color: "rgba(255,210,63,0.35)",  dur: 3.8, delay: 0   },
  { x: "94%", y: "15%", size: 8,  color: "rgba(78,205,196,0.3)",   dur: 4.2, delay: 0.6 },
  { x: "18%", y: "78%", size: 12, color: "rgba(108,99,255,0.25)",  dur: 5.0, delay: 0.3 },
  { x: "82%", y: "72%", size: 9,  color: "rgba(255,107,107,0.3)",  dur: 3.5, delay: 1.0 },
  { x: "50%", y: "88%", size: 7,  color: "rgba(255,210,63,0.2)",   dur: 4.5, delay: 0.8 },
  { x: "35%", y: "5%",  size: 6,  color: "rgba(78,205,196,0.2)",   dur: 3.2, delay: 0.4 },
];

export default function VictoryPathSection() {
  return (
    <section className="py-24 overflow-hidden bg-[#FEF4E8] relative">

      {/* Soft glow blobs */}
      <div className="pointer-events-none absolute -top-20 -right-20 w-80 h-80 rounded-full bg-[#FFD23F]/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-[#4ECDC4]/12 blur-3xl" />

      {/* Floating sparkle dots */}
      {SPARKLES.map((s, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute rounded-full"
          style={{ left: s.x, top: s.y, width: s.size, height: s.size, background: s.color }}
          animate={{ y: [0, -16, 0], scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: s.dur, repeat: Infinity, ease: "easeInOut", delay: s.delay }}
        />
      ))}

      {/* Star sparkle SVGs */}
      <motion.div
        className="pointer-events-none absolute top-[12%] right-[10%] opacity-30"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      >
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <path d="M14 2 L15.8 10.2 L24 12 L15.8 13.8 L14 22 L12.2 13.8 L4 12 L12.2 10.2 Z" fill="#FFD23F" />
        </svg>
      </motion.div>
      <motion.div
        className="pointer-events-none absolute bottom-[18%] left-[8%] opacity-25"
        animate={{ rotate: [360, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
          <path d="M11 1 L12.4 8.6 L20 10 L12.4 11.4 L11 19 L9.6 11.4 L2 10 L9.6 8.6 Z" fill="#4ECDC4" />
        </svg>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: "easeOut" }}
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

          {/* Animated dashed connector line */}
          <div className="pointer-events-none absolute left-0 right-0 top-24 z-0 hidden md:block">
            <svg
              className="w-full h-10"
              viewBox="0 0 1200 40"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <motion.g
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                style={{ transformOrigin: "0% 50%" }}
                transition={{ duration: 1.3, ease: "easeOut", delay: 0.4 }}
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

          {STEPS.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: s.delay }}
              className="flex flex-col items-center text-center max-w-xs w-full"
            >
              {/* Step badge */}
              <div className="relative mb-10 z-10">
                <motion.div
                  className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center text-5xl font-black shadow-xl ${s.textColor}`}
                  style={{ background: s.bg, rotate: s.rotate, fontFamily: "'Balsamiq Sans', cursive" }}
                  whileHover={{ rotate: "0deg", scale: 1.08 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                >
                  {s.num}
                </motion.div>

                {/* Icon badge — pop in */}
                <motion.div
                  className="absolute -bottom-4 -right-4 bg-white p-3 rounded-2xl shadow-lg"
                  initial={{ scale: 0, rotate: -20 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 350, damping: 18, delay: s.delay + 0.35 }}
                >
                  <span
                    className="material-symbols-outlined text-3xl"
                    style={{ color: s.iconColor, fontVariationSettings: "'FILL' 1,'wght' 600,'GRAD' 0,'opsz' 32" }}
                  >
                    {s.icon}
                  </span>
                </motion.div>

                {/* Glow ring behind badge */}
                <motion.div
                  className="absolute inset-0 rounded-[2.5rem] -z-10"
                  style={{ background: s.bg, filter: "blur(16px)", opacity: 0.25 }}
                  animate={{ opacity: [0.18, 0.32, 0.18] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>

              <motion.h4
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: s.delay + 0.25 }}
                className="text-2xl font-bold mb-4 text-slate-900"
                style={{ fontFamily: "'Balsamiq Sans', cursive" }}
              >
                {s.title}
              </motion.h4>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: s.delay + 0.35 }}
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
