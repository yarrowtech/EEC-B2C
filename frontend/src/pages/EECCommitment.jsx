import React from "react";
import { motion } from "framer-motion";
import { BarChart, ChartArea, Globe, Target } from "lucide-react";

export default function EECCommitment() {
  return (
    <div className="bg-white text-blue-950 selection:bg-yellow-200/60 overflow-x-hidden">
      {/* ===== Hero Section with Background, Overlay, and Curve Divider ===== */}
      <section className="relative flex h-[75vh] w-full items-center justify-center overflow-hidden bg-[url('/connect-jigsaw.jpg')] bg-cover bg-center">
        <div className="absolute inset-0 bg-black/60" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative z-10 px-6 text-center text-white"
        >
          <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
            Aims to Provide the Best Solutions
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-blue-100/90">
            At EEC, our commitment to excellence drives us to develop innovative tools and resources for all.
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

      {/* ===== Section 1 (Text Left, Image Right) ===== */}
      <div className="mx-auto max-w-6xl px-6">
        <section className="py-16">
          <div className="flex flex-col items-center gap-10 md:flex-row">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex-1"
            >
              <h2 className="text-3xl font-semibold">Commitment to Excellence</h2>
              <div className="mb-4 mt-3 h-[3px] w-28 bg-yellow-400" />
              <p className="leading-relaxed text-blue-900/90">
                EEC aims to provide the best solutions for students and educators alike. Our innovative approach leverages cutting-edge technology and research-based strategies to create effective learning experiences.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex-1 group relative"
            >
              <img
                src="/Businessman-using-ai-technology-for-data-analytics.jpg"
                alt="Commitment to Excellence"
                className="relative z-10 w-full rounded-3xl border border-blue-100/60 shadow-xl transition-transform duration-300 ease-out group-hover:scale-[1.01]"
              />
              <div className="absolute inset-0 -z-0 translate-x-3 translate-y-3 rounded-3xl bg-gradient-to-br from-sky-200/40 to-amber-200/40 blur-lg" />
            </motion.div>
          </div>
        </section>

        {/* ===== Section 2 (Image Left, Text Right) ===== */}
        <section className="py-16">
          <div className="flex flex-col-reverse items-center gap-10 md:flex-row">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex-1 group relative"
            >
              <img
                src="/innovative.jpg"
                alt="Innovative Tools"
                className="relative z-10 w-full rounded-3xl border border-blue-100/60 shadow-xl transition-transform duration-300 ease-out group-hover:scale-[1.01]"
              />
              <div className="absolute inset-0 -z-0 translate-x-3 translate-y-3 rounded-3xl bg-gradient-to-br from-fuchsia-200/40 to-sky-200/40 blur-lg" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex-1"
            >
              <h2 className="text-3xl font-semibold">Innovative Tools and Resources</h2>
              <div className="mb-4 mt-3 h-[3px] w-28 bg-yellow-400" />
              <p className="leading-relaxed text-blue-900/90">
                By developing customized learning experiences, we enhance engagement and effectiveness. Our resources are tailored to meet the evolving needs of the educational landscape.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ===== Section 3: Features ===== */}
        <section className="py-16">
          <h2 className="text-center text-3xl font-semibold">Empowering Every Learner and Educator</h2>
          <div className="mx-auto mt-3 h-[3px] w-28 bg-yellow-400" />

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <Target />,
                title: "Customized Learning Experiences",
                body: "We leverage technology to create personalized pathways that meet individual learning needs and preferences.",
                glow: "from-rose-200/60 to-amber-200/60",
              },
              {
                icon: <ChartArea />,
                title: "Engagement and Effectiveness",
                body: "Our strategies aim to enhance student engagement and ensure effective learning outcomes across various disciplines.",
                glow: "from-fuchsia-200/60 to-sky-200/60",
              },
              {
                icon: <Globe />,
                title: "Accessible and Impactful Education",
                body: "We strive to make education accessible to all, ensuring that every learner can achieve their potential.",
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
            Join Us in Empowering Education
          </motion.h2>
          <div className="mx-auto mt-3 h-[3px] w-28 bg-yellow-400" />
          <p className="mx-auto mt-4 max-w-2xl text-blue-900/90">
            At EEC, we are committed to making a meaningful impact in the educational landscape. Be a part of our journey.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <a
              href="#"
              className="rounded-2xl border border-blue-200 bg-blue-600 px-6 py-3 font-medium text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              Join Now
            </a>
            <a
              href="#features"
              className="rounded-2xl border border-blue-200/70 bg-white px-6 py-3 font-medium text-blue-700 shadow-sm hover:bg-blue-50"
            >
              Learn More
            </a>
          </div>
        </section> */}
      </div>
    </div>
  );
}