import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { Plus, X } from "lucide-react";
import { persistAuthSession } from "../lib/authSession";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const inputCls =
  "w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-[#F4736E] focus:ring-2 focus:ring-[#F4736E]/20";

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

function FieldGroup({ title, children, action }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wide text-[#F4736E]">{title}</h3>
        {action}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-slate-500 ml-1">{label}</label>
      {children}
    </div>
  );
}

export default function RegisterInterestSection() {
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [classes, setClasses] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [siblings, setSiblings] = useState([]);

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

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const updateSibling = (index, key, value) =>
    setSiblings((prev) => prev.map((s, i) => (i === index ? { ...s, [key]: value } : s)));
  const addSibling = () => setSiblings((prev) => [...prev, blankChild()]);
  const removeSibling = (index) => setSiblings((prev) => prev.filter((_, i) => i !== index));

  async function handleSubmit(e) {
    e.preventDefault();

    if (
      !form.name.trim() ||
      !form.gender ||
      !form.board ||
      !form.class ||
      !form.schoolName.trim() ||
      !form.parentName.trim() ||
      !form.mobile.trim() ||
      !form.email.trim() ||
      !form.password
    ) {
      toast.error("Please fill in all fields");
      return;
    }
    for (const sibling of siblings) {
      if (!sibling.name.trim() || !sibling.gender || !sibling.board || !sibling.class || !sibling.schoolName.trim()) {
        toast.error("Please fill in all fields for each additional child, or remove the empty entry");
        return;
      }
    }
    if (form.mobile.replace(/\D/g, "").length !== 10) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      toast.error("Enter a valid email address");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
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
      setSiblings([]);
      setTimeout(() => navigate("/dashboard", { replace: true }), 1200);
    } catch (err) {
      toast.error(err?.message || "Something went wrong, please try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="w-full py-14 px-4">
      <ToastContainer />
      <div className="mx-auto max-w-2xl rounded-[2rem] border-4 border-[#F4736E]/20 p-6 sm:p-10 shadow-xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
            Register Your Interest
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Fill in your details and get instant access to your dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <FieldGroup title="Student Details">
            <Field label="Student Name">
              <input
                className={inputCls}
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Student's full name"
              />
            </Field>
            <Field label="Gender">
              <select className={inputCls} value={form.gender} onChange={(e) => update("gender", e.target.value)}>
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Board">
              <select className={inputCls} value={form.board} onChange={(e) => update("board", e.target.value)}>
                <option value="">Select Board</option>
                {boards.map((b) => (
                  <option key={b._id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Class">
              <select className={inputCls} value={form.class} onChange={(e) => update("class", e.target.value)}>
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c._id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="School Name">
                <input
                  className={inputCls}
                  value={form.schoolName}
                  onChange={(e) => update("schoolName", e.target.value)}
                  placeholder="Current school"
                />
              </Field>
            </div>
          </FieldGroup>

          {siblings.map((sibling, index) => (
            <FieldGroup
              key={index}
              title={`Additional Child ${index + 1}`}
              action={
                <button
                  type="button"
                  onClick={() => removeSibling(index)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-600"
                >
                  <X size={14} /> Remove
                </button>
              }
            >
              <Field label="Student Name">
                <input
                  className={inputCls}
                  value={sibling.name}
                  onChange={(e) => updateSibling(index, "name", e.target.value)}
                  placeholder="Student's full name"
                />
              </Field>
              <Field label="Gender">
                <select
                  className={inputCls}
                  value={sibling.gender}
                  onChange={(e) => updateSibling(index, "gender", e.target.value)}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </Field>
              <Field label="Board">
                <select
                  className={inputCls}
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
              </Field>
              <Field label="Class">
                <select
                  className={inputCls}
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
              </Field>
              <div className="sm:col-span-2">
                <Field label="School Name">
                  <input
                    className={inputCls}
                    value={sibling.schoolName}
                    onChange={(e) => updateSibling(index, "schoolName", e.target.value)}
                    placeholder="Student's current school"
                  />
                </Field>
              </div>
            </FieldGroup>
          ))}

          <button
            type="button"
            onClick={addSibling}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#F4736E] hover:text-[#e85e58]"
          >
            <Plus size={16} /> Add Another Child
          </button>

          <FieldGroup title="Parent & Contact Details">
            <div className="sm:col-span-2">
              <Field label="Parent Name">
                <input
                  className={inputCls}
                  value={form.parentName}
                  onChange={(e) => update("parentName", e.target.value)}
                  placeholder="Parent/Guardian's name"
                />
              </Field>
            </div>
            <Field label="Mobile Number">
              <input
                className={inputCls}
                value={form.mobile}
                onChange={(e) => update("mobile", e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
                placeholder="10-digit mobile number"
                inputMode="numeric"
              />
            </Field>
            <Field label="Email ID">
              <input
                className={inputCls}
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="example@gmail.com"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Password">
                <input
                  className={inputCls}
                  type="password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                />
              </Field>
            </div>
          </FieldGroup>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-full bg-[#F4736E] px-8 py-4 font-bold text-white shadow-[0_4px_0_0_#c9443e] transition-all hover:bg-[#e85e58] active:translate-y-1 active:shadow-none disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Register Now"}
          </button>
        </form>
      </div>
    </section>
  );
}
