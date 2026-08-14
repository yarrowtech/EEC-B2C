import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import JoditEditor from "jodit-react";
import "jodit/es2021/jodit.min.css";
import { toast, ToastContainer } from "react-toastify";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  FileText,
  Sliders,
  ListChecks,
  Plus,
  Sparkles,
  GraduationCap,
  Layers,
  CircleDot,
  CheckSquare,
  ToggleLeft,
  Grid3x3,
  Move,
  ListFilter,
  Type as TypeIcon,
  GitCompare,
  AlignLeft,
  Rocket,
  Clock3,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { useQuestionScope } from "../../context/QuestionScopeContext";
import { buildStageOptions, formatStageLabel, normalizeStageNumber } from "../../lib/stage";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import QuestionsMCQUpload from "./QuestionsMCQUpload";
import QuestionsMCQMulti from "./QuestionsMCQMulti";
import QuestionsTrueFalse from "./QuestionsTrueFalse";
import QuestionsChoiceMatrix from "./QuestionsChoiceMatrix";
import QuestionsClozeDrag from "./QuestionsClozeDrag";
import QuestionsClozeSelect from "./QuestionsClozeSelect";
import QuestionsClozeText from "./QuestionsClozeText";
import QuestionsMatchList from "./QuestionsMatchList";
import QuestionsEssayRich from "./QuestionsEssayRich";
import QuestionsEssayPlain from "./QuestionsEssayPlain";

const API = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const DIFFICULTY_META = [
  { label: "Easy", swatch: "bg-emerald-500", ring: "ring-emerald-500/30", tint: "bg-emerald-50 border-emerald-200 text-emerald-700" },
  { label: "Medium", swatch: "bg-amber-500", ring: "ring-amber-500/30", tint: "bg-amber-50 border-amber-200 text-amber-700" },
  { label: "Hard", swatch: "bg-rose-500", ring: "ring-rose-500/30", tint: "bg-rose-50 border-rose-200 text-rose-700" },
];

const QUESTION_TYPES = [
  { label: "MCQ — Single Correct", short: "MCQ Single", icon: CircleDot, Component: QuestionsMCQUpload },
  { label: "MCQ — Multiple Correct", short: "MCQ Multi", icon: CheckSquare, Component: QuestionsMCQMulti },
  { label: "True / False", short: "True / False", icon: ToggleLeft, Component: QuestionsTrueFalse },
  { label: "Choice Matrix", short: "Choice Matrix", icon: Grid3x3, Component: QuestionsChoiceMatrix },
  { label: "Cloze — Drag & Drop", short: "Cloze Drag", icon: Move, Component: QuestionsClozeDrag },
  { label: "Cloze — Drop-Down", short: "Cloze Dropdown", icon: ListFilter, Component: QuestionsClozeSelect },
  { label: "Cloze — Free Text", short: "Cloze Text", icon: TypeIcon, Component: QuestionsClozeText },
  { label: "Match List", short: "Match List", icon: GitCompare, Component: QuestionsMatchList },
  { label: "Essay — Rich Text", short: "Essay Rich", icon: FileText, Component: QuestionsEssayRich },
  { label: "Essay — Plain Text", short: "Essay Plain", icon: AlignLeft, Component: QuestionsEssayPlain },
];

