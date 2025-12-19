// src/pages/Dashboard.jsx
import React, { useMemo, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  Users,
  CreditCard,
  Building2,
  Activity,
  CheckCircle2,
  FileText,
  GraduationCap,
  ClipboardList,
  MessageSquare,
  Clock,
  Bell,
  Sparkles,
} from "lucide-react";
import { myAttempts, adminAttempts } from "../lib/api";
import { Trophy, Target, Table as TableIcon } from "lucide-react";
import WelcomeCard from "./WelcomeCard";

/* small local helpers (mirrors your App.jsx approach) */
function getToken() {
  return localStorage.getItem("jwt") || "";
}
function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}
function isTokenValid(token) {
  if (!token) return false;
  try {
    const { exp } = JSON.parse(atob(token.split(".")[1] || ""));
    return typeof exp === "number" && Date.now() < exp * 1000;
  } catch {
    return false;
  }
}

/* ===== UI atoms ===== */

const Badge = ({ children, tone = "blue" }) => {
  const tones = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-800 border-amber-100",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${tones[tone] || tones.blue}`}>
      {children}
    </span>
  );
};

const IconBubble = ({ children, from, to }) => (
  <span
    className={`inline-flex size-9 items-center justify-center rounded-xl bg-gradient-to-br ${from} ${to} text-white shadow-sm`}
  >
    {children}
  </span>
);

