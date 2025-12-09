import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { adminAttempt } from "../../lib/api";
import { FiArrowLeft, FiCheck, FiX } from "react-icons/fi";

export default function ResultDetail() {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [subjectMap, setSubjectMap] = useState({});
  const [topicMap, setTopicMap] = useState({});

  // useEffect(() => {
  //   (async () => {
  //     setBusy(true);
  //     setErr("");
  //     try {
  //       const data = await adminAttempt(id);
  //       setDoc(data);
  //     } catch (e) {
  //       setErr(e.message || "Failed to load");
  //     } finally {
  //       setBusy(false);
  //     }
  //   })();
  // }, [id]);

  useEffect(() => {
  (async () => {
    setBusy(true);
    setErr("");
    try {
      loadSubjectTopicNames(); // ⭐ ADD THIS
      const data = await adminAttempt(id);
      setDoc(data);
    } catch (e) {
      setErr(e.message || "Failed to load");
    } finally {
      setBusy(false);
    }
  })();
}, [id]);


  if (busy && !doc) return <div className="p-6 text-slate-600">Loading…</div>;
  if (err) return <div className="p-6 text-rose-600">{err}</div>;
  if (!doc) return null;

  async function loadSubjectTopicNames() {
  try {
    // Fetch all subjects
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/subject`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
    });
    const subjects = await res.json();

    const sMap = {};
    const tMap = {};

    for (const s of subjects) {
      sMap[s._id] = s.name;

      // fetch topics inside this subject
      const tRes = await fetch(
        `${import.meta.env.VITE_API_URL}/api/topic/${s._id}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
        }
      );
      const topics = await tRes.json();

      topics.forEach((t) => {
        tMap[t._id] = t.name;
      });
    }

    setSubjectMap(sMap);
    setTopicMap(tMap);
  } catch (e) {
    console.error("Failed to load subject/topic names:", e);
  }
}


  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Attempt Details
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Complete information about the student’s attempt
          </p>
        </div>

        <Link
          to="/dashboard/results"
          className="
            flex items-center gap-2 
            rounded-xl border px-4 py-2 
            hover:bg-slate-50 transition shadow-sm
          "
        >
          <FiArrowLeft /> Back
        </Link>
      </div>

      {/* Information Grid */}
      <div
        className="
          grid gap-5 
          sm:grid-cols-2 lg:grid-cols-3
        "
      >
        <Info title="Student" value={`${doc.user?.name || "—"} (${doc.user?.email || "—"})`} />
        <Info title="Subject" value={doc.subject} />
        <Info title="Topic" value={doc.topic} />
        <Info title="Type" value={doc.type} />
        <Info title="Score" value={`${doc.score} / ${doc.total} (${doc.percent}%)`} />
        <Info
          title="Submitted"
          value={
            doc.submittedAt
              ? new Date(doc.submittedAt).toLocaleString()
              : "—"
          }
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-slate-100 border-b">
            <tr>
              <th className="text-left p-3 font-semibold text-slate-700">#</th>
              <th className="text-left p-3 font-semibold text-slate-700">Question</th>
              <th className="text-left p-3 font-semibold text-slate-700">Student Answer</th>
              <th className="text-left p-3 font-semibold text-slate-700">Correct</th>
              <th className="text-left p-3 font-semibold text-slate-700">Result</th>
            </tr>
          </thead>

          <tbody>
            {doc.items.map((it, idx) => (
              <tr
                key={it.qid}
                className="border-t hover:bg-slate-50 transition"
              >
                <td className="p-3">{idx + 1}</td>
                <td className="p-3 max-w-[350px]">{it.question}</td>
                <td className="p-3 text-indigo-700">{it.studentAnswer}</td>
                <td className="p-3 text-green-700">{it.correctAnswer}</td>

                <td className="p-3">
                  {it.isCorrect ? (
                    <span className="flex items-center gap-1 text-green-600 font-semibold">
                      <FiCheck /> Correct
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-600 font-semibold">
                      <FiX /> Wrong
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Info({ title, value }) {
  return (
    <div
      className="
        rounded-xl border bg-white shadow-sm 
        p-4 transition hover:shadow-md
      "
    >
      <div className="text-[11px] uppercase text-slate-500 tracking-wide">
        {title}
      </div>
      <div className="text-sm font-semibold text-slate-800 mt-1">
        {value}
      </div>
    </div>
  );
}
