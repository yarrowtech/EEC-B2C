import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getJSON } from "../../lib/api";
import { ToastContainer, useToast } from "../../components/Toast";

function MIcon({ name, className = "", fill = false, style }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={fill ? { fontVariationSettings: "'FILL' 1", ...style } : style}
    >
      {name}
    </span>
  );
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

function plainText(html) {
  return String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractListItems(html) {
  const matches = String(html || "").match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
  return matches
    .map((m) => plainText(m.replace(/^<li[^>]*>/i, "").replace(/<\/li>$/i, "")))
    .filter(Boolean);
}

function extractOutcomeItems(value) {
  const raw = String(value || "").trim();
  if (!raw) return [];

  const listItems = extractListItems(raw);
  if (listItems.length > 0) return listItems;

  const plain = plainText(raw)
    .split(/\n+/)
    .map((line) => line.replace(/^[-•–—]\s*/, "").trim())
    .filter(Boolean);

  if (plain.length > 0) return plain;

  return [];
}

const TOPIC_THEMES = [
  { test: /solar|space|planet|astro|universe/, icon: "public", color: "#D97706", bg: "#FEF3D7" },
  { test: /animal|wildlife|kingdom/, icon: "pets", color: "#0D9488", bg: "#D9F4F2" },
  { test: /plant|botany|tree|flower/, icon: "eco", color: "#DB2777", bg: "#FCE7EB" },
  { test: /weather|climate|cloud/, icon: "cloud", color: "#D97706", bg: "#FEF3D7" },
  { test: /cell|biology|organism/, icon: "biotech", color: "#2563EB", bg: "#E3EEFD" },
  { test: /human|body|anatomy/, icon: "favorite", color: "#DC2626", bg: "#FDE3E3" },
  { test: /math|number|algebra|geometry/, icon: "calculate", color: "#D97706", bg: "#FEF3D7" },
  { test: /history|civilization|war/, icon: "history_edu", color: "#A1742C", bg: "#F3E6D2" },
];

function getTopicTheme(name = "") {
  const n = String(name || "").toLowerCase();
  const match = TOPIC_THEMES.find((t) => t.test.test(n));
  if (match) return match;
  const fallbackPalette = [
    { icon: "auto_stories", color: "#6C63FF", bg: "#E8E6FE" },
    { icon: "lightbulb", color: "#D97706", bg: "#FEF3D7" },
    { icon: "explore", color: "#0D9488", bg: "#D9F4F2" },
  ];
  const idx = Math.abs(n.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % fallbackPalette.length;
  return fallbackPalette[idx];
}

export default function TopicExplorerPage() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState(null);
  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState(null);

  const user = getStoredUser();
  const gradeLabel = String(user?.className || user?.class || "Class").trim() || "Class";

  async function loadTopics() {
    setLoading(true);
    try {
      const userBoard = user.boardId || user.board || user.boardName || "";
      const userClass = user.classId || user.class || user.className || "";

      if (!userBoard || !userClass) {
        toast.error("Please update your profile with board and class information.");
        navigate("/dashboard/study");
        return;
      }

      const subjects = await getJSON(`/api/subject?board=${userBoard}&class=${userClass}`);
      const foundSubject = (subjects || []).find((s) => String(s._id) === String(subjectId));
      if (!foundSubject) {
        toast.error("Subject not found for your class and board.");
        navigate("/dashboard/study");
        return;
      }
      setSubject(foundSubject);

      const topicRows = await getJSON(
        `/api/topic/${subjectId}?board=${userBoard}&class=${userClass}`
      );
      const normalized = (Array.isArray(topicRows) ? topicRows : []).filter((t) => t?._id && t?.name);
      setTopics(normalized);
      setSelectedTopicId(normalized[0]?._id || null);
    } catch (err) {
      console.error("Failed to load topics", err);
      toast.error("Failed to load topics for this subject.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTopics();
  }, [subjectId]);

  const selectedTopic = useMemo(
    () => topics.find((t) => String(t._id) === String(selectedTopicId)) || null,
    [topics, selectedTopicId]
  );

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-3xl text-[#7a6a23]">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f7f6]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />

      {/* Header */}
      <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate("/dashboard/study")}
            className="p-1.5 rounded-full bg-[#e7c555]/20 hover:bg-[#e7c555]/30 transition-colors flex-shrink-0"
          >
            <MIcon name="arrow_back" className="text-[18px]" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base font-black text-slate-900 flex items-center gap-1 truncate">
              <MIcon name="explore" className="text-[18px] text-[#7a6a23]" />
              Topic Explorer
            </h1>
            <p className="text-[11px] text-slate-500 truncate">Exploring: {subject?.name || "Subject"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={loadTopics}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
          >
            <MIcon name="sync" className="text-[16px]" />
          </button>
          <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-[#e7c555]/40 bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-[10px] font-bold">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              String(user?.name || "U").charAt(0).toUpperCase()
            )}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-5 py-5 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4">
        {/* Left: Available Topics */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2">Available Topics</p>
          <div className="flex flex-col gap-1.5">
            {topics.map((t) => {
              const theme = getTopicTheme(t.name);
              const lessonCount = Math.max(4, extractOutcomeItems(t.learningOutcome).length || 4);
              const isActive = String(t._id) === String(selectedTopicId);
              return (
                <button
                  key={t._id}
                  onClick={() => setSelectedTopicId(t._id)}
                  className={`flex items-center gap-2.5 rounded-2xl p-2.5 text-left transition-all ${
                    isActive ? "bg-[#3f3a23] shadow-md" : "bg-white border border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: isActive ? "rgba(255,255,255,0.15)" : theme.bg, color: isActive ? "#e7c555" : theme.color }}
                  >
                    <MIcon name={theme.icon} className="text-[18px]" fill />
                  </span>
                  <div className="min-w-0">
                    <p className={`text-[13px] font-bold truncate ${isActive ? "text-[#e7c555]" : "text-slate-900"}`}>
                      {t.name}
                    </p>
                    <p className={`text-[10px] truncate ${isActive ? "text-[#e7c555]/70" : "text-slate-400"}`}>
                      {lessonCount} Lessons • Grade {gradeLabel}
                    </p>
                  </div>
                  {isActive && <MIcon name="chevron_right" className="text-[#e7c555] ml-auto shrink-0 text-[16px]" />}
                </button>
              );
            })}

            {topics.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                No topics available yet.
              </div>
            )}
          </div>
        </div>

        {/* Right: Selected Topic Detail */}
        <div>
          {!selectedTopic ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
              Pick a topic from the left to get started.
            </div>
          ) : (
            (() => {
              const theme = getTopicTheme(selectedTopic.name);
              const outcomes = extractOutcomeItems(selectedTopic.learningOutcome);
              const lessonCount = Math.max(4, outcomes.length || 4);
              const estMinutes = lessonCount * 5;
              const summaryText =
                plainText(selectedTopic.topicSummary) || "Summary is not available yet for this topic.";

              return (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  {/* Banner */}
                  <div
                    className="relative h-36 flex items-end p-4 overflow-hidden"
                    style={
                      selectedTopic.topicImage
                        ? { backgroundImage: `url(${selectedTopic.topicImage})`, backgroundSize: "cover", backgroundPosition: "center" }
                        : { background: `linear-gradient(135deg, ${theme.color}, #1f1c10)` }
                    }
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    {!selectedTopic.topicImage && (
                      <MIcon
                        name={theme.icon}
                        className="absolute -bottom-6 -right-6 text-white/10 pointer-events-none select-none"
                        style={{ fontSize: "130px" }}
                        fill
                      />
                    )}
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-[#e7c555] text-[#211d11] text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full">
                      <MIcon name="bolt" className="text-[11px]" />
                      Level Adventure
                    </span>
                    <p className="relative z-10 text-white font-black text-xl leading-tight">{selectedTopic.name}</p>
                  </div>

                  <div className="p-4 md:p-5">
                    <p className="text-[11px] font-bold text-slate-400 mb-4">
                      {lessonCount} Lessons • {estMinutes} Minutes Est.
                    </p>

                    {/* Topic Summary */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 font-bold text-slate-800 mb-1.5">
                        <MIcon name="description" className="text-[16px] text-[#7a6a23]" />
                        Topic Summary
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{summaryText}</p>
                    </div>

                    {/* Learning Outcomes */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 font-bold text-slate-800 mb-2">
                        <MIcon name="lightbulb" className="text-[16px] text-[#7a6a23]" />
                        Learning Outcomes
                      </div>
                      {outcomes.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {outcomes.map((o, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                              <MIcon name="check_circle" className="text-[14px] text-emerald-500 mt-0.5 shrink-0" fill />
                              <span>{o}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Learning outcomes are not available yet.</p>
                      )}
                    </div>

                  </div>
                </div>
              );
            })()
          )}
        </div>
      </div>
    </div>
  );
}
