// src/components/EECFooter.jsx
// Final version with Bluish Background & Modern Glass Design
import React from "react";
import { Link } from "react-router-dom";
import { Mail, Send } from "lucide-react";
import { useState } from "react";
import axios from "axios"; // <-- ADD THIS

export default function EECFooter() {

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubscribe = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setMessage("Please enter a valid email");
      return;
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/newsletter/subscribe`,
        { email }
      );

      setMessage("Subscribed successfully! Please check your email ❤️");
      setEmail("");
    } catch (err) {
      setMessage(
        err.response?.data?.message || "Something went wrong. Try again."
      );
    }
  };


  return (
    <footer className="relative isolate overflow-hidden bg-gradient-to-b from-[#0B1E3C] via-[#0E2A54] to-[#103565] text-white">
      {/* Wave Divider */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-16">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="h-full w-full rotate-180">
          <path
            fill="#ffffff"
            d="M0,64L48,58.7C96,53,192,43,288,48C384,53,480,75,576,80C672,85,768,75,864,58.7C960,43,1056,21,1152,21.3C1248,21,1344,43,1392,53.3L1440,64V120H0Z"
          />
        </svg>
      </div>

      {/* Main Section */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-12 pt-20">
        {/* Top Strip */}
        <div className="mb-12 grid gap-6 rounded-3xl md:grid-cols-3">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="inline-flex items-center gap-3">
              <img src="/logo_new.png" alt="EEC Logo" className="h-14 w-auto drop-shadow-md" />
            </Link>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-blue-100">
              Empowering smarter learning through AI-driven education and emotionally aware teaching.
              Because grades matter — but so does well-being.
            </p>
          </div>

          {/* Newsletter */}
          <form
            onSubmit={handleSubscribe}
            className="grid content-center gap-3 rounded-2xl border border-blue-300/20 bg-blue-900/30 p-4"
          >
            <label className="flex items-center gap-2 text-sm font-semibold text-blue-100">
              <Mail className="h-4 w-4 text-yellow-400" />
              Subscribe for updates
            </label>

            <div className="flex overflow-hidden rounded-2xl border border-blue-400/30 bg-white/10">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder:text-blue-200 focus:outline-none"
                placeholder="Your email address"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-l-none bg-gradient-to-r from-yellow-400 to-yellow-300 px-3 py-2 text-sm font-semibold text-blue-950 transition hover:brightness-105 active:scale-[.98]"
              >
                <Send className="h-4 w-4" />
                Subscribe
              </button>
            </div>

            {message && (
              <p className="text-xs text-green-300">{message}</p>
            )}

            <p className="text-xs text-blue-200">We respect your privacy. Unsubscribe anytime.</p>
          </form>
        </div>

        {/* Footer Links */}
        <div className="grid gap-10 md:grid-cols-5">
          {/* About */}
          <div>
            <h5 className="mb-4 text-lg font-semibold text-yellow-400">About EEC</h5>
            <p className="text-sm leading-relaxed text-blue-100">
              Kolkata-based, building equitable access to personalized learning for students of Classes 1–12.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="mb-4 text-lg font-semibold text-yellow-400">Quick Links</h5>
            <ul className="space-y-2 text-blue-100">
              <li><Link to="/" className="hover:text-yellow-300 transition">Home</Link></li>
              <li><Link to="/about" className="hover:text-yellow-300 transition">About Us</Link></li>
              <li><Link to="/support" className="hover:text-yellow-300 transition">Support</Link></li>
              <li><Link to="/marketing" className="hover:text-yellow-300 transition">Marketing</Link></li>
              <li><Link to="/boards" className="hover:text-yellow-300 transition">Boards</Link></li>
            </ul>
          </div>

          {/* EEC */}
          <div>
            <h5 className="mb-4 text-lg font-semibold text-yellow-400">EEC</h5>
            <ul className="space-y-2 text-blue-100">
              <li><Link to="/analytics" className="hover:text-yellow-300 transition">Unlock precise analytics</Link></li>
              <li><Link to="/ai" className="hover:text-yellow-300 transition">AI Engine guides</Link></li>
              <li><Link to="/product-advantages" className="hover:text-yellow-300 transition">Product Advantages</Link></li>
              <li><Link to="/tollered" className="hover:text-yellow-300 transition">Tailored Content</Link></li>
              <li><Link to="/e-learn-well" className="hover:text-yellow-300 transition">Enhance learning</Link></li>
              <li><Link to="/aim" className="hover:text-yellow-300 transition">Best Solutions</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h5 className="mb-4 text-lg font-semibold text-yellow-400">Contact</h5>
            <ul className="space-y-2 text-blue-100">
              <li><Link to="/careers" className="hover:text-yellow-300 transition">Career</Link></li>
              <li><Link to="/office" className="hover:text-yellow-300 transition">Office</Link></li>
              <li>
                <a href="tel:+919830590929" className="hover:text-yellow-300 transition">+91 9830590929</a><br />
                <a href="mailto:contact@eeclearning.com" className="hover:text-yellow-300 transition">
                  contact@eeclearning.com
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h5 className="mb-4 text-lg font-semibold text-yellow-400">Follow Us</h5>
            <div className="flex gap-4">
              <a href="#" className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/10 transition hover:bg-white/20">
                <img src="/facebook-white-icon.png" alt="Facebook" className="h-5 w-5" />
              </a>
              <a href="#" className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/10 transition hover:bg-white/20">
                <img src="/linkedin-white-icon.png" alt="LinkedIn" className="h-5 w-5" />
              </a>
            </div>
            <p className="mt-4 text-xs text-blue-200">
              123 EEC, 19B Jawaharlal Nehru Marg, Esplanade, Kolkata, WB 700087
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="my-10 h-px bg-gradient-to-r from-transparent via-blue-200/30 to-transparent" />

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-3 text-center text-sm text-blue-200 md:flex-row">
          <p>© {new Date().getFullYear()} EEC Learning. All Rights Reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-yellow-300 transition">Terms</a>
            <a href="#" className="hover:text-yellow-300 transition">Privacy</a>
            <a href="#" className="hover:text-yellow-300 transition">Cookies</a>
          </div>
        </div>
      </div>

      {/* Blue Glow Effects */}
      <div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
    </footer>
  );
}
