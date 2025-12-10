import React, { useState } from 'react';
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
  Eye
} from 'lucide-react';

const ResultsView = () => {
  const [selectedSemester, setSelectedSemester] = useState('current');
  const [selectedExam, setSelectedExam] = useState('all');

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

  const examResults = [
    {
      id: 1,
      examName: "Final Examination",
      date: "2024-03-15",
      type: "final",
      status: "completed",
      totalMarks: 500,
      obtainedMarks: 445,
      percentage: 89.0,
      subjects: [
        { name: "Mathematics", marks: 95, maxMarks: 100, grade: "A+", percentage: 95, remarks: "Excellent" },
        { name: "Physics", marks: 88, maxMarks: 100, grade: "A", percentage: 88, remarks: "Very Good" },
        { name: "Chemistry", marks: 85, maxMarks: 100, grade: "A", percentage: 85, remarks: "Good" },
        { name: "English", marks: 92, maxMarks: 100, grade: "A+", percentage: 92, remarks: "Excellent" },
        { name: "Biology", marks: 85, maxMarks: 100, grade: "A", percentage: 85, remarks: "Good" }
      ]
    },
    {
      id: 2,
      examName: "Mid-Term Examination",
      date: "2024-02-15",
      type: "midterm",
      status: "completed",
      totalMarks: 500,
      obtainedMarks: 440,
      percentage: 88.0,
      subjects: [
        { name: "Mathematics", marks: 92, maxMarks: 100, grade: "A+", percentage: 92, remarks: "Excellent" },
        { name: "Physics", marks: 86, maxMarks: 100, grade: "A", percentage: 86, remarks: "Very Good" },
        { name: "Chemistry", marks: 83, maxMarks: 100, grade: "B+", percentage: 83, remarks: "Good" },
        { name: "English", marks: 90, maxMarks: 100, grade: "A", percentage: 90, remarks: "Very Good" },
        { name: "Biology", marks: 89, maxMarks: 100, grade: "A", percentage: 89, remarks: "Very Good" }
      ]
    },
    {
      id: 3,
      examName: "Unit Test 3",
      date: "2024-01-20",
      type: "unit",
      status: "completed",
      totalMarks: 300,
      obtainedMarks: 275,
      percentage: 91.7,
      subjects: [
        { name: "Mathematics", marks: 58, maxMarks: 60, grade: "A+", percentage: 96.7, remarks: "Outstanding" },
        { name: "Physics", marks: 52, maxMarks: 60, grade: "A", percentage: 86.7, remarks: "Very Good" },
        { name: "Chemistry", marks: 55, maxMarks: 60, grade: "A", percentage: 91.7, remarks: "Excellent" },
        { name: "English", marks: 56, maxMarks: 60, grade: "A+", percentage: 93.3, remarks: "Excellent" },
        { name: "Biology", marks: 54, maxMarks: 60, grade: "A", percentage: 90.0, remarks: "Very Good" }
      ]
    }
  ];

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
              <p className="text-yellow-100 text-sm mb-1">Current Semester</p>
              <p className="text-xl font-semibold">{studentData.semester}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-yellow-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Target className="w-6 h-6 text-yellow-600" />
            </div>
            <span className="text-2xl">📊</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">{studentData.currentGPA}</h3>
            <p className="text-gray-600 text-sm">Current GPA</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full" 
                style={{ width: `${(studentData.currentGPA / 4.0) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Award className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-2xl">🏆</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">#{studentData.rank}</h3>
            <p className="text-gray-600 text-sm">Class Rank</p>
            <p className="text-xs text-gray-500 mt-1">out of {studentData.totalStudents} students</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-green-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-2xl">📈</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">{studentData.overallPercentage}%</h3>
            <p className="text-gray-600 text-sm">Overall Average</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${studentData.overallPercentage}%` }}
              />
            </div>
          </div>
        </div>

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
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
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
      </div>

      {/* Exam Results */}
      <div className="space-y-6">
        {filteredResults.map((exam) => (
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
                          <div className="font-medium text-gray-900">{subject.name}</div>
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
                        <span className={`text-sm font-medium ${
                          subject.remarks === 'Excellent' || subject.remarks === 'Outstanding' ? 'text-green-600' :
                          subject.remarks === 'Very Good' ? 'text-blue-600' :
                          subject.remarks === 'Good' ? 'text-yellow-600' :
                          'text-gray-600'
                        }`}>
                          {subject.remarks}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          Performance Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {(examResults.reduce((acc, exam) => acc + exam.percentage, 0) / examResults.length).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Average Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {Math.max(...examResults.map(exam => exam.percentage)).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Best Performance</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {examResults.filter(exam => exam.percentage >= 85).length}/{examResults.length}
            </div>
            <div className="text-sm text-gray-600">Excellent Scores</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsView;