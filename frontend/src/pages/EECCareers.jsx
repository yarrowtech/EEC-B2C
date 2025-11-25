// src/pages/EECCareers.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  UserPlus,
  Sparkles,
  Lightbulb,
  Handshake,
  ChartLine,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function EECCareers() {
  const [careerData, setCareerData] = useState(null);

  useEffect(() => {
    async function loadCareer() {
      try {
        const res = await fetch(`${API_BASE}/api/settings/career-page`);
        const json = await res.json();
        setCareerData(json);
      } catch (err) {
        console.error("Failed to load career page:", err);
      }
    }
    loadCareer();
  }, []);

  // ---------- FALLBACKS + MAPPING FROM DB ----------

  const introText =
    careerData?.introText ||
    "Welcome to EEC, where innovation meets education! At EEC, we are dedicated to shaping the future of learning by creating an engaging, student-centric platform that focuses on both academic excellence and mental well-being. Join our dynamic team of educators, technologists, and creative thinkers to make a meaningful impact on students’ lives. We believe in continuous learning, fostering a collaborative environment, and pushing boundaries to redefine the way students learn and grow. Explore career opportunities with us and be a part of the future of education!";

  const jobSectionTitle = careerData?.jobSectionTitle || "Current Job Openings";

  // Map backend jobOpenings → the same "jobs" shape your UI already uses
  const jobs =
    careerData?.jobOpenings && careerData.jobOpenings.length
      ? careerData.jobOpenings
        .filter((j) => j.isActive) // only active jobs
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((j) => ({
          title: j.title,
          desc: j.shortDescription,
          reqs: j.points && j.points.length ? j.points : [],
          form: j.formUrl || "", // if you later add formUrl in schema
          buttonLabel: j.buttonLabel || "Apply Now",
        }))
      : [
        // original static fallback
        {
          title: "Frontend Developer",
          desc:
            "Help us build beautiful and user-friendly interfaces for our EEC platform. Work with modern web technologies.",
          reqs: [
            "Experience with HTML, CSS, JavaScript",
            "Knowledge of React or Vue.js",
            "2+ years of experience",
          ],
          form: "",
          buttonLabel: "Apply Now",
        },
        {
          title: "Backend Developer",
          desc:
            "Join our backend team to develop scalable and high-performing applications for our learning platform.",
          reqs: [
            "Experience with Node.js, Python, or PHP",
            "Familiarity with MySQL or MongoDB",
            "3+ years of experience",
          ],
          form: "",
          buttonLabel: "Apply Now",
        },
        {
          title: "UX/UI Designer",
          desc:
            "Design intuitive and user-centric experiences for the EEC platform. Your creativity will shape the future of learning.",
          reqs: [
            "Experience with Figma, Sketch, or Adobe XD",
            "Knowledge of user research methods",
            "2+ years of experience",
          ],
          form: "",
          buttonLabel: "Apply Now",
        },
      ];

  const whyJoinTitle = careerData?.whyJoinTitle || "Why Join EEC?";

  // Map backend whyJoinItems → the same shape your UI uses for “Why Join”
  const whyItems =
    careerData?.whyJoinItems && careerData.whyJoinItems.length
      ? careerData.whyJoinItems.map((item, i) => {
        const glows = [
          "from-rose-200/60 to-amber-200/60",
          "from-fuchsia-200/60 to-sky-200/60",
          "from-amber-200/60 to-emerald-200/60",
        ];
        const glow = glows[i % glows.length];

        // you can map icon strings in future; for now keep the 3 icons cycling
        const icons = [<Lightbulb />, <Handshake />, <ChartLine />];
        const icon = icons[i % icons.length];

        return {
          icon,
          title: item.title,
          body: item.description,
          glow,
        };
      })
      : [
        {
          icon: <Lightbulb />,
          title: "Innovative Culture",
          body:
            "We foster a creative and collaborative environment that empowers you to bring new ideas to life.",
          glow: "from-rose-200/60 to-amber-200/60",
        },
        {
          icon: <Handshake />,
          title: "Great Team",
          body:
            "Work with a passionate team of professionals dedicated to revolutionizing the education industry.",
          glow: "from-fuchsia-200/60 to-sky-200/60",
        },
        {
          icon: <ChartLine />,
          title: "Growth Opportunities",
          body:
            "Advance your career with ample opportunities for professional development and learning.",
          glow: "from-amber-200/60 to-emerald-200/60",
        },
      ];

  return (
    <div className="overflow-x-hidden bg-white text-blue-950 selection:bg-yellow-200/60">
      <ToastContainer />
      {/* =========================
          HERO — image + overlay + chips + curve
      ========================== */}
      <section className="relative flex h-[72vh] w-full items-center justify-center overflow-hidden bg-[url('/join.jpeg')] bg-cover bg-center">
        {/* dark + color sweep overlay */}
        <div className="absolute inset-0 bg-blue-950/50" />
        <div className="absolute inset-0 mix-blend-overlay bg-gradient-to-tr from-sky-400/15 via-fuchsia-400/10 to-amber-300/10" />
        {/* soft blobs */}
        <div className="pointer-events-none absolute -left-20 top-16 h-64 w-64 rounded-full bg-sky-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-amber-300/30 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative z-10 mx-auto max-w-4xl px-6 text-center text-white"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            We’re hiring across product & engineering
          </span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight drop-shadow md:text-6xl">
            Join the <span className="text-yellow-300">EEC</span> Team
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-blue-100/90">
            Empower the future of learning with our innovative platform.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#openings"
              className="rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-400 px-5 py-2 text-sm font-semibold text-blue-950 shadow-md ring-1 ring-yellow-300/60 transition hover:shadow-lg hover:saturate-[1.1] active:scale-[.98]"
              onClick={(e) => {
                e.preventDefault();
                document
                  .querySelector("#openings")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              View Openings
            </a>
            <a
              href="#why"
              className="rounded-2xl border border-white/40 bg-white/10 px-5 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              onClick={(e) => {
                e.preventDefault();
                document
                  .querySelector("#why")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Why EEC?
            </a>
          </div>
        </motion.div>

        {/* curve divider */}
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

      {/* =========================
          WELCOME MESSAGE
      ========================== */}
      <section className="mx-auto max-w-6xl px-6 py-16 text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-lg leading-relaxed text-blue-900/90"
        >
          {introText}
        </motion.p>
      </section>

      {/* =========================
          JOB OPENINGS — glass cards
      ========================== */}
      <section id="openings" className="bg-blue-50/40 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold">
              {jobSectionTitle}
            </h2>
            <div className="mx-auto mt-3 h-[3px] w-28 bg-yellow-400" />
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {jobs.map((job, i) => (
              <motion.article
                key={job.title + i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: 0.05 * i }}
                className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-blue-100/60 bg-white/90 p-6 shadow-[0_18px_50px_rgba(2,32,71,0.08)] backdrop-blur-md transition-transform duration-300 hover:-translate-y-1.5 hover:shadow-xl"
              >
                <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-yellow-200/60 to-sky-200/60 blur-xl" />
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-2xl border border-blue-100 bg-white px-3 py-1 text-xs font-semibold text-blue-900">
                    <Briefcase className="h-4 w-4" />
                    Opening
                  </div>
                  <h3 className="text-xl font-semibold text-blue-900">
                    {job.title}
                  </h3>
                  <p className="mt-2 text-blue-900/90">{job.desc}</p>
                  <ul className="mt-4 list-disc space-y-1 pl-5 text-blue-900/90">
                    {job.reqs.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>

                <a
                  href={job.form || "#"}
                  target={job.form ? "_blank" : undefined}
                  rel={job.form ? "noopener noreferrer" : undefined}
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:shadow-lg active:scale-[.98]"
                  onClick={(e) => {
                    if (!job.form) {
                      e.preventDefault();
                      // alert("Link for this job is not added yet.");
                      toast.info("Link for this job is not added yet.", {
                        position: "bottom-right",
                        autoClose: 3000,
                      });
                    }
                  }}
                >
                  <UserPlus className="h-4 w-4" />
                  {job.buttonLabel || "Apply Now"}
                </a>

              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* =========================
          WHY JOIN — tiles
      ========================== */}
      <section id="why" className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold">
              {whyJoinTitle}
            </h2>
            <div className="mx-auto mt-3 h-[3px] w-28 bg-yellow-400" />
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {whyItems.map((f, i) => (
              <motion.div
                key={f.title + i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.05 * i }}
                className="relative overflow-hidden rounded-3xl border border-blue-100/60 bg.white p-6 shadow-xl transition-transform duration-300 hover:-translate-y-1.5"
              >
                <div
                  className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${f.glow} blur-xl`}
                />
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl border border-blue-100 bg-white shadow-sm">
                    <span className="text-2xl">{f.icon}</span>
                  </div>
                  <h4 className="text-lg font-semibold">{f.title}</h4>
                </div>
                <p className="mt-3 text-blue-900/90">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
