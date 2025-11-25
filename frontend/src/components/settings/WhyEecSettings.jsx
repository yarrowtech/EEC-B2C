import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { CheckCircle, Timer, Gamepad2, ShieldCheck, Settings } from "lucide-react";

export default function WhyEecSettings() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visible, setVisible] = useState(true);
  const [features, setFeatures] = useState([]);

  const ICON_OPTIONS = [
    { label: "Check", value: "check", icon: <CheckCircle size={18} /> },
    { label: "Timer", value: "timer", icon: <Timer size={18} /> },
    { label: "Gamepad", value: "gamepad", icon: <Gamepad2 size={18} /> },
    { label: "Shield", value: "shield", icon: <ShieldCheck size={18} /> },
  ];

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/why-eec`);
        const data = await res.json();

        setTitle(data.title);
        setDescription(data.description);
        setVisible(data.visible);
        setFeatures(data.features);
      } catch (e) {
        toast.error("Failed to load Why EEC settings.");
      }
    }
    loadData();
  }, []);

  function updateFeature(id, key, value) {
    setFeatures((feats) =>
      feats.map((f) => (f.id === id ? { ...f, [key]: value } : f))
    );
  }

  async function saveData() {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/why-eec`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, visible, features }),
      });

      if (!res.ok) return toast.error("Update failed.");

      toast.success("Why EEC section updated!");
    } catch {
      toast.error("Network error.");
    }
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
          <Settings size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Why EEC Section</h1>
          <p className="text-sm text-slate-500">Manage Why EEC content & feature blocks</p>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT PANEL */}
        <div className="self-start rounded-2xl border border-white/30 bg-white/70 backdrop-blur-xl p-6 shadow-xl space-y-5">

          <h2 className="text-lg font-semibold text-slate-700">Content</h2>

          {/* TITLE FIELD */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Title</label>
            <input
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={true}
            />
          </div>

          {/* DESCRIPTION FIELD */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea
              rows={10}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* VISIBILITY */}
          <div className="flex items-center gap-2 mt-1">
            <input
              type="checkbox"
              checked={visible}
              onChange={() => setVisible(!visible)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-slate-700">Show Section</span>
          </div>
        </div>

        {/* RIGHT PANEL - FEATURES */}
        <div className="rounded-2xl border border-white/30 bg-white/70 backdrop-blur-xl p-6 shadow-xl space-y-5">

          <h2 className="text-lg font-semibold text-slate-700">Feature Blocks</h2>

          {features.map((f) => (
            <div
              key={f.id}
              className="p-5 rounded-xl border border-slate-200 bg-white shadow-md space-y-5 hover:shadow-xl transition-all duration-300"
            >
              {/* ICON SELECT */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Icon</label>
                <select
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={f.icon}
                  onChange={(e) => updateFeature(f.id, "icon", e.target.value)}
                >
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* TITLE */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Title</label>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={f.title}
                  onChange={(e) => updateFeature(f.id, "title", e.target.value)}
                />
              </div>

              {/* SUBTITLE */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Subtitle</label>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={f.subtitle}
                  onChange={(e) => updateFeature(f.id, "subtitle", e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SAVE BUTTON */}
      <div>
        <button
          onClick={saveData}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-medium shadow-md hover:bg-indigo-700 transition-all duration-200"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
