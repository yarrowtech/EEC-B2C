import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, Heart, Lightbulb } from "lucide-react";

export default function LearningWellbeing() {
  return (
    <div className="bg-white text-blue-950 selection:bg-yellow-200/60 overflow-x-hidden">
      {/* ===== Hero Section with Background, Overlay, and Curve Divider ===== */}
      <section className="relative flex h-[75vh] w-full items-center justify-center overflow-hidden bg-[url('/9913007.jpg')] bg-cover bg-center">
        <div className="absolute inset-0 bg-black/60" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative z-10 px-6 text-center text-white"
        >
          <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
            Enhance Learning, Elevate Well-being
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-blue-100/90">
            At EEC, we believe that learning and well-being go hand in hand,
            creating a holistic educational experience.
          </p>
        </motion.div>
        <svg
          className="pointer-events-none absolute -bottom-[1px] left-0 w-full"
          viewBox="0 0 1440 120"
          aria-hidden
        >
          <path
            fill="#ffffff"
            d="M0,64L48,69.3C96,75,192,85,288,85.3C384,85,480,75,576,80C672,85,768,107,864,117.3C960,128,1056,128,1152,117.3C1248,107,1344,85,1392,74.7L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
          />
        </svg>
      </section>

      {/* ===== Section 1 ===== */}
      <div className="mx-auto max-w-6xl px-6">
        <section className="py-16">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-semibold">Learning and Well-being, Together</h2>
              <div className="mb-4 mt-3 h-[3px] w-28 bg-yellow-400" />
              <p className="leading-relaxed text-blue-900/90">
                At EEC, we integrate engaging learning materials with mindfulness practices to ensure students thrive
                both academically and mentally. Our platform promotes mental resilience while helping students achieve
                their educational goals.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="group relative order-first md:order-last"
            >
              <img
                src="/product.jpg"
                alt="Holistic Learning Approach"
                className="relative z-10 w-full rounded-3xl border border-blue-100/60 shadow-xl transition-transform duration-300 ease-out group-hover:scale-[1.01]"
              />
              <div className="absolute inset-0 -z-0 translate-x-3 translate-y-3 rounded-3xl bg-gradient-to-br from-sky-200/40 to-amber-200/40 blur-lg" />
            </motion.div>
          </div>
        </section>

        {/* ===== Section 2 ===== */}
        <section className="py-16">
          <div className="grid items-center gap-10 md:grid-cols-2 md:flex-row-reverse">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-2 md:order-1"
            >
              <h2 className="text-3xl font-semibold">Focus on Emotional Well-being</h2>
              <div className="mb-4 mt-3 h-[3px] w-28 bg-yellow-400" />
              <p className="leading-relaxed text-blue-900/90">
                We prioritize students' mental health alongside their educational progress. By fostering emotional
                well-being, EEC helps students build the resilience they need to navigate life's challenges, ensuring
                long-term success both in and out of the classroom.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-1 md:order-2 group relative"
            >
              <img
                src="/mental-health-27143.jpg"
                alt="Emotional Well-being"
                className="relative z-10 w-full rounded-3xl border border-blue-100/60 shadow-xl transition-transform duration-300 ease-out group-hover:scale-[1.01]"
              />
              <div className="absolute inset-0 -z-0 translate-x-3 translate-y-3 rounded-3xl bg-gradient-to-br from-fuchsia-200/40 to-sky-200/40 blur-lg" />
            </motion.div>
          </div>
        </section>

        {/* ===== Mindfulness Section ===== */}
        <section id="mindfulness" className="py-16">
          <h2 className="text-center text-3xl font-semibold">Mindfulness for Academic Success</h2>
          <div className="mx-auto mt-3 h-[3px] w-28 bg-yellow-400" />

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <Heart /> ,
                title: "Mindful Learning",
                body: "Engage students with mindfulness practices integrated directly into the learning process, enhancing focus and well-being.",
                glow: "from-rose-200/60 to-amber-200/60",
              },
              {
                icon: <Lightbulb />,
                title: "Balanced Approach",
                body: "We combine academic rigor with emotional support, creating a balanced and holistic approach to education.",
                glow: "from-fuchsia-200/60 to-sky-200/60",
              },
              {
                icon: <CheckCircle />,
                title: "Resilience Building",
                body: "Students gain tools to manage stress and emotions, fostering resilience and ensuring academic success over time.",
                glow: "from-amber-200/60 to-emerald-200/60",
              },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.05 * i }}
                className="relative overflow-hidden rounded-3xl border border-blue-100/60 bg-white p-6 shadow-xl transition-transform hover:-translate-y-1.5"
              >
                <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${f.glow} blur-xl`} />
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl border border-blue-100 bg-white shadow-sm">
                    <span className="text-2xl">{f.icon}</span>
                  </div>
                  <h4 className="text-lg font-semibold">{f.title}</h4>
                </div>
                <p className="mt-3 text-blue-900/90">{f.body}</p>
                <span className="pointer-events-none absolute inset-x-6 bottom-0 h-16 bg-gradient-to-t from-blue-50 to-transparent" />
              </motion.div>
            ))}
          </div>
        </section>

        {/* ===== CTA ===== */}
        {/* <section className="py-16 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-semibold"
          >
            Join Us in Fostering Balanced Education
          </motion.h2>
          <div className="mx-auto mt-3 h-[3px] w-28 bg-yellow-400" />
          <p className="mx-auto mt-4 max-w-2xl text-blue-900/90">
            At EEC, we create a learning environment where students thrive academically and mentally.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <a
              href="#"
              className="rounded-2xl border border-blue-200 bg-blue-600 px-6 py-3 font-medium text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              Book a demo
            </a>
            <a
              href="#mindfulness"
              className="rounded-2xl border border-blue-200/70 bg-white px-6 py-3 font-medium text-blue-700 shadow-sm hover:bg-blue-50"
            >
              See mindfulness
            </a>
          </div>
        </section> */}
      </div>
    </div>
  );
}