// src/lib/api.js
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL;

function authHeaders() {
  const token = localStorage.getItem("jwt");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
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
