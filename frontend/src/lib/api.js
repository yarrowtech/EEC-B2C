// src/lib/api.js
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL;

function readToken() {
  const raw = localStorage.getItem("jwt");
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string") return parsed;
  } catch {
    // raw is already a token string
  }
  return raw;
}

function authHeaders() {
  const token = readToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function authOnlyHeaders() {
  const token = readToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getUiClickSessionId() {
  const key = "eec:ui-click-session";
  try {
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const created =
      globalThis.crypto?.randomUUID?.() ||
      `anon-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(key, created);
    return created;
  } catch {
    return "";
  }
}

export async function mergeUiClickSession(sessionId) {
  const token = readToken();
  const cleanSessionId = String(sessionId || "").trim();
  if (!token || !cleanSessionId) return null;

  const res = await fetch(`${API_BASE}/api/ui-clicks/merge-session`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ sessionId: cleanSessionId }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || `Request failed (${res.status})`);
  return json;
}

export async function getJSON(path) {
  const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || `Request failed (${res.status})`);
  return json;
}

export async function postQuestion(type, data) {
  const res = await fetch(`${API_BASE}/api/questions/${type}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || `Request failed (${res.status})`);
  return json;
}

export async function postMCQSingleBulk(formData) {
  const res = await fetch(`${API_BASE}/api/questions/bulk/mcq-single`, {
    method: "POST",
    headers: authOnlyHeaders(),
    body: formData,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || `Request failed (${res.status})`);
  return json;
}

export async function postMCQMultiBulk(formData) {
  const res = await fetch(`${API_BASE}/api/questions/bulk/mcq-multi`, {
    method: "POST",
    headers: authOnlyHeaders(),
    body: formData,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || `Request failed (${res.status})`);
  return json;
}

export async function postChoiceMatrixBulk(formData) {
  const res = await fetch(`${API_BASE}/api/questions/bulk/choice-matrix`, {
    method: "POST",
    headers: authOnlyHeaders(),
    body: formData,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || `Request failed (${res.status})`);
  return json;
}

export async function postTrueFalseBulk(formData) {
  const res = await fetch(`${API_BASE}/api/questions/bulk/true-false`, {
    method: "POST",
    headers: authOnlyHeaders(),
    body: formData,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || `Request failed (${res.status})`);
  return json;
}

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append("image", file);
  const res = await fetch(`${API_BASE}/api/upload/image`, {
    method: "POST",
    headers: authOnlyHeaders(),
    body: formData,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || `Upload failed (${res.status})`);
  return json?.url || "";
}

export async function updateQuestion(id, data) {
  const res = await fetch(`${API_BASE}/api/questions/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || `Request failed (${res.status})`);
  return json;
}

export async function deleteQuestion(id) {
  const res = await fetch(`${API_BASE}/api/questions/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || `Request failed (${res.status})`);
  return json;
}

export async function startExam(payload) {
  const res = await fetch(`${API_BASE}/api/exams/start`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || `Request failed (${res.status})`);
  return json; // {attemptId, questions[], total, ...}
}

export async function restartExam(attemptId) {
  const res = await fetch(`${API_BASE}/api/exams/restart/${encodeURIComponent(attemptId)}`, {
    method: "POST",
    headers: authHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || `Request failed (${res.status})`);
  return json;
}

export async function submitExam(attemptId, answers) {
  const res = await fetch(`${API_BASE}/api/exams/submit/${attemptId}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ answers }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || `Request failed (${res.status})`);
  return json; // {score,total,percent}
}

export async function myAttempts() {
  const res = await fetch(`${API_BASE}/api/exams/attempts`, { headers: authHeaders() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || `Request failed (${res.status})`);
  return json; // {items: [...]}
}

export async function adminAttempts() {
  const res = await fetch(`${API_BASE}/api/exams/admin/attempts`, { headers: authHeaders() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || `Request failed (${res.status})`);
  return json; // { items: [...] enriched with user + attemptsForUser }
}

export async function adminAttempt(id) {
  const res = await fetch(`${API_BASE}/api/exams/admin/attempts/${id}`, { headers: authHeaders() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || `Request failed (${res.status})`);
  return json; // { ...attempt, user, items: [{ qid, question, studentAnswer, correctAnswer, isCorrect }] }
}

export async function listFlashcards(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      qs.set(k, String(v));
    }
  });
  const path = `/api/flashcards${qs.toString() ? `?${qs.toString()}` : ""}`;
  return getJSON(path);
}

export async function getFlashcardSet(id) {
  return getJSON(`/api/flashcards/${encodeURIComponent(id)}`);
}

export async function createFlashcardSet(payload) {
  const res = await fetch(`${API_BASE}/api/flashcards`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || `Request failed (${res.status})`);
  return json;
}

export async function updateFlashcardSet(id, payload) {
  const res = await fetch(`${API_BASE}/api/flashcards/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || `Request failed (${res.status})`);
  return json;
}

export async function deleteFlashcardSet(id) {
  const res = await fetch(`${API_BASE}/api/flashcards/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || `Request failed (${res.status})`);
  return json;
}

export async function participateFlashcardSet(id, payload) {
  const res = await fetch(`${API_BASE}/api/flashcards/${encodeURIComponent(id)}/participate`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload || {}),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || `Request failed (${res.status})`);
  return json;
}

export async function myFlashcardAttempts(id) {
  return getJSON(`/api/flashcards/${encodeURIComponent(id)}/my-attempts`);
}

export async function getPublicFeedback() {
  return getJSON(`/api/feedback/public`);
}

export async function getMyFeedbackStatus() {
  return getJSON(`/api/feedback/me/status`);
}

export async function submitFeedback(payload) {
  const res = await fetch(`${API_BASE}/api/feedback/submit`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || `Request failed (${res.status})`);
  return json;
}

export async function listFeedbackAdmin(status = "") {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return getJSON(`/api/feedback/admin${qs}`);
}

export async function updateFeedbackStatus(id, status) {
  const res = await fetch(`${API_BASE}/api/feedback/admin/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || `Request failed (${res.status})`);
  return json;
}
