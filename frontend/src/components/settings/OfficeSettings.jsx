// src/pages/settings/OfficeSettings.jsx
import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { Image, Upload, Settings } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

const API = import.meta.env.VITE_API_URL || "";

export default function OfficeSettings() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // pendingImages holds staged images before final save
  const [pendingImages, setPendingImages] = useState({
    hero: null,
    workspace: null,
  });

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`${API}/api/office`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        toast.error("Failed to load office settings");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function updateField(path, value) {
    // path is something like "hero.title" or "workspace.chips"
    const [root, ...rest] = path.split(".");
    setData((prev) => {
      const copy = { ...(prev || {}) };
      if (!copy[root]) copy[root] = {};
      let cur = copy[root];
      for (let i = 0; i < rest.length - 1; i++) {
        const k = rest[i];
        if (!cur[k]) cur[k] = {};
        cur = cur[k];
      }
      cur[rest[rest.length - 1]] = value;
      return copy;
    });
  }

  // handle file select and create preview
  function handleImageSelect(key, file) {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setPendingImages((prev) => ({ ...prev, [key]: { file, previewUrl } }));
  }

  function cancelNewImage(key) {
    setPendingImages((prev) => {
      const copy = { ...prev };
      if (copy[key]?.previewUrl) URL.revokeObjectURL(copy[key].previewUrl);
      delete copy[key];
      return copy;
    });
  }

  function removeCurrentImage(key) {
    updateField(`${key}.image`, "");
    cancelNewImage(key);
  }

  async function uploadFile(file) {
    const form = new FormData();
    form.append("image", file);
    const res = await fetch(`${API}/api/upload/image`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || "Upload failed");
    }
    const json = await res.json();
    return json.url;
  }

  async function handleSave() {
    try {
      setSaving(true);
      const payload = { ...(data || {}) };

      // upload pending hero image if any
      if (pendingImages.hero?.file) {
        const url = await uploadFile(pendingImages.hero.file);
        payload.hero = { ...(payload.hero || {}), image: url };
      }

      // upload pending workspace image if any
      if (pendingImages.workspace?.file) {
        const url = await uploadFile(pendingImages.workspace.file);
        payload.workspace = { ...(payload.workspace || {}), image: url };
      }

      // ensure chips are array of trimmed strings
      if (payload.workspace?.chips && typeof payload.workspace.chips === "string") {
        payload.workspace.chips = payload.workspace.chips.split(",").map((c) => c.trim()).filter(Boolean);
      }

      const res = await fetch(`${API}/api/office`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Save failed");

      const saved = await res.json();
      setData(saved);

      // clear pending previews
      Object.values(pendingImages).forEach((p) => {
        if (p?.previewUrl) URL.revokeObjectURL(p.previewUrl);
      });
      setPendingImages({});

      toast.success("Settings saved suc");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save office settings");
    } finally {
      setSaving(false);
    }
  }

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <ToastContainer />
        <div className="text-center text-slate-600">Loading office settings...</div>
      </div>
    );
  }

  // helper to render chips input as comma-separated string for admin
  const chipsString = (data.workspace?.chips || []).join(", ");

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      <ToastContainer />
      <div className="flex items-center gap-4">
        <div className="size-11 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white flex items-center justify-center shadow-md">
          <Settings size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Office Page Settings</h1>
          <p className="text-sm text-slate-500">Edit hero, workspace, map and contact info</p>
        </div>
        {loading && <span className="ml-auto text-xs text-slate-400">Loading...</span>}
      </div>

      {/* HERO */}
      <div className="rounded-2xl border border-white/30 bg-white/70 backdrop-blur-xl p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">Hero</h2>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Badge</label>
          <input
            value={data.hero?.badge || ""}
            onChange={(e) => updateField("hero.badge", e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Title</label>
            <input
              value={data.hero?.title || ""}
              onChange={(e) => updateField("hero.title", e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Subtitle</label>
            <input
              value={data.hero?.subtitle || ""}
              onChange={(e) => updateField("hero.subtitle", e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Hero image</label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_220px]">
            <div>
              {/* show current or pending preview */}
              {pendingImages.hero?.previewUrl ? (
                <div className="rounded-xl overflow-hidden border border-dashed border-indigo-300">
                  <img src={pendingImages.hero.previewUrl} alt="preview" className="w-full h-44 object-cover" />
                </div>
              ) : data.hero?.image ? (
                <div className="rounded-xl overflow-hidden border">
                  <img src={data.hero.image} alt="hero" className="w-full h-44 object-cover" />
                </div>
              ) : (
                <div className="rounded-xl h-44 border border-dashed flex items-center justify-center text-slate-400">
                  No image
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 items-start">
              <label className="inline-flex items-center gap-2 cursor-pointer px-4 py-2 rounded-xl bg-indigo-600 text-white">
                <Upload size={14} />
                Choose image
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => handleImageSelect("hero", e.target.files && e.target.files[0])}
                />
              </label>

              {pendingImages.hero ? (
                <button
                  type="button"
                  onClick={() => cancelNewImage("hero")}
                  className="px-3 py-2 rounded-lg border text-sm"
                >
                  Cancel new image
                </button>
              ) : data.hero?.image ? (
                <button
                  type="button"
                  onClick={() => removeCurrentImage("hero")}
                  className="px-3 py-2 rounded-lg border text-sm text-rose-600"
                >
                  Remove current image
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* WORKSPACE */}
      <div className="rounded-2xl border border-white/30 bg-white/70 backdrop-blur-xl p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">Workspace</h2>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Title</label>
          <input
            value={data.workspace?.title || ""}
            onChange={(e) => updateField("workspace.title", e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Paragraph</label>
          <textarea
            rows={4}
            value={data.workspace?.paragraph || ""}
            onChange={(e) => updateField("workspace.paragraph", e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Chips (comma separated)</label>
          <input
            value={(data.workspace?.chips || []).join(", ")}
            onChange={(e) => updateField("workspace.chips", e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Workspace image</label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_220px]">
            <div>
              {pendingImages.workspace?.previewUrl ? (
                <div className="rounded-xl overflow-hidden border border-dashed border-indigo-300">
                  <img src={pendingImages.workspace.previewUrl} alt="preview" className="w-full h-44 object-cover" />
                </div>
              ) : data.workspace?.image ? (
                <div className="rounded-xl overflow-hidden border">
                  <img src={data.workspace.image} alt="workspace" className="w-full h-44 object-cover" />
                </div>
              ) : (
                <div className="rounded-xl h-44 border border-dashed flex items-center justify-center text-slate-400">
                  No image
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 items-start">
              <label className="inline-flex items-center gap-2 cursor-pointer px-4 py-2 rounded-xl bg-indigo-600 text-white">
                <Upload size={14} />
                Choose image
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => handleImageSelect("workspace", e.target.files && e.target.files[0])}
                />
              </label>

              {pendingImages.workspace ? (
                <button
                  type="button"
                  onClick={() => cancelNewImage("workspace")}
                  className="px-3 py-2 rounded-lg border text-sm"
                >
                  Cancel new image
                </button>
              ) : data.workspace?.image ? (
                <button
                  type="button"
                  onClick={() => removeCurrentImage("workspace")}
                  className="px-3 py-2 rounded-lg border text-sm text-rose-600"
                >
                  Remove current image
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* MAP & CONTACT */}
      <div className="rounded-2xl border border-white/30 bg-white/70 backdrop-blur-xl p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">Map & Contact</h2>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Google Maps embed URL (iframe src)</label>
          <input
            value={data.mapEmbedUrl || ""}
            onChange={(e) => updateField("mapEmbedUrl", e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm"
            placeholder="https://www.google.com/maps/embed?pb=..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Google Maps directions URL</label>
          <input
            value={data.mapDirectionsUrl || ""}
            onChange={(e) => updateField("mapDirectionsUrl", e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm"
            placeholder="https://www.google.com/maps/dir/?api=1&destination=..."
          />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Address</label>
            <input
              value={data.address || ""}
              onChange={(e) => updateField("address", e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Phone</label>
            <input
              value={data.phone || ""}
              onChange={(e) => updateField("phone", e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              value={data.email || ""}
              onChange={(e) => updateField("email", e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 rounded-xl bg-indigo-600 text-white"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
