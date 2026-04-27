const WEAK_AREAS_STORAGE_KEY = "eec:student:weak-areas:v1";

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function resolveStageNumber(stageValue) {
  if (typeof stageValue === "number" && Number.isFinite(stageValue)) {
    return Math.max(1, Math.trunc(stageValue));
  }
  const match = String(stageValue || "").match(/(\d+)/);
  return match ? Math.max(1, Number(match[1])) : 1;
}

export function buildTopicSummaryPath({ subjectId, topicId, stage }) {
  const stageNum = resolveStageNumber(stage);
  if (!subjectId || !topicId) return `/dashboard/syllabus?stage=${stageNum}`;
  return `/dashboard/syllabus/topic/${subjectId}/${topicId}?stage=${stageNum}`;
}

export function buildTopicPracticePath({ subjectId, topicId, stage }) {
  const base = buildTopicSummaryPath({ subjectId, topicId, stage });
  return base.includes("?") ? `${base}&openPractice=1` : `${base}?openPractice=1`;
}

export function readWeakAreas() {
  const rows = readJSON(WEAK_AREAS_STORAGE_KEY, []);
  return Array.isArray(rows) ? rows : [];
}

export function saveWeakAreas(rows) {
  try {
    localStorage.setItem(WEAK_AREAS_STORAGE_KEY, JSON.stringify(rows || []));
  } catch {
    // ignore localStorage quota errors
  }
}

function buildQuestionText(question) {
  const raw =
    question?.question ||
    question?.prompt ||
    question?.plainText ||
    question?.choiceMatrix?.prompt ||
    question?.matchList?.prompt ||
    question?.clozeText?.text ||
    question?.clozeSelect?.text ||
    question?.clozeDrag?.text ||
    "";

  return String(raw).replace(/\s+/g, " ").trim();
}

export function createWeakAreaEntries({ meta, questions, result, attemptId }) {
  const detail = result?.detail || {};
  const list = [];
  const stage = resolveStageNumber(meta?.stage);
  const subjectId = String(meta?.subject || "");
  const topicId = String(meta?.topic || "");
  const subjectName = String(meta?.subjectName || "");
  const topicName = String(meta?.topicName || "");
  const now = new Date().toISOString();

  for (const q of questions || []) {
    const qid = String(q?._id || "");
    if (!qid) continue;
    const status = String(detail?.[qid] || "");
    if (status !== "wrong" && status !== "partial") continue;

    const text = buildQuestionText(q);
    list.push({
      key: `${subjectId}|${topicId}|${qid}`,
      qid,
      status,
      questionType: String(q?.type || ""),
      questionText: text || "Review this concept",
      subjectId,
      topicId,
      subjectName: subjectName || String(q?.subject?.name || ""),
      topicName: topicName || String(q?.topic?.name || ""),
      stage,
      attemptId: String(attemptId || ""),
      updatedAt: now,
    });
  }

  return list;
}

export function upsertWeakAreas(currentRows, nextRows, maxRows = 60) {
  const rows = Array.isArray(currentRows) ? currentRows : [];
  const incoming = Array.isArray(nextRows) ? nextRows : [];
  const byKey = new Map(rows.map((row) => [String(row?.key || ""), row]));

  for (const row of incoming) {
    const key = String(row?.key || "");
    if (!key) continue;
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, row);
      continue;
    }
    byKey.set(key, {
      ...prev,
      ...row,
      questionText: row.questionText || prev.questionText,
      updatedAt: row.updatedAt || prev.updatedAt,
    });
  }

  return Array.from(byKey.values())
    .sort((a, b) => new Date(b?.updatedAt || 0).getTime() - new Date(a?.updatedAt || 0).getTime())
    .slice(0, maxRows);
}

function attemptSortTs(attempt) {
  return new Date(attempt?.submittedAt || attempt?.createdAt || 0).getTime();
}

function getAttemptSubject(attempt) {
  const subjectObj = attempt?.subject;
  const topicObj = attempt?.topic;
  return {
    subjectId: String(subjectObj?._id || attempt?.subject || ""),
    topicId: String(topicObj?._id || attempt?.topic || ""),
    subjectName: String(subjectObj?.name || attempt?.subjectName || "Subject"),
    topicName: String(topicObj?.name || attempt?.topicName || "Topic"),
    stage: resolveStageNumber(attempt?.stage),
    percent: Number(attempt?.percent || 0),
  };
}

export function deriveNextAction({ attempts, weakAreas }) {
  const weakList = Array.isArray(weakAreas) ? weakAreas : [];
  const attemptList = Array.isArray(attempts) ? attempts : [];

  if (weakList.length > 0) {
    const top = weakList[0];
    const to = buildTopicPracticePath({
      subjectId: top.subjectId,
      topicId: top.topicId,
      stage: top.stage,
    });
    return {
      title: "Recommended Next Step",
      subtitle: `Revise ${top.topicName || "this topic"} and retry practice`,
      description: top.questionText,
      ctaLabel: "Revise Now",
      to,
    };
  }

  if (attemptList.length === 0) {
    return {
      title: "Recommended Next Step",
      subtitle: "Start your first practice",
      description: "Open Stage 1 syllabus and begin with any topic summary, then start practice.",
      ctaLabel: "Start Learning",
      to: "/dashboard/syllabus?stage=1",
    };
  }

  const latest = [...attemptList].sort((a, b) => attemptSortTs(b) - attemptSortTs(a))[0];
  const info = getAttemptSubject(latest);
  const to = buildTopicPracticePath({
    subjectId: info.subjectId,
    topicId: info.topicId,
    stage: info.stage,
  });

  return {
    title: "Recommended Next Step",
    subtitle: `Continue ${info.topicName} (${info.subjectName})`,
    description:
      info.percent >= 75
        ? `Great progress (${info.percent}%). Attempt a new set to strengthen speed and accuracy.`
        : `Last score ${info.percent}%. Revise summary and retry basic practice for better confidence.`,
    ctaLabel: info.percent >= 75 ? "Practice Again" : "Revise & Practice",
    to,
  };
}
