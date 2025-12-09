// src/components/auth/RequireAdmin.jsx
import React from "react";
import { Navigate } from "react-router-dom";

export default function RequireAdmin({ children }) {
  try {
    // Your login flow usually stores user (with role) in localStorage.
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if ((user?.role || "").toLowerCase() === "admin" || (user?.role || "").toLowerCase() === "teacher") return children;
  } catch {}
  return <Navigate to="/" replace />;
}
