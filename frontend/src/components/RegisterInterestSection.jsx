import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { Plus, X } from "lucide-react";
import { persistAuthSession } from "../lib/authSession";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const inputCls =
  "w-full rounded-full border-2 border-slate-100 bg-slate-50 pl-12 pr-5 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#F4736E]/40 focus:ring-2 focus:ring-[#F4736E]/15";
const inputErrCls =
  "w-full rounded-full border-2 border-rose-300 bg-rose-50/60 pl-12 pr-5 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-200";

const EMPTY_FORM = {
  name: "",
  gender: "",
  board: "",
  class: "",
  schoolName: "",
  parentName: "",
  mobile: "",
  email: "",
  password: "",
};

function blankChild() {
  return { name: "", gender: "", board: "", class: "", schoolName: "" };
}

function icon(name, extraCls = "") {
  return (
    <span
      className={`material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400 ${extraCls}`}
      style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
    >
      {name}
    </span>
  );
}

function SectionBadge({ step, title, subtitle }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F4736E] text-sm font-black text-white">
        {step}
      </span>
      <div>
        <h3 className="text-sm font-black uppercase tracking-wide text-slate-700">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div className="space-y-1">
      <label className="ml-2 text-xs font-bold text-slate-500">{label}</label>
      {children}
      {error && <p className="ml-2 text-xs font-semibold text-rose-500">{error}</p>}
    </div>
  );
}

function requiredError(value) {
  return String(value || "").trim() ? "" : "This field is required";
}

function validateForm(form) {
  const errors = {};
  errors.name = requiredError(form.name);
  errors.gender = requiredError(form.gender);
  errors.board = requiredError(form.board);
  errors.class = requiredError(form.class);
  errors.schoolName = requiredError(form.schoolName);
  errors.parentName = requiredError(form.parentName);
  errors.mobile = form.mobile.replace(/\D/g, "").length === 10 ? "" : "Enter a valid 10-digit mobile number";
  errors.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) ? "" : "Enter a valid email address";
  errors.password = form.password.length >= 6 ? "" : "Password must be at least 6 characters";
  return errors;
}

function hasErrors(errors) {
  return Object.values(errors).some(Boolean);
}

function validateChild(child) {
  return {
    name: requiredError(child.name),
    gender: requiredError(child.gender),
    board: requiredError(child.board),
    class: requiredError(child.class),
    schoolName: requiredError(child.schoolName),
  };
}

const BENEFITS = [
  { icon: "route", title: "Personalized learning paths", desc: "Practice adapts to each child's board, class, and pace." },
  { icon: "emoji_events", title: "Gamified progress", desc: "Points, streaks, and gift cards keep learning motivating." },
  // { icon: "smart_toy", title: "AI-powered practice", desc: "Fresh, exam-style questions generated for every topic." },
  { icon: "family_restroom", title: "One account, whole family", desc: "Add every child under a single parent login." },
];

