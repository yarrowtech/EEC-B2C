import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { getJSON, deleteQuestion } from "../../lib/api";
import { FiFilter, FiSearch, FiTrash2, FiEdit3, FiList } from "react-icons/fi";
import Swal from "sweetalert2";

const TYPES = [
  "mcq-single", "mcq-multi", "choice-matrix", "true-false",
  "cloze-drag", "cloze-select", "cloze-text", "match-list",
  "essay-rich", "essay-plain",
];

export default function QuestionsList() {
  const { scope } = useQuestionScope();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [subjectMap, setSubjectMap] = useState({});
  const [topicMap, setTopicMap] = useState({});


  const page = Number(searchParams.get("page") || 1);
  const limit = 10;

  const [type, setType] = useState(searchParams.get("type") || "");
  const [q, setQ] = useState(searchParams.get("q") || "");

  // ⭐ NEW: Class filter states
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(searchParams.get("class") || "");

  const canSearch = useMemo(
    () => !!scope.subject || !!scope.topic || !!type || !!q || !!selectedClass,
    [scope, type, q, selectedClass]
  );

  // ⭐ Fetch available classes
  async function loadClasses() {
    try {
      const data = await getJSON("/api/questions/classes");
      setClasses(data || []);
    } catch (e) {
      console.log("Class load failed", e);
    }
  }

  async function load() {
    setBusy(true);
    setErr("");
    try {
      const qs = new URLSearchParams();
      if (scope.subject) qs.set("subject", scope.subject);
      if (scope.topic) qs.set("topic", scope.topic);
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

  // useEffect(() => {
  //   loadClasses();
  //   load();
  //   // eslint-disable-next-line 
  // }, [page]);

  useEffect(() => {
    loadClasses();
    loadSubjectTopicNames();  // ADD THIS
    load();
    // eslint-disable-next-line
  }, [page]);


  function applyFilters(e) {
    e.preventDefault();
    const next = {};
    if (scope.subject) next.subject = scope.subject;
    if (scope.topic) next.topic = scope.topic;
    if (type) next.type = type;
    if (q) next.q = q;
    if (selectedClass) next.class = selectedClass;
    next.page = "1";
    setSearchParams(next);
    setTimeout(load, 0);
  }

  // async function onDelete(id) {
  //   if (!confirm("Delete this question?")) return;
  //   try {
  //     await deleteQuestion(id);
  //     await load();
  //   } catch (e) {
  //     alert(e.message);
  //   }
  // }

  async function onDelete(id) {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This question will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626", // red
      cancelButtonColor: "#64748b", // slate
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
  async function loadSubjectTopicNames() {
    try {
      // Load subjects
      const subjects = await getJSON("/api/subject");
      const sMap = {};
      subjects.forEach((s) => (sMap[s._id] = s.name));

      // Load topics for each subject
      const tMap = {};
      for (const s of subjects) {
        const topics = await getJSON(`/api/topic/${s._id}`);
        topics.forEach((t) => (tMap[t._id] = t.name));
      }

      setSubjectMap(sMap);
      setTopicMap(tMap);
    } catch (err) {
      console.error("Failed to load subject/topic names", err);
    }
  }

  return (
    <div
      className="
        space-y-8 
        backdrop-blur-xl p-8
      "
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 shadow">
          <FiList size={22} />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Questions — List
        </h1>
      </div>

      {/* ⭐ NEW: CLASS TABS */}
      {/* {classes.length > 0 && (
        <div className="flex gap-3 mb-4 overflow-x-auto pb-2">
          {classes.map((cls) => {
            const isActive = selectedClass === cls;
            return (
              <button
                key={cls}
                onClick={() => {
                  setSelectedClass(cls);
                  setSearchParams({ class: cls, page: 1 });
                  setTimeout(load, 0);
                }}
                className={`
                  px-5 py-2 rounded-2xl font-semibold text-sm shadow 
                  transition-all whitespace-nowrap
                  ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-lg scale-[1.05]"
                      : "bg-white/70 backdrop-blur border border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  }
                `}
              >
                {cls}
              </button>
            );
          })}
        </div>
      )} */}

      <SubjectTopicPicker />

      {/* Filters Card */}
      <form
        onSubmit={applyFilters}
        className="
          grid sm:grid-cols-3 gap-6 
          bg-white/70 backdrop-blur-xl shadow 
          rounded-2xl p-6
        "
      >
        {/* Type */}
        <div>
          <label className="font-semibold text-slate-700 mb-2 block flex items-center gap-2">
            <FiFilter className="text-indigo-600" />
            Type
          </label>
          <select
            className="
              w-full rounded-xl px-4 py-2 bg-white shadow-sm
              focus:ring-2 focus:ring-indigo-500 transition-all
            "
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
            className="
              w-full rounded-xl px-4 py-2 bg-white shadow-sm
              focus:ring-2 focus:ring-purple-500 transition-all
            "
            placeholder="Search question/prompt..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {/* Apply Button */}
        <div className="flex items-end gap-2">
          <button
            className="
              rounded-xl px-6 py-3 
              bg-gradient-to-r from-blue-600 to-blue-700 
              text-white font-semibold shadow 
              hover:shadow-lg hover:scale-[1.02] 
              active:scale-95 transition-all
            "
          >
            Apply
          </button>
          {!canSearch && (
            <span className="text-xs text-slate-500">
              Tip: Use filters or search
            </span>
          )}
        </div>
      </form>
      {classes.length > 0 && (
        <div className="flex gap-3 mb-4 overflow-x-auto pb-2">
          {/* ⭐ CLASS FILTER BAR WITH "ALL" BUTTON */}
          <div className="flex gap-3 mb-4 mt-4 overflow-x-auto pb-2">

            {/* ALL button */}
            <button
              onClick={() => {
                setSelectedClass("");
                setSearchParams({ page: 1 }); // reset all filters
                setTimeout(load, 0);
              }}
              className={`
      px-5 py-2 rounded-2xl font-semibold text-sm shadow 
      transition-all whitespace-nowrap
      ${!selectedClass
                  ? "bg-indigo-600 text-white shadow-lg scale-[1.05]"
                  : "bg-white/70 backdrop-blur border border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                }
    `}
            >
              All
            </button>

            {/* Existing class buttons */}
            {classes.length > 0 &&
              classes.map((cls) => {
                const isActive = selectedClass === cls;
                return (
                  <button
                    key={cls}
                    onClick={() => {
                      setSelectedClass(cls);
                      setSearchParams({ class: cls, page: 1 });
                      setTimeout(load, 0);
                    }}
                    className={`
            px-5 py-2 rounded-2xl font-semibold text-sm shadow 
            transition-all whitespace-nowrap
            ${isActive
                        ? "bg-indigo-600 text-white shadow-lg scale-[1.05]"
                        : "bg-white/70 backdrop-blur border border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                      }
          `}
                  >
                    {cls}
                  </button>
                );
              })}
          </div>

        </div>
      )}
      {err && <div className="text-red-600 text-sm">{err}</div>}

      {/* Table */}
      <div className="overflow-auto bg-white shadow">
        <div className="overflow-hidden border border-slate-200 bg-white shadow-md">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
              <tr>
                {["Type", "Subject", "Topic", "Preview", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="
              text-left px-4 py-3 
              font-semibold text-slate-700 
              uppercase tracking-wide text-xs
            "
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr
                  key={r._id}
                  className="
            hover:bg-indigo-50/40 
            transition-all cursor-pointer
          "
                >
                  <td className="px-4 py-3 font-medium text-slate-700">{r.type}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {subjectMap[r.subject] || "—"}
                  </td>

                  <td className="px-4 py-3 text-slate-700">
                    {topicMap[r.topic] || "—"}
                  </td>

                  {/* <td className="px-4 py-3 text-slate-600">{r.difficulty || "-"}</td> */}

                  <td className="px-4 py-3">
                    <div className="line-clamp-2 max-w-[380px] text-slate-700">
                      {r.question ||
                        r.prompt ||
                        r.choiceMatrix?.prompt ||
                        r.clozeDrag?.text ||
                        r.clozeSelect?.text ||
                        r.clozeText?.text ||
                        r.matchList?.prompt ||
                        "-"}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/dashboard/questions/edit/${r._id}`}
                      className="
                inline-flex items-center gap-1 
                rounded-lg px-3 py-1.5
                border border-blue-300 
                bg-white 
                text-blue-700 
                hover:bg-blue-50 
                shadow-sm transition mr-2
              "
                    >
                      <FiEdit3 size={15} /> Edit
                    </Link>

                    <button
                      onClick={() => onDelete(r._id)}
                      className="
                inline-flex items-center gap-1 
                rounded-lg px-3 py-1.5
                border border-red-300 
                text-red-600 
                bg-white 
                hover:bg-red-50 
                shadow-sm transition
              "
                    >
                      <FiTrash2 size={15} /> Delete
                    </button>
                  </td>
                </tr>
              ))}

              {!rows.length && !busy && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-6 text-center text-slate-500 tracking-wide"
                  >
                    No questions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">Total: {total}</div>

        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() =>
              setSearchParams({
                ...Object.fromEntries(searchParams),
                page: String(page - 1),
              })
            }
            className="
              rounded-lg border px-3 py-1 bg-white
              disabled:opacity-50 hover:bg-slate-50 transition
            "
          >
            Prev
          </button>

          <span className="text-sm px-2">
            Page {page} / {pages}
          </span>

          <button
            disabled={page >= pages}
            onClick={() =>
              setSearchParams({
                ...Object.fromEntries(searchParams),
                page: String(page + 1),
              })
            }
            className="
              rounded-lg border px-3 py-1 bg-white
              disabled:opacity-50 hover:bg-slate-50 transition
            "
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
