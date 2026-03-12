// src/pages/Dashboard.jsx
import React, { useMemo, useEffect, useState, useRef } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
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
import { myAttempts, adminAttempts, getJSON } from "../lib/api";
import { Trophy, Target, Table as TableIcon } from "lucide-react";
import WelcomeCard from "./WelcomeCard";
import WelcomeModal from "../components/WelcomeModal";
import AdventureStatCard from '../components/student/AdventureStatCard';
import DailyQuestCard from '../components/student/DailyQuestCard';
import SubscriptionSpotlight from '../components/student/SubscriptionSpotlight';

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

function getLevel(score) {
  if (score >= 2000) return "Champion";
  if (score >= 1000) return "Explorer";
  if (score >= 500) return "Apprentice";
  if (score >= 100) return "Scout";
  return "Novice";
}

const DASHBOARD_CACHE_PREFIX = "eec:dashboard-cache";

function getDashboardCacheKey(section) {
  const user = getUser();
  const userKey = user?._id || user?.id || user?.email || "anonymous";
  return `${DASHBOARD_CACHE_PREFIX}:${userKey}:${section}`;
}

function readDashboardCache(section, ttlMs) {
  try {
    const raw = localStorage.getItem(getDashboardCacheKey(section));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const { ts, data } = parsed;
    if (typeof ts !== "number") return null;
    if (Date.now() - ts > ttlMs) return null;
    return data;
  } catch {
    return null;
  }
}

