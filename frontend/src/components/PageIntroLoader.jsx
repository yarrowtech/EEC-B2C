import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";

const FLOATERS = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: (i * 97 + 11) % 100,
  y: (i * 71 + 23) % 100,
  size: 4 + (i % 4) * 3,
  delay: (i * 0.21) % 4,
  dur: 2.5 + (i % 3),
  color: i % 3 === 0 ? "rgba(244,115,110,0.12)" : i % 3 === 1 ? "rgba(231,197,85,0.12)" : "rgba(162,155,254,0.10)",
}));

export default function PageIntroLoader({ message = "Loading..." }) {
  return (
    <motion.div
      className="fixed inset-0 z-9999 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(160deg, #fff9f8 0%, #ffffff 50%, #fffdf4 100%)" }}
      initial={{ y: 0 }}
      exit={{
        y: "-100%",
        transition: { duration: 0.58, ease: [0.76, 0, 0.24, 1] },
      }}
    >
      {/* Soft radial glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(244,115,110,0.08) 0%, rgba(231,197,85,0.05) 50%, transparent 72%)",
        }}
      />

      {/* Floating soft dots (replace stars on light bg) */}
      {FLOATERS.map((f) => (
        <motion.span
          key={f.id}
          className="pointer-events-none absolute rounded-full"
          style={{
            left: `${f.x}%`,
            top: `${f.y}%`,
            width: f.size,
            height: f.size,
            background: f.color,
          }}
          animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.3, 1] }}
          transition={{ duration: f.dur, repeat: Infinity, delay: f.delay }}
        />
      ))}

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center gap-5"
      >
        {/* Logo mark */}
        <div className="relative">
          {/* Soft shadow glow */}
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: "linear-gradient(135deg, #F4736E, #e7c555)",
              filter: "blur(14px)",
              opacity: 0.3,
            }}
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
          {/* Icon box */}
          <div
            className="relative flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm"
            style={{ background: "linear-gradient(135deg, #F4736E, #e7c555)" }}
          >
            <GraduationCap size={28} color="white" strokeWidth={2.2} />
          </div>
        </div>

        {/* Brand name */}
        <span
          className="text-2xl font-extrabold leading-none tracking-tight"
          style={{
            fontFamily: "'Balsamiq Sans', 'Plus Jakarta Sans', sans-serif",
            background: "linear-gradient(130deg, #F4736E 0%, #d4a017 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Edify Eight
        </span>

        {/* Message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm tracking-wide text-slate-500"
          style={{ fontFamily: "'Balsamiq Sans', sans-serif" }}
        >
          {message}
        </motion.p>

        {/* Progress bar track */}
        <div className="h-[3px] w-52 overflow-hidden rounded-full bg-slate-200">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #F4736E, #e7c555, #F4736E)" }}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.72, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>

        {/* Dot trio */}
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="rounded-full"
              style={{
                width: i === 1 ? 7 : 5,
                height: i === 1 ? 7 : 5,
                background: i === 1 ? "#F4736E" : "#e7c555",
              }}
              animate={{ scale: [1, 1.5, 1], opacity: [0.45, 1, 0.45] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.22 }}
            />
          ))}
        </div>
      </motion.div>

      {/* Bottom reveal edge */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-[3px]"
        style={{ background: "linear-gradient(90deg, transparent, #F4736E, #e7c555, transparent)" }}
      />
    </motion.div>
  );
}
