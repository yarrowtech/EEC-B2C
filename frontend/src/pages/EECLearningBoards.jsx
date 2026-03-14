import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getJSON } from "../lib/api";

const DEFAULT_BOARDS = ["CBSE", "ICSE", "State Board", "IB"].map((name) => ({
  value: name,
  label: name,
}));
const DEFAULT_CLASSES = [
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
].map((name) => ({ value: name, label: name }));

function MIcon({ name, className = "", fill = false }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={fill ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {name}
    </span>
  );
}

export default function EECLearningBoards() {
  const navigate = useNavigate();
  const token = localStorage.getItem("jwt") || "";
  const isLoggedIn = Boolean(token);
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [boardOptions, setBoardOptions] = useState(DEFAULT_BOARDS);
  const [classOptions, setClassOptions] = useState(DEFAULT_CLASSES);
  const [board, setBoard] = useState(DEFAULT_BOARDS[0]?.value || "CBSE");
  const [grade, setGrade] = useState(DEFAULT_CLASSES[3]?.value || "Class 6");
  const [loading, setLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [topicsBySubject, setTopicsBySubject] = useState({});
  const [topicLoadingBySubject, setTopicLoadingBySubject] = useState({});
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [unlockingSubject, setUnlockingSubject] = useState("");

  const subjectCount = useMemo(() => subjects.length, [subjects]);
  const topicCount = useMemo(
    () => Object.values(topicsBySubject).reduce((sum, list) => sum + (Array.isArray(list) ? list.length : 0), 0),
    [topicsBySubject]
  );
  const boardLabel =
    boardOptions.find((b) => String(b.value) === String(board))?.label || String(board || "");
  const classLabel =
    classOptions.find((c) => String(c.value) === String(grade))?.label || String(grade || "");

  useEffect(() => {
    let mounted = true;

    async function loadMeta() {
      setMetaLoading(true);
      try {
        const [boardsRes, classesRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/boards`),
          fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/classes`),
        ]);
        const [boardsData, classesData] = await Promise.all([
          boardsRes.json().catch(() => []),
          classesRes.json().catch(() => []),
        ]);
        const boards = (Array.isArray(boardsData) ? boardsData : [])
          .map((b) => ({
            value: String(b?._id || "").trim(),
            label: String(b?.name || "").trim(),
          }))
          .filter((b) => b.value && b.label);
        const classes = (Array.isArray(classesData) ? classesData : [])
          .map((c) => ({
            value: String(c?._id || "").trim(),
            label: String(c?.name || "").trim(),
          }))
          .filter((c) => c.value && c.label);

        if (!mounted) return;
        if (boards.length > 0) {
          setBoardOptions(boards);
          setBoard(boards[0].value);
        }
        if (classes.length > 0) {
          setClassOptions(classes);
          setGrade(classes[0].value);
        }
      } catch {
        if (!mounted) return;
        setBoardOptions(DEFAULT_BOARDS);
        setClassOptions(DEFAULT_CLASSES);
      } finally {
        if (mounted) setMetaLoading(false);
      }
    }

    loadMeta();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleFindContent() {
    setLoading(true);
    setSearched(true);
    setError("");
    setTopicsBySubject({});
    setTopicLoadingBySubject({});
    try {
      const rows = isLoggedIn
        ? await getJSON(
            `/api/subject?board=${encodeURIComponent(board)}&class=${encodeURIComponent(grade)}`
          )
        : await (async () => {
            const res = await fetch(`${API}/api/subjects`);
            const data = await res.json().catch(() => ({}));
            return Array.isArray(data?.items) ? data.items : [];
          })();
      const normalized = rows
        .map((s) => ({
          _id: s?._id,
          name: String(s?.name || "").trim(),
        }))
        .filter((s) => s._id && s.name)
        .sort((a, b) => a.name.localeCompare(b.name));

      setSubjects(normalized);
      if (!isLoggedIn && normalized.length > 0) {
        const entries = await Promise.all(
          normalized.map(async (s) => {
            try {
              const res = await fetch(`${API}/api/subjects/${encodeURIComponent(s._id)}/topics`);
              const data = await res.json().catch(() => ({}));
              const rows = Array.isArray(data?.items) ? data.items : [];
              const topics = rows
                .map((t) => ({
                  _id: t?._id,
                  name: String(t?.name || "").trim(),
                  topicSummary: String(t?.topicSummary || "").trim(),
                  learningOutcome: String(t?.learningOutcome || "").trim(),
                }))
                .filter((t) => t._id && t.name)
                .sort((a, b) => a.name.localeCompare(b.name));
              return [s._id, topics];
            } catch {
              return [s._id, []];
            }
          })
        );
        setTopicsBySubject(Object.fromEntries(entries));
      }
      if (normalized.length === 0) {
        setError(
          isLoggedIn
            ? `No subjects found for ${boardLabel} - ${classLabel}.`
            : "No subjects found."
        );
      }
    } catch (e) {
      setSubjects([]);
      if (String(e?.message || "").toLowerCase().includes("401")) {
        setError("Please login first to view study contents.");
      } else {
        setError("Failed to load study contents. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadTopicsForSubject(subjectId) {
    if (!subjectId || topicLoadingBySubject[subjectId]) return;
    if (topicsBySubject[subjectId]) return;

    setTopicLoadingBySubject((prev) => ({ ...prev, [subjectId]: true }));
    try {
      const rows = isLoggedIn
        ? await getJSON(
            `/api/topic/${encodeURIComponent(subjectId)}?board=${encodeURIComponent(
              board
            )}&class=${encodeURIComponent(grade)}`
          )
        : await (async () => {
            const res = await fetch(`${API}/api/subjects/${encodeURIComponent(subjectId)}/topics`);
            const data = await res.json().catch(() => ({}));
            return Array.isArray(data?.items) ? data.items : [];
          })();
      const normalized = rows
        .map((t) => ({
          _id: t?._id,
          name: String(t?.name || "").trim(),
          topicSummary: String(t?.topicSummary || "").trim(),
          learningOutcome: String(t?.learningOutcome || "").trim(),
        }))
        .filter((t) => t._id && t.name)
        .sort((a, b) => a.name.localeCompare(b.name));
      setTopicsBySubject((prev) => ({ ...prev, [subjectId]: normalized }));
    } catch {
      setTopicsBySubject((prev) => ({ ...prev, [subjectId]: [] }));
    } finally {
      setTopicLoadingBySubject((prev) => ({ ...prev, [subjectId]: false }));
    }
  }

  return (
    <section className="min-h-screen bg-[#f8f7f6] py-12">
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="rounded-3xl bg-white border border-slate-200 p-6 md:p-8 shadow-sm">
          <div className="flex flex-col gap-3">
            <p className="inline-flex w-fit items-center gap-2 rounded-full bg-[#e7c555]/20 px-3 py-1 text-xs font-bold tracking-wide text-[#9d7b16]">
              <MIcon name="menu_book" className="text-[16px]" fill />
              Learn
            </p>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900">
              Explore Study Contents
            </h1>
            <p className="text-slate-600">
              Select board and class, then view stored subjects and their topics.
            </p>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <select
              value={board}
              onChange={(e) => setBoard(e.target.value)}
              disabled={metaLoading}
              className="h-12 rounded-xl border border-slate-300 bg-white px-4 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-[#e7c555]/40"
            >
              {boardOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              disabled={metaLoading}
              className="h-12 rounded-xl border border-slate-300 bg-white px-4 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-[#e7c555]/40"
            >
              {classOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleFindContent}
              disabled={loading || metaLoading}
              className="h-12 rounded-xl bg-[#F5C518] px-6 font-bold text-slate-900 hover:bg-[#e5b300] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : metaLoading ? "Preparing..." : "Find Contents"}
            </button>
          </div>

          {searched && !loading && (
            <div className="mt-5 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-blue-100 px-3 py-1 font-semibold text-blue-700">
                Subjects: {subjectCount}
              </span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700">
                Topics Loaded: {topicCount}
              </span>
            </div>
          )}
        </div>

        <div className="mt-6">
          {loading && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
              Loading study contents...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-700">
              {error}
            </div>
          )}

          {!loading && !error && searched && subjects.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {subjects.map((subject, index) => {
                const topics = topicsBySubject[subject._id];
                const topicsLoading = Boolean(topicLoadingBySubject[subject._id]);
                const guestVisibleTopics = Array.isArray(topics) ? topics.slice(0, 5) : [];
                const lockedCount = Array.isArray(topics) ? Math.max(0, topics.length - 5) : 0;
                const color = index % 4;
                const tone =
                  color === 0
                    ? "from-blue-400 to-indigo-600"
                    : color === 1
                    ? "from-emerald-400 to-teal-600"
                    : color === 2
                    ? "from-orange-400 to-pink-600"
                    : "from-violet-400 to-purple-600";

                return (
                  <article key={subject._id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                    <div className={`bg-gradient-to-r ${tone} p-5`}>
                      <h3 className="text-xl font-black text-white">{subject.name}</h3>
                      <p className="text-white/90 text-sm">
                        {isLoggedIn ? `${boardLabel} - ${classLabel}` : "Preview Mode"}
                      </p>
                    </div>

                    <div className="p-5">
                      {isLoggedIn && !topics && (
                        <button
                          type="button"
                          onClick={() => loadTopicsForSubject(subject._id)}
                          disabled={topicsLoading}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-70"
                        >
                          <MIcon name="library_books" className="text-[18px]" />
                          {topicsLoading ? "Loading topics..." : "Show Topics"}
                        </button>
                      )}

                      {topics && (
                        <div>
                          <div className="mb-3 text-sm font-semibold text-slate-700">
                            Topics ({topics.length})
                          </div>
                          {topics.length === 0 ? (
                            <p className="text-sm text-slate-500">No topics available for this subject.</p>
                          ) : (
                            <ul className="space-y-2">
                              {(isLoggedIn ? topics : guestVisibleTopics).map((topic) => (
                                <button
                                  key={topic._id}
                                  type="button"
                                  onClick={() =>
                                    navigate(`/learn/topic/${subject._id}/${topic._id}`, {
                                      state: {
                                        subject,
                                        topic,
                                        boardLabel,
                                        classLabel,
                                        previewMode: !isLoggedIn,
                                      },
                                    })
                                  }
                                  className="w-full text-left rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                >
                                  {topic.name}
                                </button>
                              ))}
                            </ul>
                          )}

                          {!isLoggedIn && lockedCount > 0 && (
                            <div className="mt-3 relative">
                              <div className="space-y-2 blur-[2px] pointer-events-none select-none">
                                {topics.slice(5, 8).map((topic) => (
                                  <div
                                    key={`locked-${topic._id}`}
                                    className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-slate-500"
                                  >
                                    {topic.name}
                                  </div>
                                ))}
                              </div>
                              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/65">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUnlockingSubject(subject._id);
                                    window.dispatchEvent(new Event("eec:open-login"));
                                    setTimeout(() => setUnlockingSubject(""), 1200);
                                  }}
                                  className="rounded-lg bg-slate-900 text-white px-4 py-2 text-xs font-bold"
                                >
                                  {unlockingSubject === subject._id
                                    ? "Opening login..."
                                    : `Login to unlock ${lockedCount} more topic${
                                        lockedCount > 1 ? "s" : ""
                                      }`}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
