import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  TrendingUp,
  Download,
  Target,
  BookOpen,
  Calendar,
  BarChart3,
  Star,
  Trophy,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  GitGraph,
  ChartSpline,
  Medal,
  Sparkle,
  Sparkles,
  XCircle,
  User,
  Lightbulb,
  BarChart,
  GitGraphIcon,
  BookPlus
} from 'lucide-react';
import { getJSON } from '../lib/api';

const RESULTS_CACHE_PREFIX = "eec:results-cache:v2";
const ANALYTICS_ORDER = { none: 0, basic: 1, full: 2 };

function resolveStageNumber(stageValue, examName = "") {
  if (typeof stageValue === "number" && Number.isFinite(stageValue)) {
    return Math.max(1, Math.trunc(stageValue));
  }
  const fromStage = String(stageValue || "").match(/(\d+)/);
  if (fromStage) return Math.max(1, Number(fromStage[1]));
  const fromTitle = String(examName || "").match(/(\d+)/);
  if (fromTitle) return Math.max(1, Number(fromTitle[1]));
  return 1;
}

function normalizePercent(att) {
  const raw = Number(att?.percent);
  if (Number.isFinite(raw)) return Math.max(0, Math.min(100, raw));
  const score = Number(att?.score);
  const total = Number(att?.total);
  if (Number.isFinite(score) && Number.isFinite(total) && total > 0) {
    return Math.max(0, Math.min(100, Math.round((score / total) * 100)));
  }
  return 0;
}

function getCacheKey(section, userKey = "anonymous") {
  return `${RESULTS_CACHE_PREFIX}:${userKey}:${section}`;
}

