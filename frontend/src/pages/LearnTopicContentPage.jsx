import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, ListChecks, Loader2, Zap } from "lucide-react";
import { getJSON } from "../lib/api";

function decodeEntityTags(value) {
  return String(value || "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function getHtmlOrFallback(html, fallback) {
  const clean = decodeEntityTags(String(html || "").trim());
  return clean ? clean : `<p class="text-gray-400 italic">${fallback}</p>`;
}

export default function LearnTopicContentPage() {
  const { subjectId, topicId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("jwt") || "";
  const isLoggedIn = Boolean(token);
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState(location.state?.subject || null);
  const [topic, setTopic] = useState(location.state?.topic || null);

  const boardLabel = useMemo(() => location.state?.boardLabel || "Learn", [location.state]);
  const classLabel = useMemo(() => location.state?.classLabel || "Contents", [location.state]);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        if (subject?._id === subjectId && topic?._id === topicId) return;

        if (isLoggedIn) {
          const [subjectRows, topicRows] = await Promise.all([
            getJSON("/api/subject"),
            getJSON(`/api/topic/${subjectId}`),
          ]);
          const foundSubject = (Array.isArray(subjectRows) ? subjectRows : []).find(
            (s) => String(s?._id) === String(subjectId)
          );
          const foundTopic = (Array.isArray(topicRows) ? topicRows : []).find(
            (t) => String(t?._id) === String(topicId)
          );
          if (!mounted) return;
          setSubject(foundSubject || null);
          setTopic(foundTopic || null);
          return;
        }

        const [subjectRes, topicRes] = await Promise.all([
          fetch(`${API}/api/subjects`),
          fetch(`${API}/api/subjects/${encodeURIComponent(subjectId)}/topics`),
        ]);
        const [subjectData, topicData] = await Promise.all([
          subjectRes.json().catch(() => ({})),
          topicRes.json().catch(() => ({})),
        ]);
        const foundSubject = (Array.isArray(subjectData?.items) ? subjectData.items : []).find(
          (s) => String(s?._id) === String(subjectId)
        );
        const foundTopic = (Array.isArray(topicData?.items) ? topicData.items : []).find(
          (t) => String(t?._id) === String(topicId)
        );
        if (!mounted) return;
        setSubject(foundSubject || null);
        setTopic(foundTopic || null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [API, isLoggedIn, subjectId, topicId, subject, topic]);

  function handlePracticeNow() {
    const targetPath = `/dashboard/syllabus/topic/${encodeURIComponent(
      subjectId
    )}/${encodeURIComponent(topicId)}?stage=1&openPractice=1`;
    if (!isLoggedIn) {
      sessionStorage.setItem("redirectAfterLogin", targetPath);
      window.dispatchEvent(new Event("eec:open-login"));
      return;
    }
    navigate(targetPath);
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-9 w-9 animate-spin text-amber-500" />
        <p className="text-sm text-gray-500">Loading topic content...</p>
      </div>
    );
  }

  if (!subject || !topic) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-700">
          Topic not found.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-500">
        <div className="relative mx-auto max-w-5xl px-4 py-8 md:py-10">
          <button
            onClick={() => navigate("/boards")}
            className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/25"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Learn
          </button>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold text-white">
              <BookOpen className="h-3 w-3" />
              {subject?.name || "Subject"}
            </span>
          </div>

          <h1 className="text-2xl font-extrabold leading-tight text-white md:text-4xl">
            {topic?.name || "Topic"}
          </h1>
          <p className="mt-1.5 text-sm text-white/80">
            {boardLabel} - {classLabel}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 md:px-6 md:py-8">
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/60 px-5 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
              <BookOpen className="h-4.5 w-4.5 text-blue-600" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Topic Summary</h2>
          </div>
          <div className="px-5 py-5">
            <div
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{
                __html: getHtmlOrFallback(topic?.topicSummary, "Summary is not available yet."),
              }}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/60 px-5 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100">
              <ListChecks className="h-4.5 w-4.5 text-emerald-600" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Learning Outcomes</h2>
          </div>
          <div className="px-5 py-5">
            <div
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{
                __html: getHtmlOrFallback(topic?.learningOutcome, "Learning outcomes are not available yet."),
              }}
            />
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900 p-6 text-white">
          <h3 className="text-xl font-bold">Practice Now</h3>
          <p className="mt-1 text-sm text-slate-300">
            Start practicing this topic from tryouts.
          </p>
          <button
            onClick={handlePracticeNow}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-bold text-white"
          >
            <Zap className="h-4 w-4" />
            {isLoggedIn ? "Start Practice" : "Login to Start Practice"}
          </button>
        </div>
      </div>
    </>
  );
}
