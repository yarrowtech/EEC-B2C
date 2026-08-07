import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import JoditEditor from "jodit-react";
import "jodit/es2021/jodit.min.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AddContent() {
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();
  const isAdmin = String(currentUser?.role || "").toLowerCase() === "admin";
  const isTeacher = String(currentUser?.role || "").toLowerCase() === "teacher";
  const currentUserId = String(currentUser?._id || currentUser?.id || "");

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
  const [insertingImage, setInsertingImage] = useState(false);

  const [allTopics, setAllTopics] = useState([]);
  const [loadingAllTopics, setLoadingAllTopics] = useState(true);
  const [filterBoard, setFilterBoard] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterSubject, setFilterSubject] = useState("");

  const pendingSubjectIdRef = useRef("");
  const pendingTopicIdRef = useRef("");
  const editorTopRef = useRef(null);

  const token = localStorage.getItem("jwt");
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const editorConfig = useMemo(
    () => ({
      readonly: !topicId,
      placeholder: "Write your article content...",
      minHeight: 260,
      toolbarAdaptive: false,
      askBeforePasteHTML: false,
      askBeforePasteFromWord: false,
      buttons:
        "bold,italic,underline,strikethrough,|,ul,ol,|,font,fontsize,brush,paragraph,|,align,|,outdent,indent,|,link,image,table,|,undo,redo,|,hr,eraser,fullsize",
    }),
    [topicId]
  );

  useEffect(() => {
    loadBoards();
    loadClasses();
    loadAllTopics();
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
    const selected = topics.find((t) => t._id === nextTopicId);
    if (!nextTopicId) {
      setTopicId("");
      setTopicSummary("");
      setLearningOutcome("");
      return;
    }

    if (!canManageTopicContent(selected)) {
      toast.warn("Not permitted. This content belongs to another user.");
      setTopicId("");
      setTopicSummary("");
      setLearningOutcome("");
      return;
    }

    const hasPendingDraft =
      selected?.contentStatus === "pending" &&
      (getPlainText(selected?.draftTopicSummary) || getPlainText(selected?.draftLearningOutcome));

    setTopicId(nextTopicId);
    setTopicSummary(normalizeRichContent(hasPendingDraft ? selected.draftTopicSummary : selected?.topicSummary || ""));
    setLearningOutcome(normalizeRichContent(hasPendingDraft ? selected.draftLearningOutcome : selected?.learningOutcome || ""));
  }

  function getPlainText(html) {
    const normalized = normalizeRichContent(html);
    return String(normalized || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function decodeEntityTags(value) {
    return String(value || "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&");
  }

  function normalizeRichContent(value) {
    const raw = String(value || "");
    const looksEncodedHtml = /&lt;\/?[a-z][^&]*&gt;/i.test(raw);
    return looksEncodedHtml ? decodeEntityTags(raw) : raw;
  }

  // Only an in-flight pending draft blocks another teacher — once content is
  // live/approved or idle-rejected, any teacher may propose a new draft since
  // it still needs admin approval before it takes effect.
  function getContentOwnerId(topic) {
    if (topic?.contentStatus === "pending") {
      const draftOwner = topic?.draftUpdatedBy;
      if (draftOwner) {
        return String(typeof draftOwner === "string" ? draftOwner : draftOwner?._id || draftOwner?.id || "");
      }
    }
    return "";
  }

  function canManageTopicContent(topic) {
    if (!topic?._id) return false;
    if (isAdmin) return true;
    if (!isTeacher) return false;
    const ownerId = getContentOwnerId(topic);
    return !ownerId || ownerId === currentUserId;
  }

  const selectedTopic = useMemo(
    () => topics.find((t) => t._id === topicId) || null,
    [topics, topicId]
  );
  const canEditSelectedTopic = topicId ? canManageTopicContent(selectedTopic) : false;

  // Teachers only see topics/content they're personally connected to (created
  // the topic, or wrote its live/pending content); admins see everything.
  const roleScopedTopics = useMemo(() => {
    if (!isTeacher) return allTopics;
    return allTopics.filter((t) => {
      const creatorId = t.createdBy?._id || t.createdBy;
      const contentOwnerId = t.contentUpdatedBy?._id || t.contentUpdatedBy;
      const draftOwnerId = t.draftUpdatedBy?._id || t.draftUpdatedBy;
      return [creatorId, contentOwnerId, draftOwnerId]
        .filter(Boolean)
        .some((id) => String(id) === currentUserId);
    });
  }, [allTopics, isTeacher, currentUserId]);

  const filterSubjectOptions = useMemo(() => {
    const seen = new Set();
    const options = [];
    for (const t of roleScopedTopics) {
      if (filterBoard && t.board?._id !== filterBoard) continue;
      if (filterClass && t.class?._id !== filterClass) continue;
      if (seen.has(t.subjectId)) continue;
      seen.add(t.subjectId);
      options.push({ id: t.subjectId, name: t.subjectName });
    }
    return options;
  }, [roleScopedTopics, filterBoard, filterClass]);

  const filteredAllTopics = useMemo(() => {
    return roleScopedTopics.filter((t) => {
      if (filterBoard && t.board?._id !== filterBoard) return false;
      if (filterClass && t.class?._id !== filterClass) return false;
      if (filterSubject && t.subjectId !== filterSubject) return false;
      return true;
    });
  }, [roleScopedTopics, filterBoard, filterClass, filterSubject]);

  const hasActiveFilters = Boolean(filterBoard || filterClass || filterSubject);

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
      const rows = Array.isArray(res.data) ? res.data : [];
      setSubjects(rows);

      if (pendingSubjectIdRef.current) {
        const targetSubjectId = pendingSubjectIdRef.current;
        pendingSubjectIdRef.current = "";
        setSubject(targetSubjectId);
        loadTopics(targetSubjectId, boardId, selectedClassId);
      }
    } catch {
      toast.error("Failed to load subjects");
    }
  }

  async function loadTopics(subjectId, boardId, selectedClassId) {
    try {
      const res = await axios.get(
        `${API}/api/topic/${subjectId}?board=${boardId}&class=${selectedClassId}&manage=1`,
        { headers }
      );
      const rows = Array.isArray(res.data) ? res.data : [];
      setTopics(rows);

      if (pendingTopicIdRef.current) {
        const targetTopicId = pendingTopicIdRef.current;
        pendingTopicIdRef.current = "";
        const found = rows.find((t) => t._id === targetTopicId);
        if (found && canManageTopicContent(found)) {
          const hasPendingDraft =
            found.contentStatus === "pending" &&
            (getPlainText(found.draftTopicSummary) || getPlainText(found.draftLearningOutcome));
          setTopicId(found._id);
          setTopicSummary(normalizeRichContent(hasPendingDraft ? found.draftTopicSummary : found.topicSummary || ""));
          setLearningOutcome(normalizeRichContent(hasPendingDraft ? found.draftLearningOutcome : found.learningOutcome || ""));
        } else if (found) {
          toast.warn("Not permitted. This content belongs to another user.");
        }
      }
    } catch {
      toast.error("Failed to load topics");
    }
  }

  async function loadAllTopics() {
    try {
      setLoadingAllTopics(true);
      const subRes = await axios.get(`${API}/api/subject`, { headers });
      const subjectRows = Array.isArray(subRes.data) ? subRes.data : [];

      const rows = [];
      for (const s of subjectRows) {
        const tRes = await axios.get(`${API}/api/topic/${s._id}?manage=1`, { headers });
        const topicRows = Array.isArray(tRes.data) ? tRes.data : [];
        for (const t of topicRows) {
          rows.push({ ...t, subjectId: s._id, subjectName: s.name });
        }
      }
      setAllTopics(rows);
    } catch {
      toast.error("Failed to load topics");
    } finally {
      setLoadingAllTopics(false);
    }
  }

  function editFromTable(row) {
    if (!canManageTopicContent(row)) {
      toast.warn("Not permitted. This content belongs to another user.");
      return;
    }
    pendingSubjectIdRef.current = row.subjectId;
    pendingTopicIdRef.current = row._id;
    setBoard(row.board?._id || "");
    setClassId(row.class?._id || "");
    loadSubjects(row.board?._id || "", row.class?._id || "");
    editorTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function uploadImage(file) {
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch(`${API}/api/upload/image`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok || !data?.url) {
      throw new Error(data?.message || "Image upload failed");
    }
    return data.url;
  }

  async function insertImageIntoContent(file) {
    if (!file) return;
    if (!file.type?.startsWith("image/")) {
      toast.warn("Please select an image file");
      return;
    }

    setInsertingImage(true);
    try {
      const url = await uploadImage(file);
      const block = `<p><img src="${url}" alt="content" style="max-width:100%;height:auto;border-radius:8px;" /></p>`;
      setTopicSummary((prev) => `${prev || ""}${block}`);
      toast.success("Image inserted into content");
    } catch (err) {
      toast.error(err?.message || "Failed to upload image");
    } finally {
      setInsertingImage(false);
    }
  }

  async function saveContent() {
    if (!board || !classId || !subject || !topicId) {
      toast.warn("Please select board, class, subject, and topic");
      return;
    }

    const normalizedSummary = normalizeRichContent(topicSummary);
    const normalizedOutcome = normalizeRichContent(learningOutcome);

    if (!getPlainText(normalizedSummary) || !getPlainText(normalizedOutcome)) {
      toast.warn("Topic content and learning outcome are required");
      return;
    }

    if (!canEditSelectedTopic) {
      toast.error("Not permitted to edit this topic content");
      return;
    }

    setSaving(true);
    try {
      await axios.put(
        `${API}/api/topic/${topicId}`,
        {
          topicSummary: normalizedSummary,
          learningOutcome: normalizedOutcome,
        },
        { headers }
      );
      toast.success(isTeacher ? "Content submitted for admin review" : "Topic content saved");
      setTopicSummary(normalizedSummary);
      setLearningOutcome(normalizedOutcome);
      await loadTopics(subject, board, classId);
      await loadAllTopics();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save topic content");
    } finally {
      setSaving(false);
    }
  }

  async function deleteContent(topic) {
    if (!topic?._id) return;
    if (!canManageTopicContent(topic)) {
      toast.error("Not permitted to delete this content");
      return;
    }
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

      toast.success(isTeacher ? "Content removal submitted for admin review" : "Content deleted");
      if (subject) await loadTopics(subject, board, classId);
      await loadAllTopics();
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
          Select Board → Class → Subject → Topic, then add content and learning outcomes
        </p>
      </div>

      <div ref={editorTopRef} className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 space-y-5">
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
                {t.status === "pending" ? " (Pending Review)" : t.status === "rejected" ? " (Rejected)" : ""}
              </option>
            ))}
          </select>
        </div>

        {selectedTopic && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm font-medium ${
              selectedTopic.contentStatus === "approved"
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : selectedTopic.contentStatus === "rejected"
                  ? "bg-rose-50 border-rose-200 text-rose-700"
                  : "bg-amber-50 border-amber-200 text-amber-700"
            }`}
          >
            {selectedTopic.contentStatus === "approved" &&
              "This content is approved and live for students."}
            {selectedTopic.contentStatus === "pending" &&
              "This content is pending admin review. Students still see the previously approved version until it's approved."}
            {selectedTopic.contentStatus === "rejected" && (
              <>
                This content was rejected
                {selectedTopic.contentRejectionReason ? `: ${selectedTopic.contentRejectionReason}` : "."} Edit
                and save to resubmit for review.
              </>
            )}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Topic Content
            </label>
            <div className="mb-2">
              <label
                className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold ${
                  !topicId || !canEditSelectedTopic || insertingImage
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer"
                }`}
              >
                {insertingImage ? "Uploading image..." : "Add Image to Content"}
                <input
                  type="file"
                  accept="image/*"
                  disabled={!topicId || !canEditSelectedTopic || insertingImage}
                  className="hidden"
                  onChange={(e) => insertImageIntoContent(e.target.files?.[0])}
                />
              </label>
            </div>
            <div className={`${!topicId || !canEditSelectedTopic ? "opacity-70 pointer-events-none" : ""}`}>
              <JoditEditor
                value={topicSummary}
                config={editorConfig}
                onChange={(newContent) => setTopicSummary(newContent || "")}
                onBlur={(newContent) => setTopicSummary(newContent || "")}
              />
            </div>
            {!topicId && (
              <p className="text-xs text-gray-500 mt-2">
                Select a topic to enable content editing.
              </p>
            )}
            {topicId && !canEditSelectedTopic && (
              <p className="text-xs text-red-500 mt-2">
                Not permitted. This topic content belongs to another user.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Learning Outcome
            </label>
            <div className={`${!topicId || !canEditSelectedTopic ? "opacity-70 pointer-events-none" : ""}`}>
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
              !canEditSelectedTopic ||
              !getPlainText(topicSummary) ||
              !getPlainText(learningOutcome)
            }
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              saving || !topicId || !canEditSelectedTopic || !getPlainText(topicSummary) || !getPlainText(learningOutcome)
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:from-orange-700 hover:to-amber-700"
            }`}
          >
            {saving ? "Saving..." : "Save Content"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Filter Topics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filterBoard}
            onChange={(e) => {
              setFilterBoard(e.target.value);
              setFilterSubject("");
            }}
            className="border-2 border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-500 outline-none transition-all"
          >
            <option value="">All Boards</option>
            {boards.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            value={filterClass}
            onChange={(e) => {
              setFilterClass(e.target.value);
              setFilterSubject("");
            }}
            className="border-2 border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-500 outline-none transition-all"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="border-2 border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-500 outline-none transition-all"
          >
            <option value="">All Subjects</option>
            {filterSubjectOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setFilterBoard("");
              setFilterClass("");
              setFilterSubject("");
            }}
            disabled={!hasActiveFilters}
            className={`px-6 py-3 rounded-xl transition-all font-semibold shadow-sm ${
              hasActiveFilters ? "bg-gray-200 text-gray-700 hover:bg-gray-300" : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">
            {isTeacher ? "My Topics & Content" : "All Topics & Content"} ({filteredAllTopics.length})
          </h2>
          <button
            type="button"
            onClick={loadAllTopics}
            className="px-4 py-2 rounded-xl bg-white border border-orange-200 text-orange-700 text-sm font-semibold hover:bg-orange-50 transition-all"
          >
            Refresh
          </button>
        </div>

        {loadingAllTopics ? (
          <p className="text-sm text-gray-500">Loading topics...</p>
        ) : filteredAllTopics.length === 0 ? (
          <p className="text-sm text-gray-500">
            {hasActiveFilters
              ? "No topics match your filters."
              : isTeacher
                ? "You haven't created or added content to any topics yet."
                : "No topics found."}
          </p>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-xs">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold text-gray-700">Board</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-700">Class</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-700">Subject</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-700">Topic</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-700">Topic Status</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-700">Summary</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-700">Outcome</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-700">Content Status</th>
                  <th className="text-center px-3 py-2 font-semibold text-gray-700 w-40">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAllTopics.map((t) => (
                  <tr key={t._id} className="border-t border-gray-200 align-top">
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{t.board?.name || "N/A"}</td>
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{t.class?.name || "N/A"}</td>
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{t.subjectName || "N/A"}</td>
                    <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">{t.name}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                          t.status === "approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : t.status === "rejected"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {t.status === "approved" ? "Approved" : t.status === "rejected" ? "Rejected" : "Pending"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-600">{previewText(t.topicSummary, 120)}</td>
                    <td className="px-3 py-2 text-gray-600">{previewText(t.learningOutcome, 120)}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                          t.contentStatus === "approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : t.contentStatus === "rejected"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {t.contentStatus === "approved"
                          ? "Approved"
                          : t.contentStatus === "rejected"
                            ? "Rejected"
                            : "Pending Review"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {canManageTopicContent(t) ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => editFromTable(t)}
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
                      ) : (
                        <span className="text-xs font-semibold text-red-500 px-2 py-1 bg-red-50 rounded-lg block text-center">
                          Not Permitted
                        </span>
                      )}
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
