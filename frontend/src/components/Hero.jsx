// src/components/Hero.jsx
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


function CustomSelect({
  name,
  placeholder = "Select an option",
  options = [],
  disabled = false,
  valueProp = (o) => (typeof o === "string" ? o : o.value),
  labelProp = (o) => (typeof o === "string" ? o : o.label ?? o.value),
  searchable = false,
  searchPlaceholder = "Search…",
  btnClass,      // ← optional override for trigger button
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const btnRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  // close on outside click
  useEffect(() => {
    const onDown = (e) => {
      if (!btnRef.current && !listRef.current) return;
      if (
        !btnRef.current.contains(e.target) &&
        !listRef.current?.contains(e.target)
      ) {
        setOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // basic keyboard support
  useEffect(() => {
    const onKey = (e) => {
      if (!open) return;
      if (e.key === "Escape") {
        setOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // focus search on open (if enabled)
  useEffect(() => {
    if (open && searchable) {
      // small delay so the input exists in DOM
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open, searchable]);

  const currentLabel =
    value && options.find((o) => valueProp(o) === value)
      ? labelProp(options.find((o) => valueProp(o) === value))
      : "";

  const filtered =
    !searchable || !searchTerm
      ? options
      : options.filter((o) =>
        String(labelProp(o)).toLowerCase().includes(searchTerm.toLowerCase())
      );

  return (
    <div className="relative">
      {/* Hidden field preserves your form structure */}
      <input type="hidden" name={name} value={value} />

      <button
        type="button"
        ref={btnRef}
        disabled={disabled}
        onClick={() => !disabled && setOpen((s) => !s)}
        className={btnClass ?? [
          "w-full rounded-2xl border px-4 py-2 text-sm text-blue-950",
          "bg-white/90 shadow-sm outline-none transition",
          "border-blue-200 focus:ring-2 focus:ring-yellow-300",
          disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-white",
        ].join(" ")}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="flex items-center justify-between">
          <span className={currentLabel ? "" : "text-blue-900/50"}>
            {currentLabel || placeholder}
          </span>
          <svg
            viewBox="0 0 20 20"
            className={`h-4 w-4 shrink-0 transition ${open ? "rotate-180" : ""}`}
            fill="currentColor"
          >
            <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.17l3.71-2.94a.75.75 0 1 1 .94 1.16l-4.24 3.36a.75.75 0 0 1-.94 0L5.21 8.39a.75.75 0 0 1 .02-1.18z" />
          </svg>
        </div>
      </button>

      {open && !disabled && (
        <div
          ref={listRef}
          className="absolute z-50 mt-2 w-full rounded-2xl border border-blue-200 bg-white/95 shadow-xl backdrop-blur-md"
        >
          {searchable && (
            <div className="sticky top-0 z-10 border-b border-blue-100/70 bg-white/95 p-1">
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-xl border border-blue-200 px-3 py-2 text-sm text-blue-950 outline-none focus:ring-2 focus:ring-yellow-300"
              />
            </div>
          )}

          <ul role="listbox" className="max-h-56 w-full overflow-auto p-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-blue-900/60">No results</li>
            ) : (
              filtered.map((opt) => {
                const v = valueProp(opt);
                const l = labelProp(opt);
                const active = v === value;
                return (
                  <li key={v}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        setValue(v);
                        setOpen(false);
                        setSearchTerm("");
                      }}
                      className={[
                        "w-full rounded-xl px-3 py-2 text-left text-sm",
                        active
                          ? "bg-yellow-100/70 text-blue-900"
                          : "text-blue-900/90 hover:bg-blue-50",
                      ].join(" ")}
                    >
                      {l}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}



const Hero = () => {
  const [hero, setHero] = useState(null);
  const [states, setStates] = useState([]);
  const [loadingStates, setLoadingStates] = useState(true);

  // Modal states (existing)
  const [showLogin, setShowLogin] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const modalCardRef = useRef(null);

  const [signSubmitting, setSignSubmitting] = useState(false);
  const [classes, setClasses] = useState([]);
  const [boards, setBoards] = useState([]);

  // ── Stepper modal state ──
  const [showStepper, setShowStepper] = useState(false);
  const [basicInfo, setBasicInfo] = useState({ name: "", klass: "", email: "" });
  const [stepIdx, setStepIdx] = useState(0);
  const [stepValues, setStepValues] = useState({ board: "", mobile: "", state: "", password: "", confirm: "" });
  const [stepError, setStepError] = useState("");
  const [slideDir, setSlideDir] = useState("forward");
  const [stepDone, setStepDone] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const STEPS = [
    { key: "board",    icon: "menu_book",    question: "What is your study board?",  hint: "We'll personalise your content based on your board.", type: "select" },
    { key: "mobile",   icon: "smartphone",   question: "What's your mobile number?", hint: "We'll send you important updates here.",               type: "tel",           placeholder: "e.g. 9876543210" },
    { key: "state",    icon: "location_on",  question: "Which state are you from?",  hint: "Helps us match your regional curriculum.",             type: "select-search" },
    { key: "password", icon: "lock",         question: "Create a secret password!",  hint: "Make it strong to protect your adventure.",            type: "password",      placeholder: "Min. 8 characters" },
    { key: "confirm",  icon: "check_circle", question: "Confirm your password",      hint: "Type it once more to be sure.",                        type: "password",      placeholder: "Re-enter password" },
  ];

  useEffect(() => {
    async function loadMeta() {
      try {
        const [clsRes, brdRes] = await Promise.all([
          fetch(`${API_BASE}/api/classes`),
          fetch(`${API_BASE}/api/boards`),
        ]);
        const clsData = await clsRes.json();
        const brdData = await brdRes.json();
        setClasses(Array.isArray(clsData) ? clsData : []);
        setBoards(Array.isArray(brdData) ? brdData : []);
      } catch (err) {
        console.error("Failed to load class/board", err);
      }
    }
    loadMeta();
  }, []);

  // Basic 3-field form → open stepper
  function handleBasicSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const name = form.elements["name"]?.value?.trim();
    const klass = form.elements["class"]?.value;
    const email = form.elements["email"]?.value?.trim().toLowerCase();
    if (!name) { toast.error("Please enter your name"); return; }
    if (!klass) { toast.error("Please choose your class"); return; }
    if (!email) { toast.error("Please enter your email"); return; }
    setBasicInfo({ name, klass, email });
    setStepValues({ board: "", mobile: "", state: "", password: "", confirm: "" });
    setStepIdx(0);
    setStepError("");
    setStepDone(false);
    setShowStepper(true);
  }

  function handleStepNext() {
    const step = STEPS[stepIdx];
    const val = stepValues[step.key];
    if (!val) { setStepError("Please fill in this field to continue."); return; }
    if (step.key === "confirm" && val !== stepValues.password) { setStepError("Passwords don't match. Try again!"); return; }
    setStepError("");
    if (stepIdx < STEPS.length - 1) {
      setSlideDir("forward");
      setStepIdx((i) => i + 1);
    } else {
      handleFinalSubmit();
    }
  }

  function handleStepBack() {
    if (stepIdx === 0) { setShowStepper(false); return; }
    setStepError("");
    setSlideDir("back");
    setStepIdx((i) => i - 1);
  }

  async function handleFinalSubmit() {
    setSignSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: basicInfo.name,
          email: basicInfo.email,
          phone: stepValues.mobile,
          password: stepValues.password,
          class: basicInfo.klass,
          state: stepValues.state,
          board: stepValues.board,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Registration failed");
      localStorage.setItem("jwt", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setStepDone(true);
      toast.success(`Welcome, ${data?.user?.name || "Explorer"}! 🎉`);
      setTimeout(() => {
        setShowStepper(false);
        window.dispatchEvent(new Event("eec:open-login"));
      }, 1800);
      window.dispatchEvent(new CustomEvent("eec:auth", { detail: { type: "register", user: data.user } }));
    } catch (err) {
      setStepError(err?.message || "Registration failed");
      toast.error(err?.message || "Registration failed");
    } finally {
      setSignSubmitting(false);
    }
  }

  // Load Indian states (with graceful fallback)
  useEffect(() => {
    let mounted = true;
    async function loadStates() {
      try {
        const res = await fetch(
          "https://countriesnow.space/api/v0.1/countries/states",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ country: "India" }),
          }
        );
        const json = await res.json();
        const list =
          json?.data?.states?.map((s) => s.name).filter(Boolean) || [];
        if (mounted) setStates(list);
      } catch (_err) {
        if (mounted)
          setStates([
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
          ]);
      } finally {
        if (mounted) setLoadingStates(false);
      }
    }
    loadStates();
    return () => {
      mounted = false;
    };
  }, []);

  // ESC close for modals
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setShowLogin(false);
        setShowForgot(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Backdrop click (existing)
  const onBackdropClick = (e) => {
    if (!modalCardRef.current) return;
    if (!modalCardRef.current.contains(e.target)) {
      setShowLogin(false);
      setShowForgot(false);
    }
  };

  // Open login via global event (intentionally disabled here)

  useEffect(() => {
    async function loadHeroSettings() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/hero-settings`);
        const data = await res.json();
        setHero(data);
      } catch (err) {
        console.error("Failed to load hero settings:", err);
      }
    }
    loadHeroSettings();
  }, []);


  async function handleForgotPassword(e) {
    e.preventDefault();

    const form = e.currentTarget;
    const email = form.querySelector("input")?.value?.trim().toLowerCase();

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

      if (!res.ok) {
        throw new Error(data?.message || "Failed to send reset link");
      }

      toast.success("Password reset link sent to your email 📧");
      setShowForgot(false);
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    }
  }



  // Inputs — match code.html exactly: rounded-2xl, border-2, bg-slate-50
  const inputCls =
    "w-full rounded-full border-2 border-slate-100 bg-slate-50 px-5 py-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#F4736E]/40 focus:ring-2 focus:ring-[#F4736E]/15";

  const selectBtnCls =
    "w-full max-w-full box-border rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 py-4 text-sm text-slate-900 outline-none transition focus:border-[#F4736E]/40 focus:ring-2 focus:ring-[#F4736E]/15 cursor-pointer";
  const heroHeadingCls = "text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-extrabold leading-[1.05] tracking-tight text-[#1B1F3B] break-words";

  return (
    <section className="relative overflow-hidden bg-[#FEF4E8] w-full max-w-[100vw]" style={{ minHeight: "calc(100vh - 60px)" }}>
      {/* ── Decorative blobs ── */}
      <div className="pointer-events-none absolute -left-32 top-10 h-[500px] w-[500px] rounded-full bg-[#F4736E]/8 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-[600px] w-[600px] rounded-full bg-yellow-300/15 blur-3xl" />

      {/* ── Floating rocket decor ── */}
      <div className="pointer-events-none absolute left-8 top-32 hidden opacity-15 md:block">
        <span className="material-symbols-outlined text-[80px] text-[#F4736E]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 48" }}>rocket_launch</span>
      </div>

      {/* ===== Main grid ===== */}
      <div className="relative mx-auto grid min-h-[calc(100vh-60px)] w-full max-w-full xl:max-w-[1400px] grid-cols-1 items-center gap-8 px-4 sm:px-8 py-12 md:grid-cols-2 md:py-16 lg:px-16 xl:px-24">

        {/* ── LEFT: Heading + Floating form card ── */}
        <div className="flex flex-col gap-8">

          {/* Badge — matches code.html: accent bg, border, celebration icon */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="inline-flex w-fit items-center gap-2 rounded-full border-2 border-[#4ECDC4] bg-[#4ECDC4]/20 px-4 py-2 text-xs font-black uppercase tracking-wider text-[#1B8A84]"
          >
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>celebration</span>
            50,000+ Happy Little Explorers!
          </motion.div>

          {/* Heading — large like screenshot */}
          {hero ? (
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className={heroHeadingCls}
            >
              {(() => {
                const words = hero.heading.split(" ");
                const half = Math.ceil(words.length / 2);
                return (
                  <>
                    {words.slice(0, half).join(" ")}
                    <br />
                    <span className="text-[#F4736E]">{words.slice(half).join(" ")}</span>
                  </>
                );
              })()}
            </motion.h1>
          ) : (
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className={heroHeadingCls}
            >
              Make Learning
              <br />
              <span className="text-[#F4736E]">An Adventure!</span>
            </motion.h1>
          )}

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="max-w-lg text-lg md:text-2xl leading-relaxed text-slate-500"
          >
            {hero?.paragraph ||
              "Turn study time into playtime! Master Class 3–12 exams with fun, colorful worksheets and exciting challenges designed for curious minds."}
          </motion.p>

          {/* ── Floating signup card (3-field, matches screenshot) ── */}
          <motion.div
            id="hero-signup"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.24 }}
            className="relative"
          >
            {/* Card — exact: rounded-[2.5rem] shadow-2xl border-4 border-primary/30 */}
            <div className="rounded-[2.5rem] border-4 bg-white p-6 sm:p-8 shadow-2xl w-full max-w-[100%] sm:max-w-xl overflow-hidden box-border"
              style={{ borderColor: "rgba(255,210,63,0.3)" }}>
              <h2 className="mb-6 text-2xl font-bold text-slate-800" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
                Ready to Start Your Adventure?
              </h2>

              <form onSubmit={handleBasicSubmit}>
                {/* Row 1: Name + Class — grid, from code.html */}
                <div className="grid grid-cols-1 gap-4 mb-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 ml-2">Explorer's Name</label>
                    <input className={inputCls} name="name" placeholder="Koushik Bala" type="text" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 ml-2">Choose Class</label>
                    <CustomSelect
                      name="class"
                      placeholder="Which grade?"
                      options={classes}
                      valueProp={(c) => c.name}
                      labelProp={(c) => c.name}
                      btnClass={selectBtnCls}
                    />
                  </div>
                </div>

                {/* Row 2: Email grows, button self-end — from code.html */}
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="grow space-y-1">
                    <label className="text-xs font-bold text-slate-500 ml-2"> Email</label>
                    <input
                      className={inputCls + " w-full"}
                      name="email"
                      placeholder="demo@demo.com"
                      type="email"
                    />
                  </div>
                  <button
                    type="submit"
                    className="self-end flex items-center justify-center gap-2 rounded-full bg-[#F4736E] px-8 py-4 font-bold text-white shadow-[0_4px_0_0_#c9443e] transition-all hover:bg-[#e85e58] active:translate-y-1 active:shadow-none"
                  >
                    Launch Adventure!
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>rocket_launch</span>
                  </button>
                </div>

                <p className="text-center text-[10px] text-slate-400 mt-4">
                  Safe &amp; Secure • Fun Guaranteed • No Boring Stuff
                </p>
                <p className="text-center text-xs text-slate-500 mt-1">
                  Already have an account?{" "}
                  <span
                    onClick={() => window.dispatchEvent(new Event("eec:open-login"))}
                    className="cursor-pointer font-bold text-[#F4736E] hover:underline"
                  >
                    Login here
                  </span>
                </p>
              </form>
            </div>
          </motion.div>
        </div>

        {/* ── RIGHT: Illustration card — exact structure from code.html ── */}
        <motion.div
          initial={{ opacity: 0, x: 26, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="hidden md:block flex-1 relative"
        >
          {/* aspect-square, rounded-[3rem], overflow-hidden, border-8 border-white — exact from code.html */}
          <div className="relative z-10 w-full aspect-square rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white bg-linear-to-br from-yellow-300/20 to-[#4ECDC4]/20">

            {/* Center: child_care icon + caption */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
              <span
                className="material-symbols-outlined select-none text-[#F4736E]/30 mb-4"
                style={{ fontSize: "10rem", lineHeight: 1, fontVariationSettings: "'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 48" }}
              >child_care</span>
              <p className="text-2xl font-bold italic text-slate-600 leading-snug" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
                Playful Illustration of<br />Happy Children Learning Together
              </p>
            </div>

            {/* Floating icon cards — INSIDE overflow-hidden, exact positions from code.html */}
            <div className="absolute top-12 left-12 animate-bounce rounded-3xl bg-white p-5 shadow-xl" style={{ animationDuration: "3s" }}>
              <span className="material-symbols-outlined text-4xl text-[#F4736E]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>emoji_objects</span>
            </div>
            <div className="absolute bottom-24 right-12 animate-bounce rounded-3xl bg-white p-5 shadow-xl" style={{ animationDuration: "4.5s" }}>
              <span className="material-symbols-outlined text-4xl text-violet-500" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>cruelty_free</span>
            </div>
            <div className="absolute top-1/2 right-6 animate-bounce rounded-3xl bg-white p-5 shadow-xl" style={{ animationDuration: "5.5s" }}>
              <span className="material-symbols-outlined text-4xl text-[#4ECDC4]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>castle</span>
            </div>
            <div className="absolute bottom-12 left-20 animate-bounce rounded-3xl bg-white p-5 shadow-xl" style={{ animationDuration: "4s" }}>
              <span className="material-symbols-outlined text-4xl text-amber-400" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>palette</span>
            </div>
          </div>
        </motion.div>

      </div>

      {/* ===== LOGIN MODAL (existing) ===== */}
      {showLogin && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          onMouseDown={onBackdropClick}
          aria-modal="true"
          role="dialog"
        >
          <div className="absolute inset-0 bg-blue-950/40 backdrop-blur-sm transition-opacity" />
          <div className="relative z-[61] w-[95%] sm:w-[92%] max-w-md max-h-[90vh] overflow-y-auto">
            <div
              ref={modalCardRef}
              className="relative w-full origin-center rounded-3xl border border-blue-100/80 bg-white/95 p-6 shadow-[0_24px_80px_rgba(2,32,71,0.35)] backdrop-blur-md animate-[modalIn_280ms_cubic-bezier(0.2,0.8,0.2,1)_1]"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="mb-3">
                <span className="inline-block rounded-full bg-yellow-400 px-3 py-1 text-[11px] font-semibold text-blue-950 shadow">
                  Welcome back
                </span>
                <h3 className="mt-3 text-xl font-bold leading-6 text-blue-950">
                  Login
                </h3>
              </div>

              <form
                className="grid gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  setShowLogin(false);
                }}
              >
                <input className="input" placeholder="Email or Mobile Number" />
                <input className="input" type="password" placeholder="Password" />

                <button
                  type="submit"
                  className="mt-1 rounded-2xl bg-yellow-400 px-4 py-2 text-sm font-semibold text-blue-950 shadow hover:bg-yellow-300"
                >
                  Login
                </button>

                <div className="mt-1 flex items-center justify-between text-[11px] text-blue-900/75">
                  <button
                    type="button"
                    className="hover:underline"
                    onClick={() => setShowLogin(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="font-semibold text-blue-700 hover:underline"
                    onClick={() => {
                      setShowLogin(false);
                      setShowForgot(true);
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
              </form>

              <button
                type="button"
                aria-label="Close login"
                onClick={() => setShowLogin(false)}
                className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-blue-100/70 bg-white/80 text-blue-900/80 hover:bg-white"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== FORGOT PASSWORD MODAL (existing) ===== */}
      {showForgot && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          onClick={onBackdropClick}
          aria-modal="true"
          role="dialog"
        >
          <div className="absolute inset-0 bg-blue-950/40 backdrop-blur-sm transition-opacity" />
          <div className="relative z-[61] w-[95%] sm:w-[92%] max-w-md max-h-[90vh] overflow-y-auto">
            <div
              ref={modalCardRef}
              className="relative w-full origin-center rounded-3xl border border-blue-100/80 bg-white/95 p-6 shadow-[0_24px_80px_rgba(2,32,71,0.35)] backdrop-blur-md animate-[modalIn_280ms_cubic-bezier(0.2,0.8,0.2,1)_1]"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="mb-3">
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

              <form
                className="grid gap-3"
                // onSubmit={(e) => {
                //   e.preventDefault();
                //   setShowForgot(false);
                // }}
                onSubmit={handleForgotPassword}
              >
                <input
                  className="input"
                  name="email"
                  type="email"
                  placeholder="Email Address"
                  required
                />
                <button
                  type="submit"
                  className="mt-1 rounded-2xl bg-yellow-400 px-4 py-2 text-sm font-semibold text-blue-950 shadow hover:bg-yellow-300"
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
                aria-label="Close forgot password"
                onClick={() => setShowForgot(false)}
                className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-blue-100/70 bg-white/80 text-blue-900/80 hover:bg-white"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== STEPPER MODAL ===== */}
      {showStepper && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center px-4"
          aria-modal="true"
          role="dialog"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[#1B1F3B]/60 backdrop-blur-sm"
            onClick={() => !signSubmitting && setShowStepper(false)}
          />

          {/* Modal card */}
          <div className="relative z-[71] w-[95%] sm:w-full max-w-sm max-h-[90vh] overflow-y-auto animate-[stepperIn_300ms_cubic-bezier(0.2,0.8,0.2,1)]">
            <div className="overflow-hidden rounded-3xl bg-[#FEF4E8] shadow-[0_32px_80px_rgba(27,31,59,0.25)]">

              {/* Top bar */}
              <div className="flex items-center justify-between bg-white/80 px-6 py-4 backdrop-blur">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#F4736E] text-white">
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>menu_book</span>
                  </div>
                  <span className="text-sm font-extrabold text-[#1B1F3B]">EEC</span>
                </div>
                {!stepDone && (
                  <span className="text-xs font-bold text-slate-400">
                    Step {stepIdx + 1} of {STEPS.length}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => !signSubmitting && setShowStepper(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  ✕
                </button>
              </div>

              {/* Progress dots */}
              {!stepDone && (
                <div className="flex items-center gap-1.5 px-6 pt-4">
                  {STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                        i <= stepIdx ? "bg-[#F4736E]" : "bg-slate-200"
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Step content */}
              <div className="px-6 py-8 min-h-[260px]">
                {stepDone ? (
                  /* ── Success state ── */
                  <div className="flex flex-col items-center gap-4 text-center animate-[stepperIn_400ms_ease]">
                    <span className="material-symbols-outlined text-[72px] text-[#F4736E]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48" }}>celebration</span>
                    <h3 className="text-2xl font-extrabold text-[#1B1F3B]">Adventure Begins!</h3>
                    <p className="text-sm text-slate-500">
                      Welcome, <strong>{basicInfo.name}</strong>!<br />
                      Your account is ready. Logging you in…
                    </p>
                  </div>
                ) : (
                  /* ── Current step ── */
                  <div
                    key={`step-${stepIdx}-${slideDir}`}
                    className={`animate-[${slideDir === "forward" ? "slideInRight" : "slideInLeft"}_300ms_ease]`}
                  >
                    <span
                      className="material-symbols-outlined mb-4 text-[52px] text-[#F4736E]"
                      style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 48" }}
                    >{STEPS[stepIdx].icon}</span>
                    <h3 className="text-2xl font-extrabold leading-tight text-[#1B1F3B]">
                      {STEPS[stepIdx].question}
                    </h3>
                    <p className="mt-1.5 mb-5 text-sm text-slate-500">{STEPS[stepIdx].hint}</p>

                    {/* Input for this step */}
                    {STEPS[stepIdx].type === "select" ? (
                      /* Board — controlled <select> so stepValues updates directly */
                      <select
                        key="board-select"
                        autoFocus
                        value={stepValues.board}
                        onChange={(e) => { setStepError(""); setStepValues((p) => ({ ...p, board: e.target.value })); }}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base text-[#1B1F3B] outline-none shadow-sm transition focus:border-[#F4736E]/60 focus:ring-2 focus:ring-[#F4736E]/20"
                      >
                        <option value="">Choose your board…</option>
                        {boards.map((b) => <option key={b.name} value={b.name}>{b.name}</option>)}
                      </select>
                    ) : STEPS[stepIdx].type === "select-search" ? (
                      /* State — controlled <select> for reliable dropdown display */
                      <select
                        key="state-select"
                        autoFocus
                        value={stepValues.state}
                        onChange={(e) => { setStepError(""); setStepValues((p) => ({ ...p, state: e.target.value })); }}
                        disabled={loadingStates}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base text-[#1B1F3B] outline-none shadow-sm transition focus:border-[#F4736E]/60 focus:ring-2 focus:ring-[#F4736E]/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                      >
                        <option value="">
                          {loadingStates ? "Loading states..." : "Choose your state..."}
                        </option>
                        {states.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        key={`input-${stepIdx}`}
                        autoFocus
                        type={STEPS[stepIdx].type}
                        placeholder={STEPS[stepIdx].placeholder}
                        value={stepValues[STEPS[stepIdx].key]}
                        onChange={(e) => {
                          setStepError("");
                          setStepValues((prev) => ({ ...prev, [STEPS[stepIdx].key]: e.target.value }));
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleStepNext()}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base text-[#1B1F3B] placeholder:text-slate-400 outline-none shadow-sm transition focus:border-[#F4736E]/60 focus:ring-2 focus:ring-[#F4736E]/20"
                      />
                    )}

                    {stepError && (
                      <p className="mt-3 text-xs font-semibold text-red-500">{stepError}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Footer buttons */}
              {!stepDone && (
                <div className="flex gap-3 border-t border-slate-100 bg-white/60 px-6 py-4">
                  <button
                    type="button"
                    onClick={handleStepBack}
                    className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-[.98]"
                  >
                    {stepIdx === 0 ? "← Back" : "← Back"}
                  </button>
                  <button
                    type="button"
                    disabled={signSubmitting}
                    onClick={() => {
                      // For select steps, read the hidden value from CustomSelect’s hidden input
                      const step = STEPS[stepIdx];
                      if (step.type === "select" || step.type === "select-search") {
                        // CustomSelect stores in a hidden <input name={step.key}>
                        // We need to read it differently — watch via onChange on the wrapper
                        handleStepNext();
                      } else {
                        handleStepNext();
                      }
                    }}
                    className="flex-2 rounded-2xl bg-[#F4736E] py-3 text-sm font-extrabold text-white shadow-lg shadow-[#F4736E]/25 transition hover:bg-[#e85e58] active:scale-[.98] disabled:opacity-60"
                  >
                    {signSubmitting
                      ? "Launching…"
                      : stepIdx === STEPS.length - 1
                      ? "Launch Adventure! 🚀"
                      : "Next →"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Toastify container (bottom-right) */}
      <ToastContainer
        position="bottom-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&family=Balsamiq+Sans:wght@400;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
        .material-symbols-outlined {
          font-family: 'Material Symbols Outlined';
          font-weight: normal;
          font-style: normal;
          font-size: 24px;
          line-height: 1;
          letter-spacing: normal;
          text-transform: none;
          display: inline-block;
          white-space: nowrap;
          word-wrap: normal;
          direction: ltr;
          -webkit-font-smoothing: antialiased;
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        @keyframes modalIn {
          0%   { transform: translateY(12px) scale(0.98); opacity: 0; }
          100% { transform: translateY(0)    scale(1);    opacity: 1; }
        }
        @keyframes stepperIn {
          0%   { transform: translateY(24px) scale(0.96); opacity: 0; }
          100% { transform: translateY(0)    scale(1);    opacity: 1; }
        }
        @keyframes slideInRight {
          0%   { transform: translateX(48px); opacity: 0; }
          100% { transform: translateX(0);    opacity: 1; }
        }
        @keyframes slideInLeft {
          0%   { transform: translateX(-48px); opacity: 0; }
          100% { transform: translateX(0);     opacity: 1; }
        }
      `}</style>
    </section>
  );
};

export default Hero;
