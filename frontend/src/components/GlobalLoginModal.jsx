// src/components/GlobalLoginModal.jsx
import { useEffect, useRef, useState } from "react";
import Login from "./Login"; // ⬅️ use your new design
import { useNavigate } from "react-router-dom";

export default function GlobalLoginModal() {
  const [showLogin, setShowLogin] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const modalCardRef = useRef(null);
  const navigate = useNavigate(); // ✅ add this


  useEffect(() => {
    const openLogin = () => {
      setShowForgot(false);
      setShowLogin(true);
    };
    window.addEventListener("eec:open-login", openLogin);
    return () => window.removeEventListener("eec:open-login", openLogin);
  }, []);

  const onBackdropClick = (e) => {
    if (!modalCardRef.current) return;
    if (!modalCardRef.current.contains(e.target)) {
      setShowLogin(false);
      setShowForgot(false);
    }
  };

  return (
    <>
      {showLogin && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onMouseDown={onBackdropClick}
        >
          <div className="absolute inset-0 bg-blue-950/45 backdrop-blur-sm" />
          <div
            ref={modalCardRef}
            className="relative z-[101] w-[92%] max-w-md"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* ⬇️ NEW: render the pretty Login component */}
            <Login
              onClose={() => setShowLogin(false)}
              onForgot={() => {
                setShowLogin(false);
                setShowForgot(true);
              }}
              onSubmit={async ({ emailOrPhone, password, remember }) => {
                const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

                try {
                  const res = await fetch(`${API_BASE}/api/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ emailOrPhone, password }),
                  });

                  const data = await res.json();
                  // ✅ Store token + user in localStorage
                  localStorage.setItem("jwt", data.token);
                  localStorage.setItem("user", JSON.stringify(data.user));

                  // ✅ Optional “Remember Me”
                  if (remember) {
                    localStorage.setItem("rememberEmail", emailOrPhone);
                  } else {
                    localStorage.removeItem("rememberEmail");
                  }

                  // ✅ Success toast + modal close
                  import("react-toastify").then(({ toast }) => {
                    toast.success(`Welcome back, ${data.user.name}!`);
                  });

                  setShowLogin(false);
                  // if (data.user.role === "admin") {
                  //   navigate("/admin-dashboard", { replace: true });
                  // } else {
                  //   navigate("/student-dashboard", { replace: true });
                  // }
                  navigate("/dashboard", { replace: true }); // unified dashboard

                  // ✅ Notify app that user is logged in
                  window.dispatchEvent(
                    new CustomEvent("eec:auth", {
                      detail: { type: "login", user: data.user },
                    })
                  );
                } catch (err) {
                  import("react-toastify").then(({ toast }) => {
                    toast.error(err.message || "Login failed. Please try again.");
                  });
                }
              }}
            />
          </div>
        </div>
      )}

      {showForgot && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onMouseDown={onBackdropClick}
        >
          <div className="absolute inset-0 bg-blue-950/40 backdrop-blur-sm" />
          <div
            ref={modalCardRef}
            className="relative z-[101] w-[92%] max-w-md"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* keep your existing Forgot UI for now (or I can restyle it to match) */}
            <div className="relative overflow-hidden rounded-3xl border border-blue-100/80 bg-white/95 p-6 shadow-[0_24px_80px_rgba(2,32,71,0.35)] backdrop-blur-md">
              <div className="h-1.5 w-full bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300" />
              <div className="mb-3 mt-3">
                <span className="inline-block rounded-full bg-yellow-400 px-3 py-1 text-[11px] font-semibold text-blue-950 shadow">
                  Reset Password
                </span>
                <h3 className="mt-3 text-xl font-bold leading-6 text-blue-950">Forgot Password</h3>
                <p className="mt-1 text-xs text-blue-900/70">Enter your email to receive reset instructions.</p>
              </div>

              <form
                className="grid gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  setShowForgot(false);
                }}
              >
                <input className="input" placeholder="Email Address" />
                <button
                  type="submit"
                  className="mt-1 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-400 px-4 py-2 text-sm font-semibold text-blue-950 shadow ring-1 ring-yellow-300/60 hover:shadow-lg"
                >
                  Send Reset Link
                </button>

                <div className="mt-1 flex items-center justify-between text-[11px] text-blue-900/75">
                  <button type="button" className="hover:underline" onClick={() => setShowForgot(false)}>
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
