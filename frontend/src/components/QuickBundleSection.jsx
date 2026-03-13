import React, { useState } from "react";
import axios from "axios";

export default function QuickBundleSection() {
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle");
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setStatus("error");
      setMessage("Please enter your email address");
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");
      setStatus("idle");

      const res = await axios.post(`${API}/api/newsletter/subscribe`, {
        email: normalizedEmail,
      });

      setStatus("success");
      setMessage(res?.data?.message || "Subscribed successfully! Please check your email.");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err?.response?.data?.message || "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-[#FF6B6B] py-20 relative overflow-hidden">
      <div className="absolute -left-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2
          className="text-4xl lg:text-6xl font-black text-white mb-6"
          style={{ fontFamily: "'Balsamiq Sans', cursive" }}
        >
          Subscribe To Our Newsletter
        </h2>
        <p className="text-white/90 text-xl mb-10 max-w-2xl mx-auto font-medium">
          Get the latest EEC updates, study tips, and important announcements
          straight to your inbox.
        </p>
 
        <div className="flex flex-col items-center gap-8">
        {/*<div className="flex gap-6 mb-4">
             <div className="bg-white text-[#FF6B6B] w-24 h-28 rounded-[2rem] flex flex-col items-center justify-center shadow-2xl border-b-8 border-slate-200">
              <span
                className="text-4xl font-black"
                style={{ fontFamily: "'Balsamiq Sans', cursive" }}
              >
                14
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest">
                Minutes
              </span>
            </div>
            <div className="bg-white text-[#FF6B6B] w-24 h-28 rounded-[2rem] flex flex-col items-center justify-center shadow-2xl border-b-8 border-slate-200">
              <span
                className="text-4xl font-black"
                style={{ fontFamily: "'Balsamiq Sans', cursive" }}
              >
                52
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest">
                Seconds
              </span>
            </div>
          </div>
          */}
          <form
            onSubmit={handleSubscribe}
            className="w-full max-w-xl space-y-3"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="bg-white flex-grow px-8 py-5 rounded-full border-none focus:ring-4 focus:ring-[#FFD23F] text-lg outline-none"
              />
              <button
                type="submit"
                disabled={submitting}
                className="bg-slate-900 disabled:opacity-70 disabled:cursor-not-allowed text-white font-black px-10 py-5 rounded-full shadow-xl hover:scale-105 transition-all"
              >
                {submitting ? "Subscribing..." : "Subscribe"}
              </button>
            </div>

            {message && (
              <p className={`text-sm font-semibold ${status === "success" ? "text-[#FFF5C2]" : "text-slate-900"}`}>
                {message}
              </p>
            )}
            <p className="text-xs text-white/80">We respect your privacy. Unsubscribe anytime.</p>
          </form>
        </div>
      </div>
    </section>
  );
}
