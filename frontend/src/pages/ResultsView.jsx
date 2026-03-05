import React, { useState, useEffect } from 'react';
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
  const [selectedSemester, setSelectedSemester] = useState('current');
  const [selectedExam, setSelectedExam] = useState('all');
  const [examResults, setExamResults] = useState([]);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user._id || user.id;
  const [showModal, setShowModal] = useState(false);
  const [activeExam, setActiveExam] = useState(null);
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
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
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user._id || user.id;

    if (!userId) {
      console.error("❌ No user ID in localStorage");
      return;
    }

    const cachedAttempts = readCache("attempts", String(userId), 2 * 60 * 1000);
    if (cachedAttempts) {
      setExamResults(formatResults(cachedAttempts));
      return;
    }

    fetch(`${API}/api/exams/user-results/${userId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setExamResults(formatResults(data.results));
          writeCache("attempts", String(userId), data.results || []);
        }
      })
      .catch(err => console.error("Failed to load results", err));
  }, []);


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

  function formatResults(attempts) {
    return attempts.map(att => ({
      id: att._id,

      subjectName: att.subjectName || "Unknown Subject",
      topicName: att.topicName || "Unknown Topic",

      examName: `Stage Test - ${att.stage}`,
      date: att.createdAt,
      type: "test",
      totalMarks: att.total,
      obtainedMarks: att.score,
      percentage: att.percent ?? Math.round((att.score / att.total) * 100),  // FIXED
      questions: att.questions || [],
      answers: att.answers || [],

      subjects: [
        {
          name: att.subjectName || att.subject?.name || att.subject || "Unknown Subject",
          topicName: att.topicName || att.topic?.name || att.topic || "Unknown Topic",
          marks: att.score,
          maxMarks: att.total,

          // FIXED: always compute percentage correctly
          percentage: att.percent ?? Math.round((att.score / att.total) * 100),

          grade:
            (att.percent ?? (att.score / att.total) * 100) >= 90 ? "A+" :
              (att.percent ?? (att.score / att.total) * 100) >= 80 ? "A" : "B",

          remarks:
            (att.percent ?? (att.score / att.total) * 100) >= 90 ? "Excellent" :
              (att.percent ?? (att.score / att.total) * 100) >= 80 ? "Very Good" :
                "Good"
        }
      ],

      topics: [
        {
          subject: att.subjectName || "Unknown Subject",
          topic: att.topicName || "Unknown Topic",
          correct: att.score,
          wrong: att.total - att.score
        }
      ]
    }));
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
  const overallPercentage =
    examResults.length > 0
      ? (examResults.reduce((acc, e) => acc + e.percentage, 0) / examResults.length).toFixed(2)
      : 0;
  // Pagination for exam tables
  const [examPage, setExamPage] = useState(1);
  const examsPerPage = 3;

  // Calculate pagination slices
  const totalExamPages = Math.ceil(filteredResults.length / examsPerPage);
  const paginatedExams = filteredResults.slice(
    (examPage - 1) * examsPerPage,
    examPage * examsPerPage
  );
  const hasResults = examResults.length > 0;

  const avgScore = hasResults
    ? (
      examResults.reduce((acc, exam) => acc + exam.percentage, 0) /
      examResults.length
    ).toFixed(1)
    : "0.0";

  const bestScore = hasResults
    ? Math.max(...examResults.map(exam => exam.percentage)).toFixed()
    : "0.0";

  const excellentCount = hasResults
    ? examResults.filter(exam => exam.percentage >= 85).length
    : 0;


  return (
    <div className="min-h-screen space-y-4 md:space-y-8 p-3 md:p-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Header */}
      <div className="relative z-10 overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 p-6 md:p-8 text-white shadow-2xl">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 md:p-3 bg-white/20 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-lg">
                <Trophy size={24} className="drop-shadow-lg md:hidden" />
                <Trophy size={36} className="drop-shadow-lg hidden md:block" />
              </div>
              <div>
                <h1 className="text-xl md:text-4xl font-extrabold tracking-tight drop-shadow-lg">
                  My Results
                </h1>
                <p className="hidden md:block text-sm md:text-base text-blue-100 mt-1">Track your academic performance and achievements</p>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-3 md:px-5 py-2 md:py-3 rounded-xl md:rounded-2xl shadow-lg border border-white/30">
              <p className="text-[10px] md:text-xs text-white/80">Class</p>
              <p className="text-sm md:text-xl font-bold text-white drop-shadow-lg">
                {user?.className || user?.class || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">

        {/* GPA */}
        <div className="bg-white/90 backdrop-blur-xl rounded-xl md:rounded-2xl p-3 md:p-6 shadow-md md:shadow-lg border border-gray-200/50 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <div className="p-2 md:p-3 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-lg md:rounded-xl">
              <Target className="w-4 h-4 md:w-6 md:h-6 text-yellow-600" />
            </div>
            <BarChart className="w-4 h-4 md:w-6 md:h-6 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-xl md:text-3xl font-extrabold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
              {examResults.length > 0 ? (overallPercentage / 25).toFixed(2) : 0}
            </h3>
            <p className="text-[11px] md:text-sm text-gray-600 mt-0.5 md:mt-1">GPA</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5 md:h-2">
              <div className="bg-gradient-to-r from-yellow-500 to-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min((overallPercentage / 25) * 25, 100)}%` }} />
            </div>
          </div>
        </div>

        {/* Overall Percentage */}
        <div className="bg-white/90 backdrop-blur-xl rounded-xl md:rounded-2xl p-3 md:p-6 shadow-md md:shadow-lg border border-gray-200/50 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <div className="p-2 md:p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg md:rounded-xl">
              <TrendingUp className="w-4 h-4 md:w-6 md:h-6 text-green-600" />
            </div>
            <GitGraphIcon className="w-4 h-4 md:w-6 md:h-6 text-green-400" />
          </div>
          <div>
            <h3 className="text-xl md:text-3xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{overallPercentage}%</h3>
            <p className="text-[11px] md:text-sm text-gray-600 mt-0.5 md:mt-1">Avg Score</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5 md:h-2">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${overallPercentage}%` }} />
            </div>
          </div>
        </div>

        {/* Total Exams */}
        <div className="bg-white/90 backdrop-blur-xl rounded-xl md:rounded-2xl p-3 md:p-6 shadow-md md:shadow-lg border border-gray-200/50 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <div className="p-2 md:p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg md:rounded-xl">
              <BookOpen className="w-4 h-4 md:w-6 md:h-6 text-purple-600" />
            </div>
            <BookPlus className="w-4 h-4 md:w-6 md:h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl md:text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{examResults.length}</h3>
            <p className="text-[11px] md:text-sm text-gray-600 mt-0.5 md:mt-1">Total Exams</p>
            <p className="text-[11px] md:text-xs text-green-600 mt-0.5 md:mt-1 font-medium">All completed</p>
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

      <div className="relative z-10 overflow-hidden rounded-xl md:rounded-2xl p-4 md:p-6 bg-white/90 backdrop-blur-xl shadow-lg border border-gray-200/50">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/60 via-purple-50/60 to-pink-50/60 pointer-events-none"></div>

        <h3 className="relative z-10 text-sm md:text-lg font-bold text-gray-800 mb-3 md:mb-5 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 md:w-6 md:h-6 text-indigo-600" />
          Performance Summary
        </h3>

        <div className="relative z-10 grid grid-cols-3 gap-2 md:gap-6">
          {/* AVERAGE SCORE */}
          <div className="flex flex-col items-center bg-gradient-to-br from-indigo-500 to-blue-600 text-white p-3 md:p-6 rounded-xl md:rounded-2xl shadow-md">
            <div className="text-xl md:text-4xl font-extrabold">{avgScore}%</div>
            <div className="text-[10px] md:text-sm text-indigo-100 mt-1 md:mt-2 text-center">Avg Score</div>
            <ChartSpline className="w-4 h-4 md:w-7 md:h-7 text-white/80 mt-1 md:mt-2" />
          </div>

          {/* BEST PERFORMANCE */}
          <div className="flex flex-col items-center bg-gradient-to-br from-green-500 to-emerald-600 text-white p-3 md:p-6 rounded-xl md:rounded-2xl shadow-md">
            <div className="text-xl md:text-4xl font-extrabold">{bestScore}%</div>
            <div className="text-[10px] md:text-sm text-green-100 mt-1 md:mt-2 text-center">Best</div>
            <Medal className="w-4 h-4 md:w-7 md:h-7 text-white/80 mt-1 md:mt-2" />
          </div>

          {/* EXCELLENT SCORES */}
          <div className="flex flex-col items-center bg-gradient-to-br from-purple-500 to-pink-600 text-white p-3 md:p-6 rounded-xl md:rounded-2xl shadow-md">
            <div className="text-xl md:text-4xl font-extrabold">{excellentCount}/{examResults.length || 0}</div>
            <div className="text-[10px] md:text-sm text-purple-100 mt-1 md:mt-2 text-center">Excellent</div>
            <Sparkles className="w-4 h-4 md:w-7 md:h-7 text-white/80 mt-1 md:mt-2" />
          </div>
        </div>
      </div>

      {/* Exam Results */}
      <div className="relative z-10 space-y-3 md:space-y-6">
        {paginatedExams.map((exam) => (
          <div key={exam.id} className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-md md:shadow-lg border border-gray-200/50 overflow-hidden">

            {/* Card Header — shared mobile + desktop */}
            <div className="p-4 md:p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl">
                    <FileText className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" />
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
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
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
                  onClick={() => openExamDetails(exam)}
                  className="w-full py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md active:scale-95 transition-all"
                >
                  View Details
                </button>
              </div>
            </div>

            {/* DESKTOP: Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
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
                    <tr key={subIndex} className="hover:bg-indigo-50/30 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
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
                          onClick={() => openExamDetails(exam)}
                          className="px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        ))}
      </div>
      {/* Pagination Controls */}
      {totalExamPages > 1 && (
        <div className="relative z-10 flex justify-center items-center gap-2 md:gap-3 mt-4 md:mt-6">

          {/* Prev */}
          <button
            className="flex items-center gap-1.5 px-3 md:px-4 py-2 md:py-2.5 rounded-xl bg-white/90 border border-gray-200 text-gray-700 font-semibold text-xs md:text-sm shadow-sm hover:shadow-md hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
            disabled={examPage === 1}
            onClick={() => setExamPage(examPage - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden md:inline">Previous</span>
          </button>

          {/* MOBILE: compact page indicator */}
          <span className="md:hidden text-sm font-bold text-gray-800 bg-white/90 px-4 py-2 rounded-xl border border-gray-200 shadow-sm min-w-[72px] text-center">
            {examPage} <span className="text-gray-400 font-normal text-xs">/ {totalExamPages}</span>
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
            className="flex items-center gap-1.5 px-3 md:px-4 py-2 md:py-2.5 rounded-xl bg-white/90 border border-gray-200 text-gray-700 font-semibold text-xs md:text-sm shadow-sm hover:shadow-md hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
            disabled={examPage === totalExamPages || totalExamPages === 0}
            onClick={() => setExamPage(examPage + 1)}
          >
            <span className="hidden md:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>

        </div>
      )}

      {/* ---------------- MODAL VIEW ---------------- */}
      {showModal && activeExam && (
        <div
          className="fixed inset-x-0 top-0 bottom-16 md:bottom-0 z-[80] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-2 md:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div
            className="relative w-full md:max-w-3xl rounded-t-3xl md:rounded-3xl bg-gradient-to-br from-white via-indigo-50 to-purple-50 shadow-2xl border border-white/60 overflow-hidden flex flex-col"
            style={{ maxHeight: "calc(100dvh - 4.5rem)" }}
          >
            {/* Drag handle — mobile only */}
            <div className="md:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            {/* Decorative blobs */}
            <div className="absolute -top-16 -right-16 w-56 h-56 bg-purple-300/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-indigo-300/20 rounded-full blur-3xl pointer-events-none" />

            {/* Sticky modal header */}
            <div className="relative z-10 flex items-center justify-between px-5 md:px-8 py-4 md:py-6 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
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
              <div className="rounded-xl md:rounded-2xl bg-white/90 border border-gray-100 shadow-sm p-4 md:p-6">
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
              <div className="rounded-xl md:rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-100 border border-blue-100 p-4 md:p-5">
                <h3 className="text-sm md:text-base font-bold text-blue-800 flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4" /> Subject & Topic
                </h3>
                <p className="text-xs md:text-sm text-gray-800"><span className="font-semibold">Subject:</span> {activeExam.subjectName}</p>
                <p className="text-xs md:text-sm text-gray-800 mt-1"><span className="font-semibold">Topic:</span> {activeExam.topicName}</p>
              </div>

              {/* SCORE TIP */}
              <div className="rounded-xl md:rounded-2xl bg-gradient-to-r from-green-50 to-emerald-100 border border-green-100 p-4 md:p-5">
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
                      <div key={q._id || `q-${index}`} className="p-4 md:p-5 rounded-xl md:rounded-2xl bg-white/90 shadow-sm border border-gray-100">
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
