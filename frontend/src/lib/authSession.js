// src/lib/authSession.js
import { decodeJwtPayload } from "./jwt";

// Persists a login/register/switch-account response ({ token, user }) into
// localStorage and notifies the rest of the app (which reads localStorage
// independently on mount — there's no shared auth context in this app).
export function persistAuthSession({ token, user } = {}, eventType = "login") {
  if (!token) return null;

  localStorage.setItem("jwt", token);

  const tokenPayload = decodeJwtPayload(token) || {};
  const hydratedUser = {
    ...(user || {}),
    _id: user?._id || tokenPayload?.sub || "",
    id: user?._id || tokenPayload?.sub || "",
    role: user?.role || tokenPayload?.role || "student",
  };

  localStorage.setItem("user", JSON.stringify(hydratedUser));
  window.dispatchEvent(new CustomEvent("eec:auth", { detail: { type: eventType, user: hydratedUser } }));

  return hydratedUser;
}
