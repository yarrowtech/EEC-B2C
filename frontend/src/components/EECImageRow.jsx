// src/components/EECImageRow.jsx
// Modern image row with click-to-zoom Lightbox + mobile scroll-snap carousel

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const IMAGES = [
  { src: "/Benefits for Students.jpg", alt: "Benefits for Students" },
  { src: "/Benefits for Parents.jpg", alt: "Benefits for Parents" },
  { src: "/Why Choose EEC.jpg", alt: "Why Choose EEC" },
];

export default function EECImageRow() {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const overlayRef = useRef(null);

  const openAt = (i) => {
    setIdx(i);
    setOpen(true);
  };
  const close = () => setOpen(false);
  const next = () => setIdx((i) => (i + 1) % IMAGES.length);
  const prev = () => setIdx((i) => (i - 1 + IMAGES.length) % IMAGES.length);

  // Keyboard controls
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Click outside to close
  const onBackdrop = (e) => {
    if (overlayRef.current && e.target === overlayRef.current) close();
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-sky-50 to-white py-16">
      <div className="mx-auto max-w-7xl px-4 text-center">
        <h2 className="mb-10 text-3xl font-extrabold tracking-tight text-blue-950 md:text-4xl">
          See <span className="text-yellow-500">EEC</span> in Action
        </h2>

        {/* Mobile: horizontal scroll-snap carousel */}
        <div className="sm:hidden">
          <div className="relative">
            {/* edge fades */}
            <div className="pointer-events-none absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-white to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-white to-transparent" />

            <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
              {IMAGES.map((item, i) => (
                <motion.button
                  key={i}
                  type="button"
                  onClick={() => openAt(i)}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: i * 0.05 }}
                  viewport={{ once: true }}
                  className="group relative h-64 w-72 flex-shrink-0 snap-start overflow-hidden rounded-3xl border border-blue-100/70 bg-white/60 shadow-[0_18px_60px_rgba(2,32,71,0.08)] ring-1 ring-white/60 backdrop-blur-md"
                >
                  <img
                    src={item.src}
                    alt={item.alt}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-blue-950/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="pointer-events-none absolute bottom-3 left-3 right-3 text-left text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <p className="text-base font-semibold drop-shadow">{item.alt}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop/Tablet: elegant grid */}
        <div className="mt-2 hidden grid-cols-2 gap-6 sm:grid lg:grid-cols-3">
          {IMAGES.map((item, i) => (
            <motion.button
              key={i}
              type="button"
              onClick={() => openAt(i)}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
              viewport={{ once: true }}
              className="group relative overflow-hidden rounded-3xl border border-blue-100/70 bg-white/60 shadow-[0_18px_60px_rgba(2,32,71,0.08)] ring-1 ring-white/60 backdrop-blur-md transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <img
                src={item.src}
                alt={item.alt}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-blue-950/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="pointer-events-none absolute bottom-4 left-4 right-4 text-left text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <p className="text-lg font-semibold drop-shadow">{item.alt}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* bottom decorative curve */}
      <div className="pointer-events-none mt-14 h-16">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="h-full w-full">
          <path
            fill="currentColor"
            className="text-white"
            d="M0,64L48,58.7C96,53,192,43,288,48C384,53,480,75,576,80C672,85,768,75,864,58.7C960,43,1056,21,1152,21.3C1248,21,1344,43,1392,53.3L1440,64V120H0Z"
          />
        </svg>
      </div>

      {/* ===== Lightbox ===== */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={overlayRef}
            onMouseDown={onBackdrop}
            className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-modal="true"
            role="dialog"
          >
            {/* image wrapper */}
            <motion.div
              className="relative mx-auto w-[92%] max-w-5xl"
              initial={{ scale: 0.98, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.98, y: 12, opacity: 0 }}
              transition={{ duration: 0.22 }}
            >
              <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-black/20 shadow-2xl ring-1 ring-white/20">
                <img
                  src={IMAGES[idx].src}
                  alt={IMAGES[idx].alt}
                  className="max-h-[78vh] w-full object-contain"
                  draggable={false}
                />

                {/* Caption */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent p-4 text-white">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold">{IMAGES[idx].alt}</span>
                    <span className="opacity-80">
                      {idx + 1} / {IMAGES.length}
                    </span>
                  </div>
                </div>

                {/* Controls */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-2">
                  <button
                    type="button"
                    onClick={prev}
                    className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-blue-950 shadow hover:bg-white"
                    aria-label="Previous"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-blue-950 shadow hover:bg-white"
                    aria-label="Next"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                {/* Close */}
                <button
                  type="button"
                  onClick={close}
                  className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-blue-950 shadow hover:bg-white"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
