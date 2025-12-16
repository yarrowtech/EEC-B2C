// src/components/GlobalLoginModal.jsx
import { useEffect, useRef, useState } from "react";
import Login from "./Login";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function GlobalLoginModal() {
  const [showLogin, setShowLogin] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const modalCardRef = useRef(null);
  const navigate = useNavigate();

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  /* =========================
     OPEN LOGIN EVENT
  ========================= */
  useEffect(() => {
    const openLogin = () => {
      setShowForgot(false);
      setShowLogin(true);
    };
    window.addEventListener("eec:open-login", openLogin);
    return () => window.removeEventListener("eec:open-login", openLogin);
  }, []);

  /* =========================
     BACKDROP CLICK (FIXED)
  ========================= */
  const onBackdropClick = (e) => {
    if (!modalCardRef.current?.contains(e.target)) {
      setShowLogin(false);
      setShowForgot(false);
    }
  };

  /* =========================
     FORGOT PASSWORD HANDLER
  ========================= */
  async function handleForgotPassword(e) {
    e.preventDefault();

    const form = e.currentTarget;
    const email = form.email.value.trim().toLowerCase();

    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message);

      toast.success("Password reset link sent to your email 📧");
      setShowForgot(false);
    } catch (err) {
      toast.error(err.message || "Failed to send reset link");
    }
  }

  return (
    <>
      {/* ================= LOGIN MODAL ================= */}
      {showLogin && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={onBackdropClick}
        >
          <div className="absolute inset-0 bg-blue-950/45 backdrop-blur-sm" />
          <div
            ref={modalCardRef}
            className="relative z-[101] w-[92%] max-w-md"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Login
              onClose={() => setShowLogin(false)}
              onForgot={() => {
                setShowLogin(false);
                setShowForgot(true);
              }}
              onSubmit={async ({ emailOrPhone, password, remember }) => {
                try {
                  const res = await fetch(`${API_BASE}/api/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ emailOrPhone, password }),
                  });

                  const data = await res.json();
                  if (!res.ok) throw new Error(data?.message);

                  localStorage.setItem("jwt", data.token);
                  localStorage.setItem("user", JSON.stringify(data.user));

                  toast.success(`Welcome back, ${data.user.name}!`);

                  setShowLogin(false);
                  navigate("/dashboard", { replace: true });

                  window.dispatchEvent(
                    new CustomEvent("eec:auth", {
                      detail: { type: "login", user: data.user },
                    })
                  );
                } catch (err) {
                  toast.error(err.message || "Login failed");
                }
              }}
            />
          </div>
        </div>
      )}

      {/* ================= FORGOT PASSWORD MODAL ================= */}
      {showForgot && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={onBackdropClick}
        >
          <div className="absolute inset-0 bg-blue-950/40 backdrop-blur-sm" />
          <div
            ref={modalCardRef}
            className="relative z-[101] w-[92%] max-w-md"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="relative overflow-hidden rounded-3xl border border-blue-100/80 bg-white/95 p-6 shadow-[0_24px_80px_rgba(2,32,71,0.35)] backdrop-blur-md">
              <div className="h-1.5 w-full bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300" />

              <div className="mb-3 mt-3">
                <span className="inline-block rounded-full bg-yellow-400 px-3 py-1 text-[11px] font-semibold text-blue-950 shadow">
                  Reset Password
                </span>
                <h3 className="mt-3 text-xl font-bold leading-6 text-blue-950">
                  Forgot Password
                </h3>
                <p className="mt-1 text-xs text-blue-900/70">
                  Enter your email to receive reset instructions.
                </p>
              </div>

              <form className="grid gap-3" onSubmit={handleForgotPassword}>
                <input
                  className="input"
                  name="email"
                  type="email"
                  placeholder="Email Address"
                  required
                />

                <button
                  type="submit"
                  className="mt-1 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-400 px-4 py-2 text-sm font-semibold text-blue-950 shadow ring-1 ring-yellow-300/60 hover:shadow-lg"
                >
                  Send Reset Link
                </button>

                <div className="mt-1 flex items-center justify-between text-[11px] text-blue-900/75">
                  <button
                    type="button"
                    className="hover:underline"
                    onClick={() => setShowForgot(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="font-semibold text-blue-700 hover:underline"
                    onClick={() => {
                      setShowForgot(false);
                      setShowLogin(true);
                    }}
                  >
                    Back to Login
                  </button>
                </div>
              </form>

              <button
                type="button"
                onClick={() => setShowForgot(false)}
                className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-blue-100/70 bg-white/80 text-blue-900/80 hover:bg-white"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
