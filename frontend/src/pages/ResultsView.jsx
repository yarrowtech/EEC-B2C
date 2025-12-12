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
  Lightbulb
} from 'lucide-react';

const ResultsView = () => {
  const [selectedSemester, setSelectedSemester] = useState('current');
  const [selectedExam, setSelectedExam] = useState('all');
  const [examResults, setExamResults] = useState([]);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user._id || user.id;
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
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
          name: att.subjectName || "Unknown Subject",
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
  const [showModal, setShowModal] = useState(false);
  const [activeExam, setActiveExam] = useState(null);
  // Pagination for exam tables
  const [examPage, setExamPage] = useState(1);
  const examsPerPage = 3;

  // Calculate pagination slices
  const totalExamPages = Math.ceil(filteredResults.length / examsPerPage);
  const paginatedExams = filteredResults.slice(
    (examPage - 1) * examsPerPage,
    examPage * examsPerPage
  );


  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 rounded-2xl p-6 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-32 h-32 bg-white rounded-full"></div>
          <div className="absolute bottom-4 left-4 w-24 h-24 bg-white rounded-full"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="w-8 h-8 text-yellow-200" />
                <h1 className="text-3xl font-bold">My Results</h1>
              </div>
              <p className="text-yellow-100">Track your academic performance and achievements</p>
            </div>
            <div className="text-right">
              <p className="text-yellow-100 text-sm mb-1">Current Class</p>
              <p className="text-xl font-semibold">
                {user?.className || user?.class || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* GPA */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-yellow-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Target className="w-6 h-6 text-yellow-600" />
            </div>
            <span className="text-2xl">📊</span>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-gray-800">
              {examResults.length > 0
                ? (overallPercentage / 25).toFixed(2)
                : 0}
            </h3>
            <p className="text-gray-600 text-sm">GPA (Auto Calculated)</p>

            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-yellow-500 h-2 rounded-full"
                style={{
                  width: `${Math.min((overallPercentage / 25) * 25, 100)}%`
                }}
              />
            </div>
          </div>
        </div>

        {/* Rank */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Award className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-2xl">🏆</span>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-gray-800">#1</h3>
            <p className="text-gray-600 text-sm">Class Rank</p>
            <p className="text-xs text-gray-500 mt-1">out of 1 students</p>
          </div>
        </div>

        {/* Overall Percentage */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-green-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-2xl">📈</span>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-gray-800">{overallPercentage}%</h3>
            <p className="text-gray-600 text-sm">Overall Average</p>

            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${overallPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Total Exams */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-purple-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-2xl">📚</span>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-gray-800">{examResults.length}</h3>
            <p className="text-gray-600 text-sm">Total Exams</p>
            <p className="text-xs text-green-600 mt-1">All completed</p>
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

      <div className="relative overflow-hidden rounded-2xl p-6 bg-white/60 backdrop-blur-md shadow-[0_8px_24px_-6px_rgba(0,0,0,0.15)] border border-white/70 transition-all hover:shadow-[0_12px_32px_-4px_rgba(0,0,0,0.25)] hover:scale-[1.01] duration-300">

        {/* subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/60 via-purple-50/60 to-pink-50/60 pointer-events-none"></div>

        <h3 className="relative z-10 text-lg font-semibold text-slate-800 mb-5 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          Performance Summary
        </h3>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* AVERAGE SCORE */}
          <div className="flex flex-col items-center bg-gradient-to-br from-indigo-500 to-blue-600 text-white p-4 rounded-xl shadow-md w-full">
            <div className="text-3xl font-bold drop-shadow-sm">
              {(examResults.reduce((acc, exam) => acc + exam.percentage, 0) / examResults.length).toFixed(1)}%
            </div>
            <div className="text-sm text-indigo-100 mt-1">Average Score</div>
            <span className="text-white/80 text-lg mt-1"> <ChartSpline /> </span>
          </div>

          {/* BEST PERFORMANCE */}
          <div className="flex flex-col items-center bg-gradient-to-br from-green-500 to-emerald-600 text-white p-4 rounded-xl shadow-md w-full">
            <div className="text-3xl font-bold drop-shadow-sm">
              {Math.max(...examResults.map(exam => exam.percentage)).toFixed(1)}%
            </div>
            <div className="text-sm text-green-100 mt-1">Best Performance</div>
            <span className="text-white/80 text-lg mt-1"><Medal /> </span>
          </div>

          {/* EXCELLENT SCORES */}
          <div className="flex flex-col items-center bg-gradient-to-br from-purple-500 to-pink-600 text-white p-4 rounded-xl shadow-md w-full">
            <div className="text-3xl font-bold drop-shadow-sm">
              {examResults.filter(exam => exam.percentage >= 85).length}/{examResults.length}
            </div>
            <div className="text-sm text-purple-100 mt-1">Excellent Scores</div>
            <span className="text-white/80 text-lg mt-1"> <Sparkles /> </span>
          </div>

        </div>
      </div>

      {/* Exam Results */}
      <div className="space-y-6">
        {paginatedExams.map((exam) => (
          <div key={exam.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <FileText className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{exam.examName}</h3>
                      <p className="text-sm text-gray-500">Date: {new Date(exam.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-2xl font-bold text-yellow-600">{exam.percentage}%</p>
                      <p className="text-sm text-gray-500">{exam.obtainedMarks}/{exam.totalMarks} marks</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Trophy className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Subject</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Marks Obtained</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Percentage</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Grade</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Performance</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Remarks</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {exam.subjects.map((subject, subIndex) => (
                    <tr key={subIndex} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <BookOpen className="w-4 h-4 text-blue-600" />
                          </div>

                          <div className="font-medium text-gray-900">
                            {/* SUBJECT NAME */}
                            {subject.name || "Subject"}

                            {/* TOPIC NAME */}
                            <div className="text-xs text-gray-500">
                              {subject.topicName || "Topic"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <span className="font-semibold text-gray-900">{subject.marks}</span>
                          <span className="text-gray-500">/{subject.maxMarks}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{subject.percentage}%</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getGradeColor(subject.grade)}`}>
                          {subject.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-300 ${getPerformanceColor(subject.percentage)}`}
                            style={{ width: `${subject.percentage}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{subject.percentage}%</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium ${subject.remarks === 'Excellent' || subject.remarks === 'Outstanding' ? 'text-green-600' :
                          subject.remarks === 'Very Good' ? 'text-blue-600' :
                            subject.remarks === 'Good' ? 'text-yellow-600' :
                              'text-gray-600'
                          }`}>
                          {subject.remarks}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setActiveExam(exam);
                            setShowModal(true);
                          }}
                          className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
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
      <div className="flex justify-center items-center gap-3 mt-6">
        <button
          className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
          disabled={examPage === 1}
          onClick={() => setExamPage(examPage - 1)}
        >
          Previous
        </button>

        {[...Array(totalExamPages)].map((_, i) => (
          <button
            key={i}
            onClick={() => setExamPage(i + 1)}
            className={`px-3 py-1 rounded-lg border text-sm ${examPage === i + 1
                ? "bg-yellow-500 text-white"
                : "bg-white text-gray-700"
              }`}
          >
            {i + 1}
          </button>
        ))}

        <button
          className="px-4 py-2 bg-gray-300 rounded-lg disabled:opacity-50"
          disabled={examPage === totalExamPages}
          onClick={() => setExamPage(examPage + 1)}
        >
          Next
        </button>
      </div>

      {/* ---------------- MODAL VIEW ---------------- */}
      {showModal && activeExam && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div
            className="relative bg-white/80 rounded-3xl shadow-xl w-full max-w-3xl p-8 animate-scaleIn border border-white/40"
            style={{ maxHeight: "90vh" }}
          >
            {/* INNER SCROLL AREA */}
            <div className="overflow-y-auto custom-scrollbar-hide pr-3" style={{ maxHeight: "80vh" }}>

              {/* CLOSE BUTTON */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 bg-red-500/10 text-red-600 p-2 rounded-full hover:bg-red-500/20 transition"
              >
                <XCircle className="w-5 h-5" />
              </button>

              {/* HEADER */}
              <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center gap-3">
                <Trophy className="w-8 h-8 text-yellow-500 drop-shadow" />
                Detailed Performance Report
              </h2>

              {/* STUDENT INFO */}
              <div className="mb-6 p-5 rounded-2xl shadow-sm bg-white">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-3">
                  <User className="w-5 h-5 text-amber-600" />
                  Student Information
                </h3>

                <div className="space-y-1 text-gray-700 text-sm">
                  <p><strong>Name:</strong> {user?.name}</p>
                  <p><strong>Class:</strong> {user?.class || user?.className}</p>
                  <p><strong>Exam:</strong> {activeExam.examName}</p>
                  <p><strong>Date:</strong> {new Date(activeExam.date).toLocaleString()}</p>
                </div>
              </div>

              {/* SUBJECT & TOPIC */}
              <div className="mb-6 p-5 rounded-2xl border shadow-sm bg-gradient-to-r from-blue-50 to-indigo-100/60">
                <h3 className="text-lg font-semibold text-blue-700 flex items-center gap-2 mb-2">
                  <BookOpen className="w-5 h-5 text-blue-700" />
                  Subject & Topic
                </h3>

                <p className="text-gray-800"><strong>Subject:</strong> {activeExam.subjectName}</p>
                <p className="text-gray-800"><strong>Topic:</strong> {activeExam.topicName}</p>
              </div>

              {/* SCORE SUGGESTION SECTION */}
              <div className="mb-6 p-5 rounded-2xl border shadow-md bg-gradient-to-r from-green-50 to-emerald-100/60">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-semibold text-emerald-700">Score Improvement Tip</h4>
                </div>

                <p className="text-gray-700 text-sm leading-relaxed">
                  {activeExam.percent >= 90
                    ? "🔥 Incredible! Try harder-level questions to achieve mastery."
                    : activeExam.percent >= 75
                      ? "👏 Great work! Strengthen weak areas to hit the 90%+ zone."
                      : activeExam.percent >= 50
                        ? "📘 You're improving! Focus on reviewing incorrect answers."
                        : "🌱 Start from basics and build confidence step-by-step. You can do it!"}
                </p>
              </div>

              {/* QUESTION BREAKDOWN */}
              <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-purple-600" />
                Question Breakdown
              </h3>

              <div className="space-y-5">
                {activeExam.questions.map((q, index) => {
                  const userAns =
                    q.userAnswer?.mcq?.join(", ") ||
                    q.userAnswer?.trueFalse ||
                    "—";

                  const correctAns = q.correct.join(", ");
                  const isCorrect = userAns === correctAns;

                  return (
                    <div
                      key={q._id}
                      className="p-5 rounded-2xl border shadow-sm bg-white/70 backdrop-blur-md hover:shadow-lg transition-all"
                    >
                      {/* QUESTION TITLE */}
                      <p className="font-semibold text-gray-900 mb-3 flex items-start gap-2">
                        <Sparkles className="w-5 h-5 text-yellow-500 mt-1" />
                        {index + 1}. {q.question}
                      </p>

                      {/* Correct Answer */}
                      <p className="text-green-700 text-sm font-semibold">
                        Correct Answer:{" "}
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          {correctAns}
                        </span>
                      </p>

                      {/* User Answer */}
                      <p className="text-blue-700 text-sm font-semibold mt-1">
                        Your Answer:{" "}
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          {userAns}
                        </span>
                      </p>

                      {/* STATUS BADGE */}
                      <span
                        className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold ${isCorrect
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                          }`}
                      >
                        {isCorrect ? "Correct ✔" : "Incorrect ✘"}
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