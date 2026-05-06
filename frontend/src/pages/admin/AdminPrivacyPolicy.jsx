import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Shield, Eye, Lock, Users, Bell, Trash2,
  Plus, Trash, ChevronDown, ChevronUp, RotateCcw, Save, ExternalLink,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ICON_OPTIONS = [
  { key: "Shield", label: "Shield", Icon: Shield },
  { key: "Eye",    label: "Eye",    Icon: Eye    },
  { key: "Lock",   label: "Lock",   Icon: Lock   },
  { key: "Users",  label: "Users",  Icon: Users  },
  { key: "Bell",   label: "Bell",   Icon: Bell   },
  { key: "Trash2", label: "Trash",  Icon: Trash2 },
];

const COLOR_OPTIONS = [
  { label: "Coral",  value: "#F4736E" },
  { label: "Teal",   value: "#4ECDC4" },
  { label: "Yellow", value: "#FFD23F" },
  { label: "Navy",   value: "#1B1F3B" },
];

const DEFAULT_SECTIONS = [
  {
    id: "information-we-collect", iconKey: "Eye", color: "#F4736E",
    title: "Information We Collect",
    content: [
      { heading: "Account Information", text: "When you register, we collect your name, email address, phone number, and role (student, teacher, or parent). This is required to create and manage your account." },
      { heading: "Usage Data", text: "We automatically collect information about how you interact with our platform — pages visited, features used, quiz results, time spent, and device/browser information — to improve your learning experience." },
      { heading: "Content You Provide", text: "Any content you submit — answers, notes, feedback, or uploaded study materials — is stored to deliver the service and personalise your learning path." },
    ],
  },
  {
    id: "how-we-use", iconKey: "Shield", color: "#4ECDC4",
    title: "How We Use Your Information",
    content: [
      { heading: "Service Delivery", text: "To create and maintain your account, display personalised content, track learning progress, generate reports, and enable communication between students and teachers." },
      { heading: "Improvement & Analytics", text: "We use aggregated, anonymised usage data to improve our curriculum, platform features, and AI recommendations. Individual data is never sold to advertisers." },
      { heading: "Communications", text: "We may send you account-related emails (password resets, security alerts) and optional educational updates. You can unsubscribe from marketing emails at any time." },
    ],
  },
  {
    id: "data-sharing", iconKey: "Users", color: "#FFD23F",
    title: "Data Sharing",
    content: [
      { heading: "We Do Not Sell Your Data", text: "Edify Eight does not sell, rent, or trade your personal information to third parties for marketing purposes." },
      { heading: "Service Providers", text: "We share data with trusted third-party providers (email delivery, cloud hosting, analytics) who are contractually bound to handle it securely and only for the purpose of serving you." },
      { heading: "Legal Obligations", text: "We may disclose information if required by law, court order, or to protect the rights and safety of our users and the public." },
    ],
  },
  {
    id: "data-security", iconKey: "Lock", color: "#F4736E",
    title: "Data Security",
    content: [
      { heading: "Encryption", text: "All data is transmitted over HTTPS. Passwords are hashed using bcrypt and are never stored in plain text. Reset tokens are single-use and expire within 15 minutes." },
      { heading: "Access Controls", text: "Access to user data is restricted to authorised personnel on a need-to-know basis. We perform regular internal audits of our data access logs." },
      { heading: "Breach Response", text: "In the unlikely event of a data breach, we will notify affected users within 72 hours and take immediate steps to contain and remediate the issue." },
    ],
  },
  {
    id: "your-rights", iconKey: "Bell", color: "#4ECDC4",
    title: "Your Rights",
    content: [
      { heading: "Access & Correction", text: "You can view and update your personal information at any time from your Profile page." },
      { heading: "Data Portability", text: "You may request a copy of your personal data in a machine-readable format by contacting our support team." },
      { heading: "Opt-out", text: "You can opt out of non-essential communications from your account settings or by clicking 'Unsubscribe' in any email we send." },
    ],
  },
  {
    id: "deletion", iconKey: "Trash2", color: "#FFD23F",
    title: "Data Deletion",
    content: [
      { heading: "Account Deletion", text: "You may request account deletion by contacting our support team. Upon confirmed deletion, your personal data will be permanently removed within 30 days, except where retention is required by law." },
      { heading: "Retention Period", text: "We retain account data for as long as your account is active. Anonymised usage statistics may be retained indefinitely for product improvement." },
    ],
  },
  {
    id: "cookies", iconKey: "Shield", color: "#4ECDC4",
    title: "Cookies",
    content: [
      { heading: "Essential Cookies", text: "We use session cookies and local storage tokens to keep you logged in and remember your preferences. These are necessary for the platform to function." },
      { heading: "Analytics Cookies", text: "We may use analytics tools to understand how users navigate the platform. These are anonymised and help us improve the product." },
    ],
  },
  {
    id: "children", iconKey: "Users", color: "#F4736E",
    title: "Children's Privacy",
    content: [
      { heading: "Under-13 Policy", text: "Our platform is intended for students of all ages. When a user under 13 registers, we require parental or guardian consent. We collect only the minimum data necessary and do not display targeted advertising to minors." },
    ],
  },
];

const DEFAULT_INTRO = "At Edify Eight, your privacy is not an afterthought — it is a core part of how we build. This policy explains what data we collect, why, and how we protect it.";

function token() { return localStorage.getItem("jwt") || ""; }

export default function AdminPrivacyPolicy() {
  const navigate = useNavigate();

  const [useDefault, setUseDefault] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("May 6, 2025");
  const [introText, setIntroText] = useState(DEFAULT_INTRO);
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch(`${API}/api/privacy-policy`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return;
        setUseDefault(data.useDefault !== false);
        if (data.lastUpdated) setLastUpdated(data.lastUpdated);
        if (data.introText)   setIntroText(data.introText);
        if (Array.isArray(data.sections) && data.sections.length > 0) {
          setSections(data.sections);
        }
      } catch {
        // keep defaults
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/privacy-policy`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({ useDefault, lastUpdated, introText, sections }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Save failed");
      toast.success("Privacy policy saved!");
    } catch (err) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function resetToDefault() {
    setSections(DEFAULT_SECTIONS);
    setIntroText(DEFAULT_INTRO);
    setLastUpdated("May 6, 2025");
  }

  // Section helpers
  function updateSection(idx, field, value) {
    setSections((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  }

  function updateContentItem(sIdx, cIdx, field, value) {
    setSections((prev) =>
      prev.map((s, i) => {
        if (i !== sIdx) return s;
        const content = s.content.map((c, j) => (j === cIdx ? { ...c, [field]: value } : c));
        return { ...s, content };
      })
    );
  }

  function addContentItem(sIdx) {
    setSections((prev) =>
      prev.map((s, i) =>
        i !== sIdx ? s : { ...s, content: [...s.content, { heading: "", text: "" }] }
      )
    );
  }

  function removeContentItem(sIdx, cIdx) {
    setSections((prev) =>
      prev.map((s, i) =>
        i !== sIdx ? s : { ...s, content: s.content.filter((_, j) => j !== cIdx) }
      )
    );
  }

  function addSection() {
    setSections((prev) => [
      ...prev,
      {
        id: `section-${Date.now()}`,
        iconKey: "Shield",
        color: "#4ECDC4",
        title: "New Section",
        content: [{ heading: "", text: "" }],
      },
    ]);
    setExpandedIdx(sections.length);
  }

  function removeSection(idx) {
    setSections((prev) => prev.filter((_, i) => i !== idx));
    setExpandedIdx(null);
  }

  function moveSection(idx, dir) {
    setSections((prev) => {
      const arr = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= arr.length) return arr;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return arr;
    });
    setExpandedIdx((e) => (e === idx ? idx + dir : e));
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "#FFD23F", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: "#1B1F3B" }}>
            Privacy Policy Editor
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Manage the public-facing privacy policy page
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/privacy-policy"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            <ExternalLink size={13} /> Preview
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-extrabold text-white shadow-lg transition active:scale-[0.98] disabled:opacity-60"
            style={{ background: "#F4736E", boxShadow: "0 4px 0 0 #c9443e" }}
          >
            <Save size={14} />
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Use Default Toggle */}
      <div
        className="flex items-center justify-between rounded-2xl border-2 bg-white px-5 py-4"
        style={{ borderColor: "rgba(255,210,63,0.5)" }}
      >
        <div>
          <p className="font-bold" style={{ color: "#1B1F3B" }}>Use Default Template</p>
          <p className="text-xs text-slate-500">
            When on, the public page shows the built-in template. Turn off to use your custom content below.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setUseDefault((v) => !v)}
          className="relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300"
          style={{ background: useDefault ? "#4ECDC4" : "#e2e8f0" }}
        >
          <span
            className="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300"
            style={{ transform: useDefault ? "translateX(30px)" : "translateX(4px)" }}
          />
        </button>
      </div>

      {/* Custom editor — shown when not using default */}
      {!useDefault && (
        <>
          {/* Meta fields */}
          <div className="rounded-2xl border-2 bg-white p-5" style={{ borderColor: "rgba(78,205,196,0.4)" }}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold" style={{ color: "#1B1F3B" }}>Page Info</h2>
              <button
                type="button"
                onClick={resetToDefault}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition"
              >
                <RotateCcw size={12} /> Reset to default
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600">Last Updated Date</span>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-yellow-400"
                  value={lastUpdated}
                  onChange={(e) => setLastUpdated(e.target.value)}
                  placeholder="e.g. May 6, 2025"
                />
              </label>
              <div />
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-semibold text-slate-600">Intro Text</span>
                <textarea
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-yellow-400 resize-none"
                  value={introText}
                  onChange={(e) => setIntroText(e.target.value)}
                />
              </label>
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-3">
            {sections.map((section, sIdx) => {
              const isOpen = expandedIdx === sIdx;
              const IconComp = ICON_OPTIONS.find((o) => o.key === section.iconKey)?.Icon || Shield;
              return (
                <div
                  key={section.id}
                  className="overflow-hidden rounded-2xl border-2 bg-white"
                  style={{ borderColor: `${section.color}40` }}
                >
                  {/* Section header row */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
                    style={{ background: `${section.color}10` }}
                    onClick={() => setExpandedIdx(isOpen ? null : sIdx)}
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: section.color }}
                    >
                      <IconComp className="h-4 w-4 text-white" />
                    </div>
                    <span className="flex-1 font-bold truncate" style={{ color: "#1B1F3B" }}>
                      {section.title || "Untitled section"}
                    </span>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition"
                        onClick={() => moveSection(sIdx, -1)}
                        disabled={sIdx === 0}
                        title="Move up"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition"
                        onClick={() => moveSection(sIdx, 1)}
                        disabled={sIdx === sections.length - 1}
                        title="Move down"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 transition"
                        onClick={() => removeSection(sIdx)}
                        title="Delete section"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                    <span className="text-slate-400">{isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
                  </div>

                  {/* Expanded editor */}
                  {isOpen && (
                    <div className="px-5 py-4 space-y-4">
                      {/* Section meta */}
                      <div className="grid gap-3 sm:grid-cols-3">
                        <label className="block sm:col-span-1">
                          <span className="mb-1 block text-xs font-semibold text-slate-600">Section Title</span>
                          <input
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-yellow-400"
                            value={section.title}
                            onChange={(e) => updateSection(sIdx, "title", e.target.value)}
                          />
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-xs font-semibold text-slate-600">Icon</span>
                          <select
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-yellow-400"
                            value={section.iconKey}
                            onChange={(e) => updateSection(sIdx, "iconKey", e.target.value)}
                          >
                            {ICON_OPTIONS.map((o) => (
                              <option key={o.key} value={o.key}>{o.label}</option>
                            ))}
                          </select>
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-xs font-semibold text-slate-600">Accent Color</span>
                          <select
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-yellow-400"
                            value={section.color}
                            onChange={(e) => updateSection(sIdx, "color", e.target.value)}
                          >
                            {COLOR_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </label>
                      </div>

                      {/* Content items */}
                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Content Items</p>
                        {section.content.map((item, cIdx) => (
                          <div
                            key={cIdx}
                            className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                          >
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-500">Item {cIdx + 1}</span>
                              <button
                                type="button"
                                onClick={() => removeContentItem(sIdx, cIdx)}
                                disabled={section.content.length <= 1}
                                className="text-red-400 hover:text-red-600 transition disabled:opacity-30"
                              >
                                <Trash size={13} />
                              </button>
                            </div>
                            <input
                              className="mb-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-yellow-400"
                              placeholder="Heading"
                              value={item.heading}
                              onChange={(e) => updateContentItem(sIdx, cIdx, "heading", e.target.value)}
                            />
                            <textarea
                              rows={3}
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-yellow-400 resize-none"
                              placeholder="Text content"
                              value={item.text}
                              onChange={(e) => updateContentItem(sIdx, cIdx, "text", e.target.value)}
                            />
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addContentItem(sIdx)}
                          className="inline-flex items-center gap-1 text-xs font-semibold transition"
                          style={{ color: section.color }}
                        >
                          <Plus size={13} /> Add content item
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add section */}
            <button
              type="button"
              onClick={addSection}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
              style={{ borderColor: "#4ECDC4" }}
            >
              <Plus size={16} style={{ color: "#4ECDC4" }} /> Add Section
            </button>
          </div>

          {/* Bottom save */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-extrabold text-white shadow-lg transition active:scale-[0.98] disabled:opacity-60"
              style={{ background: "#F4736E", boxShadow: "0 4px 0 0 #c9443e" }}
            >
              <Save size={15} />
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </>
      )}

      {/* Default mode info card */}
      {useDefault && (
        <div
          className="rounded-2xl border-2 bg-white p-6 text-center"
          style={{ borderColor: "rgba(78,205,196,0.3)" }}
        >
          <div
            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: "#4ECDC4" }}
          >
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-bold" style={{ color: "#1B1F3B" }}>Using Built-in Default Template</h3>
          <p className="mt-1.5 text-sm text-slate-500">
            The public Privacy Policy page is showing the default Edify Eight template.
            Toggle off "Use Default Template" above to create a custom policy.
          </p>
          <a
            href="/privacy-policy"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold transition"
            style={{ color: "#4ECDC4" }}
          >
            <ExternalLink size={14} /> View live page
          </a>
        </div>
      )}
    </div>
  );
}
