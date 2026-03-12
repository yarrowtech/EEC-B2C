import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { getJSON, startExam } from "../lib/api";

const TYPE_TITLES = {
  "mcq-single": "MCQ - Single Correct",
  "mcq-multi": "MCQ - Multiple Correct",
  "choice-matrix": "Choice Matrix",
  "true-false": "True / False",
  "cloze-drag": "Cloze Drag & Drop",
  "cloze-select": "Cloze Drop-Down",
  "cloze-text": "Cloze Text",
  "match-list": "Match List",
  "essay-plain": "Essay Plain",
  "essay-rich": "Essay Rich",
};

export default function TryoutSubjects() {
  const { tryoutType = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("jwt") || "";

  const [loading, setLoading] = useState(false);
  const [startingId, setStartingId] = useState("");
  const [boardValue, setBoardValue] = useState(location.state?.board || "");
  const [classValue, setClassValue] = useState(location.state?.class || "");
  const [boardLabel, setBoardLabel] = useState(location.state?.boardLabel || "");
  const [classLabel, setClassLabel] = useState(location.state?.classLabel || "");
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function loadSubjectsForType() {
      if (!token) return;
      setLoading(true);
      try {
        const profile = await getJSON("/api/users/profile");
        const user = profile?.user || {};
        const board = user.boardId || user.board || user.boardName || boardValue;
        const cls = user.classId || user.class || user.className || classValue;
        const boardName = user.boardName || user.board || boardLabel;
        const className = user.className || user.class || classLabel;

        if (!board || !cls) {
          throw new Error("Board/Class missing in profile");
        }

        const [subjectRows, questionRows] = await Promise.all([
          getJSON(`/api/subject?board=${encodeURIComponent(board)}&class=${encodeURIComponent(cls)}`),
          getJSON(
            `/api/questions?board=${encodeURIComponent(board)}&class=${encodeURIComponent(
              cls
            )}&type=${encodeURIComponent(tryoutType)}&page=1&limit=5000`
          ),
        ]);

        const questions = Array.isArray(questionRows?.items) ? questionRows.items : [];
        const bySubject = {};
        for (const q of questions) {
          const key = String(q?.subject || "").trim().toLowerCase();
          if (!key) continue;
          if (!bySubject[key]) bySubject[key] = { total: 0, easy: 0, moderate: 0, hard: 0 };
          bySubject[key].total += 1;
          const difficulty = String(q?.difficulty || "easy").toLowerCase();
          if (difficulty === "hard") bySubject[key].hard += 1;
          else if (difficulty === "moderate") bySubject[key].moderate += 1;
          else bySubject[key].easy += 1;
        }

        const nextSubjects = (Array.isArray(subjectRows) ? subjectRows : [])
          .map((s) => {
            const name = String(s?.name || "").trim();
            const idKey = String(s?._id || "").trim().toLowerCase();
            const byName = bySubject[name.toLowerCase()] || { total: 0, easy: 0, moderate: 0, hard: 0 };
            const byId = idKey ? bySubject[idKey] || { total: 0, easy: 0, moderate: 0, hard: 0 } : { total: 0, easy: 0, moderate: 0, hard: 0 };
            const stats = {
              total: byName.total + byId.total,
              easy: byName.easy + byId.easy,
              moderate: byName.moderate + byId.moderate,
              hard: byName.hard + byId.hard,
            };
            return {
              _id: s?._id,
              name,
              stats,
            };
          })
          .filter((s) => s.stats.total > 0)
          .sort((a, b) => a.name.localeCompare(b.name));

        if (!mounted) return;
        setBoardValue(board);
        setClassValue(cls);
        setBoardLabel(boardName);
        setClassLabel(className);
        setSubjects(nextSubjects);
      } catch (e) {
        if (!mounted) return;
        toast.error(e?.message || "Failed to load subjects");
        setSubjects([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSubjectsForType();
    return () => {
      mounted = false;
    };
  }, [token, tryoutType]);

  const title = useMemo(() => TYPE_TITLES[tryoutType] || tryoutType, [tryoutType]);

  async function startPractice(subject) {
    if (!token) {
      window.dispatchEvent(new Event("eec:open-login"));
      return;
    }
    if (!subject?._id) {
      toast.error("Invalid subject");
      return;
    }

    setStartingId(subject._id);
    try {
      const topics = await getJSON(
        `/api/topic/${subject._id}?board=${encodeURIComponent(boardValue)}&class=${encodeURIComponent(
          classValue
        )}&stage=1`
      );
      const firstTopic = Array.isArray(topics) && topics.length > 0 ? topics[0] : null;
      if (!firstTopic?._id) {
        throw new Error("No topics found for this subject");
      }

      const data = await startExam({
        stage: "stage-1",
        subject: subject._id,
        topic: firstTopic._id,
        type: tryoutType,
        limit: 10,
        class: classValue,
        board: boardValue,
      });

      navigate(`/dashboard/exams/take/${data.attemptId}`, { state: data });
    } catch (e) {
      toast.error(e?.message || "Failed to start practice");
    } finally {
      setStartingId("");
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f7f6]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <ToastContainer />
      <main className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate("/tryouts")}
            className="mb-4 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to Tryouts
          </button>
          <h1 className="text-3xl font-black text-slate-900">{title} - Subjects</h1>
          <p className="text-slate-600">
            {boardLabel && classLabel ? `${boardLabel} - ${classLabel}` : "Profile scope"}
          </p>
        </div>

        {!token && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-slate-700">Please login to start practice.</p>
          </div>
        )}

        {token && loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            Loading subjects...
          </div>
        )}

        {token && !loading && subjects.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            No subjects found for this tryout type.
          </div>
        )}

        {token && !loading && subjects.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => (
              <div key={subject._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">{subject.name}</h3>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700">
                    Total: {subject.stats.total}
                  </span>
                  <span className="rounded-full bg-green-100 px-2 py-1 font-semibold text-green-700">
                    Easy: {subject.stats.easy}
                  </span>
                  <span className="rounded-full bg-yellow-100 px-2 py-1 font-semibold text-yellow-700">
                    Moderate: {subject.stats.moderate}
                  </span>
                  <span className="rounded-full bg-purple-100 px-2 py-1 font-semibold text-purple-700">
                    Hard: {subject.stats.hard}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => startPractice(subject)}
                  disabled={startingId === subject._id}
                  className="mt-4 w-full rounded-xl bg-amber-400 py-2.5 font-bold text-slate-900 hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {startingId === subject._id ? "Starting..." : "Practice now"}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
