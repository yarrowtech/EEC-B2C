import { useEffect, useMemo, useState } from "react";
import JoditEditor from "jodit-react";
import "jodit/es2021/jodit.min.css";
import { toast, ToastContainer } from "react-toastify";
import { Check, ChevronLeft, ChevronRight, BookOpen, FileText, Sliders, ListChecks, Plus } from "lucide-react";

import { useQuestionScope } from "../../context/QuestionScopeContext";
import { buildStageOptions, formatStageLabel, normalizeStageNumber } from "../../lib/stage";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
const DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard"];

const QUESTION_TYPES = [
  { label: "MCQ — Single Correct", Component: QuestionsMCQUpload },
  { label: "MCQ — Multiple Correct", Component: QuestionsMCQMulti },
  { label: "True / False", Component: QuestionsTrueFalse },
  { label: "Choice Matrix", Component: QuestionsChoiceMatrix },
  { label: "Cloze — Drag & Drop", Component: QuestionsClozeDrag },
  { label: "Cloze — Drop-Down", Component: QuestionsClozeSelect },
  { label: "Cloze — Free Text", Component: QuestionsClozeText },
  { label: "Match List", Component: QuestionsMatchList },
  { label: "Essay — Rich Text", Component: QuestionsEssayRich },
  { label: "Essay — Plain Text", Component: QuestionsEssayPlain },
];

const STEPS = [
  { id: 1, label: "Chapter", icon: BookOpen },
  { id: 2, label: "Content", icon: FileText },
  { id: 3, label: "Parameters", icon: Sliders },
  { id: 4, label: "Tryouts", icon: ListChecks },
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

  useEffect(() => {
    if (!selectedTopicDoc) {
      setTopicSummary("");
      setLearningOutcome("");
      return;
    }
    const hasPendingDraft =
      selectedTopicDoc.contentStatus === "pending" &&
      (getPlainText(selectedTopicDoc.draftTopicSummary) || getPlainText(selectedTopicDoc.draftLearningOutcome));
    setTopicSummary(hasPendingDraft ? selectedTopicDoc.draftTopicSummary : selectedTopicDoc.topicSummary || "");
    setLearningOutcome(hasPendingDraft ? selectedTopicDoc.draftLearningOutcome : selectedTopicDoc.learningOutcome || "");
  }, [selectedTopicDoc]);

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

      toast.success("Content saved");
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

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Step 4 renders an existing question-type page, which mounts its own
          ToastContainer — avoid a second one stacking duplicate toasts. */}
      {step < 4 && <ToastContainer />}

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add Content &amp; Questions</h1>
        <p className="text-sm text-muted-foreground">
          Pick a chapter, write its content, then add tryout questions of any type — all in one place.
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
                <span className={cn("text-[11px] font-medium", isActive ? "text-foreground" : "text-muted-foreground")}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {step < 4 && (
        <Card>
          <CardHeader>
            <CardTitle>{STEPS[step - 1].label}</CardTitle>
            <CardDescription>
              {step === 1 && "Select the board, class, subject, and chapter you're allocated to."}
              {step === 2 && "Write the chapter content and its learning outcome."}
              {step === 3 && "Choose the stage, difficulty, and question type for your tryouts."}
            </CardDescription>
            {step > 1 && selectedTopicDoc && (
              <p className="text-xs font-medium text-primary">Chapter: {selectedTopicDoc.name}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-5">
            {step === 1 && (
              <div className="space-y-4">
                {hasAssignments && (
                  <p className="text-xs text-muted-foreground">
                    Showing only the board, class, subject, and chapters your admin has assigned to you.
                  </p>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Board</Label>
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
                    <Label>Class</Label>
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
                    <Label>Subject</Label>
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
                    <Label>Chapter</Label>
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

                {scope.subject && canCreateNewTopic && (
                  <div className="flex items-end gap-2 rounded-lg border border-dashed p-3">
                    <div className="flex-1 space-y-1.5">
                      <Label>Don't see your chapter? Create it</Label>
                      <Input
                        value={newTopicName}
                        onChange={(e) => setNewTopicName(e.target.value)}
                        placeholder="New chapter name"
                      />
                    </div>
                    <Button type="button" variant="outline" onClick={createTopic} disabled={creatingTopic}>
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
                    <div className="space-y-1.5">
                      <Label>Chapter Content</Label>
                      <JoditEditor value={topicSummary} config={editorConfig} onBlur={(v) => setTopicSummary(v || "")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Learning Outcome</Label>
                      <JoditEditor value={learningOutcome} config={editorConfig} onBlur={(v) => setLearningOutcome(v || "")} />
                    </div>
                    <Button type="button" onClick={saveContent} disabled={savingContent}>
                      {savingContent ? "Saving..." : "Save Content"}
                    </Button>
                  </>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Stage</Label>
                  <Select value={scope.stage} onValueChange={(v) => { setStage(v); setDifficulty(""); setQuestionType(""); }}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select stage" /></SelectTrigger>
                    <SelectContent>
                      {stages.map((s) => (
                        <SelectItem key={s} value={String(s)}>{formatStageLabel(s)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2 pt-1">
                    <Input
                      type="number"
                      min="1"
                      value={customStage}
                      onChange={(e) => setCustomStage(e.target.value)}
                      placeholder="Add stage e.g. 4"
                    />
                    <Button type="button" variant="outline" onClick={addCustomStage} disabled={!customStage}>
                      Add
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Difficulty</Label>
                  <Select value={scope.difficulty} onValueChange={(v) => { setDifficulty(v); setQuestionType(""); }} disabled={!scope.stage}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select difficulty" /></SelectTrigger>
                    <SelectContent>
                      {DIFFICULTY_LEVELS.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Question Type</Label>
                  <Select value={scope.questionType} onValueChange={setQuestionType} disabled={!scope.difficulty}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {QUESTION_TYPES.map((t) => (
                        <SelectItem key={t.label} value={t.label}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step < 4 && (
        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" onClick={goBack} disabled={step === 1}>
            <ChevronLeft className="size-4" />
            Back
          </Button>
          <Button type="button" onClick={goNext}>
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button type="button" variant="outline" onClick={goBack}>
              <ChevronLeft className="size-4" />
              Back
            </Button>
            {ActiveTypeComponent && (
              <Button type="button" onClick={addAnotherType}>
                <Plus className="size-4" />
                Add Another Question Type
              </Button>
            )}
          </div>
          {ActiveTypeComponent && (
            <p className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              {[
                boards.find((b) => b._id === scope.board)?.name,
                classes.find((c) => c._id === scope.class)?.name,
                subjects.find((s) => s._id === scope.subject)?.name,
                selectedTopicDoc?.name,
                scope.stage && `Stage ${scope.stage}`,
                scope.difficulty,
                scope.questionType,
              ]
                .filter(Boolean)
                .join(" → ")}
            </p>
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
