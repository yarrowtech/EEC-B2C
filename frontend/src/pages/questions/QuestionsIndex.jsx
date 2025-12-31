import React from "react";
import { Link } from "react-router-dom";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
import {
  FiFileText,
  FiLayers,
  FiList,
  FiCheckSquare,
  FiGrid,
  FiEdit3,
} from "react-icons/fi";

const BASIC_TYPES = [
  "MCQ — Single Correct",
  "MCQ — Multiple Correct",
  "Choice Matrix",
  "Cloze — Drag & Drop",
  "Cloze — Drop-Down",
  "Essay — Plain Text",
];



const TYPES = [
  { to: "/dashboard/questions/mcq-single", label: "MCQ — Single Correct", icon: <FiCheckSquare /> },
  { to: "/dashboard/questions/mcq-multi", label: "MCQ — Multiple Correct", icon: <FiLayers /> },
  { to: "/dashboard/questions/choice-matrix", label: "Choice Matrix", icon: <FiGrid /> },
  { to: "/dashboard/questions/cloze-drag", label: "Cloze — Drag & Drop", icon: <FiFileText /> },
  { to: "/dashboard/questions/cloze-select", label: "Cloze — Drop-Down", icon: <FiFileText /> },
  { to: "/dashboard/questions/essay-plain", label: "Essay — Plain Text", icon: <FiEdit3 /> },

  // ❌ Disabled items
  { label: "True / False", icon: <FiList />, disabled: true },
  { label: "Cloze — Free Text", icon: <FiFileText />, disabled: true },
  { label: "Match List", icon: <FiList />, disabled: true },
  { label: "Essay — Rich Text", icon: <FiEdit3 />, disabled: true },
];

export default function QuestionsIndex() {
  return (
    <div className="space-y-8 p-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Question Builder
        </h1>
        <p className="text-slate-600 mt-2 text-sm">
          Choose your subject & topic, then pick a question format.
        </p>
      </div>

      {/* Picker */}
      <SubjectTopicPicker />

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {TYPES.map((x) => {
          // const badge = BADGES[x.label];

          const Wrapper = x.disabled ? "div" : Link;

          return (
            <Wrapper
              key={x.label}
              to={x.to}
              className={`
        group rounded-2xl bg-gradient-to-br from-white/80 to-white/40
        shadow-[0_3px_10px_rgba(0,0,0,0.08)]
        border border-white/60 backdrop-blur-xl
        p-6 flex items-center gap-4
        transition-all duration-300
        ${x.disabled
                  ? "opacity-40 cursor-not-allowed pointer-events-none"
                  : "hover:-translate-y-2 hover:shadow-[0_10px_25px_rgba(0,0,0,0.15)] hover:bg-gradient-to-br hover:from-blue-50/80 hover:to-purple-50/80"
                }
      `}
            >
              {/* Icon */}
              <div
                className={`
          p-3 rounded-xl bg-white shadow-sm border border-slate-100
          text-blue-600 text-xl transition-all duration-300
          ${!x.disabled ? "group-hover:scale-110 group-hover:shadow-md group-hover:bg-blue-600 group-hover:text-white" : ""}
        `}
              >
                {x.icon}
              </div>

              {/* Label + Badge */}
              <div>
                <h3 className="font-semibold text-slate-800 text-base flex items-center gap-2">
                  {x.label}

                  {/* BASIC Badge */}
                  {BASIC_TYPES.includes(x.label) && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-200 text-slate-700 rounded-full">
                      BASIC
                    </span>
                  )}
                </h3>

              </div>
            </Wrapper>
          );
        })}

      </div>
    </div>
  );
}
