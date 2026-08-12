import { useEffect, useMemo, useState } from "react";
import JoditEditor from "jodit-react";
import "jodit/es2021/jodit.min.css";
import { toast, ToastContainer } from "react-toastify";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  FileText,
  ListChecks,
  ClipboardCheck,
  Plus,
  Trash2,
  Send,
  Image as ImageIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import QuestionPreview from "@/components/questions/QuestionPreview";
import { cn } from "@/lib/utils";

const API = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const OPTION_LETTERS = ["A", "B", "C", "D"];

const STEPS = [
  { id: 1, label: "Subject", icon: BookOpen },
  { id: 2, label: "Topic", icon: FileText },
  { id: 3, label: "Content", icon: ClipboardCheck },
  { id: 4, label: "Tryouts", icon: ListChecks },
  { id: 5, label: "Submit", icon: Send },
];

function headers() {
  return {
    Authorization: `Bearer ${localStorage.getItem("jwt") || ""}`,
    "Content-Type": "application/json",
  };
}

function getPlainText(html) {
  return String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function createEmptyQuestion() {
  return {
    key: Math.random().toString(36).slice(2),
    type: "mcq-single",
    question: "",
    options: ["", "", "", ""],
    correctSingle: "A",
    correctMulti: [],
    answer: "true",
    explanation: "",
  };
}

function StatusBadge({ status }) {
  const map = {
    approved: { label: "Approved", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    rejected: { label: "Rejected", className: "bg-rose-100 text-rose-700 border-rose-200" },
    pending: { label: "Pending Review", className: "bg-amber-100 text-amber-700 border-amber-200" },
  };
  const cfg = map[status] || map.pending;
  return <Badge variant="outline" className={cn("font-semibold", cfg.className)}>{cfg.label}</Badge>;
}

export default function SubmitChapterWizard() {
  const [step, setStep] = useState(1);

  const [boards, setBoards] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [board, setBoard] = useState("");
  const [classId, setClassId] = useState("");
  const [subject, setSubject] = useState("");

  const [topicName, setTopicName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [topicImage, setTopicImage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const [topicSummary, setTopicSummary] = useState("");
  const [learningOutcome, setLearningOutcome] = useState("");

  const [stage, setStage] = useState("1");
  const [difficulty, setDifficulty] = useState("easy");
  const [tags, setTags] = useState("");
  const [questions, setQuestions] = useState([createEmptyQuestion()]);

  const [submitting, setSubmitting] = useState(false);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);

  const editorConfig = useMemo(
    () => ({
      minHeight: 220,
      toolbarAdaptive: false,
      askBeforePasteHTML: false,
      askBeforePasteFromWord: false,
      buttons:
        "bold,italic,underline,|,ul,ol,|,font,fontsize,brush,paragraph,|,align,|,link,image,table,|,undo,redo,|,eraser",
    }),
    []
  );

  useEffect(() => {
    async function loadMeta() {
      try {
        const [bRes, cRes] = await Promise.all([
          fetch(`${API}/api/boards`),
          fetch(`${API}/api/classes`),
        ]);
        setBoards(await bRes.json().catch(() => []));
        setClasses(await cRes.json().catch(() => []));
      } catch {
        // pickers stay empty if this fails
      }
    }
    loadMeta();
  }, []);

  useEffect(() => {
    setSubject("");
    setSubjects([]);
    if (!board || !classId) return;
    fetch(`${API}/api/subject?board=${board}&class=${classId}`, { headers: headers() })
      .then((r) => r.json())
      .then((rows) => setSubjects(Array.isArray(rows) ? rows : []))
      .catch(() => setSubjects([]));
  }, [board, classId]);

  async function loadMySubmissions() {
    try {
      setLoadingSubmissions(true);
      const res = await fetch(`${API}/api/submissions/mine`, { headers: headers() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to load your submissions");
      setMySubmissions(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      toast.error(err?.message || "Failed to load your submissions");
    } finally {
      setLoadingSubmissions(false);
    }
  }

  useEffect(() => {
    loadMySubmissions();
  }, []);

  async function uploadTopicImage(file) {
    if (!file) return;
    if (!file.type?.startsWith("image/")) {
      toast.warn("Please select an image file");
      return;
    }
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`${API}/api/upload/image`, { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.url) throw new Error(data?.message || "Image upload failed");
      setTopicImage(data.url);
      toast.success("Chapter image uploaded");
    } catch (err) {
      toast.error(err?.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  }

  function updateQuestion(key, patch) {
    setQuestions((prev) => prev.map((q) => (q.key === key ? { ...q, ...patch } : q)));
  }

  function updateOption(key, index, value) {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.key !== key) return q;
        const options = [...q.options];
        options[index] = value;
        return { ...q, options };
      })
    );
  }

  function toggleMultiCorrect(key, letter) {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.key !== key) return q;
        const has = q.correctMulti.includes(letter);
        return {
          ...q,
          correctMulti: has ? q.correctMulti.filter((l) => l !== letter) : [...q.correctMulti, letter],
        };
      })
    );
  }

  function addQuestion() {
    if (questions.length >= 20) {
      toast.warn("You can add up to 20 tryout questions per chapter");
      return;
    }
    setQuestions((prev) => [...prev, createEmptyQuestion()]);
  }

  function removeQuestion(key) {
    setQuestions((prev) => (prev.length <= 1 ? prev : prev.filter((q) => q.key !== key)));
  }

  const stepValid = useMemo(() => {
    switch (step) {
      case 1:
        return Boolean(board && classId && subject);
      case 2:
        return Boolean(topicName.trim());
      case 3:
        return Boolean(getPlainText(topicSummary) && getPlainText(learningOutcome));
      case 4:
        return questions.every((q) => {
          if (!q.question.trim()) return false;
          if (q.type === "true-false") return true;
          if (q.options.some((o) => !o.trim())) return false;
          if (q.type === "mcq-multi") return q.correctMulti.length > 0;
          return true;
        });
      default:
        return true;
    }
  }, [step, board, classId, subject, topicName, topicSummary, learningOutcome, questions]);

  const progressPct = (step / STEPS.length) * 100;

  function goNext() {
    if (!stepValid) {
      toast.warn("Please complete this step before continuing");
      return;
    }
    setStep((s) => Math.min(STEPS.length, s + 1));
  }

  function goBack() {
    setStep((s) => Math.max(1, s - 1));
  }

  function buildQuestionPayload(q) {
    const shared = { stage: Number(stage), difficulty, tags, explanation: q.explanation };
    if (q.type === "mcq-single") {
      return { type: "mcq-single", question: q.question, options: q.options, correct: q.correctSingle, ...shared };
    }
    if (q.type === "mcq-multi") {
      return { type: "mcq-multi", question: q.question, options: q.options, correct: q.correctMulti, ...shared };
    }
    return { type: "true-false", question: q.question, answer: q.answer, ...shared };
  }

  async function handleSubmit() {
    if (!stepValid && step === 4) {
      toast.warn("Please complete all tryout questions before submitting");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        board,
        class: classId,
        subject,
        topicName,
        shortDescription,
        topicImage,
        topicSummary,
        learningOutcome,
        questions: questions.map(buildQuestionPayload),
      };

      const res = await fetch(`${API}/api/submissions`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to submit chapter");

      toast.success("Chapter submitted for admin review!");
      setStep(1);
      setBoard("");
      setClassId("");
      setSubject("");
      setTopicName("");
      setShortDescription("");
      setTopicImage("");
      setTopicSummary("");
      setLearningOutcome("");
      setTags("");
      setQuestions([createEmptyQuestion()]);
      await loadMySubmissions();
    } catch (err) {
      toast.error(err?.message || "Failed to submit chapter");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <ToastContainer />

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Submit a Chapter</h1>
        <p className="text-sm text-muted-foreground">
          Walk through subject, topic, content, and tryouts — then submit everything together for one review.
        </p>
      </div>

      <div className="space-y-3">
        <Progress value={progressPct} className="h-1.5" />
        <div className="flex items-center justify-between">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const isActive = s.id === step;
            const isDone = s.id < step;
            return (
              <div key={s.id} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                    isDone && "border-primary bg-primary text-primary-foreground",
                    isActive && !isDone && "border-primary text-primary",
                    !isActive && !isDone && "border-border text-muted-foreground"
                  )}
                >
                  {isDone ? <Check className="size-4" /> : <Icon className="size-4" />}
                </div>
                <span
                  className={cn(
                    "text-[11px] font-medium",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[step - 1].label}</CardTitle>
          <CardDescription>
            {step === 1 && "Choose the board, class, and subject this chapter belongs to."}
            {step === 2 && "Name the chapter and add an optional description and cover image."}
            {step === 3 && "Write the chapter content and its learning outcome."}
            {step === 4 && "Add practice questions (tryouts) students will use to test themselves."}
            {step === 5 && "Review everything, then submit for admin approval."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Board</Label>
                <Select value={board} onValueChange={(v) => { setBoard(v); setClassId(""); }}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select board" /></SelectTrigger>
                  <SelectContent>
                    {boards.map((b) => (
                      <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Class</Label>
                <Select value={classId} onValueChange={setClassId} disabled={!board}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Select value={subject} onValueChange={setSubject} disabled={!classId}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Chapter Name</Label>
                <Input value={topicName} onChange={(e) => setTopicName(e.target.value)} placeholder="e.g. Photosynthesis" />
              </div>
              <div className="space-y-1.5">
                <Label>Short Description (optional)</Label>
                <Textarea
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="One or two lines describing this chapter"
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Cover Image (optional)</Label>
                <div className="flex items-center gap-3">
                  <Label
                    htmlFor="chapter-image-upload"
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-2 rounded-lg border border-input bg-transparent px-3 py-2 text-sm font-medium hover:bg-muted",
                      uploadingImage && "pointer-events-none opacity-50"
                    )}
                  >
                    <ImageIcon className="size-4" />
                    {uploadingImage ? "Uploading..." : "Upload Image"}
                  </Label>
                  <input
                    id="chapter-image-upload"
                    type="file"
                    accept="image/*"
                    disabled={uploadingImage}
                    className="hidden"
                    onChange={(e) => uploadTopicImage(e.target.files?.[0])}
                  />
                  {topicImage && (
                    <img src={topicImage} alt="Chapter cover" className="h-12 w-12 rounded-lg border object-cover" />
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label>Chapter Content</Label>
                <JoditEditor value={topicSummary} config={editorConfig} onBlur={(v) => setTopicSummary(v || "")} />
              </div>
              <div className="space-y-1.5">
                <Label>Learning Outcome</Label>
                <JoditEditor value={learningOutcome} config={editorConfig} onBlur={(v) => setLearningOutcome(v || "")} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Stage</Label>
                  <Select value={stage} onValueChange={setStage}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Stage 1</SelectItem>
                      <SelectItem value="2">Stage 2</SelectItem>
                      <SelectItem value="3">Stage 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Tags (optional)</Label>
                  <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="algebra, physics..." />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                {questions.map((q, qi) => (
                  <Card key={q.key} className="border-dashed">
                    <CardContent className="space-y-4 pt-5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold">Question {qi + 1}</span>
                        <div className="flex items-center gap-2">
                          <Select value={q.type} onValueChange={(v) => updateQuestion(q.key, { type: v })}>
                            <SelectTrigger size="sm" className="w-40"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mcq-single">MCQ (Single)</SelectItem>
                              <SelectItem value="mcq-multi">MCQ (Multi)</SelectItem>
                              <SelectItem value="true-false">True / False</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon-sm"
                            disabled={questions.length <= 1}
                            onClick={() => removeQuestion(q.key)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>

                      <Textarea
                        value={q.question}
                        onChange={(e) => updateQuestion(q.key, { question: e.target.value })}
                        placeholder="Question text"
                        rows={2}
                      />

                      {q.type === "true-false" && (
                        <RadioGroup
                          value={q.answer}
                          onValueChange={(v) => updateQuestion(q.key, { answer: v })}
                          className="flex gap-6"
                        >
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="true" id={`${q.key}-true`} />
                            <Label htmlFor={`${q.key}-true`}>True</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="false" id={`${q.key}-false`} />
                            <Label htmlFor={`${q.key}-false`}>False</Label>
                          </div>
                        </RadioGroup>
                      )}

                      {q.type === "mcq-single" && (
                        <RadioGroup
                          value={q.correctSingle}
                          onValueChange={(v) => updateQuestion(q.key, { correctSingle: v })}
                          className="space-y-2"
                        >
                          {OPTION_LETTERS.map((letter, oi) => (
                            <div key={letter} className="flex items-center gap-2">
                              <RadioGroupItem value={letter} id={`${q.key}-${letter}`} />
                              <Input
                                value={q.options[oi]}
                                onChange={(e) => updateOption(q.key, oi, e.target.value)}
                                placeholder={`Option ${letter}`}
                                className="flex-1"
                              />
                            </div>
                          ))}
                        </RadioGroup>
                      )}

                      {q.type === "mcq-multi" && (
                        <div className="space-y-2">
                          {OPTION_LETTERS.map((letter, oi) => (
                            <div key={letter} className="flex items-center gap-2">
                              <Checkbox
                                checked={q.correctMulti.includes(letter)}
                                onCheckedChange={() => toggleMultiCorrect(q.key, letter)}
                                id={`${q.key}-${letter}`}
                              />
                              <Input
                                value={q.options[oi]}
                                onChange={(e) => updateOption(q.key, oi, e.target.value)}
                                placeholder={`Option ${letter}`}
                                className="flex-1"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      <Textarea
                        value={q.explanation}
                        onChange={(e) => updateQuestion(q.key, { explanation: e.target.value })}
                        placeholder="Explanation (optional)"
                        rows={2}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button type="button" variant="outline" onClick={addQuestion} className="w-full">
                <Plus className="size-4" />
                Add Another Question
              </Button>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Chapter</span><span className="font-medium">{topicName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Subject</span><span className="font-medium">{subjects.find((s) => s._id === subject)?.name || "-"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Board</span><span className="font-medium">{boards.find((b) => b._id === board)?.name || "-"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Class</span><span className="font-medium">{classes.find((c) => c._id === classId)?.name || "-"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tryout Questions</span><span className="font-medium">{questions.length}</span></div>
              </div>
              <p className="text-sm text-muted-foreground">
                Submitting sends the chapter, its content, and all {questions.length} tryout question{questions.length === 1 ? "" : "s"}
                {" "}to admin as one bundle — you'll see it as <strong>Pending Review</strong> below until it's approved.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={goBack} disabled={step === 1}>
          <ChevronLeft className="size-4" />
          Back
        </Button>
        {step < STEPS.length ? (
          <Button type="button" onClick={goNext}>
            Next
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} disabled={submitting}>
            <Send className="size-4" />
            {submitting ? "Submitting..." : "Submit for Review"}
          </Button>
        )}
      </div>

      <Separator />

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">My Submissions</h2>
        {loadingSubmissions ? (
          <p className="text-sm text-muted-foreground">Loading your submissions...</p>
        ) : mySubmissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">You haven't submitted any chapters yet.</p>
        ) : (
          <div className="space-y-3">
            {mySubmissions.map((item) => (
              <Card key={item._id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{item.name}</CardTitle>
                      <CardDescription>
                        {item.board?.name} · {item.class?.name} · {item.subject?.name} · {item.questionCount} tryout
                        question{item.questionCount === 1 ? "" : "s"}
                      </CardDescription>
                      {item.status === "rejected" && item.rejectionReason && (
                        <p className="mt-1 text-xs text-rose-600">Reason: {item.rejectionReason}</p>
                      )}
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                </CardHeader>
                {Array.isArray(item.questions) && item.questions.length > 0 && (
                  <CardContent className="space-y-2 pt-0">
                    {item.questions.map((q, i) => (
                      <QuestionPreview key={q._id} question={q} index={i} />
                    ))}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
