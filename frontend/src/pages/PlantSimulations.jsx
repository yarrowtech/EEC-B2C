import { useState } from "react";
import {
  Leaf,
  BookOpen,
  GraduationCap,
  Layers,
  PlayCircle
} from "lucide-react";

const boards = ["CBSE", "ICSE", "State Board"];
const classes = ["Class 1", "Class 2", "Class 3", "Class 4"];
const subjects = ["Science"];
const topics = [
  {
    title: "Parts of a Plant",
    description: "Learn about roots, stem, leaves & flowers",
  },
  {
    title: "Life Cycle of a Plant",
    description: "Seed → Germination → Plant",
  },
  {
    title: "Photosynthesis",
    description: "How plants make food using sunlight",
  },
  {
    title: "Seed Germination",
    description: "Stages of seed growth",
  },
];

export default function PlantSimulations() {
  const [board, setBoard] = useState("CBSE");
  const [cls, setCls] = useState("Class 3");
  const [subject, setSubject] = useState("Science");

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-green-700 flex items-center gap-2">
          <Leaf /> Animated Simulations
        </h1>
        <p className="text-gray-600 mt-1">
          Visual learning made simple 🌱
        </p>
      </div>

      {/* FILTER BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Select
          icon={<GraduationCap size={18} />}
          value={board}
          onChange={setBoard}
          options={boards}
          label="Board"
        />

        <Select
          icon={<Layers size={18} />}
          value={cls}
          onChange={setCls}
          options={classes}
          label="Class"
        />

        <Select
          icon={<BookOpen size={18} />}
          value={subject}
          onChange={setSubject}
          options={subjects}
          label="Subject"
        />
      </div>

      {/* TOPIC GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {topics.map((t, i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow hover:shadow-lg transition p-5 border"
          >
            <h3 className="font-semibold text-lg text-green-700">
              {t.title}
            </h3>
            <p className="text-sm text-gray-600 mt-2">
              {t.description}
            </p>

            <button
              className="mt-4 w-full flex items-center justify-center gap-2
              bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg"
            >
              <PlayCircle size={18} />
              Watch Animation
            </button>
          </div>
        ))}
      </div>

      {/* PLACEHOLDER NOTE */}
      <div className="mt-10 text-center text-sm text-gray-500">
        🎥 Animations will play here (Lottie / Video / Interactive)
      </div>
    </div>
  );
}

/* ---------- Reusable Select ---------- */

function Select({ label, value, onChange, options, icon }) {
  return (
    <div>
      <label className="text-sm text-gray-600 mb-1 flex items-center gap-2">
        {icon} {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 bg-white"
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}
