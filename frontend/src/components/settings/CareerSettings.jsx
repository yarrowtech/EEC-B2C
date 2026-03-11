import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  BriefcaseBusiness,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  ToggleLeft,
  ToggleRight,
  Link,
  AlignLeft,
  Users,
  Phone,
} from "lucide-react";
import { ToastContainer } from "react-toastify";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const emptyWhyItem = { title: "", description: "", icon: "" };
const defaultContacts = [
  { id: "address", title: "Office Address", value: "", type: "address" },
  { id: "phone", title: "Contact Number", value: "", type: "phone" },
  { id: "email", title: "Email", value: "", type: "email" },
];
const emptyJob = {
  title: "",
  tag: "Opening",
  employmentType: "Full-time",
  department: "",
  location: "",
  workMode: "Remote / On-site",
  salary: "",
  shortDescription: "",
  fullDescription: "",
  points: ["", "", ""],
  experience: "",
  buttonLabel: "Apply Now",
  isActive: true,
  order: 0,
};

/* ── small reusable pieces ──────────────────────── */
function Label({ children, className = "" }) {
  return (
    <label className={`block text-xs font-semibold text-slate-600 mb-1 ${className}`}>
      {children}
    </label>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${className}`}
      {...props}
    />
  );
}

function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition resize-none focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${className}`}
      {...props}
    />
  );
}

function SectionCard({ icon, title, description, children, accent = "indigo" }) {
  const accents = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-6 py-4">
        <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border ${accents[accent]}`}>
          {icon}
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          {description && (
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
        checked
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "bg-slate-100 text-slate-500 border border-slate-200"
      }`}
    >
      {checked ? (
        <ToggleRight className="h-3.5 w-3.5" />
      ) : (
        <ToggleLeft className="h-3.5 w-3.5" />
      )}
      {checked ? "Active" : "Inactive"}
    </button>
  );
}

