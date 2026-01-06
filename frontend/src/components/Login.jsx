// src/components/Login.jsx
import React, { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";

const LS_REMEMBER_KEY = "eecRemember";
const LS_LOGIN_ID_KEY = "eecLoginId";

export default function Login({ onClose, onForgot, onSubmit, onSignUp }) {
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");

  // Load remembered email/phone on mount
  useEffect(() => {
    const savedRemember = localStorage.getItem(LS_REMEMBER_KEY) === "1";
    setRemember(savedRemember);
    if (savedRemember) {
      const savedId = localStorage.getItem(LS_LOGIN_ID_KEY) || "";
      setEmailOrPhone(savedId);
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Call parent submit (do your API there)
      await onSubmit?.({ emailOrPhone, password, remember });

      // Persist remember choice + identifier
      if (remember) {
        localStorage.setItem(LS_REMEMBER_KEY, "1");
        localStorage.setItem(LS_LOGIN_ID_KEY, emailOrPhone);
      } else {
        localStorage.removeItem(LS_REMEMBER_KEY);
        localStorage.removeItem(LS_LOGIN_ID_KEY);
      }
    } catch (err) {
      setError(err?.message || "Login failed. Please try again.");
      return;
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-blue-100/80 bg-white/90 shadow-[0_24px_80px_rgba(2,32,71,0.28)] backdrop-blur-md">
      {/* top gradient bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300" />

      <div className="p-6">
        {/* badge */}
        <div className="mb-4 flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-yellow-400 px-3 py-1 text-[11px] font-semibold text-blue-950 shadow">
            Welcome back
          </span>
          <span className="text-[11px] text-blue-900/60">Secure sign-in</span>
        </div>

        {/* title */}
        <h3 className="text-xl font-bold leading-6 text-blue-950">Login</h3>
        <p className="mt-1 text-xs text-blue-900/70">
          Use your email or mobile number to continue.
        </p>

        {/* error */}
        {error ? (
          <div
            className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {/* form */}
        <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-blue-900/80">
              Email or Mobile
            </span>
            <input
              className="input"
              placeholder="e.g. alex@mail.com"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              autoFocus
              required
              inputMode="email"
              autoComplete="username"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-blue-900/80">
              Password
            </span>
            <div className="relative">
              <input
                className="input pr-10"
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
                className="absolute inset-y-0 right-2 my-auto inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-900/70 hover:bg-blue-50"
                aria-label={showPwd ? "Hide password" : "Show password"}
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          <div className="mt-1 flex items-center justify-between">
            <label className="flex select-none items-center gap-2 text-xs text-blue-900/80">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 accent-yellow-400"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Remember me
            </label>

            <button
              type="button"
              className="text-xs font-semibold text-blue-700 hover:underline"
              onClick={onForgot}
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-1 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-400 px-4 py-2 text-sm font-semibold text-blue-950 shadow-md ring-1 ring-yellow-300/60 transition hover:shadow-lg hover:saturate-[1.05] active:scale-[.98] disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        {/* Sign up link */}
        <div className="mt-6 text-center border-t border-blue-100 pt-4">
          <p className="text-xs text-blue-900/70">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={onSignUp}
              className="font-semibold text-blue-950 hover:text-yellow-600 transition-colors underline decoration-dotted underline-offset-2"
            >
              Sign up here
            </button>
          </p>
        </div>

        {/* close button */}
        <button
          type="button"
          aria-label="Close login"
          onClick={onClose}
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-blue-100/70 bg-white/80 text-blue-900/80 shadow-sm backdrop-blur hover:bg-white"
        >
          ×
        </button>
      </div>
    </div>
  );
}
