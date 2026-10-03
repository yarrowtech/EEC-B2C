import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getUiClickSessionId } from "../lib/api";

const TRACKABLE_SELECTOR = [
  "button",
  "a",
  "[role='button']",
  "input[type='submit']",
  "input[type='button']",
].join(",");

function readUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function cleanLabel(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function getElementLabel(el) {
  const candidates = [
    el?.getAttribute?.("data-track-label"),
    el?.getAttribute?.("aria-label"),
    el?.getAttribute?.("title"),
    el?.getAttribute?.("value"),
    el?.textContent,
    el?.id,
  ];

  for (const candidate of candidates) {
    const label = cleanLabel(candidate);
    if (label) return label.length > 120 ? `${label.slice(0, 117)}...` : label;
  }

  return "Unlabeled action";
}

function getElementType(el) {
  const tag = String(el?.tagName || "").toLowerCase();
  if (tag === "a") return "link";
  if (tag === "input") return `input:${String(el?.type || "").toLowerCase() || "button"}`;
  return tag || "button";
}

export default function UiClickTracker() {
  const location = useLocation();
  const API = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    const send = (type) => {
      const token = localStorage.getItem("jwt") || "";
      fetch(`${API.replace(/\/$/, "")}/api/site-events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          type,
          sessionId: getUiClickSessionId(),
          pagePath: `${window.location.pathname}${window.location.search}`,
          referrer: document.referrer || "",
        }),
        keepalive: true,
      }).catch(() => {});
    };

    send("pageview");
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") send("ping");
    }, 60000);
    return () => clearInterval(timer);
  }, [API, location.pathname, location.search]);

  useEffect(() => {
    const handler = (event) => {
      const target = event.target?.closest?.(TRACKABLE_SELECTOR);
      if (!target || target.getAttribute("data-track-skip") === "true") return;
      const token = localStorage.getItem("jwt") || "";

      const user = readUser();
      if (token && String(user?.role || "").toLowerCase() !== "student") return;

      const payload = {
        buttonLabel: getElementLabel(target),
        pagePath: `${window.location.pathname}${window.location.search}`,
        pageTitle: document.title || "",
        elementType: getElementType(target),
        href: target.getAttribute?.("href") || "",
        sessionId: getUiClickSessionId(),
        userName: user?.name || "",
        userEmail: user?.email || "",
        userRole: user?.role || "",
        context: {
          pathname: location.pathname,
          search: location.search,
          hash: location.hash,
        },
      };

      const url = `${API.replace(/\/$/, "")}/api/ui-clicks`;
      const body = JSON.stringify(payload);

      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body,
        keepalive: true,
      }).catch(() => {
        // Ignore analytics failures.
      });
    };

    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [API, location.hash, location.pathname, location.search]);

  return null;
}