function writeDashboardCache(section, data) {
  try {
    localStorage.setItem(
      getDashboardCacheKey(section),
      JSON.stringify({ ts: Date.now(), data })
    );
  } catch {
    // Ignore storage quota or serialization errors.
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
      className={`relative overflow-hidden rounded-xl md:rounded-2xl p-3 md:p-5 shadow-md text-white bg-gradient-to-br ${gradient[0]} ${gradient[1]} transition-all duration-300 hover:shadow-xl hover:scale-[1.02]`}
    >
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none">
        <div className="absolute top-3 right-4 w-20 h-20 bg-white rounded-full"></div>
        <div className="absolute bottom-3 left-4 w-14 h-14 bg-white rounded-full"></div>
      </div>
      <div className="relative z-10 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs md:text-sm text-white/80 truncate">{title}</p>
          <h3 className="text-base md:text-2xl font-bold mt-0.5 md:mt-1 truncate">{value}</h3>
        </div>
        <div className="p-2 md:p-3 bg-white/20 rounded-lg md:rounded-xl shadow-md flex-shrink-0">
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
  <section className={`space-y-3 md:space-y-4 ${className}`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon && <span className="text-slate-700">{icon}</span>}
        <h2 className="text-sm md:text-lg font-bold text-slate-800 tracking-tight">{title}</h2>
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
  const [uploadedQuestions, setUploadedQuestions] = useState(0);
  const [uploadedQuestionTypes, setUploadedQuestionTypes] = useState(0);
  const [totalStudyMaterials, setTotalStudyMaterials] = useState(0);
  const [subjectMap, setSubjectMap] = useState({});
  const [topicMap, setTopicMap] = useState({});

  async function loadSubjectTopicNames() {
    const cached = readDashboardCache("admin-subject-topic-map", 10 * 60 * 1000);
    if (cached) {
      setSubjectMap(cached.subjectMap || {});
      setTopicMap(cached.topicMap || {});
      return;
    }

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
      writeDashboardCache("admin-subject-topic-map", {
        subjectMap: sMap,
        topicMap: tMap,
      });
    } catch (err) {
      console.error("Failed to load names", err);
    }
  }


  // Fetch attempts + counts
  useEffect(() => {
    const cached = readDashboardCache("admin-dashboard-core", 60 * 1000);
    if (cached) {
      setRows(cached.rows || []);
      setTotalStudents(cached.totalStudents || 0);
      setTotalTeachers(cached.totalTeachers || 0);
      setUploadedQuestions(cached.uploadedQuestions || 0);
      setUploadedQuestionTypes(cached.uploadedQuestionTypes || 0);
      setTotalStudyMaterials(cached.totalStudyMaterials || 0);
      loadSubjectTopicNames();
      return;
    }

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
        const teachersCount = tData.teachers?.length || 0;
        setTotalTeachers(teachersCount);

        // load question stats
        const questionData = await getJSON("/api/questions?page=1&limit=5000");
        const questionItems = questionData.items || [];
        const questionCount = questionItems.length;
        const questionTypeCount = new Set(
          questionItems.map((item) => item.type).filter(Boolean)
        ).size;
        setUploadedQuestions(questionCount);
        setUploadedQuestionTypes(questionTypeCount);

        // load total study materials
        const studyMaterials = await getJSON("/api/study-materials/admin/all");
        const materialsCount = Array.isArray(studyMaterials) ? studyMaterials.length : 0;
        setTotalStudyMaterials(materialsCount);

        writeDashboardCache("admin-dashboard-core", {
          rows: items || [],
          totalStudents: sData.students?.length || 0,
          totalTeachers: teachersCount,
          uploadedQuestions: questionCount,
          uploadedQuestionTypes: questionTypeCount,
          totalStudyMaterials: materialsCount,
        });

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

          <StatCard
            title="Uploaded Questions"
            value={uploadedQuestions}
            icon={<ClipboardList size={18} />}
            gradient={["from-emerald-600", "to-teal-600"]}
          />

          <StatCard
            title="Uploaded Question Types"
            value={uploadedQuestionTypes}
            icon={<Activity size={18} />}
            gradient={["from-rose-600", "to-pink-600"]}
          />

          <StatCard
            title="Total Study Materials"
            value={totalStudyMaterials}
            icon={<FileText size={18} />}
            gradient={["from-amber-600", "to-orange-600"]}
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
        <div className="rounded-2xl border border-gray-100 bg-white/80 backdrop-blur shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-sm">
              <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-700 border-b-2 border-gray-200">Student</th>
                  <th className="text-left p-4 font-semibold text-gray-700 border-b-2 border-gray-200">Exam (Subject • Topic • Type)</th>
                  <th className="text-left p-4 font-semibold text-gray-700 border-b-2 border-gray-200">Score</th>
                  <th className="text-left p-4 font-semibold text-gray-700 border-b-2 border-gray-200">Attempts by Student</th>
                  <th className="text-left p-4 font-semibold text-gray-700 border-b-2 border-gray-200">Date</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((r, index) => (
                  <tr key={r._id} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-sm font-bold flex items-center justify-center shadow">
                          {indexOfFirst + index + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">{r.user?.name || "—"}</div>
                          <div className="text-xs text-slate-500">{r.user?.email || ""}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <div className="font-medium text-gray-800">
                          {r.subjectName || r.subject || "—"}
                        </div>
                        <div className="text-xs text-slate-600">
                          {r.topicName || r.topic || "—"}
                        </div>
                        <span className="uppercase text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full w-fit font-semibold">{r.type}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-gray-800 text-base">
                        {r.score} / {r.total}
                      </div>
                      <div className="mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          r.percent >= 90 ? "bg-green-100 text-green-700" :
                          r.percent >= 75 ? "bg-blue-100 text-blue-700" :
                          r.percent >= 50 ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {r.percent}%
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 text-indigo-700 px-3 py-1 text-xs font-semibold">
                        {r.attemptsForUser} attempt{r.attemptsForUser !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 text-xs">
                      {new Date(r.createdAt).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </td>
                  </tr>
                ))}
                {!rows.length && !busy && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="text-6xl">📋</div>
                        <p className="text-gray-500 font-medium">No attempts yet</p>
                        <p className="text-sm text-gray-400">Student exam attempts will appear here</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Enhanced Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-gray-200">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${
                  currentPage === 1
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg"
                }`}
              >
                ← Prev
              </button>

              {currentPage !== 1 && (
                <span className="px-2 text-gray-500 font-bold">...</span>
              )}

              <button className="px-4 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 text-white shadow-lg scale-110">
                {currentPage}
              </button>

              {currentPage !== totalPages && (
                <span className="px-2 text-gray-500 font-bold">...</span>
              )}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${
                  currentPage === totalPages
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg"
                }`}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </Section>
    </>
  );
}



function TeacherContent() {
  const [uploadedQuestions, setUploadedQuestions] = useState(0);
  const [uploadedQuestionTypes, setUploadedQuestionTypes] = useState(0);
  const [uploadedStudyMaterials, setUploadedStudyMaterials] = useState(0);
  const [uploadTrend, setUploadTrend] = useState([]);

  function toLocalDateKey(dateValue) {
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function buildLast7DaysTrend(items = []) {
    const dailyCounts = {};
    items.forEach((q) => {
      const key = toLocalDateKey(q.createdAt);
      if (!key) return;
      dailyCounts[key] = (dailyCounts[key] || 0) + 1;
    });

    const trend = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = toLocalDateKey(d);
      trend.push({
        key,
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        count: dailyCounts[key] || 0,
      });
    }
    return trend;
  }

  useEffect(() => {
    (async () => {
      try {
        const currentUser = getUser();
        const currentUserId = String(currentUser?._id || currentUser?.id || "");
        const currentUserEmail = String(currentUser?.email || "").toLowerCase();

        let ownQuestions = [];

        // Primary: server-side mine filter
        const qData = await getJSON("/api/questions?mine=1&page=1&limit=5000");
        ownQuestions = qData.items || [];

        // Fallback: client-side filter on full list if mine filter returns empty.
        if (!ownQuestions.length) {
          const fallback = await getJSON("/api/questions?page=1&limit=5000");
          const items = fallback.items || [];
          ownQuestions = items.filter((item) => {
            const uploaderId = String(item?.createdBy?._id || item?.createdBy || "");
            const uploaderEmail = String(item?.createdBy?.email || "").toLowerCase();
            return (
              (currentUserId && uploaderId === currentUserId) ||
              (currentUserEmail && uploaderEmail === currentUserEmail)
            );
          });
        }

        setUploadedQuestions(ownQuestions.length);
        setUploadedQuestionTypes(new Set(ownQuestions.map((q) => q.type).filter(Boolean)).size);

        const materials = await getJSON("/api/study-materials/admin/all");
        setUploadedStudyMaterials(Array.isArray(materials) ? materials.length : 0);

        setUploadTrend(buildLast7DaysTrend(ownQuestions));
      } catch (error) {
        console.error("Failed to load teacher upload trend", error);
        setUploadedQuestions(0);
        setUploadedQuestionTypes(0);
        setUploadedStudyMaterials(0);
        setUploadTrend(buildLast7DaysTrend([]));
      }
    })();
  }, []);

  const maxTrendValue = Math.max(1, ...uploadTrend.map((d) => d.count));

  return (
    <>
      <WelcomeCard />
      <Section title="Teacher Overview" icon={<GraduationCap size={18} />}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Uploaded Questions"
            value={uploadedQuestions}
            icon={<ClipboardList size={18} />}
            gradient={["from-indigo-600", "to-violet-600"]}
          />
          <StatCard
            title="Uploaded Question Types"
            value={uploadedQuestionTypes}
            icon={<Activity size={18} />}
            gradient={["from-emerald-600", "to-teal-600"]}
          />
          <StatCard
            title="Uploaded Study Materials"
            value={uploadedStudyMaterials}
            icon={<FileText size={18} />}
            gradient={["from-amber-600", "to-orange-600"]}
          />
        </div>
      </Section>
      <Section title="Upload Trend (Last 7 Days)" subtitle="Date-wise by you">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-7 gap-3 items-end h-48">
            {uploadTrend.map((d) => (
              <div key={d.key} className="flex flex-col items-center justify-end h-full">
                <div className="text-[11px] font-semibold text-slate-700 mb-1">{d.count}</div>
                <div
                  className="w-full rounded-md bg-gradient-to-t from-indigo-600 to-purple-500"
                  style={{ height: `${Math.max(6, (d.count / maxTrendValue) * 130)}px` }}
                  title={`${d.label}: ${d.count}`}
                />
                <div className="text-[11px] text-slate-500 mt-2 text-center">{d.label}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}

function StudentContent() {
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const navigate = useNavigate();
  const profileMenuRef = useRef(null);
  const notificationRef = useRef(null);
  const [attempts, setAttempts] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [packages, setPackages] = useState([]);
  const [packagesBusy, setPackagesBusy] = useState(false);
  const [packagesErr, setPackagesErr] = useState("");
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [subscriptionType, setSubscriptionType] = useState("");
  const [subscriptionStartDate, setSubscriptionStartDate] = useState(null);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState(null);
  const [subscriptionBusy, setSubscriptionBusy] = useState(false);
  const [subscriptionCancelBusy, setSubscriptionCancelBusy] = useState(false);
  const [subscriptionErr, setSubscriptionErr] = useState("");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dailyBadge, setDailyBadge] = useState("none");
  const [dailyStreak, setDailyStreak] = useState(0);
  const [dailyHistory, setDailyHistory] = useState([]);

  function handleLogout() {
    localStorage.removeItem("jwt");
    localStorage.removeItem("user");
    window.dispatchEvent(new CustomEvent("eec:auth", { detail: { type: "manual-logout" } }));
  }

  useEffect(() => {
    const cachedAttempts = readDashboardCache("student-attempts", 2 * 60 * 1000);
    if (cachedAttempts) {
      setAttempts(cachedAttempts.items || []);
      return;
    }

    (async () => {
      setBusy(true); setErr("");
      try {
        const { items } = await myAttempts();
        setAttempts(items || []);
        writeDashboardCache("student-attempts", { items: items || [] });
      } catch (e) {
        setErr(e.message || "Failed to load");
      } finally {
        setBusy(false);
      }
    })();
  }, []);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const res = await fetch(`${API}/api/notifications`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      } catch {
        setNotifications([]);
      }
    }

    loadNotifications();
  }, [API]);

  useEffect(() => {
    async function loadDailyBadge() {
      try {
        const res = await fetch(`${API}/api/daily-challenge/stats`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return;
        setDailyBadge(String(data?.badge || "none").toLowerCase());
        setDailyStreak(Number(data?.streak || 0));
      } catch {
        setDailyBadge("none");
        setDailyStreak(0);
      }
    }
    loadDailyBadge();
  }, [API]);

  useEffect(() => {
    async function loadDailyHistory() {
      try {
        const res = await fetch(`${API}/api/daily-challenge/history?days=35`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setDailyHistory([]);
          return;
        }
        setDailyHistory(Array.isArray(data?.items) ? data.items : []);
      } catch {
        setDailyHistory([]);
      }
    }
    loadDailyHistory();
  }, [API]);

  useEffect(() => {
    function onDocClick(e) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const cachedPackages = readDashboardCache("student-packages", 5 * 60 * 1000);
    if (cachedPackages) {
      setPackages(cachedPackages.packages || []);
    }

    const cachedSubscription = readDashboardCache("student-subscription", 60 * 1000);
    if (cachedSubscription) {
      setSubscriptionInfo(cachedSubscription.subscriptionInfo || null);
      setSubscriptionType(cachedSubscription.subscriptionType || "none");
      setSubscriptionStartDate(cachedSubscription.subscriptionStartDate || null);
      setSubscriptionEndDate(cachedSubscription.subscriptionEndDate || null);
    }

    if (!cachedPackages) {
      (async () => {
        setPackagesBusy(true);
        setPackagesErr("");
        try {
          const res = await fetch(`${API}/api/packages`);
          const data = await res.json();
          setPackages(data.packages || []);
          writeDashboardCache("student-packages", { packages: data.packages || [] });
        } catch (e) {
          setPackagesErr(e.message || "Failed to load packages");
        } finally {
          setPackagesBusy(false);
        }
      })();
    }

    if (!cachedSubscription) {
      (async () => {
        setSubscriptionBusy(true);
        setSubscriptionErr("");
        try {
          const res = await fetch(`${API}/api/subscriptions/current`, {
            headers: { Authorization: `Bearer ${getToken()}` },
          });
          const data = await res.json();
          if (res.ok && data?.hasActiveSubscription) {
            const nextSubscriptionInfo = data.subscription || null;
            const nextSubscriptionType =
              data.subscriptionType ||
              data.subscription?.package?.name ||
              data.subscription?.packageName ||
              "none";
            const nextSubscriptionStartDate =
              data.startDate || data.subscription?.startDate || data.subscription?.createdAt || null;
            const nextSubscriptionEndDate =
              data.endDate || data.subscription?.endDate || null;

            setSubscriptionInfo(nextSubscriptionInfo);
            setSubscriptionType(nextSubscriptionType);
            setSubscriptionStartDate(nextSubscriptionStartDate);
            setSubscriptionEndDate(nextSubscriptionEndDate);
            writeDashboardCache("student-subscription", {
              subscriptionInfo: nextSubscriptionInfo,
              subscriptionType: nextSubscriptionType,
              subscriptionStartDate: nextSubscriptionStartDate,
              subscriptionEndDate: nextSubscriptionEndDate,
            });
          } else {
            setSubscriptionInfo(null);
            setSubscriptionType("none");
            setSubscriptionStartDate(null);
            setSubscriptionEndDate(null);
            writeDashboardCache("student-subscription", {
              subscriptionInfo: null,
              subscriptionType: "none",
              subscriptionStartDate: null,
              subscriptionEndDate: null,
            });
          }
        } catch (e) {
          setSubscriptionErr(e.message || "Failed to load subscription");
        } finally {
          setSubscriptionBusy(false);
        }
      })();
    }
  }, []);

  const storedUser = getUser();
  const resolvedType = String(
    subscriptionType ||
    storedUser?.subscriptionType ||
    "none"
  ).toLowerCase();
  const typeLabel =
    resolvedType === "none"
      ? "Free"
      : `${resolvedType.charAt(0).toUpperCase()}${resolvedType.slice(1)}`;

  const fallbackAccessByType = {
    basic: { unlockedStages: [1, 2], studyMaterialsAccess: "none" },
    intermediate: { unlockedStages: [1, 2], studyMaterialsAccess: "limited" },
    premium: { unlockedStages: "all", studyMaterialsAccess: "full" },
    none: { unlockedStages: [1], studyMaterialsAccess: "none" },
  };

  const activePackage =
    subscriptionInfo?.package ||
    packages.find(
      (pkg) => String(pkg.name || "").toLowerCase() === resolvedType
    ) ||
    null;
  const fallbackAccess = fallbackAccessByType[resolvedType] || fallbackAccessByType.none;
  const access = activePackage
    ? {
        unlockedStages: activePackage.unlockedStages || [1],
        studyMaterialsAccess: activePackage.studyMaterialsAccess || "none",
      }
    : fallbackAccess;
  const hasPremium = resolvedType === "premium";
  const allStagesUnlocked = hasPremium || access.unlockedStages === "all";
  const stage2Unlocked =
    allStagesUnlocked ||
    (Array.isArray(access.unlockedStages) && access.unlockedStages.includes(2));
  const studyMaterialsAccess = hasPremium ? "full" : access.studyMaterialsAccess;
  const subscriptionDaysLeft = subscriptionEndDate
    ? Math.max(
        0,
        Math.ceil(
          (new Date(subscriptionEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      )
    : null;
  const userIdForRead = storedUser?._id || storedUser?.id;
  const unreadCount = notifications.filter(
    (n) => !Array.isArray(n.readBy) || !n.readBy.some((id) => String(id) === String(userIdForRead))
  ).length;
  const recentNotifications = notifications.slice(0, 6);
  const dailyLevelLabel =
    dailyBadge === "none"
      ? "Novice"
      : `${dailyBadge.charAt(0).toUpperCase()}${dailyBadge.slice(1)}`;
  const historyByDateKey = new Map(
    (dailyHistory || []).map((item) => [String(item.dateKey || ""), String(item.status || "missed")])
  );
  const nowDate = new Date();
  const monthYear = nowDate.getFullYear();
  const monthIndex = nowDate.getMonth();
  const monthStart = new Date(monthYear, monthIndex, 1);
  const daysInMonth = new Date(monthYear, monthIndex + 1, 0).getDate();
  const leadingEmptyDays = monthStart.getDay();
  const monthLabel = monthStart.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthDots = Array.from({ length: leadingEmptyDays + daysInMonth }, (_, idx) => {
    if (idx < leadingEmptyDays) return null;
    const day = idx - leadingEmptyDays + 1;
    const dateKey = `${monthYear}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const status = historyByDateKey.get(dateKey) || "missed";
    return {
      dateKey,
      day,
      status,
      isToday:
        day === nowDate.getDate() &&
        monthIndex === nowDate.getMonth() &&
        monthYear === nowDate.getFullYear(),
    };
  });

  async function markNotificationRead(id) {
    try {
      await fetch(`${API}/api/notifications/${id}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      setNotifications((prev) =>
        prev.map((n) => {
          if (n._id !== id) return n;
          const nextReadBy = Array.isArray(n.readBy) ? n.readBy : [];
          if (nextReadBy.some((v) => String(v) === String(userIdForRead))) return n;
          return { ...n, readBy: [...nextReadBy, userIdForRead] };
        })
      );
    } catch {
      // Ignore read errors in header dropdown.
    }
  }

  async function cancelSubscription() {
    if (!subscriptionInfo?._id || subscriptionCancelBusy) return;
    const ok = window.confirm("Cancel your active subscription?");
    if (!ok) return;

    setSubscriptionCancelBusy(true);
    setSubscriptionErr("");
    try {
      const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${API}/api/subscriptions/${subscriptionInfo._id}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to cancel subscription");

      setSubscriptionInfo(null);
      setSubscriptionType("none");
      setSubscriptionStartDate(null);
      setSubscriptionEndDate(null);

      const stored = getUser() || {};
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...stored,
          activeSubscription: null,
          subscriptionType: "none",
          subscriptionEndDate: null,
        })
      );

      writeDashboardCache("student-subscription", {
        subscriptionInfo: null,
        subscriptionType: "none",
        subscriptionStartDate: null,
        subscriptionEndDate: null,
      });
    } catch (e) {
      setSubscriptionErr(e.message || "Failed to cancel subscription");
    } finally {
      setSubscriptionCancelBusy(false);
    }
  }

  const totalAttempts = attempts.length;
  const totalScore = attempts.reduce((acc, a) => acc + (a.score || 0), 0);
  const totalPossible = attempts.reduce((acc, a) => acc + (a.total || 0), 0);

  // average percent
  const averagePercent =
    totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;

  return (
    <div className="student-adventure-theme relative p-4 md:p-6 space-y-6">
      {/* Decorative star */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-[0.06] pointer-events-none select-none hidden lg:block">
        <span className="material-symbols-outlined" style={{ fontSize: "260px", color: "#94a3b8" }}>star</span>
      </div>

      <WelcomeModal />

      {/* ── Welcome Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Welcome back, {storedUser?.name?.split(" ")[0] || "Student"}! 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">Your next adventure awaits.</p>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-full px-4 py-2.5 shadow-sm">
            <span className="text-lg">🛡️</span>
            <div>
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Daily Badge</div>
              <div className="text-sm font-black text-slate-800">{busy ? "…" : dailyLevelLabel}</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-full px-4 py-2.5 shadow-sm">
            <span className="text-lg">🪙</span>
            <div>
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Points</div>
              <div className="text-sm font-black text-slate-800">{busy ? "…" : `${Number(storedUser?.points || 0).toLocaleString()} pts`}</div>
            </div>
          </div>
          <div ref={notificationRef} className="relative">
            <button
              type="button"
              title="Notifications"
              onClick={() => {
                setShowNotifications((prev) => !prev);
                setProfileMenuOpen(false);
              }}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-12 z-20 w-[320px] rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-800">Notifications</p>
                  <span className="text-xs text-slate-500">{unreadCount} unread</span>
                </div>
                <div className="max-h-[320px] overflow-y-auto">
                  {recentNotifications.length === 0 ? (
                    <div className="px-3 py-6 text-center text-sm text-slate-500">
                      No notifications yet
                    </div>
                  ) : (
                    recentNotifications.map((n) => {
                      const isRead =
                        Array.isArray(n.readBy) &&
                        n.readBy.some((id) => String(id) === String(userIdForRead));
                      return (
                        <button
                          key={n._id}
                          type="button"
                          onClick={async () => {
                            if (!isRead) await markNotificationRead(n._id);
                            setShowNotifications(false);
                            navigate(`/dashboard/notification/${n._id}`);
                          }}
                          className={`w-full text-left px-3 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                            !isRead ? "bg-amber-50/40" : ""
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {!isRead && <span className="mt-1 h-2 w-2 rounded-full bg-rose-500 flex-shrink-0" />}
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate">
                                {n.title || "Notification"}
                              </p>
                              <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                                {n.message || ""}
                              </p>
                              <p className="text-[11px] text-slate-400 mt-1">
                                {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
          <div ref={profileMenuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-slate-200 shadow-sm"
            >
              {storedUser?.avatar ? (
                <img src={storedUser.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                  {storedUser?.name?.[0]?.toUpperCase() || "U"}
                </div>
              )}
            </button>
            {profileMenuOpen && (
              <div className="absolute right-0 top-12 z-20 min-w-[170px] rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate("/dashboard/profile");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <span className="material-symbols-outlined text-base">person</span>
                  Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Section title="My Study Stats">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdventureStatCard
            title="Revision Streak"
            value={busy ? "…" : `${dailyStreak} Days`}
            icon={<span className="material-symbols-outlined fill-1">local_fire_department</span>}
            accentColor="coral"
          />
          <AdventureStatCard
            title="Mastery Level"
            value={busy ? "…" : `${averagePercent}%`}
            icon={<span className="material-symbols-outlined fill-1">track_changes</span>}
            accentColor="teal"
          />
          <AdventureStatCard
            title="Tryouts Done"
            value={busy ? "…" : totalAttempts}
            icon={<span className="material-symbols-outlined fill-1">checklist</span>}
            accentColor="primary"
          />
          <AdventureStatCard
            title="Total Points"
            value={busy ? "…" : totalScore}
            icon={<span className="material-symbols-outlined fill-1">layers</span>}
            accentColor="purple"
          />
        </div>
        {err && <div className="text-xs text-rose-600 mt-2">{err}</div>}
      </Section>

      <Section title="Daily Streak Tracker" subtitle={monthLabel}>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-7 gap-2">
            {weekdayLabels.map((label) => (
              <div key={label} className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wide">
                {label}
              </div>
            ))}
            {monthDots.map((dot, idx) => {
              if (!dot) return <div key={`empty-${idx}`} className="h-6" />;
              const title = `${dot.dateKey} - ${
                dot.status === "correct"
                  ? "Correct"
                  : dot.status === "wrong"
                  ? "Attempted (wrong)"
                  : "No attempt"
              }`;
              const colorClass =
                dot.status === "correct"
                  ? "bg-emerald-500"
                  : dot.status === "wrong"
                  ? "bg-amber-400"
                  : "bg-slate-300";
              return (
                <div
                  key={dot.dateKey}
                  title={title}
                  className={`h-6 flex items-center justify-center rounded-md ${dot.isToday ? "ring-1 ring-indigo-300 bg-indigo-50" : ""}`}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${colorClass}`} />
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-4 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-emerald-500" />
              Correct
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-amber-400" />
              Wrong
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-slate-200" />
              Missed
            </span>
          </div>
        </div>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Tryouts - 2/3 width */}
        <section className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-500" style={{ fontSize: "20px" }}>history</span>
              <h2 className="text-sm md:text-lg font-bold text-slate-800">Recent Tryouts</h2>
            </div>
            <Link to="/dashboard/result" className="text-sm font-semibold text-amber-500 hover:text-amber-600 transition-colors">View All</Link>
          </div>
          <div className="rounded-2xl border border-[#e7c555]/10 bg-white/80 backdrop-blur shadow-md overflow-hidden">

          {/* ── MOBILE CARD LIST (< md) ── */}
          <div className="md:hidden divide-y divide-gray-100">
            {attempts
              .slice()
              .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
              .slice(0, 5)
              .map((a, index) => (
                <div key={a._id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-sm font-bold flex items-center justify-center flex-shrink-0 shadow">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 text-sm truncate">
                      {a.subject?.name || a.subjectName || "—"}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {a.topic?.name || a.topicName || "—"}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="uppercase text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                        {a.type}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        a.percent >= 90 ? "bg-green-100 text-green-700" :
                        a.percent >= 75 ? "bg-blue-100 text-blue-700" :
                        a.percent >= 50 ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {a.percent}%
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-gray-800 text-sm">{a.score}<span className="text-gray-400 font-normal">/{a.total}</span></div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString("en-US", { month: "short", day: "2-digit" }) : "—"}
                    </div>
                  </div>
                </div>
              ))}
            {!attempts.length && !busy && (
              <div className="p-8 text-center">
                <div className="text-4xl mb-2">📝</div>
                <p className="text-gray-500 font-medium text-sm">No exam attempts yet</p>
              </div>
            )}
          </div>

          {/* ── DESKTOP TABLE (md+) ── */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-[720px] w-full text-sm">
              <thead className="bg-[#e7c555]/5 border-b border-[#e7c555]/10">
                <tr>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500 text-left">Subject</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500 text-left">Type</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500 text-left">Score</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e7c555]/5">
                {attempts
                  .slice()
                  .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
                  .slice(0, 5)
                  .map((a, index) => (
                    <tr key={a._id} className="hover:bg-[#e7c555]/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#4ecdc4]/20 flex items-center justify-center text-[#4ecdc4]">
                            <span className="material-symbols-outlined text-sm">science</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-800">{a.subject?.name || a.subjectName || "—"}</span>
                            <span className="text-xs text-slate-600">{a.topic?.name || a.topicName || "—"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-500">{a.type}</td>
                      <td className="px-6 py-4">
                        <span className={`text-sm px-3 py-1.5 rounded-full font-black inline-flex items-center ${
                          a.percent >= 90 ? "bg-green-100 text-green-700" :
                          a.percent >= 75 ? "bg-blue-100 text-blue-700" :
                          a.percent >= 50 ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        }`}>{a.score}/{a.total}</span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-[#e7c555] hover:text-slate-900 transition-all rounded-full font-bold text-sm">
                          <span className="material-symbols-outlined text-sm">replay</span>
                          Retake
                        </button>
                      </td>
                    </tr>
                  ))}
                {!attempts.length && !busy && (
                  <tr>
                    <td colSpan={3} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="text-6xl">📝</div>
                        <p className="text-gray-500 font-medium">No exam attempts yet</p>
                        <p className="text-sm text-gray-400">Your exam history will appear here</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </section>

        {/* Spotlight column - 1/3 width */}
        <div className="flex flex-col gap-4">
          <DailyQuestCard />
          <SubscriptionSpotlight
            subscriptionType={subscriptionType}
            subscriptionInfo={subscriptionInfo}
          />
        </div>
      </div>

    </div>
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
    <div className="min-h-[calc(100vh-64px)] bg-[#f5f3ef]">
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

      <main className="mx-auto max-w-7xl px-3 md:px-4 py-4 md:py-8 space-y-5 md:space-y-8">
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
