// src/lib/jwt.js
// JWTs are base64url-encoded, not base64. atob() only understands base64
// and throws on the "-"/"_" characters base64url legitimately uses, which
// silently makes otherwise-valid tokens look invalid.
function base64UrlDecode(segment) {
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return atob(padded);
}

export function decodeJwtPayload(token) {
  try {
    const segment = String(token || "").split(".")[1];
    if (!segment) return null;
    return JSON.parse(base64UrlDecode(segment));
  } catch {
    return null;
  }
}

export function isTokenValid(token) {
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  // Tokens are no longer issued with an expiry, so no `exp` claim means the
  // session is valid indefinitely. Older tokens minted before this change
  // may still carry an `exp` — honor it for those until they're replaced by
  // a fresh login.
  if (typeof payload.exp !== "number") return true;
  return Date.now() < payload.exp * 1000;
}
