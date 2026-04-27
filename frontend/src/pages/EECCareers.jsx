// src/pages/EECCareers.jsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  UserPlus,
  Sparkles,
  Lightbulb,
  Handshake,
  Mail,
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
import PageIntroLoader from "../components/PageIntroLoader";
import usePageIntroLoader from "../hooks/usePageIntroLoader";

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
    body: "We invest in our people because when you grow, Edify Eight grows.",
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
  const [officeData, setOfficeData] = useState(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [selectedJobTitle, setSelectedJobTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCareer() {
      try {
        setLoading(true);

        // Check cache first
        const CACHE_KEY = 'eec:careers:cache';
        const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData);
            if (parsed && typeof parsed.ts === 'number' && Date.now() - parsed.ts < CACHE_TTL) {
              // Use cached data
              setCareerData(parsed.data);
              setLoading(false);
              return;
            }
          } catch (e) {
            // Invalid cache, continue to fetch
          }
        }

        // Fetch from API
        const res = await fetch(`${API_BASE}/api/settings/career-page`);
        const json = await res.json();

        // Cache the data
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          ts: Date.now(),
          data: json
        }));

        // Add a small delay for smooth transition
        await new Promise(resolve => setTimeout(resolve, 500));
        setCareerData(json);
      } catch (err) {
        console.error("Failed to load career page:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCareer();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadOffice() {
      try {
        const res = await fetch(`${API_BASE}/api/office`);
        const json = await res.json().catch(() => ({}));
        if (!res.ok || cancelled) return;
        setOfficeData(json);
      } catch (err) {
        console.error("Failed to load office contact for careers:", err);
      }
    }
    loadOffice();
    return () => {
      cancelled = true;
    };
  }, []);

  function normalizeTextValue(value) {
    if (typeof value === "string") return value.trim();
    if (value && typeof value === "object") {
      if (typeof value.value === "string") return value.value.trim();
      if (typeof value.email === "string") return value.email.trim();
    }
    return "";
  }

  const careersEmail =
    normalizeTextValue(
      Array.isArray(officeData?.contacts)
        ? officeData.contacts.find((c) => c?.type === "email")?.value
        : ""
    ) ||
    normalizeTextValue(officeData?.email) ||
    "careers@edifyeight.com";

  const introText =
    careerData?.introText ||
    "At Edify Eight, we're on a mission to transform education for the next generation. We blend technology, pedagogy, and empathy to build tools that genuinely help students thrive — academically and personally. If you're driven by purpose and want your work to matter, you've found the right place.";

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
          // {
          //   title: "Frontend Developer",
          //   badge: "Full-time",
          //   desc: "Build beautiful, fast, and accessible interfaces for our EEC learning platform using modern web technologies.",
          //   reqs: [
          //     "Proficiency in React and TypeScript",
          //     "Strong eye for design and UX detail",
          //     "2+ years of frontend experience",
          //   ],
          //   form: "",
          //   buttonLabel: "Apply Now",
          //   experience: "2+ Years",
          //   department: "Engineering",
          //   location: "Kolkata, India",
          //   workMode: "Hybrid",
          //   salary: "₹6-10 LPA",
          //   fullDescription:
          //     "You will work closely with product and design teams to build scalable, accessible, and high-performing user interfaces for students and educators.",
          //   slug: toJobSlug("Frontend Developer", 0),
          // },
          // {
          //   title: "Backend Developer",
          //   badge: "Full-time",
          //   desc: "Design and scale the APIs and infrastructure that power EEC's learning engine for thousands of students.",
          //   reqs: [
          //     "Experience with Node.js or Python",
          //     "Familiarity with SQL and NoSQL databases",
          //     "3+ years of backend experience",
          //   ],
          //   form: "",
          //   buttonLabel: "Apply Now",
          //   experience: "3+ Years",
          //   department: "Engineering",
          //   location: "Kolkata, India",
          //   workMode: "Hybrid",
          //   salary: "₹8-14 LPA",
          //   fullDescription:
          //     "You will design secure APIs, optimize data models, and improve platform reliability for large-scale learning workflows.",
          //   slug: toJobSlug("Backend Developer", 1),
          // },
          // {
          //   title: "UX/UI Designer",
          //   badge: "Full-time",
          //   desc: "Craft intuitive, beautiful experiences that make complex educational content simple and engaging for students.",
          //   reqs: [
          //     "Portfolio showcasing product design work",
          //     "Expertise in Figma and design systems",
          //     "2+ years of product design experience",
          //   ],
          //   form: "",
          //   buttonLabel: "Apply Now",
          //   experience: "2+ Years",
          //   department: "Design",
          //   location: "Kolkata, India",
          //   workMode: "On-site",
          //   salary: "₹5-9 LPA",
          //   fullDescription:
          //     "You will drive user research, create design systems, and craft intuitive learning experiences across web and mobile touchpoints.",
          //   slug: toJobSlug("UX/UI Designer", 2),
          // },
        ];

  const whyJoinTitle = careerData?.whyJoinTitle || "Why Join Edify Eight?";

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

  const introLoading = usePageIntroLoader("eec:intro:careers", 800);
  if (introLoading) {
    return <PageIntroLoader message="Preparing opportunities..." />;
  }

  if (loading) {
    return <PageIntroLoader message="Loading Career Opportunities..." />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-[#fffaf1] text-[#142239] selection:bg-yellow-200/60"
    >
      <ToastContainer />

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#fffef5] to-[#fff4df] px-4 py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 md:items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-[#ffd23f]/25 px-4 py-2 text-xs font-bold uppercase tracking-[0.35em] text-[#1e1e2a]">
              <Sparkles className="h-4 w-4 text-[#f3a600]" />
              We're Hiring
            </span>
            <h1 className="text-4xl font-black leading-tight tracking-tight text-[#121225] sm:text-5xl lg:text-6xl">
              Shape the Future of <span className="text-[#f0b429]">Education</span>
            </h1>
            <p className="text-base leading-relaxed text-[#414965] md:text-lg">
              Join a team dedicated to transforming the learning experience through innovation, compassion, and bold ideas. Everything you build at Edify Eight reaches a student who needs it.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => document.querySelector("#openings")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex min-w-[180px] items-center justify-center rounded-full bg-[#ffd23f] px-8 py-3 text-sm font-extrabold uppercase tracking-widest text-[#211d11] shadow-[0_15px_30px_rgba(255,210,63,0.35)] transition hover:-translate-y-0.5"
              >
                View Openings
              </button>
              <button
                onClick={() => document.querySelector("#mission")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex min-w-[180px] items-center justify-center rounded-full border-4 border-[#ffd23f] px-8 py-3 text-sm font-extrabold uppercase tracking-widest text-[#142239] transition hover:bg-[#ffd23f]/10"
              >
                Our Story
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-6 sm:grid-cols-4">
              {STATS.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-[#f2e2bd] bg-white px-4 py-3 text-center shadow-[0_12px_30px_rgba(0,0,0,0.04)]">
                  <p className="text-2xl font-black text-[#1c2a3b]">{stat.value}</p>
                  <p className="text-xs font-semibold text-[#5c6378]">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative rounded-[32px] border-8 border-white bg-white shadow-[0_40px_80px_rgba(20,25,38,0.12)]"
          >
            <div className="absolute -top-6 -left-6 h-24 w-24 rounded-full bg-[#ffd23f]/30 blur-3xl" />
            <img
              src={careerData?.heroImage || "/join.jpeg"}
              alt="Careers at Edify Eight"
              className="h-full w-full rounded-[24px] object-cover"
            />
            <div className="absolute bottom-6 left-6 rounded-2xl bg-white/95 px-4 py-3 text-sm font-semibold text-[#1d2a3c] shadow-lg">
              Empowering learners, one build at a time.
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section id="mission" className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} transition={{ duration: 0.55 }}>
            <p className="text-xs font-bold uppercase tracking-[0.45em] text-[#f0b429]">Our Mission</p>
            <h2 className="mt-4 text-3xl font-black text-[#0f1828] md:text-4xl">We build education that puts students first</h2>
            <p className="mt-5 text-lg leading-relaxed text-[#485067]">{introText}</p>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-white px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.45em] text-[#f0b429]">Our Values</p>
              <h3 className="mt-3 text-3xl font-black text-[#121728] sm:text-4xl">How we navigate every project</h3>
            </div>
            <Sparkles className="h-10 w-10 text-[#ffd23f]" />
          </motion.div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {VALUES.map((value, idx) => (
              <motion.div
                key={value.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.05 * idx }}
                className="rounded-3xl border-4 border-transparent bg-[#fffaf1] p-8 shadow-[0_18px_40px_rgba(15,22,32,0.06)] transition hover:border-[#ffd23f]"
              >
                <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ffd23f] text-[#1c1c23] shadow-lg">
                  {value.icon}
                </div>
                <h4 className="text-xl font-black text-[#141b2c]">{value.title}</h4>
                <p className="mt-2 text-sm text-[#4a546a]">{value.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why join */}
      <section id="why" className="bg-[#fef4dc] px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <p className="text-xs font-bold uppercase tracking-[0.45em] text-[#d77e32]">Life at Edify Eight</p>
            <h3 className="mt-3 text-3xl font-black text-[#1a2235]">{whyJoinTitle}</h3>
          </motion.div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {whyItems.map((item, idx) => (
              <motion.div
                key={item.title + idx}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.05 * idx }}
                className="rounded-[28px] border border-[#f7d9a8] bg-white p-6 text-left shadow-[0_20px_45px_rgba(212,149,70,0.15)]"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1f2a3d] text-white">
                  {item.icon}
                </div>
                <h4 className="text-lg font-bold text-[#1a1f2e]">{item.title}</h4>
                <p className="mt-2 text-sm text-[#4a4f63]">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Job openings */}
      <section id="openings" className="bg-white px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[280px,1fr] lg:items-start">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-[24px] border border-[#f1f1f1] bg-[#fffaf4] p-6 shadow-sm lg:sticky lg:top-24"
            >
              <p className="text-xs font-bold uppercase tracking-[0.45em] text-[#f0b429]">Join the team</p>
              <h3 className="mt-3 text-3xl font-black text-[#151c2b]">{jobSectionTitle}</h3>
              <p className="mt-4 text-sm leading-relaxed text-[#4c5469]">
                Don't see a perfect fit? Send us your CV and we'll reach out when the right role opens up.
              </p>
              <div className="mt-6 rounded-2xl bg-white p-4 shadow">
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#d77e32]">Contact</p>
                <a href={`mailto:${careersEmail}`} className="mt-2 inline-flex items-center gap-2 text-base font-semibold text-[#1f3b5b] hover:underline">
                  <Mail className="h-4 w-4" />
                  {careersEmail}
                </a>
              </div>
            </motion.div>

            <div className="rounded-[32px] border border-[#f0f0f0] bg-[#fffefa] p-8 shadow-[0_25px_60px_rgba(16,25,40,0.08)]">
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

      <CareerApplyModal open={applyOpen} onClose={() => setApplyOpen(false)} jobs={jobs} defaultJobTitle={selectedJobTitle} />

      {/* CTA */}
      <section className="relative overflow-hidden bg-[#142239] px-4 py-20 text-white">
        <div className="pointer-events-none absolute -left-16 top-0 h-64 w-64 rounded-full bg-[#ffd23f]/20 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-10 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative z-10 mx-auto max-w-3xl text-center"
        >
          <h3 className="text-3xl font-black md:text-4xl">Not seeing your role yet?</h3>
          <p className="mt-4 text-base text-blue-100">
            We're always open to talented people. Send us your portfolio or CV and we'll keep you in mind for future openings.
          </p>
          <a
            href={`mailto:${careersEmail}`}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-bold uppercase tracking-[0.3em] text-[#142239] shadow-lg transition hover:-translate-y-0.5"
          >
            Get in touch
            <ArrowRight className="h-4 w-4" />
          </a>
        </motion.div>
      </section>
    </motion.div>
  );
}
