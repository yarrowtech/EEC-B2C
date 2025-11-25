import React from "react";
import { Link } from "react-router-dom";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";

const TYPES = [
  { to: "/dashboard/questions/mcq-single",   label: "MCQ — Single Correct" },
  { to: "/dashboard/questions/mcq-multi",    label: "MCQ — Multiple Correct" },
  { to: "/dashboard/questions/choice-matrix",label: "Choice Matrix" },
  { to: "/dashboard/questions/true-false",   label: "True / False" },
  { to: "/dashboard/questions/cloze-drag",   label: "Cloze — Drag & Drop" },
  { to: "/dashboard/questions/cloze-select", label: "Cloze — Drop-Down" },
  { to: "/dashboard/questions/cloze-text",   label: "Cloze — Free Text" },
  { to: "/dashboard/questions/match-list",   label: "Match List" },
  { to: "/dashboard/questions/essay-rich",   label: "Essay — Rich Text" },
  { to: "/dashboard/questions/essay-plain",  label: "Essay — Plain Text" },
];

export default function QuestionsIndex() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">Questions</h1>
      <p className="text-slate-600">Pick a Subject & Topic, then a question type to upload.</p>

      <SubjectTopicPicker />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TYPES.map((x) => (
          <Link
            key={x.to}
            to={x.to}
            className="rounded-xl border bg-white p-4 hover:shadow transition-all"
          >
            <div className="text-slate-800 font-medium">{x.label}</div>
            <div className="text-xs text-slate-500 mt-1">Static UI (no API yet)</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
