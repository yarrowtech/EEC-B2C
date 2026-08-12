import { useEffect, useState } from "react";
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
} from "lucide-react";

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

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [submissionsData, questionsData, paymentsData] = await Promise.all([
          getJSON("/api/submissions/mine").catch(() => ({ items: [] })),
          getJSON("/api/questions?mine=1&page=1&limit=1").catch(() => ({ total: 0 })),
          getJSON("/api/my-payments").catch(() => ({ items: [] })),
        ]);

        if (!mounted) return;

        const submissions = Array.isArray(submissionsData?.items) ? submissionsData.items : [];
        const chapters = Array.isArray(paymentsData?.items) ? paymentsData.items : [];

        setStats({
          pendingSubmissions: submissions.filter((s) => s.status === "pending").length,
          approvedChapters: submissions.filter((s) => s.status === "approved").length,
          questionsUploaded: Number(questionsData?.total || 0),
          pendingPaymentAmount: chapters
            .filter((t) => t.paymentStatus !== "paid")
            .reduce((sum, t) => sum + (Number(t.budgetAmount) || 0), 0),
        });
        setRecentSubmissions(submissions.slice(0, 4));
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
