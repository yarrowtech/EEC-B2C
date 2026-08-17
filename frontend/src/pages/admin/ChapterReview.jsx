import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { CheckCircle2, XCircle, RotateCcw, ClipboardCheck, Sparkles, ChevronLeft, ChevronRight, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import QuestionPreview from "@/components/questions/QuestionPreview";

function authorOf(topic) {
  return topic.contentStatus === "pending" ? topic.draftUpdatedBy || topic.createdBy : topic.createdBy;
}

function getInitial(name) {
  return String(name || "?").trim().charAt(0).toUpperCase() || "?";
}

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

function StatusBadge({ label, status }) {
  const map = {
    approved: "border-emerald-200 bg-emerald-100 text-emerald-700",
    rejected: "border-rose-200 bg-rose-100 text-rose-700",
    pending: "border-amber-200 bg-amber-100 text-amber-700",
  };
  return (
    <Badge variant="outline" className={map[status] || map.pending}>
      {label}: {status === "pending" ? "Pending" : status}
    </Badge>
  );
}

export default function ChapterReview() {
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
  const [rejectingKey, setRejectingKey] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);

  const teacherGroups = useMemo(() => {
    const map = new Map();
    for (const it of items) {
      const author = authorOf(it.topic);
      const key = author?._id || "unknown";
      if (!map.has(key)) map.set(key, { id: key, author, items: [] });
      map.get(key).items.push(it);
    }
    return Array.from(map.values()).sort((a, b) =>
      String(a.author?.name || "").localeCompare(String(b.author?.name || ""))
    );
  }, [items]);

  const selectedGroup = teacherGroups.find((g) => g.id === selectedTeacherId) || null;

  // If the selected teacher no longer has any items (e.g. everything was
  // just approved), fall back to the teacher list automatically.
  useEffect(() => {
    if (selectedTeacherId && !selectedGroup) setSelectedTeacherId(null);
  }, [selectedTeacherId, selectedGroup]);

  async function load() {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/topic-review/chapters?status=${status}`, { headers: headers() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to load chapters");
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      toast.error(err?.message || "Failed to load chapters");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setSelectedTeacherId(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function updateTopicIn(topicId, patch) {
    setItems((prev) =>
      prev.map((it) => (it.topic._id === topicId ? { ...it, topic: { ...it.topic, ...patch } } : it))
    );
  }

  function removeQuestionFrom(topicId, questionId) {
    setItems((prev) =>
      prev.map((it) =>
        it.topic._id === topicId ? { ...it, questions: it.questions.filter((q) => q._id !== questionId) } : it
      )
    );
  }

  async function approveAll(topicId) {
    try {
      setActingId(topicId);
      const res = await fetch(`${API}/api/topic-review/chapters/${topicId}/approve-all`, {
        method: "PATCH",
        headers: headers(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to approve chapter");

      toast.success(`Approved — chapter and ${data.questionsApproved} question(s) are now live`);
      setItems((prev) => prev.filter((it) => it.topic._id !== topicId));
    } catch (err) {
      toast.error(err?.message || "Failed to approve chapter");
    } finally {
      setActingId("");
    }
  }

  async function reviewTopic(topicId, type, nextStatus, reason = "") {
    const key = `${topicId}-${type}`;
    try {
      setActingId(key);
      const res = await fetch(`${API}/api/topic/${topicId}/review`, {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({ type, status: nextStatus, reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to update");

      toast.success(type === "content" ? `Content ${nextStatus}` : `Topic ${nextStatus}`);

      // While only browsing pending items, drop the card once topic status,
      // content status, and every question for it are all settled.
      if (status === "pending") {
        setItems((prev) =>
          prev
            .map((it) => (it.topic._id === topicId ? { ...it, topic: { ...it.topic, ...data } } : it))
            .filter((it) => {
              if (it.topic._id !== topicId) return true;
              const stillPending =
                it.topic.status === "pending" ||
                it.topic.contentStatus === "pending" ||
                it.questions.some((q) => q.status === "pending");
              return stillPending;
            })
        );
      } else {
        updateTopicIn(topicId, data);
      }
      setRejectingKey("");
      setRejectReason("");
    } catch (err) {
      toast.error(err?.message || "Failed to update");
    } finally {
      setActingId("");
    }
  }

  async function reviewQuestion(topicId, questionId, nextStatus, reason = "") {
    const key = `q-${questionId}`;
    try {
      setActingId(key);
      const res = await fetch(`${API}/api/questions/${questionId}/review`, {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({ status: nextStatus, reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to update question");

      toast.success(`Question ${nextStatus}`);
      if (status === "pending") {
        removeQuestionFrom(topicId, questionId);
      }
      setRejectingKey("");
      setRejectReason("");
    } catch (err) {
      toast.error(err?.message || "Failed to update question");
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
            Chapter Review
          </h1>
          <p className="text-sm text-muted-foreground">
            Everything a teacher uploaded for a chapter — content and tryout questions — in one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
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
        <p className="text-sm text-muted-foreground">Loading chapters...</p>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No {status === "pending" ? "pending" : ""} chapter submissions found.
          </CardContent>
        </Card>
      ) : !selectedGroup ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {teacherGroups.map((group) => {
            const pendingCount = group.items.reduce(
              (sum, it) =>
                sum +
                (it.topic.status === "pending" ? 1 : 0) +
                (it.topic.contentStatus === "pending" ? 1 : 0) +
                it.questions.filter((q) => q.status === "pending").length,
              0
            );
            return (
              <Card
                key={group.id}
                className="cursor-pointer transition-colors hover:border-primary/40 hover:bg-muted/40"
                onClick={() => setSelectedTeacherId(group.id)}
              >
                <CardContent className="flex items-center gap-3 py-5">
                  <Avatar className="size-10">
                    <AvatarFallback>{getInitial(group.author?.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{group.author?.name || "Unknown"}</p>
                    <p className="truncate text-xs text-muted-foreground">{group.author?.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{group.items.length}</p>
                    <p className="text-[11px] text-muted-foreground">
                      chapter{group.items.length === 1 ? "" : "s"}
                    </p>
                    {status === "pending" && pendingCount > 0 && (
                      <Badge variant="outline" className="mt-1 border-amber-200 bg-amber-100 text-amber-700">
                        {pendingCount} pending
                      </Badge>
                    )}
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="outline" onClick={() => setSelectedTeacherId(null)}>
              <ChevronLeft className="size-4" />
              Back to Teachers
            </Button>
            <div className="flex items-center gap-2 text-sm">
              <User className="size-4 text-muted-foreground" />
              <span className="font-semibold">{selectedGroup.author?.name || "Unknown"}</span>
              <span className="text-muted-foreground">{selectedGroup.author?.email}</span>
            </div>
          </div>

          {selectedGroup.items.map(({ topic, questions }) => {
            const hasPendingQuestions = questions.some((q) => q.status === "pending");
            const canApproveAll =
              topic.status === "pending" || topic.contentStatus === "pending" || hasPendingQuestions;
            const contentPreview = getPlainText(
              topic.contentStatus === "pending" ? topic.draftTopicSummary : topic.topicSummary
            );
            const outcomePreview = getPlainText(
              topic.contentStatus === "pending" ? topic.draftLearningOutcome : topic.learningOutcome
            );

            return (
              <Card key={topic._id}>
                <CardHeader>
                  <CardTitle>{topic.name}</CardTitle>
                  <CardDescription>
                    {topic.board?.name} · {topic.class?.name} · {topic.subject?.name}
                  </CardDescription>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge label="Topic" status={topic.status} />
                    <StatusBadge label="Content" status={topic.contentStatus} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(contentPreview || outcomePreview) && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="mb-1 text-xs font-semibold text-muted-foreground">Content</p>
                        <p className="text-sm">{contentPreview || "-"}</p>
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-semibold text-muted-foreground">Learning Outcome</p>
                        <p className="text-sm">{outcomePreview || "-"}</p>
                      </div>
                    </div>
                  )}

                  {questions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">
                        Tryout Questions ({questions.length})
                      </p>
                      <div className="space-y-2">
                        {questions.map((q, i) => (
                          <div key={q._id} className="space-y-1.5">
                            <QuestionPreview question={q} index={i} />
                            <div className="flex items-center justify-between px-1">
                              <span className="text-[11px] text-muted-foreground">
                                {q.createdBy?.name || "Unknown"} · {q.status}
                              </span>
                              {q.status === "pending" && (
                                <div className="flex gap-1.5">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    disabled={actingId === `q-${q._id}`}
                                    onClick={() => reviewQuestion(topic._id, q._id, "approved")}
                                  >
                                    <CheckCircle2 className="size-3.5" />
                                    Approve
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    disabled={actingId === `q-${q._id}`}
                                    onClick={() => reviewQuestion(topic._id, q._id, "rejected")}
                                  >
                                    <XCircle className="size-3.5" />
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {rejectingKey.startsWith(topic._id) ? (
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
                          onClick={() => {
                            const type = rejectingKey.endsWith("content") ? "content" : "topic";
                            reviewTopic(topic._id, type, "rejected", rejectReason);
                          }}
                        >
                          Confirm Reject
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setRejectingKey("");
                            setRejectReason("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      {canApproveAll && (
                        <Button
                          type="button"
                          disabled={actingId === topic._id}
                          onClick={() => approveAll(topic._id)}
                        >
                          <Sparkles className="size-4" />
                          {actingId === topic._id ? "Approving..." : "Approve All"}
                        </Button>
                      )}
                      {topic.status === "pending" && (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={actingId === `${topic._id}-topic`}
                          onClick={() => setRejectingKey(`${topic._id}-topic`)}
                        >
                          Reject Topic
                        </Button>
                      )}
                      {topic.contentStatus === "pending" && (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={actingId === `${topic._id}-content`}
                          onClick={() => setRejectingKey(`${topic._id}-content`)}
                        >
                          Reject Content
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
