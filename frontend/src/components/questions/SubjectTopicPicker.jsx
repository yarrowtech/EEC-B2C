import React from "react";
import { useQuestionScope } from "../../context/QuestionScopeContext";

/**
 * Static lists for now; swap to API later.
 */
const SUBJECTS = ["Mathematics", "Science", "English", "Social Studies", "Computer Science"];
const TOPICS = {
  Mathematics: ["Numbers", "Fractions", "Algebra", "Geometry"],
  Science: ["Motion", "Plants", "Electricity"],
  English: ["Grammar", "Comprehension", "Vocabulary"],
  "Social Studies": ["History", "Civics", "Geography"],
  "Computer Science": ["Basics", "Programming", "Data"],
};

export default function SubjectTopicPicker() {
  const { scope, setSubject, setTopic, clear } = useQuestionScope();

  const topics = scope.subject ? TOPICS[scope.subject] || [] : [];

  return (
    <div className="rounded-xl border p-4 bg-white mb-4">
      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Subject</label>
          <select
            className="w-full rounded-lg border px-3 py-2 bg-white"
            value={scope.subject}
            onChange={(e) => { setSubject(e.target.value); setTopic(""); }}
          >
            <option value="">Select subject…</option>
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm text-slate-600 mb-1">Topic</label>
          <select
            className="w-full rounded-lg border px-3 py-2 bg-white"
            value={scope.topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={!scope.subject}
          >
            <option value="">Select topic…</option>
            {topics.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={clear}
            className="rounded-lg border px-3 py-2 hover:bg-slate-50"
          >
            Clear
          </button>
          {scope.subject && scope.topic ? (
            <span className="text-xs text-green-700">
              Active: <b>{scope.subject}</b> → <b>{scope.topic}</b>
            </span>
          ) : (
            <span className="text-xs text-slate-500">Pick a subject & topic</span>
          )}
        </div>
      </div>
    </div>
  );
}
