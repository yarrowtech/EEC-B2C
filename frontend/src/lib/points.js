// Simple localStorage-backed points system
const POINTS_KEY = 'eec_points_total';

export function getPoints() {
  try {
    const raw = localStorage.getItem(POINTS_KEY);
    const val = parseInt(raw || '0', 10);
    return Number.isNaN(val) ? 0 : val;
  } catch {
    return 0;
  }
}

export function setPoints(total) {
  try {
    const safe = Math.max(0, Math.floor(total || 0));
    localStorage.setItem(POINTS_KEY, String(safe));
    // Notify listeners in same tab
    window.dispatchEvent(new CustomEvent('points:update', { detail: { total: safe } }));
    return safe;
  } catch {
    return 0;
  }
}

export function addPoints(amount) {
  const inc = Math.max(0, Math.floor(amount || 0));
  if (!inc) return getPoints();
  const next = getPoints() + inc;
  return setPoints(next);
}

export function hasAward(key) {
  try {
    return localStorage.getItem(`eec_points_awarded_${key}`) === '1';
  } catch {
    return false;
  }
}

export function markAwarded(key) {
  try {
    localStorage.setItem(`eec_points_awarded_${key}`, '1');
  } catch {
    // ignore
  }
}