function readCache(section, userKey, ttlMs) {
  try {
    const raw = localStorage.getItem(getCacheKey(section, userKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.ts !== "number") return null;
    if (Date.now() - parsed.ts > ttlMs) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(section, userKey, data) {
  try {
    localStorage.setItem(
      getCacheKey(section, userKey),
      JSON.stringify({ ts: Date.now(), data })
    );
  } catch {
    // Ignore quota/storage errors.
  }
}

const ResultsView = () => {
  const navigate = useNavigate();
  const [selectedSemester, setSelectedSemester] = useState('current');
  const [selectedExam, setSelectedExam] = useState('all');
  const [examResults, setExamResults] = useState([]);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user._id || user.id;
  const token = localStorage.getItem("jwt") || "";
  const [showModal, setShowModal] = useState(false);
  const [activeExam, setActiveExam] = useState(null);
  const [analyticsAccess, setAnalyticsAccess] = useState("none");
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [subjectNameById, setSubjectNameById] = useState({});
  const [topicNameById, setTopicNameById] = useState({});
  const [rawAttempts, setRawAttempts] = useState([]);
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    let cancelled = false;

    async function loadNameMaps() {
      try {
        const [subjectsRes, topicsRes] = await Promise.all([
          fetch(`${API}/api/subjects`),
          fetch(`${API}/api/topics`),
        ]);
        const [subjectsData, topicsData] = await Promise.all([
          subjectsRes.json().catch(() => ({})),
          topicsRes.json().catch(() => ({})),
        ]);
        if (cancelled) return;

        const subjectRows = Array.isArray(subjectsData?.items) ? subjectsData.items : [];
        const topicRows = Array.isArray(topicsData?.items) ? topicsData.items : [];

        const sMap = {};
        const tMap = {};
        subjectRows.forEach((s) => {
          const id = String(s?._id || "").trim();
          const name = String(s?.name || "").trim();
          if (id && name) sMap[id] = name;
        });
        topicRows.forEach((t) => {
          const id = String(t?._id || "").trim();
          const name = String(t?.name || "").trim();
          if (id && name) tMap[id] = name;
        });
        setSubjectNameById(sMap);
        setTopicNameById(tMap);
      } catch {
        // keep empty maps; fallback logic will still work
      }
    }

    loadNameMaps();
    return () => {
      cancelled = true;
    };
  }, [API]);
  useEffect(() => {
    if (!showModal || !activeExam) return;
    let mounted = true;

    async function hydrateQuestions() {
      const questions = Array.isArray(activeExam.questions) ? activeExam.questions : [];
      if (!questions.length) return;

      const answerMap = new Map(
        (activeExam.answers || []).map((a) => [String(a.qid), a])
      );

      const idsToFetch = questions
        .filter((q) => {
          if (typeof q === "string") return true;
          if (!q?._id) return false;
          if (q.type === "choice-matrix") return !q.choiceMatrix?.prompt;
          if (q.type === "match-list") return !q.matchList?.left?.length || !q.matchList?.right?.length;
          if (q.type === "cloze-drag") return !q.clozeDrag?.text;
          if (q.type === "cloze-select") return !q.clozeSelect?.text;
          if (q.type === "cloze-text") return !q.clozeText?.text;
          if (q.type === "essay-plain") return !q.prompt && !q.plainText;
          if (q.type === "true-false") return !q.question;
          return !q.question && !q.prompt;
        })
        .map((q) => (typeof q === "string" ? q : q._id))
        .filter(Boolean)
        .map(String);

      const uniqueIds = [...new Set(idsToFetch)];
      if (!uniqueIds.length) {
        const nextQuestions = questions.map((q) => {
          const id = typeof q === "string" ? q : q?._id;
          const base = typeof q === "object" ? q : {};
          return {
            _id: String(id || base._id || ""),
            ...base,
            userAnswer: base?.userAnswer || answerMap.get(String(id)) || null,
          };
        });
        if (mounted) {
          setActiveExam((prev) => (prev ? { ...prev, questions: nextQuestions } : prev));
        }
        return;
      }

      const fetched = await Promise.all(
        uniqueIds.map(async (qid) => {
          const cachedQuestion = readCache(`question:${qid}`, "global", 30 * 60 * 1000);
          if (cachedQuestion) return cachedQuestion;
          const question = await getJSON(`/api/questions/${qid}`).catch(() => null);
          if (question) writeCache(`question:${qid}`, "global", question);
          return question;
        })
      );

      const fetchedMap = new Map(
        fetched.filter(Boolean).map((q) => [String(q._id), q])
      );

      const nextQuestions = questions.map((q) => {
        const id = typeof q === "string" ? q : q?._id;
        const base = typeof q === "object" ? q : {};
        const full = fetchedMap.get(String(id)) || base;

        return {
          _id: String(id || base._id || ""),
          ...full,
          userAnswer: base?.userAnswer || answerMap.get(String(id)) || null,
        };
      });

      if (mounted) {
        setActiveExam((prev) => (prev ? { ...prev, questions: nextQuestions } : prev));
      }
    }

    hydrateQuestions();
    return () => {
      mounted = false;
    };
  }, [showModal, activeExam?.id, activeExam?._id]);

  function openExamDetails(exam) {
    if (ANALYTICS_ORDER[analyticsAccess] < ANALYTICS_ORDER.full) {
      navigate("/dashboard/packages");
      return;
    }
    const answerMap = new Map(
      (exam?.answers || []).map((a) => [String(a.qid), a])
    );
    const normalizedQuestions = (exam?.questions || []).map((q) => {
      const id = typeof q === "string" ? q : q?._id;
      const base = typeof q === "object" ? q : {};
      return {
        _id: String(id || ""),
        ...base,
        userAnswer: base?.userAnswer || answerMap.get(String(id)) || null,
      };
    });

    setActiveExam({
      ...exam,
      questions: normalizedQuestions,
    });
    setShowModal(true);
  }

  // useEffect(() => {
  //   fetch(`${API}/api/exams/user-results/${user._id}`, {
  //     headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` }
  //   })
  //     .then(res => res.json())
  //     .then(data => {
  //       if (data.success) {
  //         setExamResults(formatResults(data.results));
  //       }
  //     })
  //     .catch(err => console.error("Failed to load results", err));
  // }, []);
  useEffect(() => {
    let mounted = true;
    async function loadAnalyticsAccess() {
      try {
        if (!token) {
          if (mounted) setAnalyticsAccess("none");
          return;
        }

        const analyticsUserKey = String(userId || user?.email || "anonymous");
        const cachedAnalyticsAccess = readCache("analytics-access", analyticsUserKey, 60 * 1000);
        if (cachedAnalyticsAccess && mounted) {
          setAnalyticsAccess(
            ["none", "basic", "full"].includes(String(cachedAnalyticsAccess))
              ? String(cachedAnalyticsAccess)
              : "none"
          );
        }

        const subscriptionRes = await fetch(`${API}/api/subscriptions/current`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const subscriptionData = await subscriptionRes.json();

        const activePackage =
          subscriptionData?.hasActiveSubscription ? subscriptionData?.subscription?.package : null;
        let resolvedAccess = String(
          subscriptionData?.hasActiveSubscription
            ? activePackage?.analyticsAccess || "none"
            : "none"
        ).toLowerCase();

        // Free-tier fallback: if there is no active subscription, use current Basic package config.
        if (!subscriptionData?.hasActiveSubscription) {
          const packagesRes = await fetch(`${API}/api/packages`);
          const packagesData = await packagesRes.json().catch(() => ({}));
          const packageRows = Array.isArray(packagesData?.packages) ? packagesData.packages : [];
          const basicPackage = packageRows.find(
            (p) => String(p?.name || "").toLowerCase() === "basic"
          );
          resolvedAccess = String(basicPackage?.analyticsAccess || "none").toLowerCase();
        }

        if (mounted) {
          const normalizedAccess =
            ["none", "basic", "full"].includes(resolvedAccess) ? resolvedAccess : "none";
          setAnalyticsAccess(normalizedAccess);
          writeCache("analytics-access", analyticsUserKey, normalizedAccess);
        }
      } catch {
        if (mounted) setAnalyticsAccess("none");
      } finally {
        if (mounted) setAnalyticsLoading(false);
      }
    }

    loadAnalyticsAccess();
    return () => {
      mounted = false;
    };
  }, [API, token]);

  useEffect(() => {
    if (!userId) {
      console.error("❌ No user ID in localStorage");
      return;
    }

    let cancelled = false;
    const cachedAttempts = readCache("attempts", String(userId), 2 * 60 * 1000);
    if (cachedAttempts) {
      setRawAttempts(Array.isArray(cachedAttempts) ? cachedAttempts : []);
    }

    fetch(`${API}/api/exams/user-results/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (!data.success || cancelled) return;
        const rows = Array.isArray(data.results) ? data.results : [];
        setRawAttempts(rows);
        const resolvedAccess = String(data?.analyticsAccess || "").toLowerCase();
        if (["none", "basic", "full"].includes(resolvedAccess)) {
          setAnalyticsAccess(resolvedAccess);
          writeCache("analytics-access", String(userId), resolvedAccess);
        }
        writeCache("attempts", String(userId), data.results || []);
      })
      .catch(err => {
        if (!cachedAttempts) {
          console.error("Failed to load results", err);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [API, token, userId]);


  // function formatResults(attempts) {
  //   return attempts.map(att => ({
  //     id: att._id,
  //     examName: `Stage Test - ${att.stage}`,
  //     date: att.createdAt,
  //     type: "test",
  //     totalMarks: att.total,
  //     obtainedMarks: att.score,
  //     percentage: att.percent,
  //     subjects: [
  //       {
  //         name: att.subjectName || "Unknown Subject",
  //         marks: att.score,
  //         maxMarks: att.total,
  //         percentage: att.percent,
  //         grade: att.percent >= 90 ? "A+" : att.percent >= 80 ? "A" : "B",
  //         remarks: att.percent >= 90 ? "Excellent" : att.percent >= 80 ? "Very Good" : "Good"
  //       }
  //     ],
  //     topics: [
  //       {
  //         subject: att.subjectName || "Unknown Subject",
  //         topic: att.topicName || "Unknown Topic",
  //         correct: att.score,
  //         wrong: att.total - att.score
  //       }
  //     ]
  //   }));
  // }

  // function formatResults(attempts) {
  //   return attempts.map(att => ({
  //     id: att._id,

  //     // NEW: bring backend subject + topic names
  //     subjectName: att.subjectName || "Unknown Subject",
  //     topicName: att.topicName || "Unknown Topic",

  //     examName: `Stage Test - ${att.stage}`,
  //     date: att.createdAt,
  //     type: "test",
  //     totalMarks: att.total,
  //     obtainedMarks: att.score,
  //     percentage: att.percent,
  //     questions: att.questions || [],
  //     answers: att.answers || [],
  //     subjects: [
  //       {
  //         name: att.subjectName || "Unknown Subject",
  //         marks: att.score,
  //         maxMarks: att.total,
  //         percentage: att.percent,
  //         grade:
  //           att.percent >= 90 ? "A+" :
  //             att.percent >= 80 ? "A" : "B",
  //         remarks:
  //           att.percent >= 90 ? "Excellent" :
  //             att.percent >= 80 ? "Very Good" :
  //               "Good"
  //       }
  //     ],

  //     topics: [
  //       {
  //         subject: att.subjectName || "Unknown Subject",
  //         topic: att.topicName || "Unknown Topic",
  //         correct: att.score,
  //         wrong: att.total - att.score
  //       }
  //     ]
  //   }));
  // }

  useEffect(() => {
    setExamResults(formatResults(rawAttempts, subjectNameById, topicNameById));
  }, [rawAttempts, subjectNameById, topicNameById]);

  function formatResults(attempts, subjectMap = {}, topicMap = {}) {
    return attempts.map((att) => {
      const scoreNum = Number(att?.score);
      const totalNum = Number(att?.total);
      const safeScore = Number.isFinite(scoreNum) ? scoreNum : 0;
      const safeTotal = Number.isFinite(totalNum) ? totalNum : 0;
      const percentage = normalizePercent(att);
      const subjectId = String(att?.subject?._id || att?.subject || "").trim();
      const topicId = String(att?.topic?._id || att?.topic || "").trim();
      const rawSubject = String(att?.subject || "").trim();
      const rawTopic = String(att?.topic || "").trim();
      const objectIdLike = /^[a-f\d]{24}$/i;

      const subjectName =
        String(att?.subjectName || att?.subject?.name || subjectMap[subjectId] || "").trim() ||
        (!objectIdLike.test(rawSubject) ? rawSubject : "") ||
        "Unknown Subject";
      const topicName =
        String(att?.topicName || att?.topic?.name || topicMap[topicId] || "").trim() ||
        (!objectIdLike.test(rawTopic) ? rawTopic : "") ||
        "Unknown Topic";

      return {
      id: att._id,
      stage: att.stage,
      subjectId,
      topicId,

      subjectName,
      topicName,

      examName: `Stage Test - ${att.stage}`,
      date: att.createdAt,
      type: "test",
      totalMarks: safeTotal,
      obtainedMarks: safeScore,
      percentage,
      questions: att.questions || [],
      answers: att.answers || [],

      subjects: [
        {
          name: subjectName,
          topicName,
          marks: safeScore,
          maxMarks: safeTotal,

          // FIXED: always compute percentage correctly
          percentage,

          grade:
            percentage >= 90 ? "A+" :
              percentage >= 80 ? "A" : "B",

          remarks:
            percentage >= 90 ? "Excellent" :
              percentage >= 80 ? "Very Good" :
                "Good"
        }
      ],

      topics: [
        {
          subject: subjectName,
          topic: topicName,
          correct: safeScore,
          wrong: Math.max(0, safeTotal - safeScore)
        }
      ]
    };
    });
  }

  function getSmartTip(percent) {
    if (percent >= 90) {
      return "Outstanding! Keep the streak—try higher difficulty questions and aim for 95%+.";
    }
    if (percent >= 75) {
      return "Great job! Review 1–2 weak areas and you can cross 90% soon.";
    }
    if (percent >= 50) {
      return "Good effort! Focus on mistakes and practice 10 questions daily to build speed.";
    }
    return "Every expert started here. Revisit basics and you will see steady improvement.";
  }

  function getMotivation(percent) {
    if (percent >= 90) return "You are in the top band—keep pushing!";
    if (percent >= 75) return "Strong progress—consistency will take you to the next level.";
    if (percent >= 50) return "Momentum matters—small daily wins add up fast.";
    return "No pressure—show up daily and your score will climb.";
  }

  function formatMCQAnswerText(q, answerKeys) {
    const keys = Array.isArray(answerKeys) ? answerKeys : [];
    if (!keys.length) return "—";
    return keys
      .map((key) => {
        const opt = q.options?.find((o) => o.key === key);
        const label = `${key}`;
        return opt?.text ? `${label}. ${opt.text}` : label;
      })
      .join(", ");
  }

  function normalizeMatchPairs(raw) {
    if (!raw) return {};
    if (Array.isArray(raw)) {
      const out = {};
      raw.forEach((item) => {
        if (!item || typeof item !== "object") return;
        const leftKey = item.leftIndex ?? item.left ?? item.key;
        const rightVal = item.rightIndex ?? item.right ?? item.value;
        if (leftKey === undefined || leftKey === null) return;
        out[String(leftKey)] = rightVal === undefined || rightVal === null ? "" : String(rightVal);
      });
      return out;
    }
    if (raw instanceof Map) return Object.fromEntries(raw);
    if (typeof raw === "object") {
      const out = {};
      Object.entries(raw).forEach(([k, v]) => {
        if (v && typeof v === "object") {
          const nested = v.rightIndex ?? v.right ?? v.value ?? v.index;
          out[String(k)] = nested === undefined || nested === null ? "" : String(nested);
          return;
        }
        out[String(k)] = v === undefined || v === null ? "" : String(v);
      });
      return out;
    }
    return {};
  }

  function resolveMatchLabel(left, right, leftKey, rightVal) {
    const leftIndex = Number(leftKey);
    const hasLeftIndex = Number.isFinite(leftIndex);
    const leftText = hasLeftIndex ? (left[leftIndex] || `Left ${leftIndex + 1}`) : String(leftKey);

    const rightIndex = Number(rightVal);
    const hasRightIndex = Number.isFinite(rightIndex);
    const rightText = hasRightIndex ? (right[rightIndex] || `Right ${rightIndex + 1}`) : String(rightVal || "—");

    return `${leftText} -> ${rightText}`;
  }

  function formatCorrectAnswer(q) {
    if (q.type === "true-false") {
      const v = q.correct?.[0];
      if (!v) return "—";
      return String(v).toLowerCase() === "true" ? "True" : "False";
    }
    if (q.type === "essay-plain") {
      return q.plainText || "—";
    }
    if (q.type === "essay-rich") {
      return q.plainText || q.prompt || "—";
    }
    if (q.type === "match-list") {
      const pairs = normalizeMatchPairs(q.matchList?.pairs || {});
      const right = q.matchList?.right || [];
      const left = q.matchList?.left || [];
      const keys = Object.keys(pairs);
      if (!keys.length) return "—";
      return keys
        .map((li) => resolveMatchLabel(left, right, li, pairs[li]))
        .join(", ");
    }
    if (q.type === "cloze-select") {
      const blanks = q.clozeSelect?.blanks || {};
      const keys = Object.keys(blanks);
      if (!keys.length) return "—";
      return keys.map((k) => `${k}: ${blanks[k]?.correct || "—"}`).join(", ");
    }
    if (q.type === "cloze-drag") {
      const correct = q.clozeDrag?.correctMap || q.correctMap || {};
      const keys = Object.keys(correct);
      if (!keys.length) return "—";
      return keys.map((k) => `${k}: ${correct[k]}`).join(", ");
    }
    if (q.type === "cloze-text") {
      const correct = q.clozeText?.answers || {};
      const keys = Object.keys(correct).sort();
      if (!keys.length) return "—";
      return keys.map((k) => `${k}: ${correct[k]}`).join(", ");
    }
    return formatMCQAnswerText(q, q.correct);
  }

  function formatUserAnswer(q) {
    const ua = q.userAnswer || {};
    if (q.type === "true-false") {
      if (!ua.trueFalse) return "—";
      return String(ua.trueFalse).toLowerCase() === "true" ? "True" : "False";
    }
    if (q.type === "essay-plain") {
      return ua.essay || "—";
    }
    if (q.type === "essay-rich") {
      return ua.essay || ua.essayRich?.text || "—";
    }
    if (q.type === "match-list") {
      const pairs = normalizeMatchPairs(ua.matchList || ua.pairs || ua.match || {});
      const right = q.matchList?.right || [];
      const left = q.matchList?.left || [];
      const keys = Object.keys(pairs);
      if (!keys.length) return "—";
      return keys
        .map((li) => resolveMatchLabel(left, right, li, pairs[li]))
        .join(", ");
    }
    if (q.type === "cloze-select") {
      const answers = ua.clozeSelect || {};
      const keys = Object.keys(answers);
      if (!keys.length) return "—";
      return keys.map((k) => `${k}: ${answers[k]}`).join(", ");
    }
    if (q.type === "cloze-drag") {
      const answers = ua.cloze || {};
      const keys = Object.keys(answers);
      if (!keys.length) return "—";
      return keys.map((k) => `${k}: ${answers[k]}`).join(", ");
    }
    if (q.type === "cloze-text") {
      const answers = ua.clozeText || {};
      const keys = Object.keys(answers).sort();
      if (!keys.length) return "—";
      return keys.map((k) => `${k}: ${answers[k]}`).join(", ");
    }
    return formatMCQAnswerText(q, ua.mcq);
  }

  function formatChoiceMatrixCorrect(q) {
    const rows = q.choiceMatrix?.rows || [];
    const cols = q.choiceMatrix?.cols || [];
    const cells = q.choiceMatrix?.correctCells || [];
    if (!cells.length) return "—";

    return cells
      .map((cell) => {
        const [rIdx, cIdx] = String(cell).split("-").map(Number);
        const rowLabel = rows[rIdx] || `Row ${rIdx + 1}`;
        const colLabel = cols[cIdx] || `Column ${cIdx + 1}`;
        return `${rowLabel} — ${colLabel}`;
      })
      .join(", ");
  }

  function formatChoiceMatrixUser(q) {
    const rows = q.choiceMatrix?.rows || [];
    const cols = q.choiceMatrix?.cols || [];
    const userMatrix = q.userAnswer?.matrix || {};
    const entries = Object.entries(userMatrix);
    if (!entries.length) return "—";

    return entries
      .map(([rowIndex, colValue]) => {
        const rIdx = Number(rowIndex);
        const rowLabel = rows[rIdx] || `Row ${rIdx + 1}`;
        const colLabel =
          cols.find((c) => c.toLowerCase() === String(colValue).toLowerCase()) ||
          colValue ||
          `Column`;
        return `${rowLabel} — ${colLabel}`;
      })
      .join(", ");
  }

  function isChoiceMatrixCorrect(q) {
    const rows = q.choiceMatrix?.rows || [];
    const cols = q.choiceMatrix?.cols || [];
    const userMatrix = q.userAnswer?.matrix || {};
    const correctCells = q.choiceMatrix?.correctCells || [];
    if (!correctCells.length) return false;

    const expected = new Set(
      correctCells.map((cell) => {
        const [rIdx, cIdx] = String(cell).split("-").map(Number);
        const rowLabel = rows[rIdx] || `Row ${rIdx + 1}`;
        const colLabel = cols[cIdx] || `Column ${cIdx + 1}`;
        return `${rowLabel}__${colLabel}`;
      })
    );

    const actual = new Set(
      Object.entries(userMatrix).map(([rowIndex, colValue]) => {
        const rIdx = Number(rowIndex);
        const rowLabel = rows[rIdx] || `Row ${rIdx + 1}`;
        const colLabel =
          cols.find((c) => c.toLowerCase() === String(colValue).toLowerCase()) ||
          colValue ||
          `Column`;
        return `${rowLabel}__${colLabel}`;
      })
    );

    if (!actual.size || actual.size !== expected.size) return false;
    for (const item of expected) {
      if (!actual.has(item)) return false;
    }
    return true;
  }




  const studentData = {
    name: "Student",
    studentId: "STU001",
    class: "10-A",
    semester: "Fall 2024",
    currentGPA: 3.8,
    rank: 5,
    totalStudents: 120,
    overallPercentage: 89.2
  };

  // const examResults = [
  //   {
  //     id: 1,
  //     examName: "Final Examination",
  //     date: "2024-03-15",
  //     type: "final",
  //     status: "completed",
  //     totalMarks: 500,
  //     obtainedMarks: 445,
  //     percentage: 89.0,
  //     subjects: [
  //       { name: "Mathematics", marks: 95, maxMarks: 100, grade: "A+", percentage: 95, remarks: "Excellent" },
  //       { name: "Physics", marks: 88, maxMarks: 100, grade: "A", percentage: 88, remarks: "Very Good" },
  //       { name: "Chemistry", marks: 85, maxMarks: 100, grade: "A", percentage: 85, remarks: "Good" },
  //       { name: "English", marks: 92, maxMarks: 100, grade: "A+", percentage: 92, remarks: "Excellent" },
  //       { name: "Biology", marks: 85, maxMarks: 100, grade: "A", percentage: 85, remarks: "Good" }
  //     ]
  //   },
  //   {
  //     id: 2,
  //     examName: "Mid-Term Examination",
  //     date: "2024-02-15",
  //     type: "midterm",
  //     status: "completed",
  //     totalMarks: 500,
  //     obtainedMarks: 440,
  //     percentage: 88.0,
  //     subjects: [
  //       { name: "Mathematics", marks: 92, maxMarks: 100, grade: "A+", percentage: 92, remarks: "Excellent" },
  //       { name: "Physics", marks: 86, maxMarks: 100, grade: "A", percentage: 86, remarks: "Very Good" },
  //       { name: "Chemistry", marks: 83, maxMarks: 100, grade: "B+", percentage: 83, remarks: "Good" },
  //       { name: "English", marks: 90, maxMarks: 100, grade: "A", percentage: 90, remarks: "Very Good" },
  //       { name: "Biology", marks: 89, maxMarks: 100, grade: "A", percentage: 89, remarks: "Very Good" }
  //     ]
  //   },
  //   {
  //     id: 3,
  //     examName: "Unit Test 3",
  //     date: "2024-01-20",
  //     type: "unit",
  //     status: "completed",
  //     totalMarks: 300,
  //     obtainedMarks: 275,
  //     percentage: 91.7,
  //     subjects: [
  //       { name: "Mathematics", marks: 58, maxMarks: 60, grade: "A+", percentage: 96.7, remarks: "Outstanding" },
  //       { name: "Physics", marks: 52, maxMarks: 60, grade: "A", percentage: 86.7, remarks: "Very Good" },
  //       { name: "Chemistry", marks: 55, maxMarks: 60, grade: "A", percentage: 91.7, remarks: "Excellent" },
  //       { name: "English", marks: 56, maxMarks: 60, grade: "A+", percentage: 93.3, remarks: "Excellent" },
  //       { name: "Biology", marks: 54, maxMarks: 60, grade: "A", percentage: 90.0, remarks: "Very Good" }
  //     ]
  //   }
  // ];

  const getGradeColor = (grade) => {
    if (grade.startsWith('A+')) return 'bg-green-100 text-green-800 border-green-200';
    if (grade.startsWith('A')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (grade.startsWith('B+')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (grade.startsWith('B')) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 80) return 'bg-blue-500';
    if (percentage >= 70) return 'bg-yellow-500';
    if (percentage >= 60) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const filteredResults = examResults.filter(exam => {
    if (selectedExam === 'all') return true;
    return exam.type === selectedExam;
  });
  const numericPercentages = examResults
    .map((e) => Number(e?.percentage))
    .filter((v) => Number.isFinite(v));

  const overallPercentage =
    numericPercentages.length > 0
      ? (numericPercentages.reduce((acc, v) => acc + v, 0) / numericPercentages.length).toFixed(2)
      : "0.00";
  // Pagination for exam tables
  const [examPage, setExamPage] = useState(1);
  const examsPerPage = 3;

  // Calculate pagination slices
  const totalExamPages = Math.ceil(filteredResults.length / examsPerPage);
  const paginatedExams = filteredResults.slice(
    (examPage - 1) * examsPerPage,
    examPage * examsPerPage
  );
  const hasResults = numericPercentages.length > 0;

  const avgScore = hasResults
    ? (
      numericPercentages.reduce((acc, v) => acc + v, 0) /
      numericPercentages.length
    ).toFixed(1)
    : "0.0";

  const bestScore = hasResults
    ? Math.max(...numericPercentages).toFixed()
    : "0.0";

  const excellentCount = hasResults
    ? examResults.filter(exam => exam.percentage >= 85).length
    : 0;
  const canViewAnalytics = ANALYTICS_ORDER[analyticsAccess] >= ANALYTICS_ORDER.basic;
  const canViewDetails = ANALYTICS_ORDER[analyticsAccess] >= ANALYTICS_ORDER.full;

  const weakTopicBooster = useMemo(() => {
    if (!examResults.length) return null;

    const bucket = new Map();
    for (const exam of examResults) {
      const percent = Number(exam?.percentage);
      if (!Number.isFinite(percent)) continue;

      const subjectId = String(exam?.subjectId || "").trim();
      const topicId = String(exam?.topicId || "").trim();
      const subjectName = String(exam?.subjectName || exam?.subjects?.[0]?.name || "").trim();
      const topicName = String(exam?.topicName || exam?.subjects?.[0]?.topicName || "").trim();
      const isUnknownSubject = subjectName.toLowerCase().startsWith("unknown");
      const isUnknownTopic = topicName.toLowerCase().startsWith("unknown");
      if (!subjectId || !topicId || !subjectName || !topicName || isUnknownSubject || isUnknownTopic) continue;

      const stageNumber = resolveStageNumber(exam?.stage, "");
      const key = `${stageNumber}::${subjectId}::${topicId}`;

      const prev = bucket.get(key) || {
        subjectName,
        topicName,
        stageNumber,
        subjectId,
        topicId,
        totalPercent: 0,
        count: 0,
        lastDate: 0,
      };

      prev.totalPercent += percent;
      prev.count += 1;
      prev.lastDate = Math.max(prev.lastDate, new Date(exam?.date || 0).getTime() || 0);
      bucket.set(key, prev);
    }

    const scored = [...bucket.values()]
      .map((row) => ({ ...row, avgPercent: row.count ? row.totalPercent / row.count : 0 }))
      .sort((a, b) => {
        if (a.avgPercent !== b.avgPercent) return a.avgPercent - b.avgPercent;
        if (a.count !== b.count) return b.count - a.count;
        return b.lastDate - a.lastDate;
      });

    return scored[0] || null;
  }, [examResults]);

  function startWeakTopicPractice() {
    if (!weakTopicBooster) return;

    const stageNum = weakTopicBooster.stageNumber || 1;
    const subjectId = String(weakTopicBooster.subjectId || "");
    const topicId = String(weakTopicBooster.topicId || "");

    if (subjectId && topicId && subjectId !== "undefined" && topicId !== "undefined") {
      navigate(
        `/dashboard/syllabus/topic/${subjectId}/${topicId}?stage=${stageNum}&openPractice=1`,
        {
          state: {
            subject: { _id: subjectId, name: weakTopicBooster.subjectName },
            topic: { _id: topicId, name: weakTopicBooster.topicName },
          },
        }
      );
      return;
    }

    navigate(`/dashboard/syllabus?stage=${stageNum}`);
  }


  return (
    <div className="min-h-screen space-y-4 md:space-y-8 p-3 md:p-8 bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100">

      {/* Header */}
      <div className="relative z-10 overflow-hidden rounded-2xl bg-white/70 backdrop-blur-md border border-white/60 p-6 md:p-8 shadow-[0_6px_24px_-12px_rgba(2,6,23,0.15)] hover:shadow-[0_12px_28px_-10px_rgba(2,6,23,0.25)] transition-shadow">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-slate-200/[0.07] rounded-full -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-slate-200/[0.07] rounded-full -ml-16 -mb-16"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="inline-flex size-9 md:size-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
                <Trophy size={18} className="md:hidden" />
                <Trophy size={28} className="hidden md:block" />
              </div>
              <div>
                <h1 className="text-xl md:text-4xl font-extrabold tracking-tight text-slate-800">
                  My Results
                </h1>
                <p className="hidden md:block text-sm md:text-base text-slate-600 mt-1">Track your academic performance and achievements</p>
              </div>
            </div>
            <div className="bg-blue-50 px-3 md:px-5 py-2 md:py-3 rounded-xl md:rounded-2xl border border-blue-100">
              <p className="text-[10px] md:text-xs text-blue-700">Class</p>
              <p className="text-sm md:text-xl font-bold text-blue-800">
                {user?.className || user?.class || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="relative z-10 grid grid-cols-2 lg:grid-cols-2 gap-3 md:gap-6">

        {/* Overall Percentage */}
        <div className="relative overflow-hidden rounded-xl md:rounded-2xl p-3 md:p-5 shadow-md text-white bg-gradient-to-br from-emerald-600 to-teal-600 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none">
            <div className="absolute top-3 right-4 w-20 h-20 bg-white rounded-full"></div>
            <div className="absolute bottom-3 left-4 w-14 h-14 bg-white rounded-full"></div>
          </div>
          <div className="relative z-10 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-white/80 truncate">Avg Score</p>
              <h3 className="text-base md:text-2xl font-bold mt-0.5 md:mt-1 truncate">{overallPercentage}%</h3>
            </div>
            <div className="p-2 md:p-3 bg-white/20 rounded-lg md:rounded-xl shadow-md flex-shrink-0">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
        </div>

        {/* Total Exams */}
        <div className="relative overflow-hidden rounded-xl md:rounded-2xl p-3 md:p-5 shadow-md text-white bg-gradient-to-br from-purple-600 to-fuchsia-600 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none">
            <div className="absolute top-3 right-4 w-20 h-20 bg-white rounded-full"></div>
            <div className="absolute bottom-3 left-4 w-14 h-14 bg-white rounded-full"></div>
          </div>
          <div className="relative z-10 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-white/80 truncate">Total Attempts</p>
              <h3 className="text-base md:text-2xl font-bold mt-0.5 md:mt-1 truncate">{examResults.length}</h3>
            </div>
            <div className="p-2 md:p-3 bg-white/20 rounded-lg md:rounded-xl shadow-md flex-shrink-0">
              <BookOpen className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
        </div>

      </div>


      {/* Controls */}
      {/* <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="current">Current Semester</option>
                <option value="previous">Previous Semester</option>
                <option value="all">All Semesters</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-gray-500" />
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="all">All Exams</option>
                <option value="final">Final Exams</option>
                <option value="midterm">Mid-Term Exams</option>
                <option value="unit">Unit Tests</option>
              </select>
            </div>
          </div>

          <button className="flex items-center space-x-2 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors">
            <Download className="w-4 h-4" />
            <span>Download Report Card</span>
          </button>
        </div>
      </div> */}

      <div className="relative">
      {canViewAnalytics ? (
        <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md shadow-[0_6px_24px_-12px_rgba(2,6,23,0.15)] p-5 hover:shadow-[0_12px_28px_-10px_rgba(2,6,23,0.25)] transition-shadow">
          <div className="text-[13px] font-semibold text-slate-600 tracking-wide mb-3 flex items-center gap-2">
            <span className="text-slate-700"><BarChart3 className="w-4 h-4 md:w-5 md:h-5" /></span>
            Performance Summary
          </div>

          <div className="grid grid-cols-3 gap-2 md:gap-6">
            {/* AVERAGE SCORE */}
            <div className="relative overflow-hidden flex flex-col items-center bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-3 md:p-6 rounded-xl md:rounded-2xl shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
              <div className="absolute inset-0 opacity-[0.07] pointer-events-none">
                <div className="absolute top-2 right-2 w-12 h-12 bg-white rounded-full"></div>
              </div>
              <div className="relative z-10 text-xl md:text-4xl font-extrabold">{avgScore}%</div>
              <div className="relative z-10 text-[10px] md:text-sm text-white/80 mt-1 md:mt-2 text-center">Avg Score</div>
              <ChartSpline className="relative z-10 w-4 h-4 md:w-7 md:h-7 text-white/80 mt-1 md:mt-2" />
            </div>

            {/* BEST PERFORMANCE */}
            <div className="relative overflow-hidden flex flex-col items-center bg-gradient-to-br from-emerald-600 to-teal-600 text-white p-3 md:p-6 rounded-xl md:rounded-2xl shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
              <div className="absolute inset-0 opacity-[0.07] pointer-events-none">
                <div className="absolute top-2 right-2 w-12 h-12 bg-white rounded-full"></div>
              </div>
              <div className="relative z-10 text-xl md:text-4xl font-extrabold">{bestScore}%</div>
              <div className="relative z-10 text-[10px] md:text-sm text-white/80 mt-1 md:mt-2 text-center">Best</div>
              <Medal className="relative z-10 w-4 h-4 md:w-7 md:h-7 text-white/80 mt-1 md:mt-2" />
            </div>

            {/* EXCELLENT SCORES */}
            <div className="relative overflow-hidden flex flex-col items-center bg-gradient-to-br from-rose-600 to-pink-600 text-white p-3 md:p-6 rounded-xl md:rounded-2xl shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
              <div className="absolute inset-0 opacity-[0.07] pointer-events-none">
                <div className="absolute top-2 right-2 w-12 h-12 bg-white rounded-full"></div>
              </div>
              <div className="relative z-10 text-xl md:text-4xl font-extrabold">{excellentCount}/{examResults.length || 0}</div>
              <div className="relative z-10 text-[10px] md:text-sm text-white/80 mt-1 md:mt-2 text-center">Excellent</div>
              <Sparkles className="relative z-10 w-4 h-4 md:w-7 md:h-7 text-white/80 mt-1 md:mt-2" />
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md shadow-[0_6px_24px_-12px_rgba(2,6,23,0.15)] p-5">
          <div className="grid grid-cols-3 gap-2 md:gap-6">
            {[1, 2, 3].map((item) => (
              <div key={item} className="rounded-xl md:rounded-2xl bg-slate-200/80 h-24 md:h-36 animate-pulse" />
            ))}
          </div>
        </div>
      )}
      {!analyticsLoading && !canViewAnalytics && (
        <div className="absolute inset-0 z-10 rounded-2xl bg-slate-900/55 flex items-center justify-center p-5">
          <div className="text-center">
            <p className="text-white text-sm md:text-base font-semibold">Upgrade to view full analytics</p>
            <button
              onClick={() => navigate("/dashboard/packages")}
              className="mt-3 px-4 py-2 text-sm font-semibold rounded-lg bg-white text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Upgrade Plan
            </button>
          </div>
        </div>
      )}
      </div>

      {canViewAnalytics && weakTopicBooster && (() => {
        const score = weakTopicBooster.avgPercent;
        const scorePct = Math.min(100, Math.max(0, score));
        const scoreColor = score < 40 ? "#ef4444" : score < 65 ? "#f97316" : "#eab308";
        const subjectLower = String(weakTopicBooster.subjectName || "").toLowerCase();
        const subjectIcon =
          subjectLower.includes("math") ? "calculate" :
          subjectLower.includes("science") ? "science" :
          subjectLower.includes("english") || subjectLower.includes("lang") ? "menu_book" :
          subjectLower.includes("history") ? "history_edu" :
          subjectLower.includes("geo") ? "public" :
          subjectLower.includes("bio") ? "biotech" :
          subjectLower.includes("phys") ? "bolt" :
          subjectLower.includes("chem") ? "experiment" :
          "school";

        return (
          <div className="relative z-10 overflow-hidden rounded-2xl shadow-md" style={{ background: "linear-gradient(135deg, #fff7ed 0%, #fffbeb 50%, #fef9c3 100%)" }}>
            {/* Dot-grid texture */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.08]"
              style={{ backgroundImage: "radial-gradient(circle, #92400e 1.3px, transparent 1.3px)", backgroundSize: "20px 20px" }}
            />

            {/* Decorative SVG — brain/lightning bolt graphic */}
            <div className="absolute right-0 top-0 bottom-0 flex items-center pr-4 pointer-events-none select-none opacity-[0.12]">
              <svg width="140" height="140" viewBox="0 0 140 140" fill="none">
                {/* Brain outline */}
                <ellipse cx="70" cy="65" rx="48" ry="44" stroke="#92400e" strokeWidth="4"/>
                <path d="M70 21 C70 21 58 30 58 44 C58 52 64 58 70 60 C76 58 82 52 82 44 C82 30 70 21 70 21Z" stroke="#92400e" strokeWidth="3" fill="none"/>
                <path d="M22 65 C22 52 30 42 40 38" stroke="#92400e" strokeWidth="3" strokeLinecap="round"/>
                <path d="M118 65 C118 52 110 42 100 38" stroke="#92400e" strokeWidth="3" strokeLinecap="round"/>
                <path d="M35 80 C28 74 24 68 24 62" stroke="#92400e" strokeWidth="3" strokeLinecap="round"/>
                <path d="M105 80 C112 74 116 68 116 62" stroke="#92400e" strokeWidth="3" strokeLinecap="round"/>
                {/* Lightning bolt */}
                <path d="M78 52 L62 74 L72 74 L60 96 L80 68 L70 68 Z" fill="#92400e" opacity="0.7"/>
              </svg>
            </div>

            {/* Decorative blobs */}
            <div className="absolute -top-6 -left-6 w-28 h-28 rounded-full bg-amber-300/20 pointer-events-none" />
            <div className="absolute bottom-0 left-1/2 w-16 h-16 rounded-full bg-orange-300/15 pointer-events-none" />

            <div className="relative z-10 p-5 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-5">

                {/* Left: info */}
                <div className="flex-1 min-w-0">
                  {/* Badge */}
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-200/80 border border-amber-300/60 px-3 py-1 text-[11px] font-black text-amber-800 uppercase tracking-wide">
                    <Lightbulb className="w-3.5 h-3.5" />
                    Weak Topic Booster
                  </span>

                  {/* Title */}
                  <h3 className="mt-3 text-lg md:text-xl font-black text-slate-900 leading-snug pr-0 md:pr-16">
                    Practice{" "}
                    <span className="text-amber-700">{weakTopicBooster.topicName}</span>
                  </h3>
                  <p className="mt-0.5 text-sm text-slate-600 font-medium">
                    {weakTopicBooster.subjectName}
                  </p>

                  {/* Stats row */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 border border-rose-200 px-3 py-1 text-xs font-bold text-rose-700">
                      <span className="material-symbols-outlined text-[14px]">trending_down</span>
                      {score.toFixed(1)}% avg
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600">
                      <span className="material-symbols-outlined text-[14px]">layers</span>
                      Stage {weakTopicBooster.stageNumber}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600">
                      <span className="material-symbols-outlined text-[14px]">replay</span>
                      {weakTopicBooster.count} attempt{weakTopicBooster.count !== 1 ? "s" : ""}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600">
                      <span className={`material-symbols-outlined text-[14px]`}>{subjectIcon}</span>
                      {weakTopicBooster.subjectName}
                    </span>
                  </div>

                  {/* Score bar */}
                  <div className="mt-4 max-w-xs">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                      <span>Current Score</span>
                      <span style={{ color: scoreColor }}>{score.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/60 rounded-full overflow-hidden border border-amber-200">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${scorePct}%`, background: `linear-gradient(90deg, #ef4444, ${scoreColor})` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {score < 40 ? "Needs urgent attention" : score < 65 ? "Below target — keep revising" : "Getting better!"}
                    </p>
                  </div>
                </div>

                {/* Right: subject icon + CTA */}
                <div className="flex md:flex-col items-center gap-4 md:gap-3 md:flex-shrink-0">
                  {/* Subject icon bubble */}
                  <div className="hidden md:flex w-16 h-16 rounded-2xl bg-amber-100 border border-amber-200 items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-amber-600 text-3xl">{subjectIcon}</span>
                  </div>

                  <button
                    type="button"
                    onClick={startWeakTopicPractice}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 text-sm font-black text-white shadow-md hover:from-amber-600 hover:to-orange-600 active:scale-95 transition-all"
                  >
                    <BookPlus className="w-4 h-4" />
                    Start Practice
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Exam Results */}
      <div className="relative">
      <div className="relative z-10 space-y-3 md:space-y-6">
        {canViewAnalytics ? paginatedExams.map((exam) => (
          <div key={exam.id} className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md shadow-[0_6px_24px_-12px_rgba(2,6,23,0.15)] hover:shadow-[0_12px_28px_-10px_rgba(2,6,23,0.25)] transition-shadow overflow-hidden">

            {/* Card Header — shared mobile + desktop */}
            <div className="p-4 md:p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="inline-flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
                    <FileText className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-lg font-bold text-gray-900 leading-tight">{exam.examName}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(exam.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-xl md:text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{exam.percentage}%</p>
                    <p className="text-xs text-gray-500">{exam.obtainedMarks}/{exam.totalMarks}</p>
                  </div>
                </div>
              </div>
              {/* Progress bar — mobile only */}
              <div className="mt-2.5 md:hidden">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full transition-all duration-500 ${getPerformanceColor(exam.percentage)}`}
                    style={{ width: `${exam.percentage}%` }} />
                </div>
              </div>
            </div>

            {/* MOBILE: Subject card list */}
            <div className="md:hidden divide-y divide-gray-100">
              {exam.subjects.map((subject, subIndex) => (
                <div key={subIndex} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{subject.name || "Subject"}</p>
                    <p className="text-xs text-gray-500 truncate">{subject.topicName || "Topic"}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-bold text-gray-800">{subject.marks}/{subject.maxMarks}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getGradeColor(subject.grade)}`}>{subject.grade}</span>
                  </div>
                </div>
              ))}
              <div className="px-4 py-3">
                <button
                  onClick={() => (canViewDetails ? openExamDetails(exam) : navigate("/dashboard/packages"))}
                  className={`w-full py-2.5 text-sm font-semibold rounded-xl shadow-md active:scale-95 transition-all ${
                    canViewDetails
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {canViewDetails ? "View Details" : "Upgrade to View Details"}
                </button>
              </div>
            </div>

            {/* DESKTOP: Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Subject</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Marks Obtained</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Percentage</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Grade</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Performance</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Remarks</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/50">
                  {exam.subjects.map((subject, subIndex) => (
                    <tr key={subIndex} className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <BookOpen className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="font-medium text-gray-900">
                            <div className="text-sm">{subject.name || "Subject"}</div>
                            <div className="text-xs text-gray-500">{subject.topicName || "Topic"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="font-bold text-gray-900">{subject.marks}</span>
                        <span className="text-gray-500">/{subject.maxMarks}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{subject.percentage}%</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border ${getGradeColor(subject.grade)}`}>
                          {subject.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className={`h-3 rounded-full transition-all duration-500 ${getPerformanceColor(subject.percentage)}`}
                            style={{ width: `${subject.percentage}%` }} />
                        </div>
                        <div className="text-xs text-gray-500 mt-1 font-medium">{subject.percentage}%</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-bold ${subject.remarks === 'Excellent' || subject.remarks === 'Outstanding' ? 'text-green-600' :
                          subject.remarks === 'Very Good' ? 'text-blue-600' :
                            subject.remarks === 'Good' ? 'text-yellow-600' : 'text-gray-600'}`}>
                          {subject.remarks}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => (canViewDetails ? openExamDetails(exam) : navigate("/dashboard/packages"))}
                          className={`px-4 py-2 text-sm font-medium rounded-lg shadow-md transition-all duration-300 ${
                            canViewDetails
                              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg hover:scale-105"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {canViewDetails ? "View Details" : "Upgrade to View Details"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )) : (
          <>
            {[1, 2].map((item) => (
              <div key={item} className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md p-6">
                <div className="space-y-3">
                  <div className="h-5 w-48 bg-slate-200/80 rounded animate-pulse" />
                  <div className="h-4 w-32 bg-slate-200/80 rounded animate-pulse" />
                  <div className="h-24 w-full bg-slate-200/80 rounded-xl animate-pulse" />
                </div>
              </div>
            ))}
          </>
        )}
      </div>
      {!analyticsLoading && !canViewAnalytics && (
        <div className="absolute inset-0 z-10 rounded-2xl bg-slate-900/55 flex items-center justify-center p-5">
          <div className="text-center">
            <p className="text-white text-sm md:text-base font-semibold">Upgrade to view full analytics</p>
            <button
              onClick={() => navigate("/dashboard/packages")}
              className="mt-3 px-4 py-2 text-sm font-semibold rounded-lg bg-white text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Upgrade Plan
            </button>
          </div>
        </div>
      )}
      </div>
      {/* Pagination Controls */}
      {canViewAnalytics && totalExamPages > 1 && (
        <div className="relative z-10 flex justify-center items-center gap-2 md:gap-3 mt-4 md:mt-6">

          {/* Prev */}
          <button
            className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${
              examPage === 1
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg"
            }`}
            disabled={examPage === 1}
            onClick={() => setExamPage(examPage - 1)}
          >
            <ChevronLeft className="w-4 h-4 md:hidden" />
            <span className="hidden md:inline">Previous</span>
          </button>

          {/* MOBILE: compact page indicator */}
          <span className="md:hidden px-4 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 text-white shadow-lg scale-110 min-w-[72px] text-center">
            {examPage} <span className="text-white/80 font-normal text-xs">/ {totalExamPages}</span>
          </span>

          {/* DESKTOP: smart windowed page buttons */}
          <div className="hidden md:flex items-center gap-1.5">
            {(() => {
              const items = [];
              for (let i = 1; i <= totalExamPages; i++) {
                if (i === 1 || i === totalExamPages || (i >= examPage - 1 && i <= examPage + 1)) {
                  items.push({ type: 'page', value: i });
                } else if (items[items.length - 1]?.type !== 'ellipsis') {
                  items.push({ type: 'ellipsis', value: i });
                }
              }
              return items.map((item, idx) =>
                item.type === 'ellipsis' ? (
                  <span key={idx} className="text-gray-400 text-sm px-1 select-none">…</span>
                ) : (
                  <button
                    key={item.value}
                    onClick={() => setExamPage(item.value)}
                    className={`flex items-center justify-center w-9 h-9 md:w-10 md:h-10 font-bold rounded-xl transition-all duration-200 active:scale-95 text-sm ${
                      examPage === item.value
                        ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md scale-105"
                        : "bg-white/90 text-gray-600 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 shadow-sm"
                    }`}
                  >
                    {item.value}
                  </button>
                )
              );
            })()}
          </div>

          {/* Next */}
          <button
            className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${
              examPage === totalExamPages || totalExamPages === 0
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg"
            }`}
            disabled={examPage === totalExamPages || totalExamPages === 0}
            onClick={() => setExamPage(examPage + 1)}
          >
            <span className="hidden md:inline">Next</span>
            <ChevronRight className="w-4 h-4 md:hidden" />
          </button>

        </div>
      )}

      {/* ---------------- MODAL VIEW ---------------- */}
      {canViewDetails && showModal && activeExam && (
        <div
          className="fixed inset-x-0 top-0 bottom-16 md:bottom-0 z-[80] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-2 md:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div
            className="relative w-full md:max-w-3xl rounded-t-3xl md:rounded-3xl bg-white/70 backdrop-blur-md border border-white/60 shadow-[0_6px_24px_-12px_rgba(2,6,23,0.15)] overflow-hidden flex flex-col"
            style={{ maxHeight: "calc(100dvh - 4.5rem)" }}
          >
            {/* Drag handle — mobile only */}
            <div className="md:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            {/* Decorative blobs */}
            <div className="absolute -top-16 -right-16 w-56 h-56 bg-slate-200/[0.07] rounded-full pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-slate-200/[0.07] rounded-full pointer-events-none" />

            {/* Sticky modal header */}
            <div className="relative z-10 flex items-center justify-between px-5 md:px-8 py-4 md:py-6 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="inline-flex size-9 md:size-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
                  <Trophy className="w-5 h-5 md:w-7 md:h-7" />
                </div>
                <div>
                  <h2 className="text-base md:text-2xl font-extrabold text-gray-900">Performance Report</h2>
                  <p className="text-xs text-gray-500">{activeExam.examName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-full bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="relative z-10 overflow-y-auto flex-1 px-5 md:px-8 py-4 md:py-6 space-y-4 md:space-y-6">

              {/* STUDENT INFO */}
              <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/60 shadow-[0_6px_24px_-12px_rgba(2,6,23,0.15)] p-4 md:p-6">
                <h3 className="text-sm md:text-base font-bold text-indigo-700 flex items-center gap-2 mb-3">
                  <User className="w-4 h-4" /> Student Information
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs md:text-sm text-gray-700">
                  <p><span className="font-semibold">Name:</span> {user?.name}</p>
                  <p><span className="font-semibold">Class:</span> {user?.class || user?.className}</p>
                  <p><span className="font-semibold">Exam:</span> {activeExam.examName}</p>
                  <p><span className="font-semibold">Date:</span> {new Date(activeExam.date).toLocaleDateString()}</p>
                </div>
              </div>

              {/* SUBJECT & TOPIC */}
              <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4 md:p-5">
                <h3 className="text-sm md:text-base font-bold text-blue-800 flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4" /> Subject & Topic
                </h3>
                <p className="text-xs md:text-sm text-gray-800"><span className="font-semibold">Subject:</span> {activeExam.subjectName}</p>
                <p className="text-xs md:text-sm text-gray-800 mt-1"><span className="font-semibold">Topic:</span> {activeExam.topicName}</p>
              </div>

              {/* SCORE TIP */}
              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 md:p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-sm font-bold text-emerald-700">Smart Improvement Tip</h4>
                </div>
                <p className="text-gray-700 text-xs md:text-sm leading-relaxed">{getSmartTip(activeExam.percent)}</p>
                <p className="text-emerald-700 text-xs font-semibold mt-2">{getMotivation(activeExam.percent)}</p>
              </div>

              {/* QUESTION BREAKDOWN */}
              <div>
                <h3 className="text-sm md:text-lg font-extrabold text-purple-700 mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 md:w-5 md:h-5" /> Question Breakdown
                </h3>
                <div className="space-y-3 md:space-y-4">
                  {activeExam.questions.map((q, index) => {
                    const userAns = formatUserAnswer(q);
                    const correctAns = formatCorrectAnswer(q);
                    const isCorrect = q.type === "choice-matrix"
                      ? isChoiceMatrixCorrect(q)
                      : (userAns !== "—" && correctAns !== "—" && userAns === correctAns);

                    const questionText =
                      q.choiceMatrix?.prompt ||
                      q.matchList?.prompt ||
                      q.clozeDrag?.text ||
                      q.clozeSelect?.text ||
                      q.clozeText?.text ||
                      q.prompt ||
                      q.question ||
                      q.plainText ||
                      "Question text unavailable";

                    return (
                      <div key={q._id || `q-${index}`} className="p-4 md:p-5 rounded-2xl bg-white/70 backdrop-blur-md border border-white/60 shadow-sm">
                        <p className="font-semibold text-gray-900 text-sm md:text-base mb-3 flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          {index + 1}. {questionText}
                        </p>

                        {q.type === "choice-matrix" ? (
                          <>
                            <p className="text-green-700 text-xs md:text-sm font-semibold">
                              Correct: <span className="ml-1 px-2 py-0.5 rounded bg-green-100">{formatChoiceMatrixCorrect(q)}</span>
                            </p>
                            <p className="text-blue-700 text-xs md:text-sm font-semibold mt-1.5">
                              Yours: <span className="ml-1 px-2 py-0.5 rounded bg-blue-100">{formatChoiceMatrixUser(q)}</span>
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-green-700 text-xs md:text-sm font-semibold">
                              Correct: <span className="ml-1 px-2 py-0.5 rounded bg-green-100">{correctAns}</span>
                            </p>
                            <p className="text-blue-700 text-xs md:text-sm font-semibold mt-1.5">
                              Yours: <span className="ml-1 px-2 py-0.5 rounded bg-blue-100">{userAns}</span>
                            </p>
                          </>
                        )}

                        <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold ${isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                          {isCorrect ? "🎉 Correct" : "❌ Incorrect"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
    </div>
  );
};

export default ResultsView;