const StatCard = ({ title, value, icon, gradient }) => {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 shadow-md text-white bg-gradient-to-br ${gradient[0]} ${gradient[1]} transition-all duration-300 hover:shadow-xl hover:scale-[1.02]`}
    >
      {/* Soft background pattern */}
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none">
        <div className="absolute top-3 right-4 w-20 h-20 bg-white rounded-full"></div>
        <div className="absolute bottom-3 left-4 w-14 h-14 bg-white rounded-full"></div>
      </div>

      {/* Foreground content */}
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-sm text-white/80">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
        </div>

        <div className="p-3 bg-white/20 rounded-xl shadow-md">
          {icon}
        </div>
      </div>
    </div>
  );
};


const Card = ({ title, icon, bubble = ["from-slate-700", "to-slate-900"], children }) => (
  <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md shadow-[0_6px_24px_-12px_rgba(2,6,23,0.15)] p-5 hover:shadow-[0_12px_28px_-10px_rgba(2,6,23,0.25)] transition-shadow">
    <div className="flex items-center justify-between mb-3">
      <div className="text-[13px] font-semibold text-slate-600 tracking-wide">{title}</div>
      {icon && (
        <IconBubble from={bubble[0]} to={bubble[1]}>
          {icon}
        </IconBubble>
      )}
    </div>
    <div className="text-slate-800">{children}</div>
  </div>
);

const Section = ({ title, subtitle, icon, children, className = "" }) => (
  <section className={`space-y-4 ${className}`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon && <span className="text-slate-700">{icon}</span>}
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h2>
      </div>
      {subtitle && <Badge tone="slate">{subtitle}</Badge>}
    </div>
    {children}
  </section>
);

/* ===== role-specific fragments (UI only) ===== */

// ---- ADMIN ----
// ---- ADMIN ----
function AdminContent() {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const [totalStudents, setTotalStudents] = useState(0);
  const [totalTeachers, setTotalTeachers] = useState(0);
  const [subjectMap, setSubjectMap] = useState({});
  const [topicMap, setTopicMap] = useState({});

  async function loadSubjectTopicNames() {
    try {
      const subjectRes = await fetch(`${import.meta.env.VITE_API_URL}/api/subjects`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` }
      });
      const subjects = await subjectRes.json();

      const topicRes = await fetch(`${import.meta.env.VITE_API_URL}/api/topics`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` }
      });
      const topics = await topicRes.json();

      const sMap = {};
      const tMap = {};

      subjects.items?.forEach(s => sMap[s._id] = s.name);
      topics.items?.forEach(t => tMap[t._id] = t.name);

      setSubjectMap(sMap);
      setTopicMap(tMap);
    } catch (err) {
      console.error("Failed to load names", err);
    }
  }


  // Fetch attempts + counts
  useEffect(() => {
    (async () => {
      setBusy(true);
      setErr("");

      try {
        loadSubjectTopicNames();
        // load exam attempts
        const { items } = await adminAttempts();
        setRows(items || []);

        // load students count
        const sRes = await fetch(`${import.meta.env.VITE_API_URL}/api/users/students-count`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        const sData = await sRes.json();
        setTotalStudents(sData.students?.length || 0);

        // load teachers count
        const tRes = await fetch(`${import.meta.env.VITE_API_URL}/api/users/teachers`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        const tData = await tRes.json();
        setTotalTeachers(tData.teachers?.length || 0);

      } catch (e) {
        setErr(e.message || "Failed to load attempts");
      } finally {
        setBusy(false);
      }
    })();
  }, []);

  const totalAttempts = rows.length;
  const avgPercent = rows.length
    ? Math.round(rows.reduce((acc, r) => acc + (r.percent || 0), 0) / rows.length)
    : 0;

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 6;

  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const paginatedRows = rows.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(rows.length / rowsPerPage);


  return (
    <>
      <WelcomeCard />
      {/* <Section title="Dashboard Overview" icon={<TableIcon size={18} />}> */}
      <Section title="Dashboard Overview" >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* ➤ Total Students */}
          <StatCard
            title="Total Students"
            value={totalStudents}
            icon={<Users size={18} />}
            gradient={["from-blue-600", "to-indigo-600"]}
          />

          {/* ➤ Total Teachers */}
          <StatCard
            title="Total Teachers"
            value={totalTeachers}
            icon={<GraduationCap size={18} />}
            gradient={["from-purple-600", "to-fuchsia-600"]}
          />

          {/* Existing Attempts Card */}
          {/* <StatCard
            title="Total Attempts (recent)"
            value={totalAttempts}
            icon={<ClipboardList size={18} />}
            gradient={["from-emerald-600", "to-teal-600"]}
          /> */}

          {/* Existing Average Score Card */}
          {/* <StatCard
            title="Average Score"
            value={`${avgPercent}%`}
            icon={<Target size={18} />}
            gradient={["from-rose-600", "to-pink-600"]}
          /> */}

        </div>
      </Section>

      {/* <Section title="Recent Attempts" subtitle={busy ? "Loading…" : err ? "Error" : `${rows.length} items`} icon={<Sparkles size={18} />}> */}
      <Section title="Recent Attempts" subtitle={busy ? "Loading…" : err ? "Error" : `${rows.length} items`}>
        <div className="overflow-auto bg-white/70 backdrop-blur">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="text-left p-3">Student</th>
                <th className="text-left p-3">Exam (Subject • Topic • Type)</th>
                <th className="text-left p-3">Score</th>
                <th className="text-left p-3">Attempts by Student</th>
                <th className="text-left p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map(r => (
                <tr key={r._id} className="border-t">
                  <td className="p-3">
                    <div className="font-medium">{r.user?.name || "—"}</div>
                    <div className="text-xs text-slate-500">{r.user?.email || ""}</div>
                  </td>
                  <td className="p-3">
                    {subjectMap[r.subject] || r.subjectName || "—"} • {topicMap[r.topic] || r.topicName || "—"} •
                    <span className="uppercase text-xs bg-slate-100 px-1.5 py-0.5 rounded">{r.type}</span>
                  </td>
                  <td className="p-3">
                    <span className="font-semibold">{r.score}</span> / {r.total}
                    <span className="ml-2 text-xs text-slate-500">({r.percent}%)</span>
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-2 rounded-full border px-2 py-0.5 text-xs">
                      {r.attemptsForUser} attempts
                    </span>
                  </td>
                  <td className="p-3 text-slate-600">{new Date(r.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {!rows.length && !busy && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">
                    No attempts yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="flex justify-center items-center gap-3 py-4 bg-gray-200 cursor-not-allowed border-t">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-white rounded disabled:opacity-50"
            >
              Prev
            </button>

            <span className="text-sm text-slate-700">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-white rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </Section>
    </>
  );
}



function TeacherContent() {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const [totalStudents, setTotalStudents] = useState(0);
  const [totalTeachers, setTotalTeachers] = useState(0);

  // Fetch attempts + counts
  useEffect(() => {
    (async () => {
      setBusy(true);
      setErr("");

      try {
        // load exam attempts
        // const { items } = await adminAttempts();
        // setRows(items || []);

        // load students count
        const sRes = await fetch(`${import.meta.env.VITE_API_URL}/api/users/students-count`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        const sData = await sRes.json();
        setTotalStudents(sData.students?.length || 0);

        // load teachers count
        const tRes = await fetch(`${import.meta.env.VITE_API_URL}/api/users/teachers`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        const tData = await tRes.json();
        setTotalTeachers(tData.teachers?.length || 0);

      } catch (e) {
        setErr(e.message || "Failed to load attempts");
      } finally {
        setBusy(false);
      }
    })();
  }, []);

  const totalAttempts = rows.length;
  const avgPercent = rows.length
    ? Math.round(rows.reduce((acc, r) => acc + (r.percent || 0), 0) / rows.length)
    : 0;

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 6;

  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const paginatedRows = rows.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(rows.length / rowsPerPage);

  // const totalAttempts = rows.length;
  // const avgPercent = rows.length
  //   ? Math.round(rows.reduce((acc, r) => acc + (r.percent || 0), 0) / rows.length)
  //   : 0;
  return (
    <>
      <WelcomeCard />
      <Section title="Teacher Overview" icon={<GraduationCap size={18} />}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Students"
            value={totalStudents}
            icon={<GraduationCap size={18} />}
            gradient={["from-indigo-600", "to-violet-600"]}
          />
          {/* <StatCard
            title="Assignments To Review"
            value="34"
            icon={<ClipboardList size={18} />}
            gradient={["from-rose-600", "to-pink-600"]}
          /> */}
          {/* <StatCard
            title="Students"
            value="182"
            icon={<Users size={18} />}
            gradient={["from-emerald-600", "to-teal-600"]}
          />
          <StatCard
            title="Messages"
            value="5"
            icon={<MessageSquare size={18} />}
            gradient={["from-amber-500", "to-orange-600"]}
          /> */}
        </div>
      </Section>
      <Section title="Recent Attempts" subtitle={busy ? "Loading…" : err ? "Error" : `${rows.length} items`}>
        <div className="overflow-auto bg-white/70 backdrop-blur">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="text-left p-3">Student</th>
                <th className="text-left p-3">Exam (Subject • Topic • Type)</th>
                <th className="text-left p-3">Score</th>
                <th className="text-left p-3">Attempts by Student</th>
                <th className="text-left p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map(r => (
                <tr key={r._id} className="border-t">
                  <td className="p-3">
                    <div className="font-medium">{r.user?.name || "—"}</div>
                    <div className="text-xs text-slate-500">{r.user?.email || ""}</div>
                  </td>
                  <td className="p-3">
                    {subjectMap[r.subject] || r.subjectName || "—"} • {topicMap[r.topic] || r.topicName || "—"} •
                    <span className="uppercase text-xs bg-slate-100 px-1.5 py-0.5 rounded">{r.type}</span>
                  </td>
                  <td className="p-3">
                    <span className="font-semibold">{r.score}</span> / {r.total}
                    <span className="ml-2 text-xs text-slate-500">({r.percent}%)</span>
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-2 rounded-full border px-2 py-0.5 text-xs">
                      {r.attemptsForUser} attempts
                    </span>
                  </td>
                  <td className="p-3 text-slate-600">{new Date(r.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {!rows.length && !busy && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">
                    No attempts yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="flex justify-center items-center gap-3 py-4 bg-gray-200 cursor-not-allowed border-t">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-white rounded disabled:opacity-50"
            >
              Prev
            </button>

            <span className="text-sm text-slate-700">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-white rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </Section>

      {/* <Section title="Today’s Queue" subtitle="Auto-updated">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Upcoming Sessions" icon={<Clock size={18} />} bubble={["from-blue-600", "to-indigo-600"]}>
            Maths (2:00 PM), Science (4:00 PM)
          </Card>
          <Card title="Alerts" icon={<Bell size={18} />} bubble={["from-rose-600", "to-pink-600"]}>
            2 students flagged for support
          </Card>
        </div>
      </Section> */}
    </>
  );
}

function StudentContent() {
  const [attempts, setAttempts] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      setBusy(true); setErr("");
      try {
        const { items } = await myAttempts();
        setAttempts(items || []);
      } catch (e) {
        setErr(e.message || "Failed to load");
      } finally {
        setBusy(false);
      }
    })();
  }, []);

  const totalAttempts = attempts.length;
  const totalScore = attempts.reduce((acc, a) => acc + (a.score || 0), 0);
  const totalPossible = attempts.reduce((acc, a) => acc + (a.total || 0), 0);

  // average percent
  const averagePercent =
    totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;

  return (
    <>
      <WelcomeCard />
      {/* <Section title="My Exam Stats" icon={<Trophy size={18} />}> */}
      <Section title="My Exam Stats">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* ✅ UPDATED CARD */}
          <StatCard
            title="Average Score"
            value={
              busy
                ? "…"
                : `${averagePercent}% `
            }
            icon={<Trophy size={18} />}
            gradient={["from-emerald-600", "to-teal-600"]}
          />

          <StatCard
            title="Total Points"
            value={busy ? "…" : `${totalScore} / ${totalPossible}`}
            icon={<ClipboardList size={18} />}
            gradient={["from-blue-600", "to-indigo-600"]}
          />

          {/* other cards unchanged */}
          <StatCard
            title="Attempts"
            value={busy ? "…" : `${totalAttempts} attempt${totalAttempts !== 1 ? "s" : ""}`}
            icon={<CheckCircle2 size={18} />}
            gradient={["from-emerald-600", "to-teal-600"]}
          />
          <StatCard
            title="Passed Attempts"
            value={busy ? "…" : `${totalScore}`}
            icon={<Bell size={18} />}
            gradient={["from-fuchsia-600", "to-pink-600"]}
          />
        </div>
        {err && <div className="text-xs text-rose-600 mt-2">{err}</div>}
      </Section>

      <Section title="Recent Exams" subtitle={busy ? "Loading…" : `${attempts.length} attempts`}>
        <div className="rounded-2xl border bg-white/70 backdrop-blur shadow-md overflow-hidden">

          {/* Table Header */}
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b">
            <table className="min-w-[720px] w-full text-sm">
              <thead>
                <tr className="text-slate-700">
                  <th className="p-4 text-left font-semibold">Exam</th>
                  <th className="p-4 text-left font-semibold">Score</th>
                  <th className="p-4 text-left font-semibold">When</th>
                </tr>
              </thead>
            </table>
          </div>

          {/* Table Body */}
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full text-sm">
              <tbody className="divide-y divide-slate-200">

                {attempts
                  .slice()
                  .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
                  .slice(0, 5)
                  .map(a => (
                    <tr
                      key={a._id}
                      className="hover:bg-yellow-50/60 transition-all duration-200"
                    >
                      {/* EXAM NAME */}
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">
                            {a.subject?.name || a.subjectName || "—"}
                          </span>

                          <span className="text-xs text-slate-500">
                            {a.topic?.name || a.topicName || "—"}
                          </span>

                          <span className="inline-block mt-1 text-[10px] uppercase bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                            {a.type}
                          </span>
                        </div>
                      </td>

                      {/* SCORE */}
                      <td className="p-4">
                        <div className="font-semibold text-slate-800">
                          {a.score}/{a.total}
                        </div>

                        <div className="text-xs mt-1">
                          <span
                            className={`
                      px-2 py-0.5 rounded-full 
                      ${a.percent >= 90 ? "bg-green-100 text-green-700" :
                                a.percent >= 75 ? "bg-blue-100 text-blue-700" :
                                  a.percent >= 50 ? "bg-yellow-100 text-yellow-700" :
                                    "bg-red-100 text-red-700"}
                    `}
                          >
                            {a.percent}%
                          </span>
                        </div>
                      </td>

                      {/* DATE */}
                      <td className="p-4 text-slate-600">
                        {a.submittedAt
                          ? new Date(a.submittedAt).toLocaleString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "numeric",
                            hour12: true
                          })
                          : "-"}
                      </td>
                    </tr>
                  ))}

                {/* NO DATA */}
                {!attempts.length && !busy && (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-slate-500">
                      No attempts yet.
                    </td>
                  </tr>
                )}

              </tbody>
            </table>
          </div>
        </div>
      </Section>

    </>
  );
}

function RightHeaderStats({ user }) {
  const [now, setNow] = React.useState(new Date());
  const [totalScore, setTotalScore] = React.useState(0);

  // Update time every second
  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch total score for logged-in user (if student)
  React.useEffect(() => {
    const data = JSON.parse(localStorage.getItem("myAttempts") || "[]");
    if (Array.isArray(data) && data.length) {
      const total = data.reduce((sum, a) => sum + (a.score || 0), 0);
      setTotalScore(total);
    }
  }, []);

  return (
    <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-blue-600/90 to-indigo-700/90 text-white px-4 py-2 shadow-md">
      {/* svg icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="size-6 text-yellow-300"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="2"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 8v4l3 3m6 1a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>

      {/* text data */}
      <div className="flex flex-col text-right">
        <span className="text-xs opacity-90">
          {now.toLocaleDateString(undefined, {
            weekday: "short",
            day: "2-digit",
            month: "short",
          })}
        </span>
        <span className="text-sm font-semibold">
          {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
        <span className="text-[13px] font-semibold mt-0.5 text-yellow-300">
          {/* Total Score: {avgPercent} */}
        </span>
      </div>
    </div>
  );
}


/* ===== unified dashboard ===== */
export default function Dashboard() {
  const token = getToken();
  const user = getUser();

  if (!isTokenValid(token) || !user?.role) {
    // mirror your guard behavior
    localStorage.removeItem("jwt");
    localStorage.removeItem("user");
    window.dispatchEvent(new CustomEvent("eec:auth", { detail: { type: "logout" } }));
    return <Navigate to="/" replace />;
  }

  const roleKey = String(user.role || "").toLowerCase();
  const roleContent = useMemo(() => {
    if (roleKey === "admin") return <AdminContent />;
    if (roleKey === "teacher") return <TeacherContent />;
    return <StudentContent />; // default
  }, [roleKey]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100">
      {/* <div className="border-b border-white/60 bg-white/70 backdrop-blur-md supports-[backdrop-filter]:bg-white/55">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-gradient-to-br from-yellow-600 to-orange-600 shadow-sm" />
            <div>
              <div className="text-[12px] text-slate-500/90">Welcome</div>
              <div className="font-semibold text-slate-800 leading-tight tracking-tight">
                {user?.name || "User"} — <span className="capitalize">{roleKey}</span>
              </div>
            </div>
          </div>
          <RightHeaderStats user={user} />
        </div>
      </div> */}

      <main className="mx-auto max-w-7xl px-4 py-8 space-y-8">
        {roleContent}

        {/* <Section title="Announcements" icon={<Bell size={18} />}>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card title="System Update" icon={<Sparkles size={18} />} bubble={["from-slate-800", "to-slate-900"]}>
              Minor fixes deployed.
            </Card>
            <Card title="Maintenance Window" icon={<Clock size={18} />} bubble={["from-amber-600", "to-orange-600"]}>
              Sunday 1–3 AM IST.
            </Card>
            <Card title="Help & Support" icon={<MessageSquare size={18} />} bubble={["from-blue-600", "to-indigo-600"]}>
              Reach out from the help menu.
            </Card>
          </div>
        </Section> */}
      </main>
    </div>
  );
}