/* ── collapsible job card ───────────────────────── */
function JobCard({ job, index, total, onUpdate, onUpdatePoint, onRemove }) {
  const [open, setOpen] = useState(index === 0);

  return (
    <div className={`rounded-xl border transition ${job.isActive ? "border-slate-200" : "border-slate-100 opacity-60"} bg-white shadow-sm`}>
      {/* Card header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
          {index + 1}
        </span>
        <p className="flex-1 text-sm font-semibold text-slate-800 truncate">
          {job.title || `Job Opening ${index + 1}`}
        </p>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Toggle
            checked={job.isActive}
            onChange={(v) => onUpdate(index, "isActive", v)}
          />
          {total > 1 && (
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="rounded-lg border border-rose-100 bg-rose-50 p-1.5 text-rose-500 hover:bg-rose-100 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </div>

      {/* Collapsible body */}
      {open && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Job Title *</Label>
              <Input
                placeholder="e.g. Frontend Developer"
                value={job.title}
                onChange={(e) => onUpdate(index, "title", e.target.value)}
              />
            </div>
            <div>
              <Label>Badge / Tag</Label>
              <Input
                placeholder="e.g. Full-time, Contract"
                value={job.tag}
                onChange={(e) => onUpdate(index, "tag", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Employment Type</Label>
              <select
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={job.employmentType || "Full-time"}
                onChange={(e) => onUpdate(index, "employmentType", e.target.value)}
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Internship">Internship</option>
                <option value="Contract">Contract</option>
                <option value="Freelance">Freelance</option>
              </select>
            </div>
            <div>
              <Label>Department</Label>
              <Input
                placeholder="e.g. Engineering"
                value={job.department || ""}
                onChange={(e) => onUpdate(index, "department", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Short Description</Label>
            <Textarea
              rows={3}
              placeholder="Brief description of the role..."
              value={job.shortDescription}
              onChange={(e) => onUpdate(index, "shortDescription", e.target.value)}
            />
          </div>

          <div>
            <Label>Full Job Details</Label>
            <Textarea
              rows={5}
              placeholder="Detailed role information for the job details page..."
              value={job.fullDescription || ""}
              onChange={(e) => onUpdate(index, "fullDescription", e.target.value)}
            />
          </div>

          <div>
            <Label>Requirements (Bullet Points)</Label>
            <div className="space-y-2">
              {(job.points || ["", "", ""]).map((p, pIndex) => (
                <div key={pIndex} className="flex items-center gap-2">
                  <span className="shrink-0 text-xs font-medium text-slate-400 w-4">{pIndex + 1}.</span>
                  <Input
                    placeholder={`Requirement ${pIndex + 1}`}
                    value={p}
                    onChange={(e) => onUpdatePoint(index, pIndex, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Location</Label>
              <Input
                placeholder="e.g. Kolkata, India"
                value={job.location || ""}
                onChange={(e) => onUpdate(index, "location", e.target.value)}
              />
            </div>
            <div>
              <Label>Work Mode</Label>
              <Input
                placeholder="e.g. On-site / Hybrid / Remote"
                value={job.workMode || ""}
                onChange={(e) => onUpdate(index, "workMode", e.target.value)}
              />
            </div>
            <div>
              <Label>Salary / Stipend</Label>
              <Input
                placeholder="e.g. ₹4-7 LPA or ₹15,000/month"
                value={job.salary || ""}
                onChange={(e) => onUpdate(index, "salary", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Experience Required</Label>
              <Input
                placeholder="e.g. 2+ Years"
                value={job.experience}
                onChange={(e) => onUpdate(index, "experience", e.target.value)}
              />
            </div>
            <div>
              <Label>Button Label</Label>
              <Input
                placeholder="Apply Now"
                value={job.buttonLabel}
                onChange={(e) => onUpdate(index, "buttonLabel", e.target.value)}
              />
            </div>
            <div>
              <Label>Display Order</Label>
              <Input
                type="number"
                placeholder="0"
                value={job.order}
                onChange={(e) => onUpdate(index, "order", Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <Label>Application Form URL</Label>
            <div className="relative">
              <Link className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                className="pl-8"
                placeholder="https://forms.google.com/..."
                value={job.formUrl || ""}
                onChange={(e) => onUpdate(index, "formUrl", e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── main component ─────────────────────────────── */
const CareerSettings = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [whyJoinTitle, setWhyJoinTitle] = useState("Why Join EEC?");
  const [whyJoinItems, setWhyJoinItems] = useState([emptyWhyItem]);
  const [introText, setIntroText] = useState("");
  const [jobSectionTitle, setJobSectionTitle] = useState("Open Positions");
  const [jobOpenings, setJobOpenings] = useState([emptyJob]);
  const [contactItems, setContactItems] = useState(defaultContacts);

  useEffect(() => {
    function normalizeContacts(officeDoc) {
      if (Array.isArray(officeDoc?.contacts) && officeDoc.contacts.length) {
        return officeDoc.contacts;
      }
      return [
        { id: "address", title: "Office Address", value: officeDoc?.address || "", type: "address" },
        { id: "phone", title: "Contact Number", value: officeDoc?.phone || "", type: "phone" },
        { id: "email", title: "Email", value: officeDoc?.email || "", type: "email" },
      ];
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [careerRes, officeRes] = await Promise.all([
          axios.get(`${API_BASE}/api/settings/career-page`),
          axios.get(`${API_BASE}/api/office`),
        ]);
        const data = careerRes.data || {};
        const office = officeRes.data || {};

        setWhyJoinTitle(data.whyJoinTitle || "Why Join EEC?");
        setWhyJoinItems(data.whyJoinItems?.length ? data.whyJoinItems : [emptyWhyItem]);
        setIntroText(data.introText || "");
        setJobSectionTitle(data.jobSectionTitle || "Open Positions");
        setJobOpenings(
          data.jobOpenings?.length
            ? data.jobOpenings.map((job) => ({
                ...emptyJob,
                ...job,
                points: Array.isArray(job?.points) ? job.points : ["", "", ""],
              }))
            : [emptyJob]
        );
        setContactItems(normalizeContacts(office));
      } catch (err) {
        console.error(err);
        toast.error("Failed to load career page data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const token = localStorage.getItem("admin_token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      };

      await axios.put(
        `${API_BASE}/api/settings/career-page`,
        {
          whyJoinTitle,
          whyJoinItems,
          introText,
          jobSectionTitle,
          jobOpenings: (jobOpenings || [])
            .map((job, index) => ({
              title: String(job?.title || "").trim(),
              tag: String(job?.tag || "Opening").trim() || "Opening",
              employmentType:
                String(job?.employmentType || "Full-time").trim() || "Full-time",
              department: String(job?.department || "").trim(),
              location: String(job?.location || "").trim(),
              workMode:
                String(job?.workMode || "Remote / On-site").trim() || "Remote / On-site",
              salary: String(job?.salary || "").trim(),
              shortDescription: String(job?.shortDescription || "").trim(),
              fullDescription: String(job?.fullDescription || "").trim(),
              points: Array.isArray(job?.points)
                ? job.points.map((p) => String(p || "").trim()).filter(Boolean)
                : [],
              experience: String(job?.experience || "").trim(),
              buttonLabel: String(job?.buttonLabel || "Apply Now").trim() || "Apply Now",
              isActive: Boolean(job?.isActive),
              order: Number.isFinite(Number(job?.order)) ? Number(job?.order) : index,
              formUrl: String(job?.formUrl || "").trim(),
            }))
            .filter((job) => job.title),
        },
        { headers }
      );

      const normalizedContacts = (contactItems || [])
        .map((item, idx) => ({
          id: item?.id || `contact-${Date.now()}-${idx}`,
          title: String(item?.title || "").trim(),
          value: String(item?.value || "").trim(),
          type: String(item?.type || "text").trim() || "text",
        }))
        .filter((item) => item.title || item.value);

      await axios.put(
        `${API_BASE}/api/office`,
        {
          contacts: normalizedContacts,
          address: normalizedContacts.find((i) => i.type === "address")?.value || "",
          phone: normalizedContacts.find((i) => i.type === "phone")?.value || "",
          email: normalizedContacts.find((i) => i.type === "email")?.value || "",
        },
        { headers }
      );

      toast.success("Career page updated successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update data");
    } finally {
      setSaving(false);
    }
  };

  const updateWhyItem = (index, key, value) =>
    setWhyJoinItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: value };
      return copy;
    });

  const updateJob = (index, key, value) =>
    setJobOpenings((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: value };
      return copy;
    });

  const updateJobPoint = (jobIndex, pointIndex, value) =>
    setJobOpenings((prev) => {
      const copy = [...prev];
      const points = [...(copy[jobIndex].points || [])];
      points[pointIndex] = value;
      copy[jobIndex] = { ...copy[jobIndex], points };
      return copy;
    });

  const updateContactItem = (index, key, value) =>
    setContactItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: value };
      return copy;
    });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <ToastContainer />

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/25">
            <BriefcaseBusiness size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Career Page Settings</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage job openings, intro text, and why-join cards
            </p>
          </div>
        </div>
        {loading && (
          <span className="text-xs text-slate-400 animate-pulse">Loading…</span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-5">

        {/* ── Intro Paragraph ── */}
        <SectionCard
          icon={<AlignLeft className="h-4 w-4" />}
          title="Intro / Mission Statement"
          description="Displayed below the hero headline on the careers page"
          accent="blue"
        >
          <Textarea
            rows={5}
            value={introText}
            onChange={(e) => setIntroText(e.target.value)}
            placeholder="At EEC, we're on a mission to transform education…"
          />
        </SectionCard>

        {/* ── Why Join Section ── */}
        <SectionCard
          icon={<Users className="h-4 w-4" />}
          title="Why Join EEC? — Cards"
          description="Feature cards shown in the 'Why Join' section"
          accent="indigo"
        >
          <div className="space-y-4">
            <div>
              <Label>Section Title</Label>
              <Input
                value={whyJoinTitle}
                onChange={(e) => setWhyJoinTitle(e.target.value)}
                placeholder="Why Join EEC?"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {whyJoinItems.map((item, index) => (
                <div
                  key={index}
                  className="relative rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Card {index + 1}</span>
                    {whyJoinItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setWhyJoinItems((prev) => prev.filter((_, i) => i !== index))
                        }
                        className="rounded-md p-1 text-rose-400 hover:bg-rose-50 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div>
                    <Label>Title</Label>
                    <Input
                      placeholder="e.g. Innovative Culture"
                      value={item.title}
                      onChange={(e) => updateWhyItem(index, "title", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      rows={3}
                      placeholder="Short description..."
                      value={item.description}
                      onChange={(e) => updateWhyItem(index, "description", e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setWhyJoinItems((prev) => [...prev, { ...emptyWhyItem }])}
              className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-4 py-2 text-xs font-semibold text-slate-500 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Card
            </button>
          </div>
        </SectionCard>

        {/* ── Job Openings ── */}
        <SectionCard
          icon={<BriefcaseBusiness className="h-4 w-4" />}
          title="Job Openings"
          description="Active openings are shown on the public careers page"
          accent="emerald"
        >
          <div className="space-y-4">
            <div>
              <Label>Section Heading</Label>
              <Input
                value={jobSectionTitle}
                onChange={(e) => setJobSectionTitle(e.target.value)}
                placeholder="Open Positions"
              />
            </div>

            <div className="space-y-3">
              {jobOpenings.map((job, index) => (
                <JobCard
                  key={job._id || index}
                  job={job}
                  index={index}
                  total={jobOpenings.length}
                  onUpdate={updateJob}
                  onUpdatePoint={updateJobPoint}
                  onRemove={(i) =>
                    setJobOpenings((prev) => prev.filter((_, idx) => idx !== i))
                  }
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => setJobOpenings((prev) => [...prev, { ...emptyJob }])}
              className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-4 py-2 text-xs font-semibold text-slate-500 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Job Opening
            </button>
          </div>
        </SectionCard>

        {/* ── Contact Info ── */}
        <SectionCard
          icon={<Phone className="h-4 w-4" />}
          title="Contact Information"
          description="Displayed in the contact / footer section"
          accent="rose"
        >
          <div className="space-y-3">
            {contactItems.map((item, index) => (
              <div
                key={item.id || index}
                className="grid gap-2 sm:grid-cols-12 items-end"
              >
                <div className="sm:col-span-3">
                  {index === 0 && <Label>Label</Label>}
                  <Input
                    placeholder="e.g. Office Address"
                    value={item.title || ""}
                    onChange={(e) => updateContactItem(index, "title", e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  {index === 0 && <Label>Type</Label>}
                  <select
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={item.type || "text"}
                    onChange={(e) => updateContactItem(index, "type", e.target.value)}
                  >
                    <option value="text">Text</option>
                    <option value="address">Address</option>
                    <option value="phone">Phone</option>
                    <option value="email">Email</option>
                  </select>
                </div>
                <div className="sm:col-span-6">
                  {index === 0 && <Label>Value</Label>}
                  <Input
                    placeholder="Contact value..."
                    value={item.value || ""}
                    onChange={(e) => updateContactItem(index, "value", e.target.value)}
                  />
                </div>
                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      setContactItems((prev) => prev.filter((_, i) => i !== index))
                    }
                    className="rounded-lg border border-rose-100 bg-rose-50 p-2 text-rose-500 hover:bg-rose-100 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                setContactItems((prev) => [
                  ...prev,
                  { id: `contact-${Date.now()}`, title: "", value: "", type: "text" },
                ])
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-4 py-2 text-xs font-semibold text-slate-500 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Contact Field
            </button>
          </div>
        </SectionCard>

        {/* ── Save ── */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <p className="text-xs text-slate-400">All sections save together</p>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-600/25 transition hover:bg-indigo-700 active:scale-[.98] disabled:opacity-60"
          >
            {saving ? (
              <>
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CareerSettings;
