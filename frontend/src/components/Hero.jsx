// src/components/Hero.jsx
import { useEffect, useState, useRef } from "react";
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
        className={[
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

  // Signup submit states (existing)
  const [signSubmitting, setSignSubmitting] = useState(false);
  const [signError, setSignError] = useState("");

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  async function handleSignupSubmit(e) {
    e.preventDefault();
    setSignError("");
    setSignSubmitting(true);

    const form = e.currentTarget;
    const name = form.name?.value.trim();
    // accept either "phone" or "mobile" without changing your markup elsewhere
    const phone = (form.phone?.value || form.mobile?.value || "").trim();
    const email = (form.email?.value || "").trim().toLowerCase();
    const klass = form.elements["class"]?.value || "";    // <-- NEW (safe access)
    const state = form.elements["state"]?.value || "";    // <-- NEW
    const referral = form.elements["referral"]?.value || ""; // <-- NEW
    const password = form.password?.value;
    const confirm = form.confirm?.value;

    if (!name || !email || !password) {
      const msg = "Name, Email and Password are required.";
      setSignError(msg);
      setSignSubmitting(false);
      toast.error(msg);
      return;
    }
    if (password !== confirm) {
      const msg = "Passwords do not match.";
      setSignError(msg);
      setSignSubmitting(false);
      toast.error(msg);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password, class: klass, state, referral })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Registration failed");
      }

      // persist session (your backend returns token + user)
      localStorage.setItem("jwt", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Clear all fields
      form.reset();

      // Success toast
      toast.success(`Welcome, ${data?.user?.name || "User"}! Account created successfully.`);
      setTimeout(() => {
        window.dispatchEvent(new Event("eec:open-login"));
      }, 500);

      // Optional: notify app-wide listeners
      window.dispatchEvent(new CustomEvent("eec:auth", { detail: { type: "register", user: data.user } }));
    } catch (err) {
      const msg = err?.message || "Registration failed";
      setSignError(msg);
      toast.error(msg);
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
    const openLogin = () => {
      setShowForgot(false);
      setShowLogin(true);
    };
    // window.addEventListener("eec:open-login", openLogin);
    // return () => window.removeEventListener("eec:open-login", openLogin);
  }, []);

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


  return (
    <section className="relative overflow-hidden">
      {/* ===== Background image with rich overlay ===== */}
      <img
        // src="/hero.jpeg"
        src="/bg.png"
        alt="Background"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Black tint */}
      <div className="absolute inset-0 bg-blue-950/50" />
      {/* Gradient sweep */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-blue-800/20 to-amber-200/10 mix-blend-multiply" />
      {/* Soft shapes */}
      <div className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-yellow-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-sky-300/20 blur-3xl" />

      {/* ===== Content ===== */}
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-20 md:grid-cols-2 md:py-24">
        {/* Left: Headline + CTA */}
        <div className="relative z-10 text-white">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold backdrop-blur">
            <span className="inline-block h-2 w-2 rounded-full bg-green-400 shadow-[0_0_0_3px_rgba(34,197,94,0.18)]" />
            New: 5 FREE stages for every new student
          </div>
          {/* <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight drop-shadow-sm md:text-6xl">
            Personalized learning that <span className="text-yellow-300">adapts</span> to you
          </h1> */}
          {hero && (
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight drop-shadow-sm md:text-6xl">
              {hero.heading.split(" ").map((word, i) =>
                i === hero.heading.split(" ").length - 1 ? (
                  <span key={i} className="text-yellow-300"> {word} </span>
                ) : (
                  " " + word
                )
              )}
            </h1>
          )}

          {/* <p className="mt-3 max-w-xl text-blue-100/90">
            AI-guided study paths, concept videos, and gamified progress —
            crafted to boost focus, reduce stress, and improve outcomes.
          </p> */}
          {hero && (
            <p className="mt-3 max-w-xl text-blue-100/90">{hero.paragraph}</p>
          )}


          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new Event("eec:open-login"))
              }
              className="rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-400 px-5 py-2 text-sm font-semibold text-blue-950 shadow-md ring-1 ring-yellow-300/60 transition hover:shadow-lg hover:saturate-[1.1] active:scale-[.98]"
            >
              Login
            </button>
            {/* <a
              href="#signup"
              className="rounded-2xl border border-white/40 bg-white/10 px-5 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById("hero-signup")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Create free account
            </a> */}
          </div>

          {/* Quick chips */}
          <div className="mt-6 flex flex-wrap gap-2 text-[11px]">
            {[
              "CBSE • ICSE • State Boards",
              "Concept videos & worksheets",
              "Parent dashboard",
            ].map((x) => (
              <span
                key={x}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-blue-50 backdrop-blur"
              >
                {x}
              </span>
            ))}
          </div>
        </div>

        {/* Right: Sign-up card */}
        <div id="hero-signup" className="relative z-10 ml-0 md:ml-8">
          <div className="w-full max-w-md rounded-3xl border border-blue-100/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(2,32,71,0.25)] backdrop-blur-md">
            <div className="mb-3">
              <span className="inline-block rounded-full bg-yellow-400 px-3 py-1 text-[11px] font-semibold text-blue-950 shadow">
                Start with 5 FREE stages
              </span>
              <h2 className="mt-3 text-xl font-bold leading-6 text-blue-950">
                Sign up
              </h2>
              <p className="mt-1 text-xs text-blue-900/70">
                Create your learning profile & start exploring EEC.
              </p>
            </div>

            <form className="grid gap-3" onSubmit={handleSignupSubmit}>
              <input className="input" name="name" placeholder="Enter your name" />
              <input className="input" name="mobile" placeholder="Enter your Mobile Number" />
              <input className="input" name="email" placeholder="Email Address" />

              <CustomSelect
                name="class"
                placeholder="Select Class"
                options={Array.from({ length: 12 }, (_, i) => ({
                  value: `Class ${i + 1}`,
                  label: `Class ${i + 1}`,
                }))}
              />

              <CustomSelect
                name="state"
                placeholder={loadingStates ? "Loading states..." : "Select State"}
                options={states}
                disabled={loadingStates}
                searchable
                searchPlaceholder="Search state…"
              />



              <input className="input" name="password" type="password" placeholder="Password" />
              <input
                className="input"
                type="password"
                placeholder="Confirm Password"
                name="confirm"
              />
              {/* <input className="input" name="referral" placeholder="Referral code (optional)" /> */}

              {signError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {signError}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={signSubmitting}
                className="mt-1 rounded-2xl bg-yellow-400 px-4 py-2 text-sm font-semibold text-blue-950 shadow transition hover:bg-yellow-300 active:scale-[0.99] disabled:opacity-60"
              >
                {signSubmitting ? "Submitting..." : "Submit"}
              </button>

              <p className="mt-1 text-center text-xs text-blue-900/80">
                Already have an account?{" "}
                <span
                  onClick={() =>
                    window.dispatchEvent(new Event("eec:open-login"))
                  }
                  className="cursor-pointer font-semibold text-blue-700 hover:underline"
                >
                  Login here
                </span>
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* ===== Wave Divider ===== */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 md:h-28">
        <svg
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          className="h-full w-full"
        >
          <path
            fill="#ffffff"
            d="M0,256L48,240C96,224,192,192,288,197.3C384,203,480,245,576,261.3C672,277,768,267,864,234.7C960,203,1056,149,1152,154.7C1248,160,1344,224,1392,256L1440,288V320H0Z"
          />
        </svg>
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
          <div className="relative z-[61] w-[92%] max-w-md">
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
          <div className="relative z-[61] w-[92%] max-w-md">
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
        @keyframes modalIn {
          0% { transform: translateY(12px) scale(0.98); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </section>
  );
};

export default Hero;
