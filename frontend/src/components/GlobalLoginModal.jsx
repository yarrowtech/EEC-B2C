// src/components/GlobalLoginModal.jsx
import { useEffect, useRef, useState } from "react";
import Login from "./Login";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { toast as hotToast } from "react-hot-toast";

const PROFILE_CACHE_KEY = "eec:user-profile-cache:v1";
const PROFILE_CACHE_TTL_MS = 15 * 60 * 1000;
const FALLBACK_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

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

function clearAuthStorage() {
  try {
    localStorage.removeItem("jwt");
    localStorage.removeItem("user");
  } catch {
    // Ignore storage clear failures.
  }
}

function persistAuthSession(token, user) {
  const userPayload = JSON.stringify(user || {});
  try {
    localStorage.setItem("jwt", token);
    localStorage.setItem("user", userPayload);
  } catch (err) {
    // Roll back partial writes (for example, jwt written but user failed with QuotaExceededError).
    clearAuthStorage();
    throw err;
  }
}

export default function GlobalLoginModal() {
  const [showLogin, setShowLogin] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [showGoogleProfile, setShowGoogleProfile] = useState(false);
  const [pendingGoogleAuth, setPendingGoogleAuth] = useState(null);
  const [googleProfileSubmitting, setGoogleProfileSubmitting] = useState(false);
  const [boards, setBoards] = useState([]);
  const [classes, setClasses] = useState([]);
  const [states, setStates] = useState([]);
  const [googleProfile, setGoogleProfile] = useState({
    board: "",
    className: "",
    state: "",
    phone: "",
  });
  const modalCardRef = useRef(null);
  const googleButtonRef = useRef(null);
  const navigate = useNavigate();

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  function isProfileIncomplete(user) {
    const board = String(user?.board || "").trim();
    const className = String(user?.className || user?.class || "").trim();
    const state = String(user?.state || "").trim();
    const phone = String(user?.phone || "").trim();
    return !board || !className || !state || !phone;
  }

  async function completeLogin(data, toastMessage = null) {
    let hydratedUser = data.user;
    const cachedProfileUser = readCachedProfile(data.user);
    if (cachedProfileUser) {
      hydratedUser = { ...cachedProfileUser, ...data.user };
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

    try {
      persistAuthSession(data.token, hydratedUser);
    } catch {
      throw new Error("Browser storage is full. Clear site data and try again.");
    }

    setShowForgot(false);
    setShowLogin(false);
    setShowGoogleProfile(false);
    hotToast.dismiss("login-success-toast");
    hotToast.success(toastMessage || `Welcome back, ${hydratedUser.name}!`, {
      id: "login-success-toast",
      duration: 3000,
    });
    const redirectPath = sessionStorage.getItem("redirectAfterLogin");
    if (redirectPath) {
      sessionStorage.removeItem("redirectAfterLogin");
      navigate(redirectPath, { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
    window.dispatchEvent(new CustomEvent("eec:auth", { detail: { type: "login", user: hydratedUser } }));
  }

  /* =========================
     OPEN LOGIN EVENT
  ========================= */
  useEffect(() => {
    const openLogin = () => {
      const existingToken = localStorage.getItem("jwt") || "";
      if (isTokenValid(existingToken)) {
        setShowForgot(false);
        setShowLogin(false);
        setShowGoogleProfile(false);
        return;
      }
      setShowForgot(false);
      setShowGoogleProfile(false);
      setShowLogin(true);
    };
    window.addEventListener("eec:open-login", openLogin);
    return () => window.removeEventListener("eec:open-login", openLogin);
  }, []);

  useEffect(() => {
    if (!showLogin || showForgot || !GOOGLE_CLIENT_ID) return undefined;

    let isCancelled = false;
    const scriptId = "eec-google-gsi";

    const handleGoogleCredential = async (response) => {
      if (!response?.credential) {
        toast.error("Google login did not return a credential.");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: response.credential }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message);
        if (data?.profileIncomplete || isProfileIncomplete(data?.user)) {
          setPendingGoogleAuth({ token: data.token, user: data.user });
          setGoogleProfile({
            board: data?.user?.board || "",
            className: data?.user?.className || data?.user?.class || "",
            state: data?.user?.state || "",
            phone: data?.user?.phone || "",
          });
          setShowLogin(false);
          setShowForgot(false);
          setShowGoogleProfile(true);
          return;
        }
        await completeLogin(data, `Welcome, ${data?.user?.name || "User"}!`);
      } catch (err) {
        toast.error(err.message || "Google login failed");
      }
    };

    const initGoogleButton = () => {
      if (isCancelled || !googleButtonRef.current || !window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
      });
      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: "standard",
        theme: "outline",
        text: "signin_with",
        size: "large",
        shape: "pill",
        width: 320,
      });
    };

    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.addEventListener("load", initGoogleButton);
      initGoogleButton();
      return () => {
        isCancelled = true;
        existingScript.removeEventListener("load", initGoogleButton);
      };
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.addEventListener("load", initGoogleButton);
    document.head.appendChild(script);

    return () => {
      isCancelled = true;
      script.removeEventListener("load", initGoogleButton);
    };
  }, [showLogin, showForgot, GOOGLE_CLIENT_ID, API_BASE]);


  useEffect(() => {
    if (!showGoogleProfile) return;

    let cancelled = false;
    const loadMeta = async () => {
      try {
        const [boardsRes, classesRes, statesRes] = await Promise.all([
          fetch(`${API_BASE}/api/boards`),
          fetch(`${API_BASE}/api/classes`),
          fetch("https://countriesnow.space/api/v0.1/countries/states", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ country: "India" }),
          }),
        ]);
        const boardsData = await boardsRes.json().catch(() => []);
        const classesData = await classesRes.json().catch(() => []);
        const statesJson = await statesRes.json().catch(() => ({}));
        const statesData =
          statesJson?.data?.states?.map((s) => s.name).filter(Boolean) || FALLBACK_STATES;
        if (!cancelled) {
          setBoards(Array.isArray(boardsData) ? boardsData : []);
          setClasses(Array.isArray(classesData) ? classesData : []);
          setStates(Array.isArray(statesData) && statesData.length ? statesData : FALLBACK_STATES);
        }
      } catch {
        if (!cancelled) {
          setStates(FALLBACK_STATES);
          toast.error("Failed to load board/class options.");
        }
      }
    };

    loadMeta();
    return () => {
      cancelled = true;
    };
  }, [showGoogleProfile, API_BASE]);

  /* =========================
     BACKDROP CLICK (FIXED)
  ========================= */
  const onBackdropClick = (e) => {
    if (!modalCardRef.current?.contains(e.target)) {
      setShowLogin(false);
      setShowForgot(false);
      setShowGoogleProfile(false);
      setPendingGoogleAuth(null);
    }
  };

  async function handleGoogleProfileSubmit(e) {
    e.preventDefault();
    const board = String(googleProfile.board || "").trim();
    const className = String(googleProfile.className || "").trim();
    const state = String(googleProfile.state || "").trim();
    const phone = String(googleProfile.phone || "").trim();

    if (!board || !className || !state || !phone) {
      toast.error("Please fill board, class, state, and phone.");
      return;
    }
    if (!pendingGoogleAuth?.token) {
      toast.error("Google session missing. Please login again.");
      setShowGoogleProfile(false);
      setShowLogin(true);
      return;
    }

    try {
      setGoogleProfileSubmitting(true);
      const updateRes = await fetch(`${API_BASE}/api/users/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${pendingGoogleAuth.token}`,
        },
        body: JSON.stringify({ board, className, state, phone }),
      });
      const updateData = await updateRes.json().catch(() => ({}));
      if (!updateRes.ok) throw new Error(updateData?.message || "Failed to update profile.");

      let finalUser = updateData?.user || pendingGoogleAuth.user;
      try {
        const profileRes = await fetch(`${API_BASE}/api/users/profile`, {
          headers: { Authorization: `Bearer ${pendingGoogleAuth.token}` },
        });
        const profileData = await profileRes.json().catch(() => ({}));
        if (profileRes.ok && profileData?.user) {
          finalUser = profileData.user;
        }
      } catch {
        // Keep updated profile payload if profile fetch fails.
      }

      await completeLogin(
        { token: pendingGoogleAuth.token, user: finalUser },
        `Welcome, ${finalUser?.name || "User"}!`
      );
      setPendingGoogleAuth(null);
    } catch (err) {
      toast.error(err.message || "Failed to complete Google profile.");
    } finally {
      setGoogleProfileSubmitting(false);
    }
  }

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
              showGoogleLogin={Boolean(GOOGLE_CLIENT_ID)}
              googleButtonRef={googleButtonRef}
              onSubmit={async ({ emailOrPhone, password, remember }) => {
                try {
                  const res = await fetch(`${API_BASE}/api/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ emailOrPhone, password }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data?.message);
                  await completeLogin(data);
                } catch (err) {
                  toast.error(err.message || "Login failed");
                }
              }}
            />
          </div>
        </div>
      )}

      {/* ================= GOOGLE PROFILE MODAL ================= */}
      {showGoogleProfile && (
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
            <div
              className="relative w-full rounded-[2.5rem] bg-white p-8 shadow-2xl border-4"
              style={{ borderColor: "rgba(255,210,63,0.3)" }}
            >
              <button
                type="button"
                onClick={() => {
                  setShowGoogleProfile(false);
                  setPendingGoogleAuth(null);
                  setShowLogin(true);
                }}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-800" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
                  Complete Your Profile
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  One quick step before entering your dashboard.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleGoogleProfileSubmit}>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 ml-2">Board</label>
                  <select
                    className="w-full rounded-full border-2 border-slate-100 bg-slate-50 px-5 py-4 text-sm text-slate-900 outline-none transition focus:border-[#F4736E]/40 focus:ring-2 focus:ring-[#F4736E]/15"
                    value={googleProfile.board}
                    onChange={(e) => setGoogleProfile((p) => ({ ...p, board: e.target.value }))}
                    required
                  >
                    <option value="">Select board</option>
                    {boards.map((b) => (
                      <option key={b._id || b.name} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 ml-2">Class</label>
                  <select
                    className="w-full rounded-full border-2 border-slate-100 bg-slate-50 px-5 py-4 text-sm text-slate-900 outline-none transition focus:border-[#F4736E]/40 focus:ring-2 focus:ring-[#F4736E]/15"
                    value={googleProfile.className}
                    onChange={(e) => setGoogleProfile((p) => ({ ...p, className: e.target.value }))}
                    required
                  >
                    <option value="">Select class</option>
                    {classes.map((c) => (
                      <option key={c._id || c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 ml-2">State</label>
                  <select
                    className="w-full rounded-full border-2 border-slate-100 bg-slate-50 px-5 py-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#F4736E]/40 focus:ring-2 focus:ring-[#F4736E]/15"
                    value={googleProfile.state}
                    onChange={(e) => setGoogleProfile((p) => ({ ...p, state: e.target.value }))}
                    required
                  >
                    <option value="">Select state</option>
                    {states.map((stateName) => (
                      <option key={stateName} value={stateName}>
                        {stateName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 ml-2">Phone Number</label>
                  <input
                    className="w-full rounded-full border-2 border-slate-100 bg-slate-50 px-5 py-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#F4736E]/40 focus:ring-2 focus:ring-[#F4736E]/15"
                    value={googleProfile.phone}
                    onChange={(e) => setGoogleProfile((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="Enter phone number"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={googleProfileSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-[#F4736E] px-8 py-4 font-bold text-white shadow-[0_4px_0_0_#c9443e] transition-all hover:bg-[#e85e58] active:translate-y-1 active:shadow-none disabled:opacity-60"
                >
                  {googleProfileSubmitting ? "Saving..." : "Continue to Dashboard"}
                </button>
              </form>
            </div>
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
                    className="w-full rounded-full border-2 border-slate-100 bg-slate-50 px-5 py-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#F4736E]/40 focus:ring-2 focus:ring-[#F4736E]/15"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-[#F4736E] px-8 py-4 font-bold text-white shadow-[0_4px_0_0_#c9443e] transition-all hover:bg-[#e85e58] active:translate-y-1 active:shadow-none"
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
