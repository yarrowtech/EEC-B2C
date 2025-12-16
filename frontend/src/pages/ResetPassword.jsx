import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Eye, EyeOff, ShieldCheck, Lock } from "lucide-react";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const isStrong = password.length >= 8;

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

      toast.success("Password reset successful. Please login.");
      navigate("/", { replace: true });
      window.dispatchEvent(new Event("eec:open-login"));
    } catch (err) {
      toast.error(err.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="relative overflow-hidden rounded-3xl border border-blue-100/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(2,32,71,0.25)] backdrop-blur-md"
        >
          {/* Top gradient bar */}
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300" />

          {/* Header */}
          <div className="mb-4 mt-2 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400 text-blue-950 shadow">
              <ShieldCheck size={20} />
            </div>
            <h2 className="text-xl font-bold text-blue-950">
              Reset Password
            </h2>
            <p className="mt-1 text-xs text-blue-900/70">
              Choose a strong password to secure your account
            </p>
          </div>

          {/* Inputs */}
          <div className="grid gap-3">
            {/* New Password */}
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                className="input pr-10"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-900/60 hover:text-blue-900"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Strength hint */}
            <p
              className={`text-[11px] ${
                isStrong ? "text-green-600" : "text-blue-900/60"
              }`}
            >
              {isStrong
                ? "Strong password ✔"
                : "Use at least 8 characters for better security"}
            </p>

            {/* Confirm Password */}
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                className="input pr-10"
                placeholder="Confirm password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-900/60 hover:text-blue-900"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-400 px-4 py-2 text-sm font-semibold text-blue-950 shadow ring-1 ring-yellow-300/60 transition hover:shadow-lg disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-950 border-t-transparent" />
                  Resetting...
                </>
              ) : (
                <>
                  <Lock size={16} />
                  Reset Password
                </>
              )}
            </button>
          </div>

          {/* Security note */}
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] text-blue-900/70">
            🔒 For your security, this reset link works only once and expires
            after 15 minutes.
          </div>
        </form>
      </div>
    </div>
  );
}
