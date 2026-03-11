import { useEffect, useMemo, useState } from "react";
import { X, Upload, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function CareerApplyModal({
  open,
  onClose,
  jobs = [],
  defaultJobTitle = "",
}) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    jobPosition: "",
    message: "",
    cv: null,
  });

  const jobOptions = useMemo(
    () => jobs.map((job) => String(job?.title || "").trim()).filter(Boolean),
    [jobs]
  );

  useEffect(() => {
    if (!open) return;
    let user = null;
    try {
      user = JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      user = null;
    }
    setForm({
      name: user?.name || "",
      email: user?.email || "",
      phone: "",
      jobPosition:
        defaultJobTitle && jobOptions.includes(defaultJobTitle)
          ? defaultJobTitle
          : jobOptions[0] || defaultJobTitle || "",
      message: "",
      cv: null,
    });
  }, [open, defaultJobTitle, jobOptions]);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;

  const onField = (key, value) =>
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

  const submit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) return toast.error("Please enter your name");
    if (!form.email.trim()) return toast.error("Please enter your email");
    if (!form.jobPosition.trim()) return toast.error("Please select job position");
    if (!form.cv) return toast.error("Please upload your CV");

    const fd = new FormData();
    fd.append("name", form.name.trim());
    fd.append("email", form.email.trim());
    fd.append("phone", form.phone.trim());
    fd.append("jobPosition", form.jobPosition.trim());
    fd.append("message", form.message.trim());
    fd.append("cv", form.cv);

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/api/career-applications/apply`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Failed to submit application");
      }
      toast.success("Application submitted successfully");
      onClose?.();
    } catch (err) {
      toast.error(err?.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/55 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="text-lg font-bold text-slate-900">Apply For Job</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 px-5 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-slate-700">
              Name *
              <input
                type="text"
                value={form.name}
                onChange={(e) => onField("name", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                required
              />
            </label>
            <label className="block text-sm text-slate-700">
              Email *
              <input
                type="email"
                value={form.email}
                onChange={(e) => onField("email", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                required
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-slate-700">
              Job Position *
              <select
                value={form.jobPosition}
                onChange={(e) => onField("jobPosition", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                required
              >
                {jobOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
                {!jobOptions.length && <option value="">No active position</option>}
              </select>
            </label>

            <label className="block text-sm text-slate-700">
              Phone
              <input
                type="text"
                value={form.phone}
                onChange={(e) => onField("phone", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </label>
          </div>

          <label className="block text-sm text-slate-700">
            CV (PDF/DOC/DOCX) *
            <label className="mt-1 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
              <Upload className="h-4 w-4" />
              <span>{form.cv ? form.cv.name : "Choose file"}</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(e) => onField("cv", e.target.files?.[0] || null)}
                required
              />
            </label>
          </label>

          <label className="block text-sm text-slate-700">
            Message (optional)
            <textarea
              rows={3}
              value={form.message}
              onChange={(e) => onField("message", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              placeholder="Add a short note..."
            />
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
