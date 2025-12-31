import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { adminAttempt } from "../../lib/api";
import { ArrowLeft, Check, X, BookOpen, ClipboardList, Calendar, Award, TrendingUp } from "lucide-react";

export default function ResultDetail() {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [subjectMap, setSubjectMap] = useState({});
  const [topicMap, setTopicMap] = useState({});

  useEffect(() => {
    (async () => {
      setBusy(true);
      setErr("");
      try {
        loadSubjectTopicNames();
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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/subject`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
      });
      const subjects = await res.json();

      const sMap = {};
      const tMap = {};

      for (const s of subjects) {
        sMap[s._id] = s.name;

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

  const correctCount = doc.items.filter(it => it.isCorrect).length;
  const wrongCount = doc.items.length - correctCount;
  const accuracy = doc.items.length > 0 ? Math.round((correctCount / doc.items.length) * 100) : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-sm">
            <ClipboardList size={20} />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-slate-800 tracking-tight">Exam Attempt Details</h1>
            <p className="text-sm text-slate-500">Complete breakdown of student's performance</p>
          </div>
        </div>

        <Link
          to="/dashboard/results"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium text-slate-700"
        >
          <ArrowLeft size={16} />
          Back to Results
        </Link>
      </div>

      {/* Score Overview Card */}
      <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-purple-50 to-pink-50 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Student Info */}
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {(doc.user?.name || "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{doc.user?.name || "Unknown"}</h2>
              <p className="text-sm text-slate-600">{doc.user?.email || "—"}</p>
            </div>
          </div>

          {/* Score Display */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {doc.score}/{doc.total}
              </div>
              <p className="text-xs text-slate-600 mt-1">Score</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {doc.percent}%
              </div>
              <p className="text-xs text-slate-600 mt-1">Percentage</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <InfoCard
          icon={<BookOpen size={20} />}
          title="Subject"
          value={doc.subjectName || subjectMap[doc.subject] || doc.subject}
          gradient="from-blue-600 to-cyan-600"
        />

        <InfoCard
          icon={<ClipboardList size={20} />}
          title="Topic"
          value={doc.topicName || topicMap[doc.topic] || doc.topic}
          gradient="from-indigo-600 to-purple-600"
        />

        <InfoCard
          icon={<Award size={20} />}
          title="Exam Type"
          value={doc.type?.toUpperCase() || "—"}
          gradient="from-purple-600 to-pink-600"
        />

        <InfoCard
          icon={<TrendingUp size={20} />}
          title="Accuracy"
          value={`${accuracy}%`}
          gradient="from-green-600 to-emerald-600"
        />

        <InfoCard
          icon={<Check size={20} />}
          title="Correct Answers"
          value={`${correctCount} / ${doc.items.length}`}
          gradient="from-green-600 to-teal-600"
        />

        <InfoCard
          icon={<Calendar size={20} />}
          title="Submitted At"
          value={doc.submittedAt ? new Date(doc.submittedAt).toLocaleString() : "—"}
          gradient="from-orange-600 to-red-600"
        />
      </div>

      {/* Questions Breakdown */}
      <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-pink-50">
          <h2 className="text-lg font-semibold text-slate-800">Questions Breakdown</h2>
          <p className="text-sm text-slate-600 mt-1">
            Detailed analysis of each question and answer
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Q#</th>
                <th className="px-6 py-4 text-left font-semibold">Question</th>
                <th className="px-6 py-4 text-left font-semibold">Student Answer</th>
                <th className="px-6 py-4 text-left font-semibold">Correct Answer</th>
                <th className="px-6 py-4 text-left font-semibold">Result</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {doc.items.map((it, idx) => (
                <tr
                  key={it.qid}
                  className={`transition-all ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"} hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50`}
                >
                  <td className="px-6 py-4 font-semibold text-slate-700">
                    {idx + 1}
                  </td>
                  <td className="px-6 py-4 max-w-[400px] text-slate-800">
                    {it.question}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      it.isCorrect
                        ? "bg-green-100 text-green-800 border border-green-200"
                        : "bg-red-100 text-red-800 border border-red-200"
                    }`}>
                      {it.studentAnswer}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {it.correctAnswer}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {it.isCorrect ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-100 text-green-700 font-semibold text-xs border border-green-200">
                        <Check size={14} /> Correct
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 font-semibold text-xs border border-red-200">
                        <X size={14} /> Wrong
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Footer */}
        <div className="px-6 py-4 border-t bg-gradient-to-r from-slate-50 to-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-slate-700">
                <span className="font-semibold">{correctCount}</span> Correct
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-slate-700">
                <span className="font-semibold">{wrongCount}</span> Wrong
              </span>
            </div>
          </div>
          <div className="text-sm text-slate-600">
            Total Questions: <span className="font-semibold text-slate-800">{doc.items.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, title, value, gradient }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/60 bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 group">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className={`inline-flex size-10 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} text-white shadow-md`}>
            {icon}
          </div>
        </div>
        <div className="text-xs uppercase text-slate-500 font-medium tracking-wide mb-1">
          {title}
        </div>
        <div className="text-base font-semibold text-slate-900 truncate">
          {value}
        </div>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
    </div>
  );
}
