// src/components/Login.jsx
import { useEffect, useState } from "react";

const LS_REMEMBER_KEY = "eecRemember";
const LS_LOGIN_ID_KEY = "eecLoginId";

const inputCls =
  "w-full rounded-full border-2 border-slate-100 bg-slate-50 px-5 py-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#F4736E]/40 focus:ring-2 focus:ring-[#F4736E]/15";

export default function Login({
  onClose,
  onForgot,
  onSubmit,
  onSignUp,
  showGoogleLogin = false,
  googleButtonRef = null,
}) {
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(LS_REMEMBER_KEY) === "1";
    setRemember(saved);
    if (saved) setEmailOrPhone(localStorage.getItem(LS_LOGIN_ID_KEY) || "");
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onSubmit?.({ emailOrPhone, password, remember });
      if (remember) {
        localStorage.setItem(LS_REMEMBER_KEY, "1");
        localStorage.setItem(LS_LOGIN_ID_KEY, emailOrPhone);
      } else {
        localStorage.removeItem(LS_REMEMBER_KEY);
        localStorage.removeItem(LS_LOGIN_ID_KEY);
      }
    } catch (err) {
      setError(err?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* ── Font + icon import ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Balsamiq+Sans:wght@400;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
      `}</style>

      <div
        className="relative w-full rounded-[2.5rem] bg-white p-8 shadow-2xl border-4"
        style={{ borderColor: "rgba(255,210,63,0.3)" }}
      >
        {/* Sparkle badge — top-right, rotated, coral */}
        <div className="absolute -top-6 -right-6 hidden sm:flex items-center justify-center rounded-full bg-[#F4736E] p-4 text-white shadow-lg rotate-12">
          <span
            className="material-symbols-outlined text-3xl"
            style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
          >
            waving_hand
          </span>
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
        >
          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>close</span>
        </button>

        {/* Header */}
        <div className="mb-6">
          {/* <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#4ECDC4] bg-[#4ECDC4]/20 px-4 py-2 text-xs font-black uppercase tracking-wider text-[#1B8A84] mb-4">
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>star</span>
            Welcome Back, Explorer!
          </div> */}
          <h3
            className="text-2xl font-bold text-slate-800"
            style={{ fontFamily: "'Balsamiq Sans', cursive" }}
          >
            Login to Your Adventure!
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Use your email or mobile number to continue.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
            {error}
          </div>
        )}

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 ml-2">Email or Mobile</label>
            <input
              className={inputCls}
              placeholder="e.g. alex@mail.com"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              autoFocus
              required
              inputMode="email"
              autoComplete="username"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 ml-2">Password</label>
            <div className="relative">
              <input
                className={inputCls + " pr-12"}
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="absolute inset-y-0 right-3 my-auto flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 transition"
                aria-label={showPwd ? "Hide password" : "Show password"}
              >
                <span
                  className="material-symbols-outlined text-xl"
                  style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
                >
                  {showPwd ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer select-none items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                className="h-4 w-4 rounded accent-[#F4736E]"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Remember me
            </label>
            <button
              type="button"
              className="text-xs font-bold text-[#F4736E] hover:underline"
              onClick={onForgot}
            >
              Forgot password?
            </button>
          </div>

          {/* Login button — matches code.html launch button style */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-[#F4736E] px-8 py-4 font-bold text-white shadow-[0_4px_0_0_#c9443e] transition-all hover:bg-[#e85e58] active:translate-y-1 active:shadow-none disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Login to Adventure"}
            {!loading && (
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
              >
                login
              </span>
            )}
          </button>

          {showGoogleLogin && (
            <>
              <div className="flex items-center gap-3 pt-2">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">or</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
              <div className="flex justify-center pt-1">
                <div ref={googleButtonRef} />
              </div>
            </>
          )}
        </form>

        {/* Sign up link */}
        <div className="mt-6 border-t border-slate-100 pt-4 text-center">
          <p className="text-xs text-slate-500">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={onSignUp}
              className="font-bold text-[#F4736E] hover:underline"
            >
              Join the Adventure!
            </button>
          </p>
        </div>
      </div>
    </>
  );
}
