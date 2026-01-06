import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { getJSON, deleteQuestion } from "../../lib/api";
import { FiFilter, FiSearch, FiTrash2, FiEdit3, FiList } from "react-icons/fi";
import Swal from "sweetalert2";
import { toast, ToastContainer } from "react-toastify";

const TYPES = [
  "mcq-single", "mcq-multi", "choice-matrix", "true-false",
  "cloze-drag", "cloze-select", "cloze-text", "match-list",
  "essay-rich", "essay-plain",
];

export default function QuestionsList() {
  const { scope, clear } = useQuestionScope();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [initialized, setInitialized] = useState(false);

  // Data maps for display
  const [subjectMap, setSubjectMap] = useState({});
  const [topicMap, setTopicMap] = useState({});
  const [boardMap, setBoardMap] = useState({});
  const [classMap, setClassMap] = useState({});

  const page = Number(searchParams.get("page") || 1);
  const limit = 10;

  const [type, setType] = useState(searchParams.get("type") || "");
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [selectedClass, setSelectedClass] = useState(searchParams.get("class") || "");

  // Filter options
  const [classes, setClasses] = useState([]);
  const [boards, setBoards] = useState([]);

  const canSearch = useMemo(
    () => !!scope.subject || !!scope.topic || !!type || !!q || !!selectedClass,
    [scope, type, q, selectedClass]
  );

  async function loadMetadata() {
    try {
      // Load boards
      const boardsData = await getJSON("/api/boards");
      setBoards(boardsData || []);
      const bMap = {};
      boardsData.forEach((b) => (bMap[b._id] = b.name));
      setBoardMap(bMap);

      // Load classes
      const classesData = await getJSON("/api/classes");
      setClasses(classesData.map(c => c.name) || []);
      const cMap = {};
      classesData.forEach((c) => (cMap[c._id] = c.name));
      setClassMap(cMap);

      // Load subjects
      const subjects = await getJSON("/api/subject");
      const sMap = {};
      subjects.forEach((s) => (sMap[s._id] = s.name));
      setSubjectMap(sMap);

      // Load topics
      const tMap = {};
      for (const s of subjects) {
        const topics = await getJSON(`/api/topic/${s._id}`);
        topics.forEach((t) => (tMap[t._id] = t.name));
      }
      setTopicMap(tMap);
    } catch (err) {
      console.error("Failed to load metadata", err);
    }
  }

  async function load() {
    setBusy(true);
    setErr("");
    try {
      const qs = new URLSearchParams();
      if (scope.board) qs.set("board", scope.board);
      if (scope.class) qs.set("class", scope.class);
      if (scope.subject) qs.set("subject", scope.subject);
      if (scope.topic) qs.set("topic", scope.topic);

      // Map stage names to numbers if needed
      if (scope.stage) {
        const stageMap = {
          "Foundation": "1",
          "Intermediate": "2",
          "Advanced": "3"
        };
        const stageValue = stageMap[scope.stage] || scope.stage;
        qs.set("stage", stageValue);
      }

      // Ensure difficulty is lowercase
      if (scope.difficulty) {
        qs.set("difficulty", scope.difficulty.toLowerCase());
      }

      if (scope.questionType) qs.set("questionType", scope.questionType);
      if (type) qs.set("type", type);
      if (q) qs.set("q", q);
      if (selectedClass) qs.set("class", selectedClass);
      qs.set("page", page.toString());
      qs.set("limit", limit.toString());

      const data = await getJSON(`/api/questions?${qs.toString()}`);
      setRows(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      setErr(e.message || "Failed to load");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    // Clear scope when component mounts to show all questions
    clear();
    loadMetadata();
    setInitialized(true);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    // Only load after initialization is complete
    if (initialized) {
      load();
    }
    // eslint-disable-next-line
  }, [page, initialized]);

  function applyFilters(e) {
    e.preventDefault();
    const next = {};
    if (scope.board) next.board = scope.board;
    if (scope.class) next.class = scope.class;
    if (scope.subject) next.subject = scope.subject;
    if (scope.topic) next.topic = scope.topic;
    if (scope.stage) next.stage = scope.stage;
    if (scope.difficulty) next.difficulty = scope.difficulty;
    if (scope.questionType) next.questionType = scope.questionType;
    if (type) next.type = type;
    if (q) next.q = q;
    if (selectedClass) next.class = selectedClass;
    next.page = "1";
    setSearchParams(next);
    setTimeout(load, 0);
  }

  async function onDelete(id) {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This question will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      await deleteQuestion(id);

      await Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "The question has been deleted.",
        timer: 1400,
        showConfirmButton: false,
      });

      await load();
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: e.message || "Something went wrong",
      });
    }
  }

  const pages = Math.max(1, Math.ceil(total / limit));

  // Map stage numbers to names
  const stageNames = { 1: "Foundation", 2: "Intermediate", 3: "Advanced" };

  return (
    <>
      <ToastContainer position="bottom-right" />
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
            <FiList size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Questions List
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              View, filter, and manage all questions
            </p>
          </div>
        </div>

        {/* Cascading Picker for filtering */}
        <SubjectTopicPicker />

        {/* Additional Filters */}
        <form
          onSubmit={applyFilters}
          className="grid sm:grid-cols-3 gap-6 bg-white shadow-md rounded-2xl p-6"
        >
          {/* Type Filter */}
          <div>
            <label className="font-semibold text-slate-700 mb-2 block flex items-center gap-2">
              <FiFilter className="text-indigo-600" />
              Question Type
            </label>
            <select
              className="w-full rounded-xl px-4 py-2 bg-slate-50 border border-slate-300 shadow-sm
                       focus:ring-2 focus:ring-indigo-500 outline-none"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">All types</option>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="font-semibold text-slate-700 mb-2 block flex items-center gap-2">
              <FiSearch className="text-purple-600" />
              Search
            </label>
            <input
              className="w-full rounded-xl px-4 py-2 bg-slate-50 border border-slate-300 shadow-sm
                       focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="Search question text..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {/* Apply Button */}
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="rounded-xl px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600
                       text-white font-semibold shadow-lg hover:shadow-xl hover:from-blue-700
                       hover:to-indigo-700 active:scale-95 transition-all"
            >
              Apply Filters
            </button>
          </div>
        </form>

        {err && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            {err}
          </div>
        )}

        {/* Results Table */}
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-bold text-slate-700 uppercase tracking-wide text-xs">
                    #
                  </th>
                  <th className="text-left px-4 py-3 font-bold text-slate-700 uppercase tracking-wide text-xs">
                    Board
                  </th>
                  <th className="text-left px-4 py-3 font-bold text-slate-700 uppercase tracking-wide text-xs">
                    Class
                  </th>
                  <th className="text-left px-4 py-3 font-bold text-slate-700 uppercase tracking-wide text-xs">
                    Subject
                  </th>
                  <th className="text-left px-4 py-3 font-bold text-slate-700 uppercase tracking-wide text-xs">
                    Topic
                  </th>
                  {/* <th className="text-left px-4 py-3 font-bold text-slate-700 uppercase tracking-wide text-xs">
                    Stage
                  </th> */}
                  <th className="text-left px-4 py-3 font-bold text-slate-700 uppercase tracking-wide text-xs">
                    Difficulty
                  </th>
                  <th className="text-left px-4 py-3 font-bold text-slate-700 uppercase tracking-wide text-xs">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 font-bold text-slate-700 uppercase tracking-wide text-xs">
                    Question Preview
                  </th>
                  <th className="text-center px-4 py-3 font-bold text-slate-700 uppercase tracking-wide text-xs">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {rows.map((r, idx) => (
                  <tr
                    key={r._id}
                    className="hover:bg-blue-50/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-slate-600 font-medium">
                      {(page - 1) * limit + idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                        {boardMap[r.board] || r.board || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {classMap[r.class] || r.class || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">
                      {subjectMap[r.subject] || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {topicMap[r.topic] || "—"}
                    </td>
                    {/* <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                        {stageNames[r.stage] || r.level || "—"}
                      </span>
                    </td> */}
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        r.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                        r.difficulty === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {r.difficulty || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {r.type || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="line-clamp-2 max-w-[300px] text-slate-700">
                        {r.question ||
                          r.prompt ||
                          r.choiceMatrix?.prompt ||
                          r.clozeDrag?.text ||
                          r.clozeSelect?.text ||
                          r.clozeText?.text ||
                          r.matchList?.prompt ||
                          "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/dashboard/questions/edit/${r._id}`}
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5
                                   border border-blue-300 bg-white text-blue-700
                                   hover:bg-blue-50 shadow-sm transition"
                        >
                          <FiEdit3 size={15} /> Edit
                        </Link>

                        <button
                          onClick={() => onDelete(r._id)}
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5
                                   border border-red-300 text-red-600 bg-white
                                   hover:bg-red-50 shadow-sm transition"
                        >
                          <FiTrash2 size={15} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!rows.length && !busy && (
                  <tr>
                    <td
                      colSpan={10}
                      className="p-8 text-center text-slate-500"
                    >
                      <div className="text-6xl mb-3">📝</div>
                      <div className="font-semibold text-lg">No questions found</div>
                      <div className="text-sm mt-1">Try adjusting your filters or add new questions</div>
                    </td>
                  </tr>
                )}

                {busy && (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500">
                      Loading questions...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between bg-white px-6 py-4 rounded-xl shadow-md">
          <div className="text-sm text-slate-600">
            Showing {rows.length > 0 ? (page - 1) * limit + 1 : 0} to{" "}
            {Math.min(page * limit, total)} of {total} questions
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() =>
                setSearchParams({
                  ...Object.fromEntries(searchParams),
                  page: String(page - 1),
                })
              }
              className="rounded-lg border border-slate-300 px-4 py-2 bg-white font-medium
                       disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50
                       transition"
            >
              Previous
            </button>

            <span className="text-sm px-4 py-2 bg-slate-100 rounded-lg font-medium">
              Page {page} of {pages}
            </span>

            <button
              disabled={page >= pages}
              onClick={() =>
                setSearchParams({
                  ...Object.fromEntries(searchParams),
                  page: String(page + 1),
                })
              }
              className="rounded-lg border border-slate-300 px-4 py-2 bg-white font-medium
                       disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50
                       transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
