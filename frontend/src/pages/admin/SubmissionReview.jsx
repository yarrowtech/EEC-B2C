import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { CheckCircle2, XCircle, RotateCcw, ClipboardCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import QuestionPreview from "@/components/questions/QuestionPreview";

const API = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function headers() {
  return {
    Authorization: `Bearer ${localStorage.getItem("jwt") || ""}`,
    "Content-Type": "application/json",
  };
}

function getPlainText(html, max = 220) {
  const text = String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

export default function SubmissionReview() {
  const isAdmin = (() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return String(user?.role || "").toLowerCase() === "admin";
    } catch {
      return false;
    }
  })();

  const [status, setStatus] = useState("pending");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState("");
  const [rejectingId, setRejectingId] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  async function load() {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/submissions/review?status=${status}`, { headers: headers() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to load submissions");
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      toast.error(err?.message || "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function review(submissionId, nextStatus, reason = "") {
    try {
      setActingId(submissionId);
      const res = await fetch(`${API}/api/submissions/${submissionId}/review`, {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({ status: nextStatus, reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to review submission");

      setItems((prev) => prev.filter((item) => item.topic.submissionId !== submissionId));
      toast.success(nextStatus === "approved" ? "Approved — chapter and questions are now live" : "Submission rejected");
      setRejectingId("");
      setRejectReason("");
    } catch (err) {
      toast.error(err?.message || "Failed to review submission");
    } finally {
      setActingId("");
    }
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <ToastContainer />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <ClipboardCheck className="size-6" />
            Chapter Submissions
          </h1>
          <p className="text-sm text-muted-foreground">
            Review a teacher's chapter, content, and tryout questions together — approve or reject in one click.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" onClick={load}>
            <RotateCcw className="size-4" />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading submissions...</p>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No {status !== "all" ? status : ""} submissions found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map(({ topic, questions }) => (
            <Card key={topic.submissionId}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle>{topic.name}</CardTitle>
                    <CardDescription>
                      {topic.board?.name} · {topic.class?.name} · {topic.subject?.name}
                    </CardDescription>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p className="font-medium text-foreground">{topic.createdBy?.name || "Unknown"}</p>
                    <p>{topic.createdBy?.email}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {topic.shortDescription && (
                  <p className="text-sm text-muted-foreground">{topic.shortDescription}</p>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-xs font-semibold text-muted-foreground">Content</p>
                    <p className="text-sm">{getPlainText(topic.topicSummary) || "-"}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold text-muted-foreground">Learning Outcome</p>
                    <p className="text-sm">{getPlainText(topic.learningOutcome) || "-"}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Tryout Questions ({questions.length})
                  </p>
                  <div className="space-y-2">
                    {questions.map((q, i) => (
                      <QuestionPreview key={q._id} question={q} index={i} />
                    ))}
                  </div>
                </div>

                {topic.status === "pending" && (
                  <>
                    <Separator />
                    {rejectingId === topic.submissionId ? (
                      <div className="space-y-2">
                        <Textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Reason for rejection (optional)"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="destructive"
                            disabled={actingId === topic.submissionId}
                            onClick={() => review(topic.submissionId, "rejected", rejectReason)}
                          >
                            Confirm Reject
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setRejectingId("");
                              setRejectReason("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          disabled={actingId === topic.submissionId}
                          onClick={() => review(topic.submissionId, "approved")}
                        >
                          <CheckCircle2 className="size-4" />
                          {actingId === topic.submissionId ? "Approving..." : "Approve All"}
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          disabled={actingId === topic.submissionId}
                          onClick={() => setRejectingId(topic.submissionId)}
                        >
                          <XCircle className="size-4" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
