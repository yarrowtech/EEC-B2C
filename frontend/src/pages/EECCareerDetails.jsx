import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  UserPlus,
  Briefcase,
  Clock,
  MapPin,
  Building2,
  IndianRupee,
  CheckCircle2,
} from "lucide-react";
import CareerApplyModal from "../components/careers/CareerApplyModal";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function toJobSlug(title, index) {
  const base = String(title || "job")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "job"}-${index + 1}`;
}

function getFallbackJobs() {
  return [
    {
      title: "Frontend Developer",
      badge: "Full-time",
      desc: "Build beautiful, fast, and accessible interfaces for our EEC learning platform using modern web technologies.",
      fullDescription:
        "You will work closely with product and design teams to build scalable, accessible, and high-performing user interfaces for students and educators.",
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
      slug: toJobSlug("Frontend Developer", 0),
    },
    {
      title: "Backend Developer",
      badge: "Full-time",
      desc: "Design and scale the APIs and infrastructure that power EEC's learning engine for thousands of students.",
      fullDescription:
        "You will design secure APIs, optimize data models, and improve platform reliability for large-scale learning workflows.",
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
      slug: toJobSlug("Backend Developer", 1),
    },
    {
      title: "UX/UI Designer",
      badge: "Full-time",
      desc: "Craft intuitive, beautiful experiences that make complex educational content simple and engaging for students.",
      fullDescription:
        "You will drive user research, create design systems, and craft intuitive learning experiences across web and mobile touchpoints.",
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
      slug: toJobSlug("UX/UI Designer", 2),
    },
  ];
}

function mapJobs(careerData) {
  if (!(careerData?.jobOpenings && careerData.jobOpenings.length)) {
    return getFallbackJobs();
  }
  return careerData.jobOpenings
    .filter((j) => j.isActive)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((j, index) => ({
      title: j.title,
      badge: j.employmentType || j.tag || j.badge || "Full-time",
      desc: j.shortDescription || "",
      fullDescription: j.fullDescription || "",
      reqs: Array.isArray(j.points) ? j.points : [],
      form: j.formUrl || "",
      buttonLabel: j.buttonLabel || "Apply Now",
      experience: j.experience || "",
      department: j.department || "",
      location: j.location || "",
      workMode: j.workMode || "",
      salary: j.salary || "",
      slug: toJobSlug(j.title, index),
    }));
}

export default function EECCareerDetails() {
  const { jobSlug } = useParams();
  const [careerData, setCareerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);

  useEffect(() => {
    async function loadCareer() {
      try {
        const res = await fetch(`${API_BASE}/api/settings/career-page`);
        const json = await res.json();
        setCareerData(json);
      } catch (err) {
        console.error("Failed to load career detail page:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCareer();
  }, []);

  const jobs = useMemo(() => mapJobs(careerData), [careerData]);
  const job = useMemo(() => jobs.find((item) => item.slug === jobSlug), [jobs, jobSlug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-20 text-center text-slate-500">
        Loading job details...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-20">
        <p className="text-lg font-semibold text-slate-900">Job not found.</p>
        <p className="mt-2 text-slate-500">This opening may have been removed or the link is outdated.</p>
        <Link
          to="/careers"
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Careers
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/70 py-14">
      <div className="mx-auto max-w-5xl px-6">
        <Link
          to="/careers"
          className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Careers
        </Link>

        <article className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-0.5 text-xs font-semibold text-blue-700">
              <Briefcase className="h-3 w-3" />
              {job.badge}
            </span>
            {job.experience && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-3 py-0.5 text-xs font-semibold text-slate-600">
                <Clock className="h-3 w-3" />
                {job.experience}
              </span>
            )}
            {job.workMode && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-3 py-0.5 text-xs font-semibold text-slate-600">
                <MapPin className="h-3 w-3" />
                {job.workMode}
              </span>
            )}
            {job.location && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-3 py-0.5 text-xs font-semibold text-slate-600">
                <MapPin className="h-3 w-3" />
                {job.location}
              </span>
            )}
            {job.department && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-3 py-0.5 text-xs font-semibold text-slate-600">
                <Building2 className="h-3 w-3" />
                {job.department}
              </span>
            )}
            {job.salary && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-0.5 text-xs font-semibold text-emerald-700">
                <IndianRupee className="h-3 w-3" />
                {job.salary}
              </span>
            )}
          </div>

          <h1 className="mt-4 text-3xl font-extrabold text-slate-900">{job.title}</h1>
          <p className="mt-3 text-slate-600">{job.desc}</p>

          {(job.fullDescription || "").trim() && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h2 className="text-sm font-semibold text-slate-900">Full Details</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                {job.fullDescription}
              </p>
            </div>
          )}

          {job.reqs?.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-slate-900">Requirements</h2>
              <ul className="mt-3 space-y-2">
                {job.reqs.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setApplyOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[.98]"
            >
              <UserPlus className="h-4 w-4" />
              {job.buttonLabel || "Apply Now"}
            </a>
          </div>
        </article>
      </div>

      <CareerApplyModal
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        jobs={jobs}
        defaultJobTitle={job.title}
      />
    </div>
  );
}
