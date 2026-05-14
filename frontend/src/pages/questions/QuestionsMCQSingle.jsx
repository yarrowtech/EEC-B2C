import React, { useState } from "react";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { postQuestion } from "../../lib/api";
import { buildQuestionStagePayload } from "../../lib/stage";
import { toast, ToastContainer } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  Tag,
  CheckCircle2,
  ChevronRight,
  RotateCcw,
  Save,
  Lightbulb,
  AlertCircle,
  BookOpen,
} from "lucide-react";

const OPTION_LABELS = ["A", "B", "C", "D"];
const OPTION_COLORS = {
  A: { ring: "#F4736E", bg: "#fff5f4", badge: "bg-[#F4736E]" },
  B: { ring: "#6C63FF", bg: "#f5f4ff", badge: "bg-[#6C63FF]" },
  C: { ring: "#4ECDC4", bg: "#f0fdfb", badge: "bg-[#4ECDC4]" },
  D: { ring: "#e7c555", bg: "#fefce8", badge: "bg-[#e7c555] !text-slate-800" },
};
const DIFFICULTY_CONFIG = {
  easy:     { label: "Easy",     color: "#22c55e", bg: "rgba(34,197,94,0.10)",  ring: "#22c55e" },
  moderate: { label: "Moderate", color: "#f59e0b", bg: "rgba(245,158,11,0.10)", ring: "#f59e0b" },
  hard:     { label: "Hard",     color: "#ef4444", bg: "rgba(239,68,68,0.10)",  ring: "#ef4444" },
};
const Motion = motion;

