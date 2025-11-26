import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import {
  Book,
  Pencil,
  Headphones,
  GraduationCap,
  Target,
  Trophy,
  Brain,
  Volume2,
  LayoutDashboard,
  Settings
} from "lucide-react";

const ICON_MAP = {
  book: <Book size={20} />,
  pen: <Pencil size={20} />,
  headphones: <Headphones size={20} />,
  graduation: <GraduationCap size={20} />,
  target: <Target size={20} />,
  trophy: <Trophy size={20} />,
  brain: <Brain size={20} />,
  speaker: <Volume2 size={20} />,
  dashboard: <LayoutDashboard size={20} />,
};

const ICON_OPTIONS = Object.keys(ICON_MAP).map((key) => ({
  label: key.charAt(0).toUpperCase() + key.slice(1),
  value: key,
  icon: ICON_MAP[key],
}));

export default function FeaturesSettings() {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [visible, setVisible] = useState(true);
  const [features, setFeatures] = useState([]);
  const [iconSearch, setIconSearch] = useState("");
  const [activeIconPicker, setActiveIconPicker] = useState(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/features`);
      const data = await res.json();

      setTitle(data.title);
      setSubtitle(data.subtitle);
      setVisible(data.visible);
      setFeatures(data.features);
    }
    load();
  }, []);

  function updateFeature(id, key, value) {
    setFeatures((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [key]: value } : f))
    );
  }

  async function saveData() {
    const payload = { title, subtitle, visible, features };
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/features`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) return toast.error("Failed to save");

    toast.success("Features section updated!");
  }

  const filteredIcons = ICON_OPTIONS.filter((icon) =>
    icon.label.toLowerCase().includes(iconSearch.toLowerCase())
  );

  return (
    <div className="space-y-8">
<ToastContainer />
      {/* ===== HEADER ===== */}
      <div className="flex items-center gap-3">
        <div className="size-10 flex items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
          <Settings size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Features & Modules Section</h1>
          <p className="text-sm text-slate-500">Manage all EEC feature blocks</p>
        </div>
      </div>

      {/* ===== ROW 1 (Title + Subtitle) ===== */}
      <div className="rounded-2xl border border-white/40 bg-white/70 backdrop-blur-xl p-6 shadow-lg space-y-5">

        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-800">Section Title</label>
          <input
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 bg-gray-200 shadow-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled
          />
        </div>

        {/* Subtitle */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-800">Section Subtitle</label>
          <textarea
            rows={3}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 bg-white shadow-sm focus:ring-2 focus:ring-blue-600 outline-none"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
          />
        </div>

        {/* Visibility */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={visible}
            onChange={() => setVisible(!visible)}
            className="h-4 w-4 rounded border-blue-500 text-indigo-600"
          />
          <span className="text-sm text-slate-700">Show this section</span>
        </div>
      </div>

      {/* ===== ROW 2 (Features Section) ===== */}
      {/* ===== ROW 2 — FEATURES GRID ===== */}
      <div className="rounded-2xl border border-white/40 bg-white/70 backdrop-blur-xl p-6 shadow-xl space-y-6">

        <h2 className="text-lg font-semibold text-slate-700">Feature Items</h2>

        {/* FEATURES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {features.map((f) => (
            <div
              key={f.id}
              className="p-5 rounded-xl border bg-white shadow-md space-y-6 hover:shadow-xl transition"
            >
              {/* ALWAYS VISIBLE ICON PICKER */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Choose Icon</label>

                {/* Search Bar */}
                <input
                  type="text"
                  placeholder="Search icons..."
                  className="w-full px-3 py-2 rounded-lg border shadow-sm"
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                />

                {/* ICON GRID */}
                <div className="grid grid-cols-5 gap-3 mt-2 max-h-[200px] overflow-y-auto pr-1">

                  {ICON_OPTIONS
                    .filter((icon) =>
                      icon.label.toLowerCase().includes(iconSearch.toLowerCase())
                    )
                    .map((icon) => (
                      <button
                        key={icon.value}
                        className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition 
                    ${f.icon === icon.value
                            ? "border-indigo-600 bg-indigo-100"
                            : "border-gray-300 hover:bg-gray-100"
                          }
                  `}
                        onClick={() => updateFeature(f.id, "icon", icon.value)}
                      >
                        {icon.icon}
                        <span className="text-[11px] text-slate-600">{icon.label}</span>
                      </button>
                    ))}

                </div>
              </div>

              {/* TITLE */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Title</label>
                <input
                  className="w-full px-3 py-2 rounded-lg border shadow-sm bg-white"
                  value={f.title}
                  onChange={(e) => updateFeature(f.id, "title", e.target.value)}
                />
              </div>

              {/* DESCRIPTION */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Description</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border shadow-sm bg-white"
                  value={f.description}
                  onChange={(e) => updateFeature(f.id, "description", e.target.value)}
                />
              </div>

            </div>
          ))}
        </div>
      </div>


      {/* SAVE BUTTON */}
      <button
        onClick={saveData}
        className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition"
      >
        Save Changes
      </button>
    </div>
  );
}
