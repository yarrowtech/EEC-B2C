import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import JoditEditor from "jodit-react";
import "jodit/es2021/jodit.min.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AddContent() {
  const [boards, setBoards] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);

  const [board, setBoard] = useState("");
  const [classId, setClassId] = useState("");
  const [subject, setSubject] = useState("");
  const [topicId, setTopicId] = useState("");

  const [topicSummary, setTopicSummary] = useState("");
  const [learningOutcome, setLearningOutcome] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const token = localStorage.getItem("jwt");
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const selectedSubjectName = useMemo(
    () => subjects.find((s) => s._id === subject)?.name || "-",
    [subjects, subject]
  );
  const selectedBoardName = useMemo(
    () => boards.find((b) => b._id === board)?.name || "-",
    [boards, board]
  );
  const selectedClassName = useMemo(
    () => classes.find((c) => c._id === classId)?.name || "-",
    [classes, classId]
  );
  const editorConfig = useMemo(
    () => ({
      readonly: !topicId,
      placeholder: "Start writing...",
      minHeight: 260,
      toolbarAdaptive: false,
      askBeforePasteHTML: false,
      askBeforePasteFromWord: false,
      buttons:
        "bold,italic,underline,strikethrough,|,ul,ol,|,font,fontsize,brush,paragraph,|,align,|,outdent,indent,|,link,table,|,undo,redo,|,hr,eraser,fullsize",
    }),
    [topicId]
  );

  useEffect(() => {
    loadBoards();
    loadClasses();
  }, []);

  useEffect(() => {
    setSubject("");
    setTopicId("");
    setTopicSummary("");
    setLearningOutcome("");
    setTopics([]);

    if (board && classId) {
      loadSubjects(board, classId);
      return;
    }
    setSubjects([]);
  }, [board, classId]);

  useEffect(() => {
    setTopicId("");
    setTopicSummary("");
    setLearningOutcome("");

    if (!subject) {
      setTopics([]);
      return;
    }
    loadTopics(subject, board, classId);
  }, [subject]);

  function handleTopicChange(nextTopicId) {
    setTopicId(nextTopicId);
    const selectedTopic = topics.find((t) => t._id === nextTopicId);
    setTopicSummary(selectedTopic?.topicSummary || "");
    setLearningOutcome(selectedTopic?.learningOutcome || "");
  }

  function getPlainText(html) {
    return String(html || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  }

  function hasContent(topic) {
    return Boolean(getPlainText(topic?.topicSummary) || getPlainText(topic?.learningOutcome));
  }

  function previewText(html, max = 100) {
    const txt = getPlainText(html);
    if (!txt) return "-";
    return txt.length > max ? `${txt.slice(0, max)}...` : txt;
  }

  async function loadBoards() {
    try {
      const res = await axios.get(`${API}/api/boards`, { headers });
      setBoards(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Failed to load boards");
    }
  }

  async function loadClasses() {
    try {
      const res = await axios.get(`${API}/api/classes`, { headers });
      setClasses(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Failed to load classes");
    }
  }

  async function loadSubjects(boardId, selectedClassId) {
    try {
      const res = await axios.get(
        `${API}/api/subject?board=${boardId}&class=${selectedClassId}`,
        { headers }
      );
      setSubjects(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Failed to load subjects");
    }
  }

  async function loadTopics(subjectId, boardId, selectedClassId) {
    try {
      const res = await axios.get(
        `${API}/api/topic/${subjectId}?board=${boardId}&class=${selectedClassId}`,
        { headers }
      );
      setTopics(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Failed to load topics");
    }
  }

  async function saveContent() {
    if (!board || !classId || !subject || !topicId) {
      toast.warn("Please select board, class, subject, and topic");
      return;
    }

    if (!getPlainText(topicSummary) || !getPlainText(learningOutcome)) {
      toast.warn("Summary and learning outcome are required");
      return;
    }

    setSaving(true);
    try {
      await axios.put(
        `${API}/api/topic/${topicId}`,
        {
          topicSummary,
          learningOutcome,
        },
        { headers }
      );
      toast.success("Topic content saved");
      await loadTopics(subject, board, classId);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save topic content");
    } finally {
      setSaving(false);
    }
  }

  async function deleteContent(topic) {
    if (!topic?._id) return;
    if (!window.confirm(`Delete saved content for "${topic.name}"?`)) return;

    setDeletingId(topic._id);
    try {
      await axios.put(
        `${API}/api/topic/${topic._id}`,
        {
          topicSummary: "",
          learningOutcome: "",
        },
        { headers }
      );

      if (topicId === topic._id) {
        setTopicSummary("");
        setLearningOutcome("");
      }

      toast.success("Content deleted");
      await loadTopics(subject, board, classId);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete content");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <ToastContainer />

      <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 rounded-2xl p-8 shadow-sm border border-orange-100">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
          Add Content
        </h1>
        <p className="text-gray-600 mt-2 text-lg">
          Select Board → Class → Subject → Topic, then add summary and learning outcome
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={board}
            onChange={(e) => setBoard(e.target.value)}
            className="border-2 border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-500 outline-none transition-all"
          >
            <option value="">Select Board</option>
            {boards.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            disabled={!board}
            className={`border-2 border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-500 outline-none transition-all ${
              !board ? "bg-gray-100 cursor-not-allowed opacity-60" : ""
            }`}
          >
            <option value="">Select Class</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={!board || !classId}
            className={`border-2 border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-500 outline-none transition-all ${
              !board || !classId ? "bg-gray-100 cursor-not-allowed opacity-60" : ""
            }`}
          >
            <option value="">Select Subject</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={topicId}
            onChange={(e) => handleTopicChange(e.target.value)}
            disabled={!subject}
            className={`border-2 border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-500 outline-none transition-all ${
              !subject ? "bg-gray-100 cursor-not-allowed opacity-60" : ""
            }`}
          >
            <option value="">Select Topic</option>
            {topics.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Topic Summary
            </label>
            <div className={`${!topicId ? "opacity-70 pointer-events-none" : ""}`}>
              <JoditEditor
                value={topicSummary}
                config={editorConfig}
                onChange={(newContent) => setTopicSummary(newContent || "")}
                onBlur={(newContent) => setTopicSummary(newContent || "")}
              />
            </div>
            {!topicId && (
              <p className="text-xs text-gray-500 mt-2">
                Select a topic to enable editing.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Learning Outcome
            </label>
            <div className={`${!topicId ? "opacity-70 pointer-events-none" : ""}`}>
              <JoditEditor
                value={learningOutcome}
                config={editorConfig}
                onChange={(newContent) => setLearningOutcome(newContent || "")}
                onBlur={(newContent) => setLearningOutcome(newContent || "")}
              />
            </div>
            {!topicId && (
              <p className="text-xs text-gray-500 mt-2">
                Select a topic to enable editing.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={saveContent}
            disabled={
              saving ||
              !topicId ||
              !getPlainText(topicSummary) ||
              !getPlainText(learningOutcome)
            }
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              saving || !topicId || !topicSummary.trim() || !learningOutcome.trim()
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:from-orange-700 hover:to-amber-700"
            }`}
          >
            {saving ? "Saving..." : "Save Content"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Stored Topic Content</h2>
          <span className="text-sm text-gray-500">
            {topics.filter((t) => hasContent(t)).length} with content
          </span>
        </div>

        {!subject ? (
          <p className="text-sm text-gray-500">
            Select board, class, and subject to view stored content.
          </p>
        ) : topics.length === 0 ? (
          <p className="text-sm text-gray-500">No topics found for this selection.</p>
        ) : topics.filter((t) => hasContent(t)).length === 0 ? (
          <p className="text-sm text-gray-500">No saved content yet for these topics.</p>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-xs">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold text-gray-700">Board</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-700">Class</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-700">Subject</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-700">Topic</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-700">Summary</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-700">Outcome</th>
                  <th className="text-center px-3 py-2 font-semibold text-gray-700 w-40">Actions</th>
                </tr>
              </thead>
              <tbody>
                {topics
                  .filter((t) => hasContent(t))
                  .map((t) => (
                    <tr key={t._id} className="border-t border-gray-200 align-top">
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                        {t.board?.name || selectedBoardName}
                      </td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                        {t.class?.name || selectedClassName}
                      </td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                        {selectedSubjectName}
                      </td>
                      <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">
                        {t.name}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {previewText(t.topicSummary, 120)}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {previewText(t.learningOutcome, 120)}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleTopicChange(t._id)}
                            className="px-2.5 py-1 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteContent(t)}
                            disabled={deletingId === t._id}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                              deletingId === t._id
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-red-600 text-white hover:bg-red-700"
                            }`}
                          >
                            {deletingId === t._id ? "..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
