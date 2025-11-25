import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SupportCenter() {
  const faqs = useMemo(
    () => [
      {
        q: "What is EEC? Why Choose Us for Education?",
        a: (
          <div className="space-y-3">
            <p>
              EEC (Electronic Educare) is a smart learning platform for students from Class 1 to 12, powered by AI and
              ML to personalize and enhance learning.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Adaptive Smart Learning</li>
              <li>Gamified Progress</li>
              <li>Concept Videos & Worksheets</li>
              <li>CBSE, ICSE & State Board Alignment</li>
            </ul>
          </div>
        ),
        open: true,
      },
      {
        q: "Who We Are?",
        a: (
          <p>
            We are a team of educators, technologists, and innovators dedicated to transforming the way students learn
            through personalized education.
          </p>
        ),
      },
      {
        q: "What is Our Aim?",
        a: (
          <ul className="list-disc pl-5 space-y-1">
            <li>Provide personalized learning paths</li>
            <li>Reduce exam pressure</li>
            <li>Make learning engaging and efficient</li>
          </ul>
        ),
      },
      {
        q: "Types of Experiential Learning Solutions with EEC",
        a: (
          <ul className="list-disc pl-5 space-y-1">
            <li>Interactive Challenges & Quizzes</li>
            <li>AI-based Learning Paths</li>
            <li>Gamified Learning Experience</li>
            <li>Concept Videos & Activities</li>
            <li>Parent Dashboard & Progress Reports</li>
            <li>Screen Time-Conscious Design</li>
          </ul>
        ),
      },
    ],
    []
  );

  const [openSet, setOpenSet] = useState(() => new Set(faqs.filter((f) => f.open).map((_, i) => i)));
  const toggle = (i) =>
    setOpenSet((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    if (!query.trim()) return faqs.map((f, i) => ({ ...f, i }));
    const ql = query.toLowerCase();
    return faqs
      .map((f, i) => ({ ...f, i }))
      .filter((f) => f.q.toLowerCase().includes(ql) || String(f.a?.props?.children || "").toLowerCase().includes(ql));
  }, [faqs, query]);

  return (
    <div className="bg-white text-blue-950 selection:bg-yellow-200/60 overflow-x-hidden">
      {/* ===== Header ===== */}
      <section className="py-12 bg-blue-50/40 border-b border-blue-100">
        <div className="mx-auto max-w-6xl px-6">
          <h1 className="text-3xl md:text-4xl font-extrabold">Support Center</h1>
          <div className="mt-3 h-[3px] w-24 bg-yellow-400" />
        </div>
      </section>

      {/* ===== Content Row ===== */}
      <section className="py-12">
        <div className="mx-auto max-w-6xl px-6 grid gap-10 md:grid-cols-3">
          {/* Left (Quick Search) */}
          <div className="md:col-span-1">
            <h3 className="text-lg font-semibold">Quick Search</h3>
            <div className="mt-3 relative">
              <input
                type="search"
                placeholder="Search here..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-2xl border border-blue-200 bg-white px-4 py-3 pr-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <svg
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-3.5-3.5" />
              </svg>
            </div>
          </div>

          {/* Right (FAQ) */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold">General Questions</h3>

            <div className="mt-4 rounded-3xl border border-blue-100/60 bg-white shadow-xl divide-y divide-blue-100/70">
              {results.map((f) => {
                const isOpen = openSet.has(f.i);
                return (
                  <div key={f.q}>
                    <button
                      onClick={() => toggle(f.i)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left hover:bg-blue-50/40"
                    >
                      <span className="font-medium text-blue-900">{f.q}</span>
                      <span className="grid h-8 w-8 place-items-center rounded-full border border-blue-200 bg-white text-blue-700">
                        <svg
                          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </span>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden px-6 pb-6"
                        >
                          <div className="rounded-2xl bg-blue-50/40 p-4 text-blue-900/90">{f.a}</div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {results.length === 0 && (
                <div className="px-6 py-10 text-center text-blue-900/70">No results found. Try different keywords.</div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}