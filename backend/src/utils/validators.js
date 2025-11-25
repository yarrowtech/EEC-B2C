export const isEmail = (v = "") => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export const isPhone = (v = "") => /^[0-9]{10}$/.test(v.replace(/\D/g, ""));

export function normalizeLoginId(id) {
  const s = String(id || "").trim();
  return s.toLowerCase(); // keep it simple (email/phone in one field)
}
