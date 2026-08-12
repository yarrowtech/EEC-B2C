import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Send,
  FileText,
  ClipboardList,
  Wallet,
  Clock,
  CheckCircle2,
  Library,
  ArrowRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { getJSON } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function StatCard({ icon: Icon, label, value, hint, accent }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${accent}`}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          {hint && <p className="truncate text-[11px] text-muted-foreground/80">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({ to, icon: Icon, title, description }) {
  return (
    <Link to={to}>
      <Card className="h-full transition-colors hover:border-primary/40 hover:bg-muted/40">
        <CardContent className="flex items-start gap-3 py-5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}

export default function TeacherHome() {
  const user = getUser();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingSubmissions: 0,
    approvedChapters: 0,
    questionsUploaded: 0,
    pendingPaymentAmount: 0,
  });
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [questionDates, setQuestionDates] = useState([]);
  const [trendRange, setTrendRange] = useState(14);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [submissionsData, questionsData, paymentsData] = await Promise.all([
          getJSON("/api/submissions/mine").catch(() => ({ items: [] })),
          getJSON("/api/questions?mine=1&page=1&limit=5000").catch(() => ({ items: [], total: 0 })),
          getJSON("/api/my-payments").catch(() => ({ items: [] })),
        ]);

        if (!mounted) return;

        const submissions = Array.isArray(submissionsData?.items) ? submissionsData.items : [];
        const chapters = Array.isArray(paymentsData?.items) ? paymentsData.items : [];
        const questionItems = Array.isArray(questionsData?.items) ? questionsData.items : [];

        setStats({
          pendingSubmissions: submissions.filter((s) => s.status === "pending").length,
          approvedChapters: submissions.filter((s) => s.status === "approved").length,
          questionsUploaded: Number(questionsData?.total || questionItems.length || 0),
          pendingPaymentAmount: chapters
            .filter((t) => t.paymentStatus !== "paid")
            .reduce((sum, t) => sum + (Number(t.budgetAmount) || 0), 0),
        });
        setRecentSubmissions(submissions.slice(0, 4));
        setQuestionDates(questionItems.map((item) => item.createdAt).filter(Boolean));
      } catch {
        // stats just stay at defaults if this fails
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const { trendData, trendChangePercent } = useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = trendRange - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    const dayKey = (d) => d.toISOString().slice(0, 10);
    const countsByDay = new Map(days.map((d) => [dayKey(d), 0]));
    for (const raw of questionDates) {
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) continue;
      d.setHours(0, 0, 0, 0);
      const key = dayKey(d);
      if (countsByDay.has(key)) {
        countsByDay.set(key, countsByDay.get(key) + 1);
      }
    }
    const data = days.map((d) => ({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      questions: countsByDay.get(dayKey(d)) || 0,
    }));

    const half = Math.floor(trendRange / 2) || 1;
    const firstHalfTotal = data.slice(0, half).reduce((s, r) => s + r.questions, 0);
    const secondHalfTotal = data.slice(-half).reduce((s, r) => s + r.questions, 0);
    const changePercent = firstHalfTotal > 0
      ? Math.round(((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100)
      : secondHalfTotal > 0 ? 100 : 0;

    return { trendData: data, trendChangePercent: changePercent };
  }, [questionDates, trendRange]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user?.name || "Teacher"}</h1>
        <p className="text-sm text-muted-foreground">
          Here's what's happening with your chapters and submissions.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Clock}
          label="Pending Submissions"
          value={loading ? "-" : stats.pendingSubmissions}
          accent="bg-amber-100 text-amber-700"
        />
        <StatCard
          icon={CheckCircle2}
          label="Approved Chapters"
          value={loading ? "-" : stats.approvedChapters}
          accent="bg-emerald-100 text-emerald-700"
        />
        <StatCard
          icon={ClipboardList}
          label="Questions Uploaded"
          value={loading ? "-" : stats.questionsUploaded}
          accent="bg-indigo-100 text-indigo-700"
        />
        <StatCard
          icon={Wallet}
          label="Pending Payments"
          value={loading ? "-" : `₹${stats.pendingPaymentAmount.toLocaleString("en-IN")}`}
          accent="bg-rose-100 text-rose-700"
        />
      </div>

      <Card>
        <CardContent className="py-5">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
            <div>
              <p className="text-sm font-semibold">Question Upload Trends</p>
              <p className="text-xs text-muted-foreground mt-0.5">Date-wise count of your uploaded questions.</p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                  trendChangePercent >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                }`}
              >
                {trendChangePercent >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                {trendChangePercent >= 0 ? "+" : ""}{trendChangePercent}%
              </span>
              <div className="flex items-center rounded-lg border p-0.5">
                {[7, 14, 30].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setTrendRange(n)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                      trendRange === n ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {n}d
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="h-56 md:h-64 mt-3 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="teacherQuestionTrendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6c63ff" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6c63ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eeecff" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#9891c9" }}
                  axisLine={false}
                  tickLine={false}
                  interval={trendRange > 14 ? Math.ceil(trendRange / 8) : 0}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#9891c9" }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e4e1ff", fontSize: 12, boxShadow: "0 6px 20px -8px rgba(76,99,255,0.25)" }}
                  labelStyle={{ fontWeight: 700, color: "#1e293b" }}
                  formatter={(value) => [`${value} question${value === 1 ? "" : "s"}`, "Uploaded"]}
                />
                <Area
                  type="monotone"
                  dataKey="questions"
                  stroke="#6c63ff"
                  strokeWidth={2.5}
                  fill="url(#teacherQuestionTrendFill)"
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <QuickAction
            to="/dashboard/submit-chapter"
            icon={Send}
            title="Submit a Chapter"
            description="Walk through subject, content, and tryouts step by step"
          />
          <QuickAction
            to="/dashboard/add-chapter-workspace"
            icon={FileText}
            title="Add Content & Questions"
            description="Pick a chapter, write its content, then add tryout questions"
          />
          <QuickAction
            to="/dashboard/my-payments"
            icon={Wallet}
            title="My Payments"
            description="Track what you've earned and what's pending"
          />
          <QuickAction
            to="/dashboard/study-materials"
            icon={Library}
            title="Study Materials"
            description="Browse and manage uploaded study materials"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Submissions</CardTitle>
          <CardDescription>Your most recent chapter submissions and their review status</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : recentSubmissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You haven't submitted any chapters yet.{" "}
              <Link to="/dashboard/submit-chapter" className="font-medium text-primary underline-offset-4 hover:underline">
                Submit your first one
              </Link>
              .
            </p>
          ) : (
            <div className="space-y-2">
              {recentSubmissions.map((item) => (
                <div key={item._id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.board?.name} · {item.class?.name} · {item.subject?.name}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      item.status === "approved"
                        ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                        : item.status === "rejected"
                          ? "border-rose-200 bg-rose-100 text-rose-700"
                          : "border-amber-200 bg-amber-100 text-amber-700"
                    }
                  >
                    {item.status === "pending" ? "Pending Review" : item.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