export default function QuestionsMCQSingle() {
  const { scope } = useQuestionScope();
  const [form, setForm] = useState({
    difficulty: "easy",
    question: "",
    options: ["", "", "", ""],
    correct: "A",
    hint: "",
    explanation: "",
    tags: "",
  });
  const [tagInput, setTagInput] = useState("");
  const [tagList, setTagList] = useState([]);
  const [saved, setSaved] = useState(false);

  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  const updateOpt = (i, v) =>
    setForm((s) => { const next = [...s.options]; next[i] = v; return { ...s, options: next }; });

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tagList.includes(t)) {
      const next = [...tagList, t];
      setTagList(next);
      update("tags", next.join(","));
    }
    setTagInput("");
  };
  const removeTag = (t) => {
    const next = tagList.filter((x) => x !== t);
    setTagList(next);
    update("tags", next.join(","));
  };

  const handleReset = () => {
    setForm({
      difficulty: "easy",
      question: "",
      options: ["", "", "", ""],
      correct: "A",
      hint: "",
      explanation: "",
      tags: "",
    });
    setTagList([]);
    setTagInput("");
    setSaved(false);
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!scope.board || !scope.class || !scope.subject || !scope.topic ||
        !scope.stage || !scope.difficulty || !scope.questionType) {
      return toast.warn("Please complete all fields in the parameter selector above");
    }
    if (form.options.some((opt) => !opt.trim())) {
      return toast.warn("Please fill all options");
    }

    try {
      await postQuestion("mcq-single", {
        board: scope.board,
        class: scope.class,
        subject: scope.subject,
        topic: scope.topic,
        ...buildQuestionStagePayload(scope.stage),
        difficulty: scope.difficulty.toLowerCase(),
        questionType: scope.questionType,
        tags: form.tags,
        question: form.question,
        options: form.options,
        correct: form.correct,
        hint: form.hint,
        explanation: form.explanation,
      });
      toast.success("Question saved");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      toast.error(err.message || "Failed to save question");
    }
  };

  const wordCount = form.question.trim().split(/\s+/).filter(Boolean).length;
  const allOptionsFilled = form.options.every((o) => o.trim().length > 0);

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      <ToastContainer position="bottom-right" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ── Page header ── */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Questions</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#F4736E] font-semibold">MCQ — Single Correct</span>
          </div>
          <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B1F3B]"
                style={{ fontFamily: "'Balsamiq Sans', sans-serif" }}>
                MCQ — Single Correct
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">Create a multiple-choice question with one correct answer</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F4736E]/10 border border-[#F4736E]/25">
              <div className="w-2 h-2 rounded-full bg-[#F4736E] animate-pulse" />
              <span className="text-xs font-bold text-[#F4736E]">Single Correct</span>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-5">

          {/* ── Subject / Topic picker ── */}
          <SubjectTopicPicker />

          {/* ── Difficulty selector ── */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6">
            <SectionLabel icon={<AlertCircle className="w-4 h-4 text-orange-500" />} title="Difficulty Level" />
            <div className="flex flex-wrap gap-3">
              {Object.entries(DIFFICULTY_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => update("difficulty", key)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all border-2"
                  style={{
                    borderColor: form.difficulty === key ? cfg.color : "transparent",
                    background: form.difficulty === key ? cfg.bg : "#f8fafc",
                    color: form.difficulty === key ? cfg.color : "#64748b",
                    boxShadow: form.difficulty === key ? `0 0 0 3px ${cfg.color}22` : "none",
                  }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Question input ── */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6">
            <SectionLabel icon={<HelpCircle className="w-4 h-4 text-[#6C63FF]" />} title="Question" required />
            <div className="relative">
              <textarea
                value={form.question}
                onChange={(e) => update("question", e.target.value)}
                rows={5}
                required
                placeholder="Type your question here… Be clear and specific."
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 hover:border-[#6C63FF]/40 focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF]/15 outline-none bg-slate-50 focus:bg-white text-sm text-slate-800 leading-relaxed resize-none transition-all pr-20"
              />
              <span className="absolute bottom-3 right-3 text-xs font-semibold text-slate-400 pointer-events-none">
                {wordCount} {wordCount === 1 ? "word" : "words"}
              </span>
            </div>
          </div>

          {/* ── Answer options ── */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <SectionLabel icon={<CheckCircle2 className="w-4 h-4 text-[#4ECDC4]" />} title="Answer Options" required />
              <span className="text-xs text-slate-400 font-medium">Click an option to mark it correct</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {OPTION_LABELS.map((L, i) => {
                const cfg = OPTION_COLORS[L];
                const isCorrect = form.correct === L;
                return (
                  <Motion.div
                    key={L}
                    layout
                    className="relative flex items-center gap-3 rounded-xl border-2 px-4 py-3 cursor-pointer transition-all"
                    style={{
                      borderColor: isCorrect ? cfg.ring : "#e2e8f0",
                      background: isCorrect ? cfg.bg : "#f8fafc",
                      boxShadow: isCorrect ? `0 0 0 3px ${cfg.ring}20` : "none",
                    }}
                    onClick={() => update("correct", L)}
                  >
                    {/* Letter badge */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-black shrink-0 ${cfg.badge}`}
                    >
                      {L}
                    </div>

                    {/* Input */}
                    <input
                      type="text"
                      value={form.options[i]}
                      onChange={(e) => { e.stopPropagation(); updateOpt(i, e.target.value); }}
                      onClick={(e) => e.stopPropagation()}
                      placeholder={`Option ${L}`}
                      className="flex-1 bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400 font-medium"
                    />

                    {/* Correct indicator */}
                    <AnimatePresence>
                      {isCorrect && (
                        <Motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20 }}
                          className="shrink-0"
                        >
                          <CheckCircle2 className="w-5 h-5" style={{ color: cfg.ring }} />
                        </Motion.div>
                      )}
                    </AnimatePresence>
                  </Motion.div>
                );
              })}
            </div>

            {/* Correct answer summary */}
            <div className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Correct answer:</span>
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-white text-xs font-black"
                style={{ background: OPTION_COLORS[form.correct].ring }}
              >
                Option {form.correct}
                {form.options[OPTION_LABELS.indexOf(form.correct)] && (
                  <span className="font-medium opacity-90">
                    — {form.options[OPTION_LABELS.indexOf(form.correct)].slice(0, 40)}
                    {form.options[OPTION_LABELS.indexOf(form.correct)].length > 40 ? "…" : ""}
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* ── Tags ── */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6">
            <SectionLabel icon={<Tag className="w-4 h-4 text-[#FF9F1C]" />} title="Tags" />
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="e.g. arithmetic, fractions…  Press Enter to add"
                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-slate-200 hover:border-[#FF9F1C]/40 focus:border-[#FF9F1C] focus:ring-2 focus:ring-[#FF9F1C]/15 outline-none bg-slate-50 focus:bg-white text-sm transition-all"
              />
              <button type="button" onClick={addTag}
                className="px-4 py-2.5 rounded-xl bg-[#FF9F1C] hover:bg-[#e8920a] text-white text-sm font-bold transition-colors shrink-0">
                Add
              </button>
            </div>
            {tagList.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tagList.map((t) => (
                  <span key={t}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF9F1C]/10 border border-[#FF9F1C]/30 text-xs font-bold text-[#e8920a]">
                    {t}
                    <button type="button" onClick={() => removeTag(t)}
                      className="hover:text-red-500 transition-colors leading-none text-base">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Explanation ── */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6">
            <SectionLabel icon={<Lightbulb className="w-4 h-4 text-amber-500" />} title="Hint" badge="Optional" />
            <textarea
              value={form.hint}
              onChange={(e) => update("hint", e.target.value)}
              rows={3}
              placeholder="Add a hint that will be shown in exam hint section"
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 hover:border-amber-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none bg-slate-50 focus:bg-white text-sm text-slate-800 leading-relaxed resize-none transition-all"
            />
          </div>

          {/* ── Explanation ── */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6">
            <SectionLabel icon={<Lightbulb className="w-4 h-4 text-[#e7c555]" />} title="Explanation" badge="Optional" />
            <textarea
              value={form.explanation}
              onChange={(e) => update("explanation", e.target.value)}
              rows={4}
              placeholder="Explain why the correct answer is right. This helps students learn…"
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 hover:border-[#e7c555]/40 focus:border-[#e7c555] focus:ring-2 focus:ring-[#e7c555]/15 outline-none bg-slate-50 focus:bg-white text-sm text-slate-800 leading-relaxed resize-none transition-all"
            />
          </div>

          {/* ── Submit bar ── */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm px-5 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

              {/* Status indicators */}
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                <StatusDot ok={!!form.question.trim()} label="Question" />
                <StatusDot ok={allOptionsFilled} label="All options" />
                <StatusDot ok={!!form.correct} label="Correct answer" />
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button type="button" onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-semibold transition-all">
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>

                <Motion.button
                  type="submit"
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold shadow-sm transition-all"
                  style={{
                    background: saved
                      ? "linear-gradient(135deg, #22c55e, #16a34a)"
                      : "linear-gradient(135deg, #F4736E, #e05e5a)",
                  }}
                >
                  {saved ? (
                    <><CheckCircle2 className="w-4 h-4" /> Saved!</>
                  ) : (
                    <><Save className="w-4 h-4" /> Save Question</>
                  )}
                </Motion.button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Small helpers ── */

function SectionLabel({ icon, title, required, badge }) {
  return (
    <div className="flex items-center gap-2 mb-3.5">
      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <span className="text-sm font-bold text-slate-700">{title}</span>
      {required && <span className="text-red-400 text-sm">*</span>}
      {badge && (
        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wide">
          {badge}
        </span>
      )}
    </div>
  );
}

function StatusDot({ ok, label }) {
  return (
    <span className={`flex items-center gap-1.5 ${ok ? "text-green-600" : "text-slate-400"}`}>
      <span className={`w-2 h-2 rounded-full ${ok ? "bg-green-500" : "bg-slate-300"}`} />
      {label}
    </span>
  );
}
