import React, { useEffect, useState } from "react";
import axios from "axios";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { FiRefreshCw } from "react-icons/fi";
import { Book } from "lucide-react";

const STAGES = ["Foundation", "Intermediate", "Advanced"];
const DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard"];
const QUESTION_TYPES = [
  "MCQ — Single Correct",
  "MCQ — Multiple Correct",
  "Choice Matrix",
  "Cloze — Drag & Drop",
  "Cloze — Drop-Down",
  "Essay — Plain Text"
];

export default function SubjectTopicPicker() {
  const {
    scope,
    setBoard,
    setClass,
    setSubject,
    setTopic,
    setStage,
    setDifficulty,
    setQuestionType,
    clear
  } = useQuestionScope();

  const [boards, setBoards] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);

  // Load boards and classes on mount
  useEffect(() => {
    loadBoards();
    loadClasses();
  }, []);

  // Load subjects when board and class are selected
  useEffect(() => {
    if (scope.board && scope.class) {
      loadSubjects(scope.board, scope.class);
    } else {
      setSubjects([]);
    }
  }, [scope.board, scope.class]);

  // Load topics when subject is selected
  useEffect(() => {
    if (scope.subject && scope.board && scope.class) {
      loadTopics(scope.subject, scope.board, scope.class);
    } else {
      setTopics([]);
    }
  }, [scope.subject, scope.board, scope.class]);

  const loadBoards = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/boards`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
      });
      setBoards(res.data);
    } catch (err) {
      console.error("Error loading boards:", err);
    }
  };

  const loadClasses = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/classes`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
      });
      setClasses(res.data);
    } catch (err) {
      console.error("Error loading classes:", err);
    }
  };

  const loadSubjects = async (boardId, classId) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/subject?board=${boardId}&class=${classId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
        }
      );
      setSubjects(res.data);
    } catch (err) {
      console.error("Error loading subjects:", err);
    }
  };

  const loadTopics = async (subjectId, boardId, classId) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/topic/${subjectId}?board=${boardId}&class=${classId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
        }
      );
      setTopics(res.data);
    } catch (err) {
      console.error("Error loading topics:", err);
    }
  };

  const isComplete = scope.board && scope.class && scope.subject && scope.topic &&
                     scope.stage && scope.difficulty && scope.questionType;

  return (
    <div className="relative rounded-[2.5rem] bg-gradient-to-br from-yellow-50 via-pink-50 to-sky-50 p-8 shadow-xl overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-purple-300/30 rounded-full blur-2xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-green-300/30 rounded-full blur-2xl" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-lg">
            <Book size={24} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            Select Question Parameters
          </h2>
        </div>

        <button
          type="button"
          onClick={clear}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-400 to-pink-500 text-white px-6 py-3 font-bold shadow-lg hover:scale-105 transition-all"
        >
          <FiRefreshCw /> Clear All
        </button>
      </div>

      {/* Cascading Flow Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 relative z-10">

        {/* 1. Board */}
        <div>
          <label className="font-bold text-slate-700 mb-2 block text-sm">
            1. Board
          </label>
          <select
            className="w-full rounded-xl px-4 py-3 shadow-md focus:ring-2 focus:ring-blue-500 bg-white border border-slate-200"
            value={scope.board}
            onChange={(e) => {
              setBoard(e.target.value);
              setClass("");
              setSubject("");
              setTopic("");
              setStage("");
              setDifficulty("");
              setQuestionType("");
            }}
          >
            <option value="">Select Board</option>
            {boards.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Class */}
        <div>
          <label className="font-bold text-slate-700 mb-2 block text-sm">
            2. Class
          </label>
          <select
            className={`w-full rounded-xl px-4 py-3 shadow-md focus:ring-2 focus:ring-blue-500 border border-slate-200 ${
              !scope.board ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'
            }`}
            value={scope.class}
            onChange={(e) => {
              setClass(e.target.value);
              setSubject("");
              setTopic("");
              setStage("");
              setDifficulty("");
              setQuestionType("");
            }}
            disabled={!scope.board}
          >
            <option value="">Select Class</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Subject */}
        <div>
          <label className="font-bold text-slate-700 mb-2 block text-sm">
            3. Subject
          </label>
          <select
            className={`w-full rounded-xl px-4 py-3 shadow-md focus:ring-2 focus:ring-purple-500 border border-slate-200 ${
              !scope.board || !scope.class ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'
            }`}
            value={scope.subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setTopic("");
              setStage("");
              setDifficulty("");
              setQuestionType("");
            }}
            disabled={!scope.board || !scope.class}
          >
            <option value="">Select Subject</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Topic */}
        <div>
          <label className="font-bold text-slate-700 mb-2 block text-sm">
            4. Topic
          </label>
          <select
            className={`w-full rounded-xl px-4 py-3 shadow-md focus:ring-2 focus:ring-purple-500 border border-slate-200 ${
              !scope.subject ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'
            }`}
            value={scope.topic}
            onChange={(e) => {
              setTopic(e.target.value);
              setStage("");
              setDifficulty("");
              setQuestionType("");
            }}
            disabled={!scope.subject}
          >
            <option value="">Select Topic</option>
            {topics.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* 5. Stage */}
        <div>
          <label className="font-bold text-slate-700 mb-2 block text-sm">
            5. Stage
          </label>
          <select
            className={`w-full rounded-xl px-4 py-3 shadow-md focus:ring-2 focus:ring-indigo-500 border border-slate-200 ${
              !scope.topic ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'
            }`}
            value={scope.stage}
            onChange={(e) => {
              setStage(e.target.value);
              setDifficulty("");
              setQuestionType("");
            }}
            disabled={!scope.topic}
          >
            <option value="">Select Stage</option>
            {STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </div>

        {/* 6. Difficulty */}
        <div>
          <label className="font-bold text-slate-700 mb-2 block text-sm">
            6. Difficulty
          </label>
          <select
            className={`w-full rounded-xl px-4 py-3 shadow-md focus:ring-2 focus:ring-orange-500 border border-slate-200 ${
              !scope.stage ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'
            }`}
            value={scope.difficulty}
            onChange={(e) => {
              setDifficulty(e.target.value);
              setQuestionType("");
            }}
            disabled={!scope.stage}
          >
            <option value="">Select Difficulty</option>
            {DIFFICULTY_LEVELS.map((diff) => (
              <option key={diff} value={diff}>
                {diff}
              </option>
            ))}
          </select>
        </div>

        {/* 7. Question Type */}
        <div>
          <label className="font-bold text-slate-700 mb-2 block text-sm">
            7. Question Type
          </label>
          <select
            className={`w-full rounded-xl px-4 py-3 shadow-md focus:ring-2 focus:ring-green-500 border border-slate-200 ${
              !scope.difficulty ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'
            }`}
            value={scope.questionType}
            onChange={(e) => setQuestionType(e.target.value)}
            disabled={!scope.difficulty}
          >
            <option value="">Select Type</option>
            {QUESTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Status Indicator */}
        <div className="flex items-end">
          <div className="w-full text-center">
            {isComplete ? (
              <div className="inline-block px-6 py-3 rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold shadow-lg animate-pulse">
                ✓ Ready to Add Question!
              </div>
            ) : (
              <div className="inline-block px-6 py-3 rounded-2xl bg-slate-200 text-slate-600 text-sm font-medium">
                Complete all fields
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Selection Display */}
      {isComplete && (
        <div className="mt-6 p-4 bg-white/80 backdrop-blur rounded-2xl shadow-md relative z-10">
          <p className="text-sm text-slate-700 font-medium">
            <span className="font-bold text-blue-600">Current Selection:</span>{" "}
            {boards.find(b => b._id === scope.board)?.name} → {" "}
            {classes.find(c => c._id === scope.class)?.name} → {" "}
            {subjects.find(s => s._id === scope.subject)?.name} → {" "}
            {topics.find(t => t._id === scope.topic)?.name} → {" "}
            {scope.stage} → {scope.difficulty} → {scope.questionType}
          </p>
        </div>
      )}
    </div>
  );
}
