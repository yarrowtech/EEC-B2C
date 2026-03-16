// src/components/GlobalLoginModal.jsx
import { useEffect, useRef, useState } from "react";
import Login from "./Login";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const PROFILE_CACHE_KEY = "eec:user-profile-cache:v1";
const PROFILE_CACHE_TTL_MS = 15 * 60 * 1000;

function isTokenValid(token) {
  if (!token) return false;
  try {
    const { exp } = JSON.parse(atob(token.split(".")[1] || ""));
    return typeof exp === "number" && Date.now() < exp * 1000;
  } catch {
    return false;
  }
}

function getUserCacheId(user) {
  return String(user?._id || user?.id || user?.email || user?.phone || "").toLowerCase();
}

function readCachedProfile(loginUser) {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.user || !parsed?.cachedAt) return null;
    if (Date.now() - Number(parsed.cachedAt) > PROFILE_CACHE_TTL_MS) return null;
    if (getUserCacheId(parsed.user) !== getUserCacheId(loginUser)) return null;
    return parsed.user;
  } catch {
    return null;
  }
}

function writeCachedProfile(user) {
  try {
    localStorage.setItem(
      PROFILE_CACHE_KEY,
      JSON.stringify({
        cachedAt: Date.now(),
        user,
      })
    );
  } catch {
    // Ignore cache write failures.
  }
}

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
      const existingToken = localStorage.getItem("jwt") || "";
      if (isTokenValid(existingToken)) {
        setShowForgot(false);
        setShowLogin(false);
        return;
      }
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
          className="fixed inset-0 z-100 flex items-center justify-center px-4"
          onClick={onBackdropClick}
        >
          <div className="absolute inset-0 bg-[#1B1F3B]/60 backdrop-blur-sm" />
          <div
            ref={modalCardRef}
            className="relative z-101 w-full max-w-md"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Login
              onClose={() => setShowLogin(false)}
              onForgot={() => { setShowLogin(false); setShowForgot(true); }}
              onSignUp={() => { setShowLogin(false); navigate("/register"); }}
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

                  let hydratedUser = data.user;
                  const cachedProfileUser = readCachedProfile(data.user);
                  if (cachedProfileUser) {
                    hydratedUser = { ...data.user, ...cachedProfileUser };
                  }

                  const shouldFetchProfile = !cachedProfileUser || !hydratedUser?.avatar;
                  if (shouldFetchProfile) {
                  try {
                    const profileRes = await fetch(`${API_BASE}/api/users/profile`, {
                      headers: { Authorization: `Bearer ${data.token}` },
                    });
                    const profileData = await profileRes.json().catch(() => ({}));
                    if (profileRes.ok && profileData?.user) {
                      hydratedUser = { ...data.user, ...profileData.user };
                      writeCachedProfile(hydratedUser);
                    }
                  } catch {
                    // Ignore hydration failure and keep login payload user.
                  }
                  } else {
                    writeCachedProfile(hydratedUser);
                  }

                  localStorage.setItem("user", JSON.stringify(hydratedUser));
                  setShowForgot(false);
                  setShowLogin(false);
                  toast.success(`Welcome back, ${hydratedUser.name}!`);
                  const redirectPath = sessionStorage.getItem("redirectAfterLogin");
                  if (redirectPath) {
                    sessionStorage.removeItem("redirectAfterLogin");
                    navigate(redirectPath, { replace: true });
                  } else {
                    navigate("/dashboard", { replace: true });
                  }
                  window.dispatchEvent(new CustomEvent("eec:auth", { detail: { type: "login", user: hydratedUser } }));
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
          className="fixed inset-0 z-100 flex items-center justify-center px-4"
          onClick={onBackdropClick}
        >
          <div className="absolute inset-0 bg-[#1B1F3B]/60 backdrop-blur-sm" />
          <div
            ref={modalCardRef}
            className="relative z-101 w-full max-w-md"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Card — matches code.html template style */}
            <div
              className="relative w-full rounded-[2.5rem] bg-white p-8 shadow-2xl border-4"
              style={{ borderColor: "rgba(255,210,63,0.3)" }}
            >
              {/* Sparkle badge */}
              <div className="absolute -top-6 -right-6 hidden sm:flex items-center justify-center rounded-full bg-[#F4736E] p-4 text-white shadow-lg rotate-12">
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>lock_reset</span>
              </div>

              {/* Close */}
              <button
                type="button"
                onClick={() => setShowForgot(false)}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
              >
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>close</span>
              </button>

              {/* Header */}
              <div className="mb-6">
                {/* <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#4ECDC4] bg-[#4ECDC4]/20 px-4 py-2 text-xs font-black uppercase tracking-wider text-[#1B8A84] mb-4">
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>shield_lock</span>
                  Reset Password
                </div> */}
                <h3 className="text-2xl font-bold text-slate-800" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
                  Forgot Your Password?
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Enter your email and we'll send reset instructions.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleForgotPassword}>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 ml-2">Email Address</label>
                  <input
                    className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 py-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#F4736E]/40 focus:ring-2 focus:ring-[#F4736E]/15"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#F4736E] px-8 py-4 font-bold text-white shadow-[0_4px_0_0_#c9443e] transition-all hover:bg-[#e85e58] active:translate-y-1 active:shadow-none"
                >
                  Send Reset Link
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>send</span>
                </button>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    className="text-xs text-slate-400 hover:text-slate-600 transition"
                    onClick={() => setShowForgot(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="text-xs font-bold text-[#F4736E] hover:underline"
                    onClick={() => { setShowForgot(false); setShowLogin(true); }}
                  >
                    ← Back to Login
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
