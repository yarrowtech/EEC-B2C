// src/pages/EECCareers.jsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  UserPlus,
  Sparkles,
  Lightbulb,
  Handshake,
  ChartLine,
  ArrowRight,
  CheckCircle2,
  Users,
  BookOpen,
  Rocket,
  Heart,
  Globe,
  Shield,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ToastContainer } from "react-toastify";
import CareerApplyModal from "../components/careers/CareerApplyModal";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const STATS = [
  { value: "500+", label: "Students Impacted" },
  { value: "50+", label: "Team Members" },
  { value: "10+", label: "Courses Offered" },
  { value: "5★", label: "Average Rating" },
];

const VALUES = [
  {
    icon: <Lightbulb className="h-6 w-6" />,
    title: "Innovation First",
    body: "We constantly challenge the status quo to build better learning experiences.",
    color: "bg-amber-50 text-amber-600 border-amber-100",
  },
  {
    icon: <Heart className="h-6 w-6" />,
    title: "Student Wellbeing",
    body: "Every decision we make starts and ends with how it benefits our students.",
    color: "bg-rose-50 text-rose-600 border-rose-100",
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Collaborative Culture",
    body: "We win together. Great work happens when diverse minds collaborate openly.",
    color: "bg-sky-50 text-sky-600 border-sky-100",
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: "Inclusive by Design",
    body: "We build for everyone and believe our team should reflect the world we serve.",
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  {
    icon: <ChartLine className="h-6 w-6" />,
    title: "Growth Mindset",
    body: "We invest in our people because when you grow, EEC grows.",
    color: "bg-violet-50 text-violet-600 border-violet-100",
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Integrity Always",
    body: "We do the right thing even when no one is watching — transparency is non-negotiable.",
    color: "bg-blue-50 text-blue-600 border-blue-100",
  },
];

function JobRow({ job, index, onApply }) {
  const [open, setOpen] = useState(false);

  const meta = [
    job.badge,
    job.salary,
    job.location || job.workMode,
  ].filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: 0.06 * index }}
    >
      <div className="border-t border-slate-200 py-6">
        {/* Row header */}
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-2">
              Open Role
            </p>
            <h3 className="text-2xl font-bold text-slate-900 leading-tight">
              {job.title}
            </h3>
            {meta.length > 0 && (
              <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-sm text-slate-400">
                {meta.map((m, i) => (
                  <span key={i} className="flex items-center gap-2">
                    {i > 0 && <span className="h-1 w-1 rounded-full bg-slate-300 inline-block" />}
                    {m}
                  </span>
                ))}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle details"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50"
            >
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => onApply(job.title)}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[.98]"
            >
              {job.buttonLabel || "Apply Now"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Expandable details */}
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-5 overflow-hidden"
          >
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 space-y-4">
              {job.desc && (
                <p className="text-sm leading-relaxed text-slate-600">{job.desc}</p>
              )}
              {job.reqs && job.reqs.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                    Requirements
                  </p>
                  <ul className="space-y-1.5">
                    {job.reqs.map((r) => (
                      <li key={r} className="flex items-start gap-2 text-sm text-slate-700">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex items-center gap-3 pt-1">
                <Link
                  to={`/careers/${job.slug}`}
                  className="text-sm font-semibold text-blue-600 hover:underline"
                >
                  Full job description →
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function toJobSlug(title, index) {
  const base = String(title || "job")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "job"}-${index + 1}`;
}

export default function EECCareers() {
  const [careerData, setCareerData] = useState(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [selectedJobTitle, setSelectedJobTitle] = useState("");

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

  const introText =
    careerData?.introText ||
    "At EEC, we're on a mission to transform education for the next generation. We blend technology, pedagogy, and empathy to build tools that genuinely help students thrive — academically and personally. If you're driven by purpose and want your work to matter, you've found the right place.";

  const jobSectionTitle = careerData?.jobSectionTitle || "Open Positions";

  const jobs =
    careerData?.jobOpenings && careerData.jobOpenings.length
      ? careerData.jobOpenings
          .filter((j) => j.isActive)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((j, index) => ({
            title: j.title,
            badge: j.employmentType || j.tag || j.badge || "Full-time",
            desc: j.shortDescription,
            fullDescription: j.fullDescription || "",
            reqs: j.points && j.points.length ? j.points : [],
            form: j.formUrl || "",
            buttonLabel: j.buttonLabel || "Apply Now",
            experience: j.experience || "",
            department: j.department || "",
            location: j.location || "",
            workMode: j.workMode || "",
            salary: j.salary || "",
            slug: toJobSlug(j.title, index),
          }))
      : [
          {
            title: "Frontend Developer",
            badge: "Full-time",
            desc: "Build beautiful, fast, and accessible interfaces for our EEC learning platform using modern web technologies.",
            reqs: [
              "Proficiency in React and TypeScript",
              "Strong eye for design and UX detail",
              "2+ years of frontend experience",
            ],
            form: "",
            buttonLabel: "Apply Now",
            experience: "2+ Years",
            department: "Engineering",
            location: "Kolkata, India",
            workMode: "Hybrid",
            salary: "₹6-10 LPA",
            fullDescription:
              "You will work closely with product and design teams to build scalable, accessible, and high-performing user interfaces for students and educators.",
            slug: toJobSlug("Frontend Developer", 0),
          },
          {
            title: "Backend Developer",
            badge: "Full-time",
            desc: "Design and scale the APIs and infrastructure that power EEC's learning engine for thousands of students.",
            reqs: [
              "Experience with Node.js or Python",
              "Familiarity with SQL and NoSQL databases",
              "3+ years of backend experience",
            ],
            form: "",
            buttonLabel: "Apply Now",
            experience: "3+ Years",
            department: "Engineering",
            location: "Kolkata, India",
            workMode: "Hybrid",
            salary: "₹8-14 LPA",
            fullDescription:
              "You will design secure APIs, optimize data models, and improve platform reliability for large-scale learning workflows.",
            slug: toJobSlug("Backend Developer", 1),
          },
          {
            title: "UX/UI Designer",
            badge: "Full-time",
            desc: "Craft intuitive, beautiful experiences that make complex educational content simple and engaging for students.",
            reqs: [
              "Portfolio showcasing product design work",
              "Expertise in Figma and design systems",
              "2+ years of product design experience",
            ],
            form: "",
            buttonLabel: "Apply Now",
            experience: "2+ Years",
            department: "Design",
            location: "Kolkata, India",
            workMode: "On-site",
            salary: "₹5-9 LPA",
            fullDescription:
              "You will drive user research, create design systems, and craft intuitive learning experiences across web and mobile touchpoints.",
            slug: toJobSlug("UX/UI Designer", 2),
          },
        ];

  const whyJoinTitle = careerData?.whyJoinTitle || "Why Join EEC?";

  const whyItems =
    careerData?.whyJoinItems && careerData.whyJoinItems.length
      ? careerData.whyJoinItems.map((item, i) => {
          const icons = [
            <Rocket className="h-6 w-6" />,
            <Handshake className="h-6 w-6" />,
            <BookOpen className="h-6 w-6" />,
          ];
          return {
            icon: icons[i % icons.length],
            title: item.title,
            body: item.description,
          };
        })
      : [
          {
            icon: <Rocket className="h-6 w-6" />,
            title: "Meaningful Work",
            body: "Every feature you ship directly impacts students' futures. Your work isn't just code — it's a better education for someone.",
          },
          {
            icon: <Handshake className="h-6 w-6" />,
            title: "Great People",
            body: "Work alongside passionate educators, engineers, and designers who care deeply about what they build.",
          },
          {
            icon: <BookOpen className="h-6 w-6" />,
            title: "Keep Learning",
            body: "We offer learning budgets, mentorship programs, and regular knowledge-sharing sessions to fuel your growth.",
          },
        ];

  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="overflow-x-hidden bg-white text-slate-800 selection:bg-yellow-200/60">
      <ToastContainer />

      {/* ─── HERO ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[url('/join.jpeg')] bg-cover bg-center">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/85 via-blue-900/75 to-indigo-900/70" />
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-1/2 h-80 w-80 rounded-full bg-amber-400/15 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-6xl px-6 py-28 md:py-36">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white/90 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
              We're hiring — come build with us
            </span>

            <h1 className="mt-6 text-5xl font-extrabold leading-tight tracking-tight text-white md:text-6xl lg:text-7xl">
              Shape the Future
              <br />
              of <span className="text-yellow-300">Education</span>
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-blue-100/80">
              Join a team of builders, educators, and dreamers who believe that
              better tools create better learners.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#openings"
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .querySelector("#openings")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-blue-950 shadow-lg shadow-yellow-400/25 transition hover:bg-yellow-300 active:scale-[.98]"
              >
                View Open Roles
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#why"
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .querySelector("#why")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                Our Culture
              </a>
            </div>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4"
          >
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-center backdrop-blur"
              >
                <p className="text-2xl font-extrabold text-white">{s.value}</p>
                <p className="mt-0.5 text-xs text-blue-200">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Curve divider */}
        <svg
          className="pointer-events-none absolute -bottom-[1px] left-0 w-full"
          viewBox="0 0 1440 80"
          aria-hidden
        >
          <path
            fill="#ffffff"
            d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z"
          />
        </svg>
      </section>

      {/* ─── MISSION STRIP ────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-blue-500">
            Our Mission
          </p>
          <h2 className="mt-3 text-3xl font-extrabold leading-snug text-slate-900 md:text-4xl">
            We build education that puts <br className="hidden sm:block" />
            students <span className="text-blue-600">first</span>.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-500">
            {introText}
          </p>
        </motion.div>
      </section>

      {/* ─── VALUES ───────────────────────────────────────── */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-blue-500">
              What We Stand For
            </p>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900">
              Our Values
            </h2>
          </motion.div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {VALUES.map((v, i) => (
              <motion.div
                key={v.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.05 * i }}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div
                  className={`inline-flex items-center justify-center rounded-xl border p-3 ${v.color}`}
                >
                  {v.icon}
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">
                  {v.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                  {v.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHY JOIN ─────────────────────────────────────── */}
      <section id="why" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-blue-500">
              Benefits & Perks
            </p>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900">
              {whyJoinTitle}
            </h2>
          </motion.div>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {whyItems.map((f, i) => (
              <motion.div
                key={f.title + i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.08 * i }}
                className="group relative flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm transition hover:border-blue-100 hover:shadow-lg"
              >
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/25 transition group-hover:scale-105">
                  {f.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                    {f.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── JOB OPENINGS ─────────────────────────────────── */}
      <section id="openings" className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col gap-10 lg:flex-row lg:gap-16">

            {/* Left sticky sidebar */}
            <div className="lg:w-64 lg:shrink-0">
              <div className="lg:sticky lg:top-28">
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="text-4xl font-extrabold leading-tight text-slate-900 md:text-5xl">
                    {jobSectionTitle}
                  </h2>
                  <p className="mt-5 text-sm leading-relaxed text-slate-500">
                    Don't see the right fit? We'd still love to hear from you.
                  </p>
                  <div className="mt-6 space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                      Or contact us with
                    </p>
                    <a
                      href="mailto:careers@eec.edu"
                      className="text-base font-semibold text-blue-600 underline underline-offset-2 hover:text-blue-800 transition"
                    >
                      careers@eec.edu
                    </a>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Right: job rows */}
            <div className="flex-1">
              {jobs.map((job, i) => (
                <JobRow
                  key={job.title + i}
                  job={job}
                  index={i}
                  onApply={(title) => {
                    setSelectedJobTitle(title);
                    setApplyOpen(true);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <CareerApplyModal
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        jobs={jobs}
        defaultJobTitle={selectedJobTitle}
      />

      {/* ─── CTA BANNER ───────────────────────────────────── */}
      <section className="relative overflow-hidden bg-blue-600 py-20">
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-blue-500/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 right-0 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl" />
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="relative z-10 mx-auto max-w-3xl px-6 text-center"
        >
          <h2 className="text-3xl font-extrabold text-white md:text-4xl">
            Don't see the right role?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-blue-100">
            We're always open to talented people. Send us your portfolio or CV
            and we'll keep you in mind for future openings.
          </p>
          <a
            href="mailto:careers@eec.edu"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3 text-sm font-bold text-blue-700 shadow-lg shadow-blue-900/20 transition hover:bg-blue-50 active:scale-[.98]"
          >
            Get in Touch
            <ArrowRight className="h-4 w-4" />
          </a>
        </motion.div>
      </section>
    </div>
  );
}