export default function RegisterInterestSection() {
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [classes, setClasses] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [siblings, setSiblings] = useState([]);
  const [siblingErrors, setSiblingErrors] = useState([]);
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadMeta() {
      try {
        const [boardsRes, classesRes] = await Promise.all([
          fetch(`${API_BASE}/api/boards`),
          fetch(`${API_BASE}/api/classes`),
        ]);
        const boardsData = await boardsRes.json().catch(() => []);
        const classesData = await classesRes.json().catch(() => []);
        if (!mounted) return;
        setBoards(Array.isArray(boardsData) ? boardsData : []);
        setClasses(Array.isArray(classesData) ? classesData : []);
      } catch {
        // ignore, dropdowns just stay empty
      }
    }
    loadMeta();
    return () => {
      mounted = false;
    };
  }, []);

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev));
  };
  const updateSibling = (index, key, value) => {
    setSiblings((prev) => prev.map((s, i) => (i === index ? { ...s, [key]: value } : s)));
    setSiblingErrors((prev) =>
      prev.map((e, i) => (i === index && e?.[key] ? { ...e, [key]: "" } : e))
    );
  };
  const addSibling = () => {
    setSiblings((prev) => [...prev, blankChild()]);
    setSiblingErrors((prev) => [...prev, {}]);
  };
  const removeSibling = (index) => {
    setSiblings((prev) => prev.filter((_, i) => i !== index));
    setSiblingErrors((prev) => prev.filter((_, i) => i !== index));
  };

  async function handleSubmit(e) {
    e.preventDefault();

    const formErrors = validateForm(form);
    const childErrors = siblings.map(validateChild);
    setErrors(formErrors);
    setSiblingErrors(childErrors);

    if (hasErrors(formErrors) || childErrors.some(hasErrors)) {
      toast.error("Please fix the highlighted fields before continuing");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/registrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, additionalChildren: siblings }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to submit");

      const hydratedUser = persistAuthSession(data, "register");

      toast.success(`Welcome, ${hydratedUser?.name || "Explorer"}! Redirecting to your dashboard...`);
      setForm(EMPTY_FORM);
      setErrors({});
      setSiblings([]);
      setSiblingErrors([]);
      setTimeout(() => navigate("/dashboard", { replace: true }), 1200);
    } catch (err) {
      toast.error(err?.message || "Something went wrong, please try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="w-full bg-gradient-to-b from-[#FFF7F2] to-white px-4 py-14">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Balsamiq+Sans:wght@400;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
      `}</style>
      <ToastContainer />

      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        {/* Benefits panel */}
        <div className="order-2 lg:sticky lg:top-24 lg:order-1">
          <div className="rounded-[2rem] border-4 border-[#4ECDC4]/25 bg-gradient-to-br from-[#F4736E] to-[#e85e58] p-8 text-white shadow-xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-black uppercase tracking-wider">
              <span
                className="material-symbols-outlined text-base"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
              >
                celebration
              </span>
              Join Edify Eight
            </span>
            <h2
              className="mt-4 text-3xl font-bold leading-tight"
              style={{ fontFamily: "'Balsamiq Sans', cursive" }}
            >
              Register your interest
            </h2>
            <p className="mt-2 text-sm text-white/85">
              Fill in a few details and get instant access to your family dashboard.
            </p>

            <div className="mt-8 space-y-5">
              {BENEFITS.map((b) => (
                <div key={b.title} className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                    <span
                      className="material-symbols-outlined text-xl"
                      style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
                    >
                      {b.icon}
                    </span>
                  </span>
                  <div>
                    <p className="text-sm font-bold">{b.title}</p>
                    <p className="text-xs text-white/75">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="order-1 rounded-[2rem] border-4 border-[#F4736E]/15 bg-white p-6 shadow-xl sm:p-10 lg:order-2">
          <form onSubmit={handleSubmit} className="space-y-9" noValidate>
            <div className="space-y-5">
              <SectionBadge step={1} title="Student Details" subtitle="Tell us about the student" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Student Name" error={errors.name}>
                  <div className="relative">
                    {icon("person")}
                    <input
                      className={errors.name ? inputErrCls : inputCls}
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      placeholder="Student's full name"
                    />
                  </div>
                </Field>
                <Field label="Gender" error={errors.gender}>
                  <div className="relative">
                    {icon("wc")}
                    <select
                      className={errors.gender ? inputErrCls : inputCls}
                      value={form.gender}
                      onChange={(e) => update("gender", e.target.value)}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </Field>
                <Field label="Board" error={errors.board}>
                  <div className="relative">
                    {icon("account_balance")}
                    <select
                      className={errors.board ? inputErrCls : inputCls}
                      value={form.board}
                      onChange={(e) => update("board", e.target.value)}
                    >
                      <option value="">Select Board</option>
                      {boards.map((b) => (
                        <option key={b._id} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </Field>
                <Field label="Class" error={errors.class}>
                  <div className="relative">
                    {icon("school")}
                    <select
                      className={errors.class ? inputErrCls : inputCls}
                      value={form.class}
                      onChange={(e) => update("class", e.target.value)}
                    >
                      <option value="">Select Class</option>
                      {classes.map((c) => (
                        <option key={c._id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </Field>
                <div className="sm:col-span-2">
                  <Field label="School Name" error={errors.schoolName}>
                    <div className="relative">
                      {icon("apartment")}
                      <input
                        className={errors.schoolName ? inputErrCls : inputCls}
                        value={form.schoolName}
                        onChange={(e) => update("schoolName", e.target.value)}
                        placeholder="Current school"
                      />
                    </div>
                  </Field>
                </div>
              </div>
            </div>

            {siblings.length > 0 && (
              <div className="space-y-5">
                <SectionBadge step={2} title="Additional Children" subtitle="Add every child under this family" />
                <div className="space-y-4">
                  {siblings.map((sibling, index) => {
                    const childErr = siblingErrors[index] || {};
                    return (
                      <div
                        key={index}
                        className="relative rounded-2xl border-2 border-[#4ECDC4]/30 bg-[#4ECDC4]/5 p-4 sm:p-5"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-wide text-[#1B8A84]">
                            Child {index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeSibling(index)}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-rose-500 shadow hover:bg-rose-50"
                            aria-label="Remove child"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <Field label="Student Name" error={childErr.name}>
                            <div className="relative">
                              {icon("person")}
                              <input
                                className={childErr.name ? inputErrCls : inputCls}
                                value={sibling.name}
                                onChange={(e) => updateSibling(index, "name", e.target.value)}
                                placeholder="Student's full name"
                              />
                            </div>
                          </Field>
                          <Field label="Gender" error={childErr.gender}>
                            <div className="relative">
                              {icon("wc")}
                              <select
                                className={childErr.gender ? inputErrCls : inputCls}
                                value={sibling.gender}
                                onChange={(e) => updateSibling(index, "gender", e.target.value)}
                              >
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                          </Field>
                          <Field label="Board" error={childErr.board}>
                            <div className="relative">
                              {icon("account_balance")}
                              <select
                                className={childErr.board ? inputErrCls : inputCls}
                                value={sibling.board}
                                onChange={(e) => updateSibling(index, "board", e.target.value)}
                              >
                                <option value="">Select Board</option>
                                {boards.map((b) => (
                                  <option key={b._id} value={b.name}>
                                    {b.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </Field>
                          <Field label="Class" error={childErr.class}>
                            <div className="relative">
                              {icon("school")}
                              <select
                                className={childErr.class ? inputErrCls : inputCls}
                                value={sibling.class}
                                onChange={(e) => updateSibling(index, "class", e.target.value)}
                              >
                                <option value="">Select Class</option>
                                {classes.map((c) => (
                                  <option key={c._id} value={c.name}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </Field>
                          <div className="sm:col-span-2">
                            <Field label="School Name" error={childErr.schoolName}>
                              <div className="relative">
                                {icon("apartment")}
                                <input
                                  className={childErr.schoolName ? inputErrCls : inputCls}
                                  value={sibling.schoolName}
                                  onChange={(e) => updateSibling(index, "schoolName", e.target.value)}
                                  placeholder="Student's current school"
                                />
                              </div>
                            </Field>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={addSibling}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border-2 border-dashed border-[#4ECDC4]/50 py-3 text-sm font-bold text-[#1B8A84] transition hover:border-[#4ECDC4] hover:bg-[#4ECDC4]/5 sm:w-auto sm:px-6"
            >
              <Plus size={16} /> Add Another Child
            </button>

            <div className="space-y-5">
              <SectionBadge step={siblings.length > 0 ? 3 : 2} title="Parent & Contact Details" subtitle="How we'll reach you" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="Parent Name" error={errors.parentName}>
                    <div className="relative">
                      {icon("family_restroom")}
                      <input
                        className={errors.parentName ? inputErrCls : inputCls}
                        value={form.parentName}
                        onChange={(e) => update("parentName", e.target.value)}
                        placeholder="Parent/Guardian's name"
                      />
                    </div>
                  </Field>
                </div>
                <Field label="Mobile Number" error={errors.mobile}>
                  <div className="relative">
                    {icon("call")}
                    <input
                      className={errors.mobile ? inputErrCls : inputCls}
                      value={form.mobile}
                      onChange={(e) => update("mobile", e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
                      placeholder="10-digit mobile number"
                      inputMode="numeric"
                    />
                  </div>
                </Field>
                <Field label="Email ID" error={errors.email}>
                  <div className="relative">
                    {icon("mail")}
                    <input
                      className={errors.email ? inputErrCls : inputCls}
                      type="email"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      placeholder="example@gmail.com"
                    />
                  </div>
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Password" error={errors.password}>
                    <div className="relative">
                      {icon("lock")}
                      <input
                        className={(errors.password ? inputErrCls : inputCls) + " pr-12"}
                        type={showPwd ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => update("password", e.target.value)}
                        placeholder="Min. 6 characters"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd((s) => !s)}
                        className="absolute inset-y-0 right-3 my-auto flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100"
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
                  </Field>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#F4736E] px-8 py-4 font-bold text-white shadow-[0_4px_0_0_#c9443e] transition-all hover:bg-[#e85e58] active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Register Now"}
              {!submitting && (
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
                >
                  arrow_forward
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
