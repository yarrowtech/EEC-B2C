export function normalizeStageNumber(stageValue) {
  if (stageValue === null || stageValue === undefined || stageValue === "") {
    return 1;
  }

  if (typeof stageValue === "number" && Number.isFinite(stageValue)) {
    return Math.max(1, Math.trunc(stageValue));
  }

  const raw = String(stageValue).trim().toLowerCase();
  if (!raw) return 1;

  if (/^\d+$/.test(raw)) {
    return Math.max(1, Number(raw));
  }

  const stageMatch = raw.match(/^stage[-\s]*(\d+)$/);
  if (stageMatch) {
    return Math.max(1, Number(stageMatch[1]));
  }

  if (raw === "foundation") return 1;
  if (raw === "intermediate") return 2;
  if (raw === "advanced") return 3;

  return 1;
}

export function getLevelFromStage(stageValue) {
  const stage = normalizeStageNumber(stageValue);
  if (stage <= 1) return "basic";
  if (stage === 2) return "intermediate";
  return "advanced";
}

export function buildQuestionStagePayload(stageValue) {
  return {
    stage: normalizeStageNumber(stageValue),
    level: getLevelFromStage(stageValue),
  };
}

export function formatStageLabel(stageValue) {
  const stage = normalizeStageNumber(stageValue);
  return `Stage ${stage}`;
}

export function buildStageOptions(stages = [], includeDefaults = true) {
  const normalized = (Array.isArray(stages) ? stages : [])
    .map((s) => normalizeStageNumber(s))
    .filter((s) => Number.isFinite(s) && s >= 1);

  const base = includeDefaults ? [1, 2, 3] : [];
  return [...new Set([...base, ...normalized])].sort((a, b) => a - b);
}