const STEPS = [
  { id: 1, label: "Chapter", icon: BookOpen, bubble: "bg-indigo-100 text-indigo-600" },
  { id: 2, label: "Content", icon: FileText, bubble: "bg-teal-100 text-teal-600" },
  { id: 3, label: "Parameters", icon: Sliders, bubble: "bg-amber-100 text-amber-600" },
  { id: 4, label: "Tryouts", icon: ListChecks, bubble: "bg-rose-100 text-rose-600" },
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

export default function AddChapterWorkspace() {
  const {
    scope,
    setBoard,
    setClass,
    setSubject,
    setTopic,
    setStage,
    setDifficulty,
    setQuestionType,
    setHidePicker,
    clear,
  } = useQuestionScope();

  const [searchParams] = useSearchParams();

  const isAdmin = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      return String(user?.role || "").toLowerCase() === "admin";
    } catch {
      return false;
    }
  }, []);

  const [step, setStep] = useState(1);

  const [boards, setBoards] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);

  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);

  const [newTopicName, setNewTopicName] = useState("");
  const [creatingTopic, setCreatingTopic] = useState(false);

  const [topicSummary, setTopicSummary] = useState("");
  const [learningOutcome, setLearningOutcome] = useState("");
  const [savingContent, setSavingContent] = useState(false);

  const [stages, setStages] = useState([1, 2, 3]);
  const [customStage, setCustomStage] = useState("");
  const [showCustomStage, setShowCustomStage] = useState(false);

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

  // Start every visit with a clean scope
  useEffect(() => {
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Arriving from "My Chapters" with a specific chapter to edit — pre-fill
  // the scope from the URL and jump straight to the Content step.
  useEffect(() => {
    const editTopicId = searchParams.get("editTopic");
    if (!editTopicId) return;
    const boardId = searchParams.get("board") || "";
    const classId = searchParams.get("class") || "";
    const subjectId = searchParams.get("subject") || "";
    if (boardId) setBoard(boardId);
    if (classId) setClass(classId);
    if (subjectId) setSubject(subjectId);
    setTopic(editTopicId);
    setStep(2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Step 4 embeds an existing question-type page that renders its own
  // SubjectTopicPicker — we've already collected all 7 fields by then, so
  // hide that redundant picker and show a compact summary instead.
  useEffect(() => {
    setHidePicker(step === 4);
    return () => setHidePicker(false);
  }, [step, setHidePicker]);

  useEffect(() => {
    fetch(`${API}/api/boards`).then((r) => r.json()).then((d) => setBoards(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(`${API}/api/classes`).then((r) => r.json()).then((d) => setClasses(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(`${API}/api/questions/stages`, { headers: headers() })
      .then((r) => r.json())
      .then((d) => setStages(buildStageOptions(d?.stages || [])))
      .catch(() => setStages([1, 2, 3]));
    fetch(`${API}/api/chapter-assignments/mine`, { headers: headers() })
      .then((r) => r.json())
      .then((d) => setAssignments(Array.isArray(d?.items) ? d.items : []))
      .catch(() => setAssignments([]))
      .finally(() => setLoadingAssignments(false));
  }, []);

  // If the admin has assigned this teacher specific boards/classes/subjects,
  // only those show up here — otherwise every board/class/subject is open
  // (same "unassigned teachers stay open" rule the backend enforces).
  const hasAssignments = assignments.length > 0;

  const allowedBoards = useMemo(() => {
    if (!hasAssignments) return boards;
    const ids = new Set(assignments.map((a) => String(a.board?._id || a.board)));
    return boards.filter((b) => ids.has(String(b._id)));
  }, [boards, assignments, hasAssignments]);

  const allowedClasses = useMemo(() => {
    if (!hasAssignments) return classes;
    if (!scope.board) return [];
    const matching = assignments.filter((a) => String(a.board?._id || a.board) === String(scope.board));
    if (matching.some((a) => !a.class)) return classes;
    const ids = new Set(matching.map((a) => String(a.class?._id || a.class)).filter(Boolean));
    return classes.filter((c) => ids.has(String(c._id)));
  }, [classes, assignments, hasAssignments, scope.board]);

  const allowedSubjects = useMemo(() => {
    if (!hasAssignments) return subjects;
    if (!scope.board || !scope.class) return [];
    const matching = assignments.filter(
      (a) =>
        String(a.board?._id || a.board) === String(scope.board) &&
        (!a.class || String(a.class?._id || a.class) === String(scope.class))
    );
    if (matching.some((a) => !a.subject)) return subjects;
    const ids = new Set(matching.map((a) => String(a.subject?._id || a.subject)).filter(Boolean));
    return subjects.filter((s) => ids.has(String(s._id)));
  }, [subjects, assignments, hasAssignments, scope.board, scope.class]);

  const allowedTopics = useMemo(() => {
    if (!hasAssignments) return topics;
    if (!scope.board || !scope.class || !scope.subject) return [];
    const matching = assignments.filter(
      (a) =>
        String(a.board?._id || a.board) === String(scope.board) &&
        (!a.class || String(a.class?._id || a.class) === String(scope.class)) &&
        (!a.subject || String(a.subject?._id || a.subject) === String(scope.subject))
    );
    // A subject/class/board-wide grant (no specific topic) opens every
    // chapter in it; a chapter-level grant only allows that one chapter.
    if (matching.some((a) => !a.topic)) return topics;
    const ids = new Set(matching.map((a) => String(a.topic?._id || a.topic)).filter(Boolean));
    return topics.filter((t) => ids.has(String(t._id)));
  }, [topics, assignments, hasAssignments, scope.board, scope.class, scope.subject]);

  // A chapter-level grant only covers the one chapter it names — the
  // writer can't create additional chapters under that subject with it.
  const canCreateNewTopic = useMemo(() => {
    if (!hasAssignments) return true;
    if (!scope.board || !scope.class || !scope.subject) return false;
    const matching = assignments.filter(
      (a) =>
        String(a.board?._id || a.board) === String(scope.board) &&
        (!a.class || String(a.class?._id || a.class) === String(scope.class)) &&
        (!a.subject || String(a.subject?._id || a.subject) === String(scope.subject))
    );
    return matching.some((a) => !a.topic);
  }, [assignments, hasAssignments, scope.board, scope.class, scope.subject]);

  useEffect(() => {
    setSubjects([]);
    if (!scope.board || !scope.class) return;
    fetch(`${API}/api/subject?board=${scope.board}&class=${scope.class}`, { headers: headers() })
      .then((r) => r.json())
      .then((rows) => setSubjects(Array.isArray(rows) ? rows : []))
      .catch(() => setSubjects([]));
  }, [scope.board, scope.class]);

  useEffect(() => {
    setTopics([]);
    if (!scope.subject) return;
    fetch(`${API}/api/topic/${scope.subject}?board=${scope.board}&class=${scope.class}&manage=1`, {
      headers: headers(),
    })
      .then((r) => r.json())
      .then((rows) => setTopics(Array.isArray(rows) ? rows : []))
      .catch(() => setTopics([]));
  }, [scope.subject, scope.board, scope.class]);

  const selectedTopicDoc = useMemo(
    () => topics.find((t) => t._id === scope.topic) || null,
    [topics, scope.topic]
  );

  // A teacher's content submission lands in the draft fields and waits for
  // admin review — this tells us whether we should be showing that draft
  // (their last submission) instead of the last-approved live content.
  const hasPendingDraft = useMemo(() => {
    if (!selectedTopicDoc) return false;
    return Boolean(
      selectedTopicDoc.contentStatus === "pending" &&
        (getPlainText(selectedTopicDoc.draftTopicSummary) || getPlainText(selectedTopicDoc.draftLearningOutcome))
    );
  }, [selectedTopicDoc]);

  useEffect(() => {
    if (!selectedTopicDoc) {
      setTopicSummary("");
      setLearningOutcome("");
      return;
    }
    setTopicSummary(hasPendingDraft ? selectedTopicDoc.draftTopicSummary : selectedTopicDoc.topicSummary || "");
    setLearningOutcome(hasPendingDraft ? selectedTopicDoc.draftLearningOutcome : selectedTopicDoc.learningOutcome || "");
  }, [selectedTopicDoc, hasPendingDraft]);

  async function refreshTopics(selectId) {
    if (!scope.subject) return;
    try {
      const res = await fetch(
        `${API}/api/topic/${scope.subject}?board=${scope.board}&class=${scope.class}&manage=1`,
        { headers: headers() }
      );
      const rows = await res.json().catch(() => []);
      setTopics(Array.isArray(rows) ? rows : []);
      if (selectId) setTopic(selectId);
    } catch {
      // topics list just stays stale if this fails
    }
  }

  async function createTopic() {
    if (!newTopicName.trim()) {
      toast.warn("Enter a chapter name");
      return;
    }
    setCreatingTopic(true);
    try {
      const res = await fetch(`${API}/api/topic`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          name: newTopicName.trim(),
          subject: scope.subject,
          board: scope.board,
          class: scope.class,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to create chapter");

      toast.success("Chapter created");
      setNewTopicName("");
      await refreshTopics(data._id);
    } catch (err) {
      toast.error(err?.message || "Failed to create chapter");
    } finally {
      setCreatingTopic(false);
    }
  }

  async function saveContent() {
    if (!scope.topic) return;
    const summaryText = getPlainText(topicSummary);
    const outcomeText = getPlainText(learningOutcome);
    if (!summaryText || !outcomeText) {
      toast.warn("Please write both the chapter content and the learning outcome");
      return;
    }

    setSavingContent(true);
    try {
      const res = await fetch(`${API}/api/topic/${scope.topic}`, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({ topicSummary, learningOutcome }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to save content");

      toast.success(
        isAdmin
          ? "Content saved and published"
          : "Content submitted for admin review"
      );
      await refreshTopics(scope.topic);
    } catch (err) {
      toast.error(err?.message || "Failed to save content");
    } finally {
      setSavingContent(false);
    }
  }

  function addCustomStage() {
    const parsed = normalizeStageNumber(customStage);
    setStages(buildStageOptions([...stages, parsed], false));
    setStage(String(parsed));
    setCustomStage("");
    setShowCustomStage(false);
  }

  const stepValid = useMemo(() => {
    switch (step) {
      case 1:
        return Boolean(scope.board && scope.class && scope.subject && scope.topic);
      case 3:
        return Boolean(scope.stage && scope.difficulty && scope.questionType);
      default:
        return true;
    }
  }, [step, scope.board, scope.class, scope.subject, scope.topic, scope.stage, scope.difficulty, scope.questionType]);

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

  // Keep the chosen chapter (board/class/subject/topic), but clear
  // stage/difficulty/type so the teacher can add tryouts of another
  // question type for the same chapter.
  function addAnotherType() {
    setStage("");
    setDifficulty("");
    setQuestionType("");
    setStep(3);
  }


  const ActiveTypeComponent = QUESTION_TYPES.find((t) => t.label === scope.questionType)?.Component || null;
  const activeTypeMeta = QUESTION_TYPES.find((t) => t.label === scope.questionType) || null;
  const currentStepMeta = STEPS[step - 1];

  const breadcrumbChips = [
    { label: boards.find((b) => b._id === scope.board)?.name, tone: "bg-indigo-100 text-indigo-700" },
    { label: classes.find((c) => c._id === scope.class)?.name, tone: "bg-teal-100 text-teal-700" },
    { label: subjects.find((s) => s._id === scope.subject)?.name, tone: "bg-amber-100 text-amber-700" },
    { label: selectedTopicDoc?.name, tone: "bg-rose-100 text-rose-700" },
    { label: scope.stage && `Stage ${scope.stage}`, tone: "bg-violet-100 text-violet-700" },
    { label: scope.difficulty, tone: "bg-sky-100 text-sky-700" },
    { label: activeTypeMeta?.short, tone: "bg-emerald-100 text-emerald-700" },
  ].filter((c) => c.label);

  return (
    <div className="mx-auto max-w-6xl space-y-6 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(191,219,254,0.38),transparent_24%),linear-gradient(to_bottom,#eff6ff,#f8fbff)] p-4 sm:p-6">
      {/* Step 4 renders an existing question-type page, which mounts its own
          ToastContainer — avoid a second one stacking duplicate toasts. */}
      {step < 4 && <ToastContainer />}

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-[linear-gradient(135deg,#ffffff,#eff6ff)] p-6 shadow-sm sm:p-7">
        <div className="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-14 left-1/3 size-36 rounded-full bg-blue-100/80 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#1877f2,#4f9ef8)] text-white shadow-lg shadow-blue-200/70">
            <Sparkles className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Add Content &amp; Questions</h1>
            <p className="mt-1 max-w-lg text-sm text-muted-foreground">
              Pick a chapter, write its content, then add tryout questions of any type — all in one guided flow.
            </p>
          </div>
        </div>
      </div>

      {/* Connected stepper */}
      <div className="flex items-start">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          const isActive = s.id === step;
          const isDone = s.id < step;
          return (
            <div key={s.id} className="flex items-start" style={{ flex: idx === STEPS.length - 1 ? "0 0 auto" : "1 1 0%" }}>
              <div className="flex shrink-0 flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300",
                    isDone && "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-200/60",
                    isActive && !isDone && "scale-110 border-blue-600 bg-blue-50 text-blue-700 ring-4 ring-blue-100",
                    !isActive && !isDone && "border-border bg-background text-muted-foreground"
                  )}
                >
                  {isDone ? <Check className="size-4.5" /> : <Icon className="size-4.5" />}
                </div>
                <span className={cn("whitespace-nowrap text-[11px] font-semibold", isActive ? "text-foreground" : "text-muted-foreground")}>
                  {s.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className="relative mt-5 h-0.5 w-full flex-1 overflow-hidden rounded-full bg-blue-100">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#1877f2,#4f9ef8)] transition-all duration-500 ease-out"
                    style={{ width: s.id < step ? "100%" : "0%" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {step < 4 && (
        <Card className="overflow-hidden rounded-3xl border-blue-100 shadow-lg shadow-blue-100/40">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", currentStepMeta.bubble)}>
                <currentStepMeta.icon className="size-5" />
              </div>
              <div>
                <CardTitle>{currentStepMeta.label}</CardTitle>
                <CardDescription>
                  {step === 1 && "Select the board, class, subject, and chapter you're allocated to."}
                  {step === 2 && "Write the chapter content and its learning outcome."}
                  {step === 3 && "Choose the stage, difficulty, and question type for your tryouts."}
                </CardDescription>
              </div>
            </div>
            {step > 1 && selectedTopicDoc && (
              <Badge variant="secondary" className="mt-1 w-fit gap-1.5">
                <BookOpen className="size-3.5" />
                {selectedTopicDoc.name}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-5">
            {step === 1 && (
              <div className="space-y-4">
                {hasAssignments && (
                  <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                    <GraduationCap className="size-4 shrink-0" />
                    Showing only the board, class, subject, and chapters your admin has assigned to you.
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <GraduationCap className="size-3.5" /> Board
                    </Label>
                    <Select
                      value={scope.board}
                      onValueChange={(v) => { setBoard(v); setClass(""); setSubject(""); setTopic(""); }}
                      disabled={loadingAssignments}
                    >
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select board" /></SelectTrigger>
                      <SelectContent>
                        {allowedBoards.map((b) => (
                          <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <Layers className="size-3.5" /> Class
                    </Label>
                    <Select value={scope.class} onValueChange={(v) => { setClass(v); setSubject(""); setTopic(""); }} disabled={!scope.board}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select class" /></SelectTrigger>
                      <SelectContent>
                        {allowedClasses.map((c) => (
                          <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <BookOpen className="size-3.5" /> Subject
                    </Label>
                    <Select value={scope.subject} onValueChange={(v) => { setSubject(v); setTopic(""); }} disabled={!scope.class}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select subject" /></SelectTrigger>
                      <SelectContent>
                        {allowedSubjects.map((s) => (
                          <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <FileText className="size-3.5" /> Chapter
                    </Label>
                    <Select value={scope.topic} onValueChange={setTopic} disabled={!scope.subject}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select chapter" /></SelectTrigger>
                      <SelectContent>
                        {allowedTopics.map((t) => (
                          <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {breadcrumbChips.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {breadcrumbChips.slice(0, 4).map((c, i) => (
                      <span key={i} className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold", c.tone)}>
                        <Check className="size-3" />
                        {c.label}
                      </span>
                    ))}
                  </div>
                )}

                {scope.subject && canCreateNewTopic && (
                  <div className="flex items-end gap-2 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50 p-3.5">
                    <div className="flex-1 space-y-1.5">
                      <Label className="flex items-center gap-1.5">
                        <Plus className="size-3.5 text-blue-600" /> Don't see your chapter? Create it
                      </Label>
                      <Input
                        value={newTopicName}
                        onChange={(e) => setNewTopicName(e.target.value)}
                        placeholder="New chapter name"
                      />
                    </div>
                    <Button type="button" onClick={createTopic} disabled={creatingTopic}>
                      <Plus className="size-4" />
                      {creatingTopic ? "Creating..." : "Create"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                {!scope.topic ? (
                  <p className="text-sm text-muted-foreground">Go back and select a chapter first.</p>
                ) : (
                  <>
              {hasPendingDraft && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                  <Clock3 className="size-4 shrink-0" />
                  You're viewing your submitted draft — it's pending admin review. Students still see the previously approved version until it's approved.
                </div>
              )}
              {!hasPendingDraft && selectedTopicDoc?.contentStatus === "approved" && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="size-4 shrink-0" />
                  This content is approved and live for students. Saving changes will submit a new version for review.
                </div>
              )}
              {!hasPendingDraft && selectedTopicDoc?.contentStatus === "rejected" && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>
                    Your last submission was rejected{selectedTopicDoc.contentRejectionReason ? `: ${selectedTopicDoc.contentRejectionReason}` : "."} Please revise and save again.
                  </span>
                </div>
              )}
              <div className="space-y-1.5 rounded-2xl border bg-muted/20 p-3.5">
                <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <FileText className="size-3.5" /> Chapter Content
                </Label>
                <div className="overflow-hidden rounded-xl border border-blue-100 bg-white">
                  <JoditEditor value={topicSummary} config={editorConfig} onBlur={(v) => setTopicSummary(v || "")} />
                </div>
              </div>
                    <div className="space-y-1.5 rounded-2xl border border-blue-100 bg-blue-50/50 p-3.5">
                      <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <Rocket className="size-3.5" /> Learning Outcome
                      </Label>
                      <div className="overflow-hidden rounded-xl border border-blue-100 bg-white">
                        <JoditEditor value={learningOutcome} config={editorConfig} onBlur={(v) => setLearningOutcome(v || "")} />
                      </div>
                    </div>
                    <Button type="button" onClick={saveContent} disabled={savingContent} className="gap-1.5">
                      <Check className="size-4" />
                      {savingContent ? "Saving..." : "Save Content"}
                    </Button>
                  </>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <Layers className="size-3.5" /> Stage
                    </Label>
                    <Select value={scope.stage} onValueChange={(v) => { setStage(v); setDifficulty(""); setQuestionType(""); }}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select stage" /></SelectTrigger>
                      <SelectContent>
                        {stages.map((s) => (
                          <SelectItem key={s} value={String(s)}>{formatStageLabel(s)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {showCustomStage ? (
                      <div className="flex gap-2 pt-1">
                        <Input
                          type="number"
                          min="1"
                          autoFocus
                          value={customStage}
                          onChange={(e) => setCustomStage(e.target.value)}
                          placeholder="Add stage e.g. 4"
                        />
                        <Button type="button" variant="outline" onClick={addCustomStage} disabled={!customStage}>
                          Add
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => { setShowCustomStage(false); setCustomStage(""); }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowCustomStage(true)}
                        className="flex items-center gap-1 pt-1 text-xs font-semibold text-primary hover:underline"
                      >
                        <Plus className="size-3.5" /> More
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <Sliders className="size-3.5" /> Difficulty
                    </Label>
                    <div className={cn("grid grid-cols-3 gap-2", !scope.stage && "pointer-events-none opacity-40")}>
                      {DIFFICULTY_META.map((d) => {
                        const isSelected = scope.difficulty === d.label;
                        return (
                          <button
                            key={d.label}
                            type="button"
                            onClick={() => { setDifficulty(d.label); setQuestionType(""); }}
                            className={cn(
                              "flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-2.5 text-xs font-semibold transition-all",
                              isSelected ? cn(d.tint, "ring-2 ring-offset-1", d.ring) : "border-border bg-background text-muted-foreground hover:border-blue-300"
                            )}
                          >
                            <span className={cn("size-2.5 rounded-full", d.swatch)} />
                            {d.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <ListChecks className="size-3.5" /> Question Type
                  </Label>
                  <div className={cn("grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5", !scope.difficulty && "pointer-events-none opacity-40")}>
                    {QUESTION_TYPES.map((t) => {
                      const TypeIconEl = t.icon;
                      const isSelected = scope.questionType === t.label;
                      return (
                        <button
                          key={t.label}
                          type="button"
                          onClick={() => setQuestionType(t.label)}
                          className={cn(
                            "flex flex-col items-center gap-2 rounded-2xl border-2 px-2 py-3.5 text-center text-[11px] font-semibold transition-all",
                            isSelected
                              ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm ring-2 ring-blue-100"
                              : "border-border bg-background text-muted-foreground hover:border-blue-300 hover:bg-blue-50"
                          )}
                        >
                          <span className={cn("flex size-9 items-center justify-center rounded-xl", isSelected ? "bg-[linear-gradient(135deg,#1877f2,#4f9ef8)] text-white" : "bg-muted text-foreground")}>
                            <TypeIconEl className="size-4.5" />
                          </span>
                          {t.short}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step < 4 && (
        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" size="lg" className="rounded-full border-blue-200 text-blue-700 hover:bg-blue-50" onClick={goBack} disabled={step === 1}>
            <ChevronLeft className="size-4" />
            Back
          </Button>
          <Button type="button" size="lg" className="rounded-full bg-[linear-gradient(135deg,#1877f2,#4f9ef8)] text-white shadow-md shadow-blue-200/50" onClick={goNext}>
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button type="button" variant="outline" size="lg" className="rounded-full border-blue-200 text-blue-700 hover:bg-blue-50" onClick={goBack}>
              <ChevronLeft className="size-4" />
              Back
            </Button>
            {ActiveTypeComponent && (
              <Button type="button" size="lg" className="rounded-full bg-[linear-gradient(135deg,#1877f2,#4f9ef8)] text-white shadow-md shadow-blue-200/50" onClick={addAnotherType}>
                <Plus className="size-4" />
                Add Another Question Type
              </Button>
            )}
          </div>
          {ActiveTypeComponent && breadcrumbChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-blue-100 bg-blue-50/70 px-3.5 py-3">
              {breadcrumbChips.map((c, i) => (
                <span key={i} className="inline-flex items-center gap-1">
                  <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold", c.tone)}>
                    {c.label}
                  </span>
                  {i < breadcrumbChips.length - 1 && <ChevronRight className="size-3 text-muted-foreground" />}
                </span>
              ))}
            </div>
          )}
          {ActiveTypeComponent ? (
            <div className="-mx-6">
              <ActiveTypeComponent />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Go back and select a question type.</p>
          )}
        </div>
      )}
    </div>
  );
}
