import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ClipboardList, FileText, PenSquare, Users, Wallet } from "lucide-react";

import { getJSON } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function StatCard(props) {
  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardContent className="flex items-center gap-4 py-5">
        <div className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${props.tone}`}>
          <props.icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold tracking-tight text-slate-900">{props.value}</p>
          <p className="truncate text-sm font-medium text-slate-600">{props.label}</p>
          {props.note ? <p className="truncate text-xs text-slate-500">{props.note}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

function ActionCard(props) {
  return (
    <Button
      asChild
      variant="outline"
      className="h-auto justify-start rounded-2xl border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
    >
      <Link to={props.to}>
        <div className="flex w-full items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
            <props.icon className="size-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-slate-900">{props.title}</p>
              <ArrowRight className="size-4 shrink-0 text-slate-400" />
            </div>
            <p className="mt-1 text-sm text-slate-600">{props.description}</p>
          </div>
        </div>
      </Link>
    </Button>
  );
}

function ListRow({ title, meta, status, statusTone }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="min-w-0">
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{meta}</p>
      </div>
      <Badge variant="outline" className={`shrink-0 ${statusTone}`}>
        {status}
      </Badge>
    </div>
  );
}

export default function TeacherHome() {
  const user = getUser();
  const name = user?.name || "Teacher";
  const teacherId = String(user?._id || user?.id || "");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const [submissionsData, paymentsData, assignmentsData, analyticsData] = await Promise.all([
          getJSON("/api/submissions/mine").catch(() => ({ items: [] })),
          getJSON("/api/my-payments").catch(() => ({ items: [] })),
          getJSON("/api/chapter-assignments/mine").catch(() => ({ items: [] })),
          getJSON("/api/questions/upload-performance?passPercent=60").catch(() => ({
            teacherSummaries: [],
            setRows: [],
          })),
        ]);

        if (!mounted) return;

        setSubmissions(Array.isArray(submissionsData?.items) ? submissionsData.items : []);
        setPayments(Array.isArray(paymentsData?.items) ? paymentsData.items : []);
        setAssignments(Array.isArray(assignmentsData?.items) ? assignmentsData.items : []);
        setAnalytics(analyticsData || null);
      } catch (e) {
        if (mounted) setError(e?.message || "Failed to load teacher dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const {
    pendingSubmissions,
    approvedSubmissions,
    totalSubmissions,
    totalQuestionsUploaded,
    studentReach,
    pendingAmount,
    recentSubmissions,
    recentAssignments,
    unpaidCount,
    paymentByTopicId,
    latestActivity,
  } = useMemo(() => {
    const sortedSubmissions = [...submissions].sort(
      (a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0)
    );

    const teacherSummary = Array.isArray(analytics?.teacherSummaries)
      ? analytics.teacherSummaries.find((row) => String(row?.teacherId || "") === teacherId) ||
        analytics.teacherSummaries[0] ||
        null
      : null;

    const total = payments.reduce((sum, item) => sum + Number(item?.budgetAmount || 0), 0);
    const paid = payments
      .filter((item) => String(item?.paymentStatus || "").toLowerCase() === "paid")
      .reduce((sum, item) => sum + Number(item?.budgetAmount || 0), 0);
    const unpaid = payments.filter((item) => String(item?.paymentStatus || "").toLowerCase() !== "paid");
    const paymentByTopicId = new Map(
      payments
        .map((item) => [String(item?._id || ""), String(item?.paymentStatus || "").toLowerCase()])
        .filter(([id]) => id)
    );

    const latestItem =
      sortedSubmissions[0] ||
      [...payments].sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))[0] ||
      [...assignments].sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))[0] ||
      null;

    const pending = sortedSubmissions.filter((item) => String(item?.status || "").toLowerCase() === "pending");
    const approved = sortedSubmissions.filter((item) => String(item?.status || "").toLowerCase() === "approved");

    return {
      pendingSubmissions: pending.length,
      approvedSubmissions: approved.length,
      totalSubmissions: sortedSubmissions.length,
      totalQuestionsUploaded: Number(teacherSummary?.uploadedQuestions || 0),
      studentReach: Number(teacherSummary?.uniqueStudentsCount || 0),
      pendingAmount: total - paid,
      recentSubmissions: sortedSubmissions.slice(0, 3),
      recentAssignments: [...assignments]
        .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
        .slice(0, 3),
      unpaidCount: unpaid.length,
      paymentByTopicId,
      latestActivity: latestItem,
    };
  }, [submissions, payments, assignments, analytics, teacherId]);

  const quickActions = [
    {
      to: "/dashboard/add-chapter-workspace",
      icon: PenSquare,
      title: "Write Content",
      description: "Create or continue a chapter draft.",
    },
    {
      to: "/dashboard/questions/list",
      icon: ClipboardList,
      title: "Question Bank",
      description: "Review and manage your questions.",
    },
    {
      to: "/dashboard/my-payments",
      icon: Wallet,
      title: "Payments",
      description: "Check cleared and pending payouts.",
    },
    {
      to: "/dashboard/student-engagement",
      icon: Users,
      title: "Student Engagement",
      description: "See how learners are responding.",
    },
  ];

  return (
    <div className="space-y-6 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_30%),radial-gradient(circle_at_top_right,rgba(191,219,254,0.42),transparent_24%),linear-gradient(to_bottom,#eff6ff,#f8fbff)] p-4 sm:p-6">
      <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-3">
          <Badge className="w-fit bg-[linear-gradient(135deg,#1877f2,#4f9ef8)] text-white hover:bg-[linear-gradient(135deg,#1877f2,#4f9ef8)]">
            Teacher Workspace
          </Badge>
          <h1 className="text-3xl font-black tracking-tight text-blue-950 sm:text-4xl">
            Welcome back, {name}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-blue-800/80 sm:text-base">
            Live summary of your chapter work, payouts, and student engagement.
          </p>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={FileText}
          label="Draft Lessons"
          value={loading ? "-" : totalSubmissions}
          note={`${pendingSubmissions} pending, ${approvedSubmissions} approved`}
          tone="bg-blue-100 text-blue-700"
        />
        <StatCard
          icon={ClipboardList}
          label="Questions Ready"
          value={loading ? "-" : totalQuestionsUploaded}
          note="From your uploaded tryouts"
          tone="bg-cyan-100 text-cyan-700"
        />
        <StatCard
          icon={Users}
          label="Student Reach"
          value={loading ? "-" : studentReach}
          note="Unique students engaged"
          tone="bg-indigo-100 text-indigo-700"
        />
        <StatCard
          icon={Wallet}
          label="Pending Payout"
          value={loading ? "-" : formatMoney(pendingAmount)}
          note={`${unpaidCount} chapter${unpaidCount === 1 ? "" : "s"} unpaid`}
          tone="bg-blue-100 text-blue-800"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-blue-100 shadow-sm">
          <CardHeader className="border-b border-blue-50">
            <CardTitle className="text-blue-950">Quick Actions</CardTitle>
            <CardDescription className="text-blue-700/80">Open the main teacher work areas.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 py-5 sm:grid-cols-2">
            {quickActions.map((item) => (
              <ActionCard key={item.to} {...item} />
            ))}
          </CardContent>
        </Card>

        <Card className="border-blue-100 shadow-sm">
          <CardHeader className="border-b border-blue-50">
            <CardTitle className="text-blue-950">Latest Activity</CardTitle>
            <CardDescription className="text-blue-700/80">Most recent change across your dashboard data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 py-5">
            {latestActivity ? (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="font-semibold text-blue-950">{latestActivity?.name || latestActivity?.topic?.name || "Recent item"}</p>
                <p className="mt-1 text-sm text-blue-700/80">
                  {latestActivity?.createdAt ? formatDateTime(latestActivity.createdAt) : "Recently"}
                </p>
                <p className="mt-1 text-xs text-blue-500">
                  {latestActivity?.status || latestActivity?.paymentStatus || "Active"}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-blue-200 bg-white p-4 text-sm text-blue-700/70">
                No activity yet.
              </div>
            )}

            <div className="rounded-2xl border border-blue-100 bg-white p-4">
              <p className="text-sm font-semibold text-blue-950">Current status</p>
              <p className="mt-1 text-sm text-blue-700/80">
                {loading
                  ? "Loading your dashboard..."
                  : `${pendingSubmissions} pending chapters and ${unpaidCount} unpaid chapter${unpaidCount === 1 ? "" : "s"}.`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-blue-100 shadow-sm">
          <CardHeader className="border-b border-blue-50">
            <CardTitle className="text-blue-950">Recent Submissions</CardTitle>
            <CardDescription className="text-blue-700/80">Your latest chapter work and review status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 py-5">
            {recentSubmissions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-blue-200 bg-white p-4 text-sm text-blue-700/70">
                No submissions yet.
              </div>
            ) : (
              recentSubmissions.map((item) => {
                const status = String(item?.status || "pending").toLowerCase();
                const statusTone =
                  status === "approved"
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : status === "rejected"
                      ? "border-sky-200 bg-sky-50 text-sky-700"
                      : "border-blue-200 bg-blue-50 text-blue-800";
                return (
                  <ListRow
                    key={item?._id || item?.submissionId || item?.name}
                    title={item?.name || "Untitled chapter"}
                    meta={[item?.board?.name, item?.class?.name, item?.subject?.name].filter(Boolean).join(" · ") || "Board / Class / Subject not set"}
                    status={status}
                    statusTone={statusTone}
                  />
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="border-blue-100 shadow-sm">
          <CardHeader className="border-b border-blue-50">
            <CardTitle className="text-blue-950">Active Assignments</CardTitle>
            <CardDescription className="text-blue-700/80">Your current board/class/subject scope.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 py-5">
            {recentAssignments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-blue-200 bg-white p-4 text-sm text-blue-700/70">
                No assignments have been given yet.
              </div>
            ) : (
              recentAssignments.map((item) => (
                (() => {
                  const topicId = String(item?.topic?._id || item?.topic || "");
                  const paymentStatus = paymentByTopicId.get(topicId) || "unpaid";
                  const statusLabel = paymentStatus === "paid" ? "Paid" : "Unpaid";
                  const statusTone =
                    paymentStatus === "paid"
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-sky-200 bg-sky-50 text-sky-700";

                  return (
                <div
                  key={item?._id}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-blue-100 bg-white p-4"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-blue-950">{item?.board?.name || "Board"}</p>
                    <p className="mt-1 text-sm text-blue-700/80">
                      {[item?.class?.name, item?.subject?.name, item?.topic?.name].filter(Boolean).join(" · ") ||
                        "Whole scope assignment"}
                    </p>
                    <p className="mt-1 text-xs text-blue-500">
                      {item?.createdAt ? `Assigned ${formatDateTime(item.createdAt)}` : "Recently assigned"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Badge variant="outline" className={statusTone}>
                      {statusLabel}
                    </Badge>
                    <Badge variant="outline" className="border-blue-100 bg-blue-50 text-blue-700">
                      {formatMoney(item?.amount)}
                    </Badge>
                  </div>
                </div>
                  );
                })()
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
