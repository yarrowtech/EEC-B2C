import React, { useEffect, useMemo, useState } from "react";
import {
  createFlashcardSet,
  deleteFlashcardSet,
  getFlashcardSet,
  getJSON,
  listFlashcards,
  updateFlashcardSet,
} from "../../lib/api";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const initialForm = {
  title: "",
  description: "",
  board: "",
  class: "",
  subject: "",
  topic: "",
  stage: 1,
  isActive: true,
  cards: [
    { front: "", back: "" },
    { front: "", back: "" },
  ],
};

export default function FlashcardsManage() {
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const [boards, setBoards] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);

  const [list, setList] = useState([]);
  const [search, setSearch] = useState("");

  const canSubmit = useMemo(() => {
    const hasScope = form.title && form.board && form.class && form.subject && form.topic;
    const validCards = (form.cards || []).filter((c) => String(c.front || "").trim() && String(c.back || "").trim());
    return Boolean(hasScope && validCards.length > 0);
  }, [form]);

  useEffect(() => {
    loadBoardsAndClasses();
    loadFlashcardSets();
  }, []);

  useEffect(() => {
    if (!form.board || !form.class) {
      setSubjects([]);
      setTopics([]);
      return;
    }
    loadSubjects();
  }, [form.board, form.class]);

  useEffect(() => {
    if (!form.subject) {
      setTopics([]);
      return;
    }
    loadTopics();
  }, [form.subject]);

  async function loadBoardsAndClasses() {
    try {
      const [bRes, cRes] = await Promise.all([
        fetch(`${API}/api/boards`),
        fetch(`${API}/api/classes`),
      ]);
      const [bData, cData] = await Promise.all([bRes.json(), cRes.json()]);
      setBoards(Array.isArray(bData) ? bData : []);
      setClasses(Array.isArray(cData) ? cData : []);
    } catch {
      setBoards([]);
      setClasses([]);
    }
  }

  async function loadSubjects() {
    try {
      const rows = await getJSON(
        `/api/subject?board=${encodeURIComponent(form.board)}&class=${encodeURIComponent(form.class)}`
      );
      setSubjects(Array.isArray(rows) ? rows : []);
    } catch {
      setSubjects([]);
    }
  }

  async function loadTopics() {
    try {
      const rows = await getJSON(
        `/api/topic/${encodeURIComponent(form.subject)}?board=${encodeURIComponent(form.board)}&class=${encodeURIComponent(form.class)}`
      );
      setTopics(Array.isArray(rows) ? rows : []);
    } catch {
      setTopics([]);
    }
  }

  async function loadFlashcardSets() {
    try {
      const data = await listFlashcards({ admin: 1, q: search });
      setList(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      setError(e.message || "Failed to load flashcards");
    }
  }

  function setFormField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onCardChange(index, key, value) {
    setForm((prev) => {
      const next = [...(prev.cards || [])];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, cards: next };
    });
  }

  function addCard() {
    setForm((prev) => ({ ...prev, cards: [...(prev.cards || []), { front: "", back: "" }] }));
  }

  function removeCard(index) {
    setForm((prev) => {
      const next = [...(prev.cards || [])];
      next.splice(index, 1);
      return { ...prev, cards: next.length ? next : [{ front: "", back: "" }] };
    });
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId("");
    setMsg("");
    setError("");
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    setError("");
    try {
      const payload = {
        ...form,
        cards: (form.cards || []).filter((c) => String(c.front || "").trim() && String(c.back || "").trim()),
      };
      if (editingId) {
        await updateFlashcardSet(editingId, payload);
        setMsg("Flashcard set updated");
      } else {
        await createFlashcardSet(payload);
        setMsg("Flashcard set created");
      }
      await loadFlashcardSets();
      resetForm();
    } catch (e2) {
      setError(e2.message || "Failed to save flashcard set");
    } finally {
      setBusy(false);
    }
  }

  async function onEdit(row) {
    setError("");
    setMsg("");
    try {
      const full = await getFlashcardSet(row._id);
      setEditingId(row._id);
      setForm({
        title: full.title || "",
        description: full.description || "",
        board: full.board || "",
        class: full.class || "",
        subject: full.subject || "",
        topic: full.topic || "",
        stage: Number(full.stage || 1),
        isActive: Boolean(full.isActive),
        cards: Array.isArray(full.cards) && full.cards.length
          ? full.cards.map((c) => ({ front: c.front || "", back: c.back || "" }))
          : [{ front: "", back: "" }],
      });
    } catch (e) {
      setError(e.message || "Failed to load flashcard set");
    }
  }

  async function onDelete(id) {
    const ok = window.confirm("Delete this flashcard set?");
    if (!ok) return;
    setError("");
    setMsg("");
    try {
      await deleteFlashcardSet(id);
      setMsg("Flashcard set deleted");
      await loadFlashcardSets();
      if (editingId === id) resetForm();
    } catch (e) {
      setError(e.message || "Failed to delete flashcard set");
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
        <h1 className="text-xl md:text-2xl font-black text-slate-900">Flashcards Manager</h1>
        <p className="text-sm text-slate-600 mt-1">Create board/class/subject/topic based flashcards for students.</p>
      </div>

      <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={form.title}
            onChange={(e) => setFormField("title", e.target.value)}
            placeholder="Set title"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={form.stage}
            onChange={(e) => setFormField("stage", Number(e.target.value))}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          >
            <option value={1}>Stage 1</option>
            <option value={2}>Stage 2</option>
            <option value={3}>Stage 3</option>
          </select>
        </div>

        <textarea
          value={form.description}
          onChange={(e) => setFormField("description", e.target.value)}
          placeholder="Description (optional)"
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[72px]"
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={form.board}
            onChange={(e) => setForm((prev) => ({ ...prev, board: e.target.value, subject: "", topic: "" }))}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select board</option>
            {boards.map((b) => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>
          <select
            value={form.class}
            onChange={(e) => setForm((prev) => ({ ...prev, class: e.target.value, subject: "", topic: "" }))}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select class</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          <select
            value={form.subject}
            onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value, topic: "" }))}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select subject</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
          <select
            value={form.topic}
            onChange={(e) => setFormField("topic", e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select topic</option>
            {topics.map((t) => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
        </div>

        <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setFormField("isActive", e.target.checked)}
          />
          Active for students
        </label>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-800">Cards</p>
            <button
              type="button"
              onClick={addCard}
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
            >
              + Add Card
            </button>
          </div>
          {(form.cards || []).map((card, idx) => (
            <div key={`card-${idx}`} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
              <input
                value={card.front}
                onChange={(e) => onCardChange(idx, "front", e.target.value)}
                placeholder={`Card ${idx + 1} front`}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                value={card.back}
                onChange={(e) => onCardChange(idx, "back", e.target.value)}
                placeholder={`Card ${idx + 1} back`}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => removeCard(idx)}
                className="rounded-xl border border-rose-300 text-rose-600 px-3 py-2 text-xs font-bold hover:bg-rose-50"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!canSubmit || busy}
            className="rounded-xl bg-indigo-600 text-white px-4 py-2.5 text-sm font-bold hover:bg-indigo-700 disabled:opacity-50"
          >
            {busy ? "Saving..." : editingId ? "Update Flashcards" : "Create Flashcards"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Cancel Edit
            </button>
          )}
        </div>
        {msg && <p className="text-sm text-emerald-600 font-semibold">{msg}</p>}
        {error && <p className="text-sm text-rose-600 font-semibold">{error}</p>}
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
          <p className="text-base font-black text-slate-900">Existing Flashcard Sets</p>
          <div className="flex gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title..."
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={loadFlashcardSets}
              className="rounded-xl bg-slate-900 text-white px-3 py-2 text-sm font-bold"
            >
              Search
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 pr-2">Title</th>
                <th className="py-2 pr-2">Scope</th>
                <th className="py-2 pr-2">Cards</th>
                <th className="py-2 pr-2">Participants</th>
                <th className="py-2 pr-2">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row) => (
                <tr key={row._id} className="border-b border-slate-100">
                  <td className="py-2 pr-2 font-semibold text-slate-800">{row.title}</td>
                  <td className="py-2 pr-2 text-xs text-slate-600">B:{row.board} C:{row.class} S:{row.subject} T:{row.topic}</td>
                  <td className="py-2 pr-2">{row.cardsCount || row.cards?.length || 0}</td>
                  <td className="py-2 pr-2">{row.participantsCount || 0}</td>
                  <td className="py-2 pr-2">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${row.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                      {row.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-2">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(row)}
                        className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-bold text-slate-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(row._id)}
                        className="rounded-lg border border-rose-300 px-2 py-1 text-xs font-bold text-rose-600"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">No flashcard sets found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

