import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  Pencil,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";

const CATEGORY_OPTIONS = [
  "Notes",
  "Reference Books",
  "Practice Papers",
  "Video Content",
  "Syllabus",
  "Other",
];

const SUBJECT_OPTIONS = ["Maths", "Science", "English"];

const ACCESS_OPTIONS = [
  {
    value: "free",
    label: "Free",
    helper: "Available without payment",
  },
  {
    value: "limited",
    label: "Limited",
    helper: "Intermediate and higher access",
  },
  {
    value: "premium",
    label: "Premium",
    helper: "Advanced paid access",
  },
];

const emptyForm = {
  title: "",
  class: "",
  board: "CBSE",
  subject: "Maths",
  category: "Notes",
  accessLevel: "free",
  price: 0,
};

function getErrorMessage(payload, fallback) {
  return payload?.error || payload?.message || fallback;
}

function formatDate(value) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "-";
  }
}

export default function UploadStudyMaterialInternal({
  apiBaseUrl = "http://localhost:5001",
  serviceToken,
  teacherId,
  clientSource = "super-admin-portal",
}) {
  const [form, setForm] = useState(emptyForm);
  const [pdf, setPdf] = useState(null);
  const [classes, setClasses] = useState([]);
  const [boards, setBoards] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [teacherStatus, setTeacherStatus] = useState(null);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  const headers = useMemo(
    () => ({
      "x-service-token": serviceToken || "",
      "x-client-source": clientSource,
    }),
    [clientSource, serviceToken]
  );

  const canUpload = Boolean(
    serviceToken && teacherId && teacherStatus?.canUploadContent
  );

  async function requestJson(path, options = {}) {
    const res = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers: {
        ...headers,
        ...(options.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...(options.headers || {}),
      },
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(getErrorMessage(payload, "Request failed"));
    }
    return payload;
  }

  async function loadPageData() {
    if (!serviceToken || !teacherId) {
      setInitialLoading(false);
      setMessage({
        type: "error",
        text: "serviceToken and teacherId are required for this integration screen.",
      });
      return;
    }

    try {
      setInitialLoading(true);
      setMessage({ type: "", text: "" });

      const [statusRes, classesRes, boardsRes, materialsRes] = await Promise.all([
        requestJson(`/api/internal/teacher-content/teachers/${teacherId}/status`),
        requestJson("/api/internal/teacher-content/classes"),
        requestJson("/api/internal/teacher-content/boards"),
        requestJson(`/api/internal/teacher-content/materials?teacherId=${teacherId}`),
      ]);

      setTeacherStatus(statusRes.data || null);
      setClasses(Array.isArray(classesRes.data) ? classesRes.data : []);
      setBoards(Array.isArray(boardsRes.data) ? boardsRes.data : []);
      setMaterials(Array.isArray(materialsRes.data) ? materialsRes.data : []);
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to load upload data." });
    } finally {
      setInitialLoading(false);
    }
  }

  useEffect(() => {
    loadPageData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBaseUrl, serviceToken, teacherId, clientSource]);

  function updateField(name, value) {
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "accessLevel" && value === "free") {
        next.price = 0;
      }
      return next;
    });
  }

  function resetForm() {
    setForm(emptyForm);
    setPdf(null);
    setEditId(null);
  }

  function editMaterial(material) {
    setForm({
      title: material.title || "",
      class: material.class || "",
      board: material.board || "CBSE",
      subject: material.subject || "Maths",
      category: material.category || "Notes",
      accessLevel: material.accessLevel || "free",
      price: Number(material.price || 0),
    });
    setPdf(null);
    setEditId(material._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submitMaterial(event) {
    event.preventDefault();

    if (!canUpload) {
      setMessage({
        type: "error",
        text: "This teacher is not verified for content upload.",
      });
      return;
    }

    if (!editId && !pdf) {
      setMessage({ type: "error", text: "Please select a PDF file." });
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      const formData = new FormData();
      formData.append("teacherId", teacherId);
      formData.append("title", form.title);
      formData.append("class", form.class);
      formData.append("board", form.board);
      formData.append("subject", form.subject);
      formData.append("category", form.category);
      formData.append("accessLevel", form.accessLevel);
      formData.append("isFree", String(form.accessLevel === "free"));
      formData.append("price", String(form.accessLevel === "free" ? 0 : form.price));
      if (pdf) formData.append("pdf", pdf);

      const path = editId
        ? `/api/internal/teacher-content/materials/${editId}`
        : "/api/internal/teacher-content/materials";

      await requestJson(path, {
        method: editId ? "PUT" : "POST",
        body: formData,
      });

      setMessage({
        type: "success",
        text: editId
          ? "Study material updated successfully."
          : "Study material uploaded successfully.",
      });
      resetForm();
      await loadPageData();
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Unable to save material." });
    } finally {
      setLoading(false);
    }
  }

  async function deleteMaterial(materialId) {
    const confirmed = window.confirm("Delete this study material permanently?");
    if (!confirmed) return;

    try {
      setDeletingId(materialId);
      setMessage({ type: "", text: "" });

      await requestJson(`/api/internal/teacher-content/materials/${materialId}`, {
        method: "DELETE",
        body: JSON.stringify({ teacherId }),
      });

      setMessage({ type: "success", text: "Study material deleted successfully." });
      await loadPageData();
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Unable to delete material." });
    } finally {
      setDeletingId("");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                <Upload size={20} />
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-normal text-slate-950">
                  Upload Study Material
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Manage PDF resources for the selected verified teacher.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={loadPageData}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </header>

        {message.text && (
          <div
            className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">Teacher</p>
            <p className="mt-2 text-base font-semibold text-slate-950">
              {teacherStatus?.name || "Not loaded"}
            </p>
            <p className="mt-1 text-sm text-slate-500">{teacherStatus?.email || "-"}</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">Upload Permission</p>
            <p
              className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                canUpload
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {canUpload ? "Verified teacher" : "Verification required"}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">Materials</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{materials.length}</p>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-bold text-slate-950">
              {editId ? "Edit Material" : "New Material"}
            </h2>
          </div>

          <form onSubmit={submitMaterial} className="space-y-5 p-5">
            <div>
              <label className="text-sm font-semibold text-slate-700">Material Title</label>
              <input
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                placeholder="e.g. Algebra Chapter 1 Notes"
                className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-semibold text-slate-700">Class</label>
                <select
                  value={form.class}
                  onChange={(event) => updateField("class", event.target.value)}
                  className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                >
                  <option value="">Select Class</option>
                  {classes.map((item) => (
                    <option key={item._id || item.name} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Board</label>
                <select
                  value={form.board}
                  onChange={(event) => updateField("board", event.target.value)}
                  className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                >
                  <option value="">Select Board</option>
                  {boards.map((item) => (
                    <option key={item._id || item.name} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Subject</label>
                <select
                  value={form.subject}
                  onChange={(event) => updateField("subject", event.target.value)}
                  className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                >
                  {SUBJECT_OPTIONS.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-700">Category</label>
                <select
                  value={form.category}
                  onChange={(event) => updateField("category", event.target.value)}
                  className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {CATEGORY_OPTIONS.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Access Level</label>
                <select
                  value={form.accessLevel}
                  onChange={(event) => updateField("accessLevel", event.target.value)}
                  className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {ACCESS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {option.helper}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {form.accessLevel !== "free" && (
              <div>
                <label className="text-sm font-semibold text-slate-700">Price</label>
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(event) => updateField("price", event.target.value)}
                  className="mt-1 h-11 w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>
            )}

            <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <FileText className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-2 text-sm font-semibold text-slate-700">
                {pdf?.name || (editId ? "Upload a replacement PDF if needed" : "Upload PDF study material")}
              </p>
              <p className="mt-1 text-xs text-slate-500">Only PDF files are supported.</p>
              <input
                type="file"
                accept="application/pdf"
                onChange={(event) => setPdf(event.target.files?.[0] || null)}
                className="mt-4 text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={loading || initialLoading || !canUpload}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {editId ? "Update Material" : "Upload Material"}
              </button>

              {editId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-bold text-slate-950">Uploaded Materials</h2>
            {initialLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
          </div>

          <div className="divide-y divide-slate-200">
            {materials.length === 0 && !initialLoading && (
              <div className="p-8 text-center text-sm text-slate-500">
                No study materials uploaded yet.
              </div>
            )}

            {materials.map((material) => (
              <div
                key={material._id}
                className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <h3 className="truncate text-base font-bold text-slate-950">
                    {material.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {material.class} / {material.board} / {material.subject}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
                      {material.category || "Notes"}
                    </span>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 font-semibold text-blue-700">
                      {material.accessLevel || "free"}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
                      {formatDate(material.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => editMaterial(material)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100"
                    title="Edit material"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteMaterial(material._id)}
                    disabled={deletingId === material._id}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                    title="Delete material"
                  >
                    {deletingId === material._id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
