import React, { useEffect, useState } from "react";
import axios from "axios";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { FiBookOpen, FiTag, FiRefreshCw } from "react-icons/fi";

export default function SubjectTopicPicker() {
  const { scope, setSubject, setTopic, clear } = useQuestionScope();

  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);

  // Load subjects on mount
  useEffect(() => {
    loadSubjects();
  }, []);

  // Load topics when subject changes
  useEffect(() => {
    if (scope.subject) loadTopics(scope.subject);
    else setTopics([]);
  }, [scope.subject]);

  const loadSubjects = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/subject`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
      });
      setSubjects(res.data);
    } catch (err) {
      console.error("Error loading subjects:", err);
    }
  };

  const loadTopics = async (subjectId) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/topic/${subjectId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
        }
      );
      setTopics(res.data);
    } catch (err) {
      console.error("Error loading topics:", err);
    }
  };

  return (
    <div
      className="
      rounded-3xl border border-white/60 
      bg-gradient-to-br from-white/70 to-white/30
      backdrop-blur-2xl shadow-lg p-7 
      transition-all duration-300 hover:shadow-2xl
    "
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 rounded-xl bg-blue-100 text-blue-600 text-xl shadow-sm">
          <FiBookOpen />
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Select Scope
        </h2>
      </div>

      <div className="grid sm:grid-cols-3 gap-6">
        {/* SUBJECT DROPDOWN */}
        <div className="flex flex-col">
          <label className="font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <FiTag className="text-blue-500" /> Subject
          </label>

          <select
            className="
              w-full rounded-xl border border-slate-200 px-4 py-3 bg-white
              outline-none shadow-sm
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              transition-all
            "
            value={scope.subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setTopic("");
            }}
          >
            <option value="">Choose a subject…</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* TOPIC DROPDOWN */}
        <div className="flex flex-col">
          <label className="font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <FiTag className="text-purple-500" /> Topic
          </label>

          <select
            className="
              w-full rounded-xl border border-slate-200 px-4 py-3 bg-white
              outline-none shadow-sm
              focus:ring-2 focus:ring-purple-500 focus:border-purple-500
              transition-all disabled:opacity-40
            "
            value={scope.topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={!scope.subject}
          >
            <option value="">Choose a topic…</option>

            {topics.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* CLEAR + ACTIVE STATUS */}
        <div className="flex flex-col justify-between">
          <button
            type="button"
            onClick={clear}
            className="
              flex items-center justify-center gap-2
              rounded-xl bg-red-500 text-white px-4 py-3
              text-sm font-semibold
              hover:bg-red-600 active:scale-95 transition-all shadow-md
            "
          >
            <FiRefreshCw /> Clear Selection
          </button>

          <div className="mt-3 text-center">
            {scope.subject && scope.topic ? (
              <div
                className="
                  inline-block px-4 py-2 rounded-full
                  bg-green-100 text-green-700
                  text-xs font-medium shadow-sm
                  animate-[fadeIn_0.3s_ease-out]
                "
              >
                Active: {subjects.find((s) => s._id === scope.subject)?.name} →{" "}
                {topics.find((t) => t._id === scope.topic)?.name}
              </div>
            ) : (
              <span className="text-xs text-slate-500">
                Choose subject & topic
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
