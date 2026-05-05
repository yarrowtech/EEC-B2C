import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Eye, EyeOff, Lock, CheckCircle2, XCircle, TimerOff } from "lucide-react";

function getStrength(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"];
const STRENGTH_COLORS = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];

function fmt(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Token validity / countdown
  const [tokenState, setTokenState] = useState("checking"); // "checking" | "valid" | "expired"
  const [secondsLeft, setSecondsLeft] = useState(null);
  const timerRef = useRef(null);

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Check token on mount and start countdown
  useEffect(() => {
    async function check() {
      try {
        const res = await fetch(`${API_BASE}/api/auth/reset-token-status/${token}`);
        const data = await res.json();
        if (!res.ok || !data.valid) {
          setTokenState("expired");
          return;
        }
        setTokenState("valid");
        setSecondsLeft(data.expiresIn);
      } catch {
        setTokenState("expired");
      }
    }
    check();
  }, [token, API_BASE]);

  // Countdown tick
  useEffect(() => {
    if (tokenState !== "valid" || secondsLeft === null) return;
    if (secondsLeft <= 0) {
      setTokenState("expired");
      return;
    }
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          setTokenState("expired");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [tokenState, secondsLeft !== null]);

  const strength = getStrength(password);
  const passwordsMatch = confirm.length > 0 && password === confirm;
  const passwordsMismatch = confirm.length > 0 && password !== confirm;

  // Colour the countdown: green > 5 min, amber 1-5 min, red < 1 min
  const timerColor =
    secondsLeft > 300 ? "#22c55e" : secondsLeft > 60 ? "#f97316" : "#ef4444";

  async function handleSubmit(e) {
    e.preventDefault();
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      clearInterval(timerRef.current);
      setDone(true);
      setTimeout(() => {
        navigate("/", { replace: true });
        window.dispatchEvent(new Event("eec:open-login"));
      }, 2400);
    } catch (err) {
      toast.error(err.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10"
      style={{ background: "#FEF4E8" }}
    >
      {/* Decorative blobs */}
      <div
        className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full blur-3xl opacity-40"
        style={{ background: "#FFD23F" }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full blur-3xl opacity-30"
        style={{ background: "#4ECDC4" }}
      />
      <div
        className="pointer-events-none absolute top-1/3 right-8 h-48 w-48 rounded-full blur-2xl opacity-20"
        style={{ background: "#F4736E" }}
      />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        {/* <div className="mb-6 flex flex-col items-center gap-1">
          <img
            src="/logo_new.png"
            alt="Edify Eight"
            className="h-12 w-auto object-contain drop-shadow"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        </div> */}

        {/* Card */}
        <div
          className="overflow-hidden rounded-4xl border-4 bg-white shadow-2xl"
          style={{ borderColor: "rgba(255,210,63,0.4)" }}
        >
          {/* Top colour strip */}
          <div className="flex h-2">
            <div className="flex-1" style={{ background: "#FFD23F" }} />
            <div className="flex-1" style={{ background: "#F4736E" }} />
            <div className="flex-1" style={{ background: "#4ECDC4" }} />
          </div>

          <div className="px-8 py-8">

            {/* ── Checking state ── */}
            {tokenState === "checking" && (
              <div className="flex flex-col items-center gap-4 py-10">
                <div
                  className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"
                  style={{ borderColor: "#FFD23F", borderTopColor: "transparent" }}
                />
                <p className="text-sm font-medium" style={{ color: "#64748b" }}>
                  Verifying link…
                </p>
              </div>
            )}

            {/* ── Expired state ── */}
            {tokenState === "expired" && (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-full"
                  style={{ border: "4px solid #F4736E", background: "rgba(244,115,110,0.08)" }}
                >
                  <TimerOff className="h-9 w-9" style={{ color: "#F4736E" }} />
                </div>
                <h2 className="text-2xl font-extrabold" style={{ color: "#1B1F3B" }}>
                  Link Expired
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>
                  This reset link has expired or already been used.
                  <br />
                  Please request a new one.
                </p>
                <button
                  onClick={() => {
                    navigate("/");
                    setTimeout(() => window.dispatchEvent(new Event("eec:open-forgot")), 100);
                  }}
                  className="mt-2 rounded-full px-7 py-3 text-sm font-extrabold text-white shadow-lg transition active:scale-[0.98]"
                  style={{ background: "#F4736E", boxShadow: "0 4px 0 0 #c9443e" }}
                >
                  Request new link
                </button>
              </div>
            )}

            {/* ── Success state ── */}
            {tokenState === "valid" && done && (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-full"
                  style={{ border: "4px solid #4ECDC4", background: "rgba(78,205,196,0.08)" }}
                >
                  <CheckCircle2 className="h-10 w-10" style={{ color: "#4ECDC4" }} />
                </div>
                <h2 className="text-2xl font-bold" style={{ color: "#1B1F3B" }}>
                  Password Reset!
                </h2>
                <p className="text-sm" style={{ color: "#64748b" }}>
                  Your password has been updated. Redirecting you to login…
                </p>
                <div className="mt-2 h-1.5 w-52 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full"
                    style={{ background: "#4ECDC4", animation: "shrink 2.4s linear forwards" }}
                  />
                </div>
              </div>
            )}

            {/* ── Form ── */}
            {tokenState === "valid" && !done && (
              <form onSubmit={handleSubmit}>
                {/* Header */}
                <div className="mb-6 text-center">
                  <div
                    className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg rotate-3"
                    style={{ background: "#FFD23F" }}
                  >
                    <span className="text-2xl">🔐</span>
                  </div>
                  <h2
                    className="text-2xl font-extrabold tracking-tight"
                    style={{ color: "#1B1F3B" }}
                  >
                    Reset your password
                  </h2>
                  <p className="mt-1.5 text-sm" style={{ color: "#64748b" }}>
                    Choose a strong new password to keep your account safe
                  </p>
                </div>

                {/* Countdown badge */}
                {secondsLeft !== null && (
                  <div
                    className="mb-5 flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5"
                    style={{
                      background: `${timerColor}12`,
                      borderColor: `${timerColor}40`,
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0" style={{ color: timerColor }}>
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                      <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span className="text-sm font-bold tabular-nums" style={{ color: timerColor }}>
                      {fmt(secondsLeft)}
                    </span>
                    <span className="text-xs" style={{ color: "#64748b" }}>
                      remaining to reset
                    </span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* New Password */}
                  <div>
                    <label
                      className="mb-1.5 block text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "#1B1F3B" }}
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPass ? "text" : "password"}
                        className="w-full rounded-full border-2 bg-slate-50 px-5 py-3.5 pr-12 text-sm outline-none transition placeholder:text-slate-400"
                        style={{ borderColor: "#e2e8f0", color: "#1B1F3B" }}
                        onFocus={(e) => (e.target.style.borderColor = "#F4736E")}
                        onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                        placeholder="Enter new password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 transition"
                        style={{ color: "#94a3b8" }}
                      >
                        {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>

                    {/* Strength bar */}
                    {password.length > 0 && (
                      <div className="mt-2.5 px-1">
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className="h-1.5 flex-1 rounded-full transition-all duration-300"
                              style={{
                                backgroundColor:
                                  i <= strength ? STRENGTH_COLORS[strength] : "#e2e8f0",
                              }}
                            />
                          ))}
                        </div>
                        <p
                          className="mt-1 text-[11px] font-semibold"
                          style={{ color: STRENGTH_COLORS[strength] }}
                        >
                          {STRENGTH_LABELS[strength]}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label
                      className="mb-1.5 block text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "#1B1F3B" }}
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirm ? "text" : "password"}
                        className="w-full rounded-full border-2 bg-slate-50 px-5 py-3.5 pr-12 text-sm outline-none transition placeholder:text-slate-400"
                        style={{
                          borderColor: passwordsMismatch
                            ? "#ef4444"
                            : passwordsMatch
                            ? "#22c55e"
                            : "#e2e8f0",
                          color: "#1B1F3B",
                        }}
                        placeholder="Confirm new password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 transition"
                        style={{ color: "#94a3b8" }}
                      >
                        {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>

                    {confirm.length > 0 && (
                      <p
                        className="mt-1.5 flex items-center gap-1 px-1 text-[11px] font-semibold"
                        style={{ color: passwordsMatch ? "#22c55e" : "#ef4444" }}
                      >
                        {passwordsMatch ? (
                          <><CheckCircle2 size={11} /> Passwords match</>
                        ) : (
                          <><XCircle size={11} /> Passwords do not match</>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-full py-4 text-sm font-extrabold text-white shadow-lg transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ background: "#F4736E", boxShadow: "0 4px 0 0 #c9443e" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#e85e58"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#F4736E"; }}
                  >
                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Resetting…
                      </>
                    ) : (
                      <>
                        <Lock size={15} />
                        Reset Password
                      </>
                    )}
                  </button>
                </div>

                {/* Security note */}
                <div
                  className="mt-5 flex items-start gap-2 rounded-2xl border px-4 py-3 text-xs"
                  style={{
                    background: "#FEF4E8",
                    borderColor: "rgba(255,210,63,0.5)",
                    color: "#64748b",
                  }}
                >
                  <span className="mt-0.5 text-base">🔒</span>
                  <span>
                    This link is <strong style={{ color: "#1B1F3B" }}>single-use</strong> and
                    expires in <strong style={{ color: "#1B1F3B" }}>15 minutes</strong> of being sent.
                  </span>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="mt-5 text-center text-xs" style={{ color: "#94a3b8" }}>
          © {new Date().getFullYear()} Edify Eight. All rights reserved.
        </p>
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
