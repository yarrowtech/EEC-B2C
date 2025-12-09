import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { Image, Plus, Trash2, Upload, Settings } from "lucide-react";

const TABS = ["hero", "vision", "brand", "values", "mission", "custom"];

export default function AboutUsSettings() {
  const [sections, setSections] = useState([]);
  const [activeTab, setActiveTab] = useState("hero");
  const [loading, setLoading] = useState(false);
  // holds selected files + previews before final submit
  const [pendingImages, setPendingImages] = useState({});

  /* ---------------- FETCH DATA ---------------- */
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/about-us`);
        const json = await res.json();
        setSections(json.sections || []);
      } catch {
        toast.error("Failed to load About Us data");
      }
    }
    load();
  }, []);

  /* ---------------- UPDATE SECTION ---------------- */
  function updateSection(id, key, value) {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [key]: value } : s))
    );
  }

  /* ---------------- HANDLE IMAGE SELECT (LOCAL PREVIEW) ---------------- */
  function handleImageSelect(id, file) {
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    setPendingImages((prev) => ({
      ...prev,
      [id]: {
        file,
        previewUrl,
      },
    }));
  }

  /* ---------------- REMOVE PENDING NEW IMAGE ---------------- */
  function cancelNewImage(id) {
    setPendingImages((prev) => {
      const copy = { ...prev };
      const pending = copy[id];
      if (pending?.previewUrl) {
        URL.revokeObjectURL(pending.previewUrl);
      }
      delete copy[id];
      return copy;
    });
  }

  /* ---------------- REMOVE EXISTING IMAGE ---------------- */
  function removeCurrentImage(id) {
    updateSection(id, "image", "");
    // also clear any pending new image
    cancelNewImage(id);
  }

  /* ---------------- ADD NEW SECTION ---------------- */
  function addSection() {
    const newId = Date.now();
    const newSection = {
      id: newId,
      type: "custom",
      title: "",
      subtitle: "",
      description: "",
      bullets: [],
      chips: [],
      image: "",
    };
    setSections((prev) => [...prev, newSection]);
    setActiveTab("custom");
  }

  /* ---------------- DELETE SECTION ---------------- */
  function deleteSection(id) {
    setSections((prev) => prev.filter((s) => s.id !== id));
    cancelNewImage(id);
  }

  /* ---------------- SAVE CHANGES (UPLOAD PENDING IMAGES + SAVE DOC) ---------------- */
  async function save() {
    setLoading(true);
    try {
      const updatedSections = [];

      for (const section of sections) {
        const copy = { ...section };
        const pending = pendingImages[section.id];

        // If user selected a new image for this section, upload now
        if (pending?.file) {
          const form = new FormData();
          form.append("image", pending.file);

          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/api/upload/image`,
            {
              method: "POST",
              body: form,
            }
          );

          if (!res.ok) {
            throw new Error("Image upload failed");
          }

          const data = await res.json();
          copy.image = data.url;
        }

        updatedSections.push(copy);
      }

      // Save updated sections (with uploaded image URLs) to DB
      await fetch(`${import.meta.env.VITE_API_URL}/api/about-us`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: updatedSections }),
      });

      setSections(updatedSections);
      // clear pending previews after successful save
      Object.values(pendingImages).forEach((p) => {
        if (p?.previewUrl) URL.revokeObjectURL(p.previewUrl);
      });
      setPendingImages({});

      toast.success("About Us updated!");
    } catch (err) {
      console.error(err);
      toast.error("Error saving data.");
    }
    setLoading(false);
  }

  /* ---------------- FILTER CURRENT TAB ---------------- */
  const tabItems = sections.filter((s) =>
    activeTab === "custom" ? s.type === "custom" : s.type === activeTab
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <ToastContainer />
      {/* ---------- HEADER ---------- */}
      <div className="flex items-center gap-4">
        <div className="size-11 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white flex items-center justify-center shadow-md">
          <Settings size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">About Us Settings</h1>
          <p className="text-sm text-slate-500">
            Manage content blocks and preview images before publishing
          </p>
        </div>
      </div>

      {/* ---------- TAB BUTTONS ---------- */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl border text-sm font-medium transition 
              ${activeTab === tab
                ? "bg-indigo-600 text-white border-indigo-600 shadow"
                : "bg-white/70 backdrop-blur border-slate-300 hover:bg-white"
              }
            `}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ---------- TAB CONTENT ---------- */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-1 md:items-start">

        {tabItems.map((s) => {
          const pending = pendingImages[s.id];

          return (
            <div
              key={s.id}
              className="rounded-2xl border border-white/40 bg-white/80 backdrop-blur-xl shadow-xl p-6 space-y-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5"
            >
              {/* TITLE */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-800">Title</label>
                <input
                  value={s.title}
                  onChange={(e) => updateSection(s.id, "title", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* SUBTITLE */}
              {["hero", "vision"].includes(s.type) && (
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-800">
                    Subtitle
                  </label>
                  <input
                    value={s.subtitle}
                    onChange={(e) =>
                      updateSection(s.id, "subtitle", e.target.value)
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              )}

              {/* DESCRIPTION */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-800">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={s.description}
                  onChange={(e) =>
                    updateSection(s.id, "description", e.target.value)
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* BULLETS */}
              {["vision"].includes(s.type) && (
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-800">
                    Bullets{" "}
                    <span className="text-[11px] text-slate-500">
                      (1 per line)
                    </span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="1 bullet per line"
                    value={s.bullets?.join("\n") || ""}
                    onChange={(e) =>
                      updateSection(
                        s.id,
                        "bullets",
                        e.target.value.split("\n")
                      )
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              )}

              {/* CHIPS */}
              {["brand", "values"].includes(s.type) && (
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-800">
                    Chips{" "}
                    <span className="text-[11px] text-slate-500">
                      (comma separated)
                    </span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Comma separated"
                    value={s.chips?.join(", ") || ""}
                    onChange={(e) =>
                      updateSection(
                        s.id,
                        "chips",
                        e.target.value
                          .split(",")
                          .map((v) => v.trim())
                      )
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              )}

              {/* IMAGE SECTION — LAYOUT + PREVIEW + CANCEL */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Image size={16} />
                  Section Image
                </label>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-start">
                  {/* LEFT: CURRENT + NEW PREVIEW */}
                  <div className="space-y-3">
                    {/* Current image from DB */}
                    {s.image && !pending?.previewUrl && (
                      <div>
                        <p className="text-xs font-medium text-slate-600 mb-1">
                          Current image
                        </p>
                        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                          <img
                            src={s.image}
                            className="w-full h-36 object-cover"
                            alt="Current section"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCurrentImage(s.id)}
                          className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-red-600 bg-red-50 hover:bg-red-100 border border-red-100"
                        >
                          <Trash2 size={12} />
                          Remove current image
                        </button>
                      </div>
                    )}

                    {/* New selected preview (not yet saved) */}
                    {pending?.previewUrl && (
                      <div>
                        <p className="text-xs font-medium text-slate-600 mb-1">
                          New image (not saved yet)
                        </p>
                        <div className="overflow-hidden rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/40 shadow-sm">
                          <img
                            src={pending.previewUrl}
                            className="w-full h-36 object-cover"
                            alt="Preview"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => cancelNewImage(s.id)}
                          className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200"
                        >
                          Cancel new image
                        </button>
                      </div>
                    )}

                    {!s.image && !pending?.previewUrl && (
                      <p className="text-xs text-slate-500 italic">
                        No image selected yet.
                      </p>
                    )}
                  </div>

                  {/* RIGHT: BUTTONS */}
                  <div className="space-y-2">
                    <label className="flex items-center justify-center gap-2 cursor-pointer px-4 py-2.5 bg-indigo-600 text-white rounded-xl shadow hover:bg-indigo-700 transition text-sm">
                      <Upload size={16} />
                      <span>Choose Image</span>
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(e) =>
                          handleImageSelect(
                            s.id,
                            e.target.files && e.target.files[0]
                          )
                        }
                      />
                    </label>

                    <p className="text-[11px] text-slate-500">
                      You can preview and cancel before clicking{" "}
                      <span className="font-semibold">Save Changes</span>.
                    </p>
                  </div>
                </div>
              </div>

              {/* DELETE BUTTON */}
              {s.type === "custom" && (
                <button
                  onClick={() => deleteSection(s.id)}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 transition"
                >
                  <Trash2 size={16} />
                  Delete Section
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ADD NEW CUSTOM SECTION */}
      <button
        onClick={addSection}
        className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl shadow hover:bg-green-700 transition"
      >
        <Plus size={18} />
        Add Custom Section
      </button>

      {/* SAVE BUTTON */}
      <div>
        <button
          onClick={save}
          disabled={loading}
          className="mt-2 px-8 py-3 rounded-xl bg-indigo-600 text-white shadow hover:bg-indigo-700 transition disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
