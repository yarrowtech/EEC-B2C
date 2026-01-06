import React, { useState, useEffect } from 'react';
import {
  FileText,
  Award,
  TrendingUp,
  Download,
  Target,
  BookOpen,
  Calendar,
  BarChart3,
  Star,
  Trophy,
  ChevronDown,
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
  TrophyIcon,
  GitGraphIcon,
  BookPlus
} from 'lucide-react';
import { getJSON } from '../lib/api';

const ResultsView = () => {
  const [selectedSemester, setSelectedSemester] = useState('current');
  const [selectedExam, setSelectedExam] = useState('all');
  const [examResults, setExamResults] = useState([]);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user._id || user.id;
  const [classRank, setClassRank] = useState(null);
  const [totalStudents, setTotalStudents] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeExam, setActiveExam] = useState(null);
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  useEffect(() => {
    if (!userId) return;

    fetch(`${API}/api/exams/class-rank/${userId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setClassRank(data.rank);
          setTotalStudents(data.totalStudents);
        }
      })
      .catch(err => console.error("Rank fetch error", err));
  }, []);

  useEffect(() => {
    if (!showModal || !activeExam) return;
    let mounted = true;

    async function hydrateQuestions() {
      const questions = Array.isArray(activeExam.questions) ? activeExam.questions : [];
      if (!questions.length) return;

      const answerMap = new Map(
        (activeExam.answers || []).map((a) => [String(a.qid), a])
      );

      const needsFetch = questions.some(
        (q) =>
          typeof q === "string" ||
          (!q?.question && !q?.choiceMatrix?.prompt)
      );

      if (!needsFetch) return;

      const ids = questions
        .map((q) => (typeof q === "string" ? q : q?._id))
        .filter(Boolean)
        .map(String);

      const uniqueIds = [...new Set(ids)];
      const fetched = await Promise.all(
        uniqueIds.map((qid) => getJSON(`/api/questions/${qid}`).catch(() => null))
      );

      const fetchedMap = new Map(
        fetched.filter(Boolean).map((q) => [String(q._id), q])
      );

      const nextQuestions = questions.map((q) => {
        const id = typeof q === "string" ? q : q?._id;
        const base = typeof q === "object" ? q : null;
        const full = fetchedMap.get(String(id)) || base;
        if (!full) return q;
        return {
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
  }, [showModal, activeExam]);

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

    fetch(`${API}/api/exams/user-results/${userId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setExamResults(formatResults(data.results));
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

  function formatAnswerText(q, answerKeys, trueFalseValue) {
    if (q.type === "true-false") {
      if (!trueFalseValue) return "—";
      return trueFalseValue.toString().toLowerCase() === "true" ? "True" : "False";
    }

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
    <div className="min-h-screen space-y-6 md:space-y-8 p-4 sm:p-6 md:p-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                <Trophy size={40} className="drop-shadow-lg" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-lg">
                  My Results
                </h1>
                <p className="text-sm md:text-base text-blue-100 mt-1">Track your academic performance and achievements</p>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-4 sm:px-5 py-3 rounded-xl md:rounded-2xl shadow-lg border border-white/30">
              <p className="text-xs text-white/80">Current Class</p>
              <p className="text-lg sm:text-xl font-bold text-white drop-shadow-lg">
                {user?.className || user?.class || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">

        {/* GPA */}
        <div className="bg-white/90 backdrop-blur-xl rounded-xl md:rounded-2xl p-5 md:p-6 shadow-lg hover:shadow-2xl border border-gray-200/50 transform hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Target className="w-6 h-6 text-yellow-600" />
            </div>
            <BarChart className="w-6 h-6 text-yellow-400" />
          </div>

          <div>
            <h3 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
              {examResults.length > 0
                ? (overallPercentage / 25).toFixed(2)
                : 0}
            </h3>
            <p className="text-xs md:text-sm text-gray-600 mt-1">GPA (Auto Calculated)</p>

            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-yellow-500 to-amber-500 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((overallPercentage / 25) * 25, 100)}%`
                }}
              />
            </div>
          </div>
        </div>

        {/* Rank */}
        <div className="bg-white/90 backdrop-blur-xl rounded-xl md:rounded-2xl p-5 md:p-6 shadow-lg hover:shadow-2xl border border-gray-200/50 transform hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Award className="w-6 h-6 text-blue-600" />
            </div>
            <TrophyIcon className="w-6 h-6 text-blue-400" />
          </div>

          <div>
            <h3 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              #{classRank ?? "—"}
            </h3>
            <p className="text-xs md:text-sm text-gray-600 mt-1">Class Rank</p>
            <p className="text-xs text-gray-500 mt-1">
              out of {totalStudents ?? "—"} students
            </p>
          </div>
        </div>

        {/* Overall Percentage */}
        <div className="bg-white/90 backdrop-blur-xl rounded-xl md:rounded-2xl p-5 md:p-6 shadow-lg hover:shadow-2xl border border-gray-200/50 transform hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <GitGraphIcon className="w-6 h-6 text-green-400" />
          </div>

          <div>
            <h3 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{overallPercentage}%</h3>
            <p className="text-xs md:text-sm text-gray-600 mt-1">Overall Average</p>

            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${overallPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Total Exams */}
        <div className="bg-white/90 backdrop-blur-xl rounded-xl md:rounded-2xl p-5 md:p-6 shadow-lg hover:shadow-2xl border border-gray-200/50 transform hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <BookPlus className="w-6 h-6 text-purple-400" />
          </div>

          <div>
            <h3 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{examResults.length}</h3>
            <p className="text-xs md:text-sm text-gray-600 mt-1">Total Exams</p>
            <p className="text-xs text-green-600 mt-1 font-medium">All completed</p>
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

      <div className="relative z-10 overflow-hidden rounded-xl md:rounded-2xl p-5 md:p-6 bg-white/90 backdrop-blur-xl shadow-lg hover:shadow-2xl border border-gray-200/50">

        {/* subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/60 via-purple-50/60 to-pink-50/60 pointer-events-none"></div>

        <h3 className="relative z-10 text-base md:text-lg font-bold text-gray-800 mb-4 md:mb-5 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" />
          Performance Summary
        </h3>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">

          {/* AVERAGE SCORE */}
          <div className="flex flex-col items-center bg-gradient-to-br from-indigo-500 to-blue-600 text-white p-5 md:p-6 rounded-xl md:rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 w-full">
            <div className="text-3xl md:text-4xl font-extrabold drop-shadow-lg">
              {avgScore}%
            </div>
            <div className="text-xs md:text-sm text-indigo-100 mt-2">Average Score</div>
            <ChartSpline className="w-6 h-6 md:w-7 md:h-7 text-white/80 mt-2" />
          </div>

          {/* BEST PERFORMANCE */}
          <div className="flex flex-col items-center bg-gradient-to-br from-green-500 to-emerald-600 text-white p-5 md:p-6 rounded-xl md:rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 w-full">
            <div className="text-3xl md:text-4xl font-extrabold drop-shadow-lg">
              {bestScore}%
            </div>
            <div className="text-xs md:text-sm text-green-100 mt-2">Best Performance</div>
            <Medal className="w-6 h-6 md:w-7 md:h-7 text-white/80 mt-2" />
          </div>

          {/* EXCELLENT SCORES */}
          <div className="flex flex-col items-center bg-gradient-to-br from-purple-500 to-pink-600 text-white p-5 md:p-6 rounded-xl md:rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 w-full">
            <div className="text-3xl md:text-4xl font-extrabold drop-shadow-lg">
              {excellentCount}/{examResults.length || 0}
            </div>
            <div className="text-xs md:text-sm text-purple-100 mt-2">Excellent Scores</div>
            <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-white/80 mt-2" />
          </div>

        </div>
      </div>

      {/* Exam Results */}
      <div className="relative z-10 space-y-4 md:space-y-6">
        {paginatedExams.map((exam) => (
          <div key={exam.id} className="bg-white/90 backdrop-blur-xl rounded-xl md:rounded-2xl shadow-lg hover:shadow-2xl border border-gray-200/50 overflow-hidden">
            <div className="p-5 md:p-6 border-b border-gray-200/50 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl">
                      <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-base md:text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">{exam.examName}</h3>
                      <p className="text-xs md:text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                        {new Date(exam.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="text-right">
                    <p className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{exam.percentage}%</p>
                    <p className="text-xs md:text-sm text-gray-500 font-medium">{exam.obtainedMarks}/{exam.totalMarks} marks</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl">
                    <Trophy className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-gray-700">Subject</th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-gray-700">Marks Obtained</th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-gray-700">Percentage</th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-gray-700">Grade</th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-gray-700">Performance</th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-gray-700">Remarks</th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/50">
                  {exam.subjects.map((subject, subIndex) => (
                    <tr key={subIndex} className="hover:bg-indigo-50/30 transition-colors duration-200">
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
                            <BookOpen className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
                          </div>

                          <div className="font-medium text-gray-900">
                            <div className="text-xs md:text-sm">{subject.name || "Subject"}</div>
                            <div className="text-xs text-gray-500">
                              {subject.topicName || "Topic"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        <div className="text-xs md:text-sm">
                          <span className="font-bold text-gray-900">{subject.marks}</span>
                          <span className="text-gray-500">/{subject.maxMarks}</span>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        <div className="font-bold text-xs md:text-sm bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{subject.percentage}%</div>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        <span className={`inline-flex px-2 md:px-3 py-1 text-xs font-bold rounded-full border ${getGradeColor(subject.grade)}`}>
                          {subject.grade}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 md:h-3">
                          <div
                            className={`h-2.5 md:h-3 rounded-full transition-all duration-500 ${getPerformanceColor(subject.percentage)}`}
                            style={{ width: `${subject.percentage}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1 font-medium">{subject.percentage}%</div>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        <span className={`text-xs md:text-sm font-bold ${subject.remarks === 'Excellent' || subject.remarks === 'Outstanding' ? 'text-green-600' :
                          subject.remarks === 'Very Good' ? 'text-blue-600' :
                            subject.remarks === 'Good' ? 'text-yellow-600' :
                              'text-gray-600'
                          }`}>
                          {subject.remarks}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        <button
                          onClick={() => {
                            setActiveExam(exam);
                            setShowModal(true);
                          }}
                          className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
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
      {/* Pagination Controls for Exam Tables */}
      <div className="relative z-10 flex justify-center items-center gap-2 md:gap-3 mt-6">
        <button
          className="px-3 md:px-4 py-2 rounded-lg md:rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200/50 text-gray-700 font-medium text-sm md:text-base hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-600 hover:text-white hover:border-transparent disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-300"
          disabled={examPage === 1}
          onClick={() => setExamPage(examPage - 1)}
        >
          Previous
        </button>

        {[...Array(totalExamPages)].map((_, i) => (
          <button
            key={i}
            onClick={() => setExamPage(i + 1)}
            className={`px-3 md:px-4 py-2 rounded-lg md:rounded-xl font-bold text-sm md:text-base transition-all duration-300 ${examPage === i + 1
              ? "bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 text-white shadow-lg scale-110"
              : "bg-white/80 backdrop-blur-sm text-gray-700 border border-gray-200/50 hover:border-indigo-300 hover:bg-indigo-50 shadow-md hover:shadow-lg"
              }`}
          >
            {i + 1}
          </button>
        ))}

        <button
          className="px-3 md:px-4 py-2 rounded-lg md:rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200/50 text-gray-700 font-medium text-sm md:text-base hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-600 hover:text-white hover:border-transparent disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-300"
          disabled={examPage === totalExamPages}
          onClick={() => setExamPage(examPage + 1)}
        >
          Next
        </button>
      </div>

      {/* ---------------- MODAL VIEW ---------------- */}
      {showModal && activeExam && (
        <div
          className="
      fixed inset-0 z-50
      bg-gradient-to-br from-black/60 via-black/50 to-black/70
      backdrop-blur-lg
      flex items-center justify-center p-4
      animate-fadeIn
    "
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div
            className="
        relative w-full max-w-3xl
        rounded-2xl md:rounded-3xl
        bg-gradient-to-br from-white via-indigo-50 to-purple-50
        shadow-[0_40px_100px_rgba(0,0,0,0.35)]
        border border-white/60
        animate-scaleIn
        overflow-hidden p-6 md:p-10
      "
            style={{ maxHeight: "90vh" }}
          >
            {/* Decorative blobs */}
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-purple-300/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-indigo-300/30 rounded-full blur-3xl" />

            {/* INNER SCROLL */}
            <div
              className="relative z-10 overflow-y-auto pr-3 custom-scrollbar-hide"
              style={{ maxHeight: "80vh" }}
            >
              {/* CLOSE BUTTON */}
              <button
                onClick={() => setShowModal(false)}
                className="
            absolute top-3 right-3 md:top-5 md:right-5
            bg-gradient-to-br from-red-500 to-pink-600
            text-white p-2 rounded-full
            shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300
          "
              >
                <XCircle className="w-5 h-5" />
              </button>

              {/* HEADER */}
              <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
                <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl">
                  <Trophy className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Performance Report
                </h2>
              </div>

              {/* STUDENT INFO */}
              <div className="mb-5 md:mb-6 p-4 md:p-6 rounded-xl md:rounded-2xl bg-white/90 backdrop-blur-sm shadow-lg border border-gray-200/50">
                <h3 className="text-base md:text-lg font-bold text-indigo-700 flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 md:w-5 md:h-5" />
                  Student Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 text-xs md:text-sm text-gray-700">
                  <p><strong>Name:</strong> {user?.name}</p>
                  <p><strong>Class:</strong> {user?.class || user?.className}</p>
                  <p><strong>Exam:</strong> {activeExam.examName}</p>
                  <p><strong>Date:</strong> {new Date(activeExam.date).toLocaleString()}</p>
                </div>
              </div>

              {/* SUBJECT & TOPIC */}
              <div className="mb-5 md:mb-6 p-4 md:p-6 rounded-xl md:rounded-2xl bg-gradient-to-r from-blue-100 to-indigo-200 shadow-lg">
                <h3 className="text-base md:text-lg font-bold text-blue-800 flex items-center gap-2 mb-2 md:mb-3">
                  <BookOpen className="w-4 h-4 md:w-5 md:h-5" />
                  Subject & Topic
                </h3>

                <p className="text-xs md:text-sm text-gray-800"><strong>Subject:</strong> {activeExam.subjectName}</p>
                <p className="text-xs md:text-sm text-gray-800"><strong>Topic:</strong> {activeExam.topicName}</p>
              </div>

              {/* SCORE TIP */}
              <div className="mb-6 md:mb-8 p-4 md:p-6 rounded-xl md:rounded-2xl bg-gradient-to-r from-green-100 to-emerald-200 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
                  <h4 className="text-sm md:text-base font-bold text-emerald-700">
                    Smart Improvement Tip
                  </h4>
                </div>

                <p className="text-gray-700 text-xs md:text-sm leading-relaxed">
                  {getSmartTip(activeExam.percent)}
                </p>
                <p className="text-emerald-700 text-xs md:text-sm font-semibold mt-2">
                  {getMotivation(activeExam.percent)}
                </p>
              </div>

              {/* QUESTION BREAKDOWN */}
              <h3 className="text-2xl font-extrabold text-purple-700 mb-4 flex items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                Question Breakdown
              </h3>

              <div className="space-y-6">
                {activeExam.questions.map((q, index) => {
                  const userAns = formatAnswerText(
                    q,
                    q.userAnswer?.mcq,
                    q.userAnswer?.trueFalse
                  );
                  const correctAns = formatAnswerText(q, q.correct);
                  const isCorrect =
                    q.type === "choice-matrix"
                      ? isChoiceMatrixCorrect(q)
                      : userAns === correctAns;

                  return (
                    <div
                      key={q._id}
                      className="
                  p-6 rounded-2xl
                  bg-white/90
                  shadow-lg
                  border border-white
                  hover:scale-[1.02]
                  transition-all
                "
                    >
                      <p className="font-semibold text-gray-900 mb-3 flex items-start gap-2">
                        <Sparkles className="w-5 h-5 text-yellow-500 mt-1" />
                        {index + 1}. {q.type === "choice-matrix" ? q.choiceMatrix?.prompt : q.question}
                      </p>

                      {q.type === "choice-matrix" ? (
                        <>
                          <p className="text-green-700 text-sm font-semibold">
                            Correct Answer:
                            <span className="ml-2 px-2 py-0.5 rounded bg-green-100">
                              {formatChoiceMatrixCorrect(q)}
                            </span>
                          </p>
                          <p className="text-blue-700 text-sm font-semibold mt-1">
                            Your Answer:
                            <span className="ml-2 px-2 py-0.5 rounded bg-blue-100">
                              {formatChoiceMatrixUser(q)}
                            </span>
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-green-700 text-sm font-semibold">
                            Correct Answer:
                            <span className="ml-2 px-2 py-0.5 rounded bg-green-100">
                              {correctAns}
                            </span>
                          </p>

                          <p className="text-blue-700 text-sm font-semibold mt-1">
                            Your Answer:
                            <span className="ml-2 px-2 py-0.5 rounded bg-blue-100">
                              {userAns}
                            </span>
                          </p>
                        </>
                      )}

                      <span
                        className={`
                    inline-block mt-4 px-4 py-1 rounded-full text-xs font-bold
                    ${isCorrect
                            ? "bg-green-200 text-green-800"
                            : "bg-red-200 text-red-800"}
                  `}
                      >
                        {isCorrect ? "🎉 Correct" : "❌ Incorrect"}
                      </span>
                    </div>
                  );
                })}
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
