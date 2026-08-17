import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  BookOpen,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Edit3,
  FileText,
  IndianRupee,
  Layers3,
  Wallet,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";

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

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasContent(item) {
  return Boolean(stripHtml(item?.topicSummary) || stripHtml(item?.learningOutcome));
}

// A brand-new chapter defaults to contentStatus "approved" even though no
// content has ever been written for it — treat that as still pending
// instead of showing a misleading "approved" badge for empty content.
function effectiveContentStatus(item) {
  const status = String(item?.contentStatus || "pending").toLowerCase();
  if (status === "approved" && !hasContent(item)) return "pending";
  return status;
}

function editChapterUrl(item) {
  const params = new URLSearchParams({
    editTopic: String(item?._id || ""),
    board: String(item?.board?._id || ""),
    class: String(item?.class?._id || ""),
    subject: String(item?.subject?._id || ""),
  });
  return `/dashboard/add-chapter-workspace?${params.toString()}`;
}

function StatCard(props) {
  return (
    <Card className="border-blue-100 shadow-sm">
      <CardContent className="flex items-center gap-4 py-5">
        <div className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${props.tone}`}>
          <props.icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold tracking-tight text-blue-950">{props.value}</p>
          <p className="truncate text-sm font-medium text-blue-700/80">{props.label}</p>
          {props.note ? <p className="truncate text-xs text-blue-500">{props.note}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }) {
  const normalized = String(status || "unpaid").toLowerCase();
  const label = normalized === "paid" ? "Paid" : "Unpaid";
  const className =
    normalized === "paid"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : "border-sky-200 bg-sky-50 text-sky-700";
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}

function ChapterCard({ item, showUploader }) {
  const paymentStatus = String(item?.paymentStatus || "unpaid").toLowerCase();
  const contentStatus = effectiveContentStatus(item);
  const emptyContentText = "Content not added by you yet.";

  const contentTone =
    contentStatus === "approved"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : contentStatus === "rejected"
        ? "border-sky-200 bg-sky-50 text-sky-700"
        : "border-blue-100 bg-white text-blue-700";

  return (
    <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-bold text-blue-950">{item?.name || "Untitled chapter"}</p>
            <Badge variant="outline" className={contentTone}>
              {contentStatus === "approved" ? "Content Approved" : contentStatus === "rejected" ? "Content Rejected" : "Content Pending"}
            </Badge>
            {showUploader && item?.createdBy?.name && (
              <Badge variant="secondary">Uploaded by {item.createdBy.name}</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-blue-700/80">
            {[item?.board?.name, item?.class?.name, item?.subject?.name].filter(Boolean).join(" · ") ||
              "Board / Class / Subject not set"}
          </p>
          <p className="mt-1 text-xs text-blue-500">
            {item?.createdAt ? `Created ${formatDate(item.createdAt)}` : "Recently created"}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={paymentStatus} />
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-800">
            {formatMoney(item?.budgetAmount)}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Summary</p>
          <p className="mt-1 line-clamp-3 text-sm text-blue-800">
            {stripHtml(item?.topicSummary) || emptyContentText}
          </p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Learning Outcome</p>
          <p className="mt-1 line-clamp-3 text-sm text-blue-800">
            {stripHtml(item?.learningOutcome) || emptyContentText}
          </p>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button
          asChild
          variant="outline"
          className="rounded-full border-blue-200 text-blue-700 hover:bg-blue-50"
        >
          <Link to={editChapterUrl(item)}>
            <Edit3 className="mr-2 size-3.5" />
            Edit Content
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function MyChaptersPage() {
  const user = getUser();
  const role = String(user?.role || "").toLowerCase();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/my-payments`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("jwt") || ""}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || "Failed to load chapters");
        if (!mounted) return;
        setItems(Array.isArray(data?.items) ? data.items : []);
      } catch (e) {
        if (mounted) setErr(e?.message || "Failed to load chapters");
        toast.error(e?.message || "Failed to load chapters");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const totalAmount = items.reduce((sum, item) => sum + Number(item?.budgetAmount || 0), 0);
    const paidItems = items.filter((item) => String(item?.paymentStatus || "").toLowerCase() === "paid");
    const unpaidItems = items.filter((item) => String(item?.paymentStatus || "").toLowerCase() !== "paid");
    const approvedItems = items.filter((item) => effectiveContentStatus(item) === "approved");
    return {
      total: items.length,
      paid: paidItems.length,
      unpaid: unpaidItems.length,
      approved: approvedItems.length,
      totalAmount,
    };
  }, [items]);

  if (role && role !== "teacher" && role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const isAdmin = role === "admin";

  return (
    <div className="space-y-6 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_30%),radial-gradient(circle_at_top_right,rgba(191,219,254,0.42),transparent_24%),linear-gradient(to_bottom,#eff6ff,#f8fbff)] p-4 sm:p-6">
      <ToastContainer position="bottom-right" />

      <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-3">
          <Badge className="w-fit bg-[linear-gradient(135deg,#1877f2,#4f9ef8)] text-white hover:bg-[linear-gradient(135deg,#1877f2,#4f9ef8)]">
            Chapter Library
          </Badge>
          <h1 className="text-3xl font-black tracking-tight text-blue-950 sm:text-4xl">
            {isAdmin ? "All Uploaded Chapters" : "Your Uploaded Chapters"}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-blue-700/80 sm:text-base">
            {isAdmin
              ? "View every chapter uploaded by any teacher, its content status, and whether payment has been marked paid or unpaid."
              : "View all chapters you’ve added, their content status, and whether payment has been marked paid or unpaid."}
          </p>
        </div>
      </section>

      {err ? (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {err}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={BookOpen} label="Total Chapters" value={loading ? "-" : stats.total} tone="bg-blue-100 text-blue-700" note="All uploaded chapters" />
        <StatCard icon={CheckCircle2} label="Paid" value={loading ? "-" : stats.paid} tone="bg-blue-100 text-blue-800" note="Payment done" />
        <StatCard icon={CircleAlert} label="Unpaid" value={loading ? "-" : stats.unpaid} tone="bg-sky-100 text-sky-700" note="Payment pending" />
        <StatCard icon={Layers3} label="Content Approved" value={loading ? "-" : stats.approved} tone="bg-indigo-100 text-indigo-700" note="Ready chapters" />
        <StatCard icon={Wallet} label="Total Value" value={loading ? "-" : formatMoney(stats.totalAmount)} tone="bg-cyan-100 text-cyan-700" note="Agreed amount" />
      </div>

      <Card className="border-blue-100 shadow-sm">
        <CardHeader className="border-b border-blue-50">
          <CardTitle className="text-blue-950">All Chapters</CardTitle>
          <CardDescription className="text-blue-700/80">
            Separate view for the chapters you uploaded, outside the content editor.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 py-5">
          {loading ? (
            <div className="rounded-2xl border border-dashed border-blue-200 bg-white p-6 text-sm text-blue-700/70">
              Loading your chapters...
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-blue-200 bg-white p-6 text-sm text-blue-700/70">
              You haven&apos;t uploaded any chapters yet.
            </div>
          ) : (
            items.map((item) => <ChapterCard key={item._id} item={item} showUploader={isAdmin} />)
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button asChild className="rounded-full bg-[linear-gradient(135deg,#1877f2,#4f9ef8)] text-white shadow-md shadow-blue-200/50">
          <Link to="/dashboard/add-chapter-workspace">
            <Edit3 className="mr-2 size-4" />
            Open Content Workspace
          </Link>
        </Button>
      </div>
    </div>
  );
}
