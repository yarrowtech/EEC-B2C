import { useEffect, useMemo, useState } from "react";
import { Image, Palette, Globe2, Upload, X } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API = import.meta.env.VITE_API_URL || "";

const DEFAULT_DATA = {
  siteName: "Edify Eight",
  siteTagline: "Learn. Practice. Grow.",
  metaTitle: "Edify Eight",
  metaDescription: "Edify Eight learning platform for students, teachers, and institutions.",
  faviconUrl: "",
  logoUrl: "",
  websiteUrl: "",
  supportEmail: "",
  supportPhone: "",
  primaryColor: "#f59e0b",
};

function getAuthHeaders(extra = {}) {
  const token = localStorage.getItem("jwt") || "";
  return token
    ? { ...extra, Authorization: `Bearer ${token}` }
    : extra;
}

export default function WebsiteSettings() {
  const [data, setData] = useState(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingImages, setPendingImages] = useState({
    logo: null,
    favicon: null,
  });

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`${API}/api/website-settings`);
        const json = await res.json();
        setData({ ...DEFAULT_DATA, ...(json || {}) });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load website settings");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  function updateField(key, value) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function handleImageSelect(key, file) {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setPendingImages((prev) => ({ ...prev, [key]: { file, previewUrl } }));
  }

  function removePendingImage(key) {
    setPendingImages((prev) => {
      const copy = { ...prev };
      if (copy[key]?.previewUrl) URL.revokeObjectURL(copy[key].previewUrl);
      delete copy[key];
      return copy;
    });
  }

  function removeCurrentImage(key) {
    updateField(key === "logo" ? "logoUrl" : "faviconUrl", "");
    removePendingImage(key);
  }

  async function uploadImage(file) {
    const form = new FormData();
    form.append("image", file);

    const res = await fetch(`${API}/api/upload/image`, {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      throw new Error("Image upload failed");
    }

    const json = await res.json();
    return json.url;
  }

  const logoPreview = useMemo(
    () => pendingImages.logo?.previewUrl || data.logoUrl || "",
    [data.logoUrl, pendingImages.logo]
  );
  const faviconPreview = useMemo(
    () => pendingImages.favicon?.previewUrl || data.faviconUrl || "",
    [data.faviconUrl, pendingImages.favicon]
  );

  async function handleSave() {
    try {
      setSaving(true);

      const payload = {
        ...data,
        siteName: String(data.siteName || "").trim(),
        siteTagline: String(data.siteTagline || "").trim(),
        metaTitle: String(data.metaTitle || "").trim(),
        metaDescription: String(data.metaDescription || "").trim(),
        websiteUrl: String(data.websiteUrl || "").trim(),
        supportEmail: String(data.supportEmail || "").trim(),
        supportPhone: String(data.supportPhone || "").trim(),
        primaryColor: String(data.primaryColor || "#f59e0b").trim() || "#f59e0b",
      };

      if (pendingImages.logo?.file) {
        payload.logoUrl = await uploadImage(pendingImages.logo.file);
      }
      if (pendingImages.favicon?.file) {
        payload.faviconUrl = await uploadImage(pendingImages.favicon.file);
      }

      const res = await fetch(`${API}/api/website-settings`, {
        method: "PUT",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(errText || `Save failed (${res.status})`);
      }

      const saved = await res.json();
      setData({ ...DEFAULT_DATA, ...(saved || {}) });

      Object.values(pendingImages).forEach((item) => {
        if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
      setPendingImages({ logo: null, favicon: null });

      window.dispatchEvent(new CustomEvent("website:settings-updated", { detail: saved }));
      toast.success("Website settings saved");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save website settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-5xl p-6 text-slate-600">Loading website settings...</div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 md:p-6">
      <ToastContainer />

      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg">
          <Globe2 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Website Settings</h1>
          <p className="text-sm text-slate-500">
            Update site name, favicon, logo, and branding metadata.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Palette className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-slate-900">Branding</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Website Name</label>
              <input
                value={data.siteName}
                onChange={(e) => updateField("siteName", e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Tagline</label>
              <input
                value={data.siteTagline}
                onChange={(e) => updateField("siteTagline", e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Primary Color</label>
              <input
                type="color"
                value={data.primaryColor || "#f59e0b"}
                onChange={(e) => updateField("primaryColor", e.target.value)}
                className="h-12 w-24 rounded-2xl border border-slate-200 bg-white p-1"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Logo URL</label>
              <input
                value={data.logoUrl}
                onChange={(e) => updateField("logoUrl", e.target.value)}
                placeholder="Upload or paste a logo URL"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Logo Upload</label>
              <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 hover:border-amber-400 hover:text-amber-700">
                <Upload className="h-4 w-4" />
                Choose logo image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageSelect("logo", e.target.files?.[0])}
                />
              </label>
            </div>
            {(logoPreview || data.logoUrl) && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">Logo Preview</span>
                  <button
                    type="button"
                    onClick={() => removeCurrentImage("logo")}
                    className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-rose-600 border border-rose-200 hover:bg-rose-50"
                  >
                    <X className="h-3 w-3" />
                    Remove
                  </button>
                </div>
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="h-20 w-auto rounded-xl border border-slate-200 bg-white object-contain p-2"
                />
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Image className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-slate-900">Site Metadata</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Meta Title</label>
              <input
                value={data.metaTitle}
                onChange={(e) => updateField("metaTitle", e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Meta Description</label>
              <textarea
                value={data.metaDescription}
                onChange={(e) => updateField("metaDescription", e.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Website URL</label>
              <input
                value={data.websiteUrl}
                onChange={(e) => updateField("websiteUrl", e.target.value)}
                placeholder="https://your-domain.com"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Support Email</label>
              <input
                value={data.supportEmail}
                onChange={(e) => updateField("supportEmail", e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Support Phone</label>
              <input
                value={data.supportPhone}
                onChange={(e) => updateField("supportPhone", e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Favicon URL</label>
              <input
                value={data.faviconUrl}
                onChange={(e) => updateField("faviconUrl", e.target.value)}
                placeholder="Upload or paste a favicon URL"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Favicon Upload</label>
              <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 hover:border-amber-400 hover:text-amber-700">
                <Upload className="h-4 w-4" />
                Choose favicon image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageSelect("favicon", e.target.files?.[0])}
                />
              </label>
            </div>
            {(faviconPreview || data.faviconUrl) && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">Favicon Preview</span>
                  <button
                    type="button"
                    onClick={() => removeCurrentImage("favicon")}
                    className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-rose-600 border border-rose-200 hover:bg-rose-50"
                  >
                    <X className="h-3 w-3" />
                    Remove
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <img
                    src={faviconPreview}
                    alt="Favicon preview"
                    className="h-12 w-12 rounded-xl border border-slate-200 bg-white object-contain p-1"
                  />
                  <p className="text-sm text-slate-500">This icon will be used in the browser tab.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-amber-200 bg-amber-50/80 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-amber-900">Live preview</p>
          <p className="text-sm text-amber-800">
            {data.siteName} - {data.siteTagline}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center rounded-full bg-amber-500 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Website Settings"}
        </button>
      </div>
    </div>
  );
}
