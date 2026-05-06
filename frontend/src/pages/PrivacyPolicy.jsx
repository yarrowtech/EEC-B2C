import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Shield, Eye, Lock, Users, Bell, Trash2, Mail, ChevronRight } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const DEFAULT_LAST_UPDATED = "May 6, 2025";
const DEFAULT_INTRO =
  "At Edify Eight, your privacy is not an afterthought — it is a core part of how we build. This policy explains what data we collect, why, and how we protect it.";

// Icon map for rendering fetched sections
const ICON_MAP = { Eye, Shield, Lock, Users, Bell, Trash2 };

const DEFAULT_SECTIONS = [
  {
    id: "information-we-collect",
    icon: Eye,
    color: "#F4736E",
    title: "Information We Collect",
    content: [
      {
        heading: "Account Information",
        text: "When you register, we collect your name, email address, phone number, and role (student, teacher, or parent). This is required to create and manage your account.",
      },
      {
        heading: "Usage Data",
        text: "We automatically collect information about how you interact with our platform — pages visited, features used, quiz results, time spent, and device/browser information — to improve your learning experience.",
      },
      {
        heading: "Content You Provide",
        text: "Any content you submit — answers, notes, feedback, or uploaded study materials — is stored to deliver the service and personalise your learning path.",
      },
    ],
  },
  {
    id: "how-we-use",
    icon: Shield,
    color: "#4ECDC4",
    title: "How We Use Your Information",
    content: [
      {
        heading: "Service Delivery",
        text: "To create and maintain your account, display personalised content, track learning progress, generate reports, and enable communication between students and teachers.",
      },
      {
        heading: "Improvement & Analytics",
        text: "We use aggregated, anonymised usage data to improve our curriculum, platform features, and AI recommendations. Individual data is never sold to advertisers.",
      },
      {
        heading: "Communications",
        text: "We may send you account-related emails (password resets, security alerts) and optional educational updates. You can unsubscribe from marketing emails at any time.",
      },
    ],
  },
  {
    id: "data-sharing",
    icon: Users,
    color: "#FFD23F",
    title: "Data Sharing",
    content: [
      {
        heading: "We Do Not Sell Your Data",
        text: "Edify Eight does not sell, rent, or trade your personal information to third parties for marketing purposes.",
      },
      {
        heading: "Service Providers",
        text: "We share data with trusted third-party providers (email delivery, cloud hosting, analytics) who are contractually bound to handle it securely and only for the purpose of serving you.",
      },
      {
        heading: "Legal Obligations",
        text: "We may disclose information if required by law, court order, or to protect the rights and safety of our users and the public.",
      },
    ],
  },
  {
    id: "data-security",
    icon: Lock,
    color: "#F4736E",
    title: "Data Security",
    content: [
      {
        heading: "Encryption",
        text: "All data is transmitted over HTTPS. Passwords are hashed using bcrypt and are never stored in plain text. Reset tokens are single-use and expire within 15 minutes.",
      },
      {
        heading: "Access Controls",
        text: "Access to user data is restricted to authorised personnel on a need-to-know basis. We perform regular internal audits of our data access logs.",
      },
      {
        heading: "Breach Response",
        text: "In the unlikely event of a data breach, we will notify affected users within 72 hours and take immediate steps to contain and remediate the issue.",
      },
    ],
  },
  {
    id: "your-rights",
    icon: Bell,
    color: "#4ECDC4",
    title: "Your Rights",
    content: [
      {
        heading: "Access & Correction",
        text: "You can view and update your personal information at any time from your Profile page.",
      },
      {
        heading: "Data Portability",
        text: "You may request a copy of your personal data in a machine-readable format by contacting our support team.",
      },
      {
        heading: "Opt-out",
        text: "You can opt out of non-essential communications from your account settings or by clicking 'Unsubscribe' in any email we send.",
      },
    ],
  },
  {
    id: "deletion",
    icon: Trash2,
    color: "#FFD23F",
    title: "Data Deletion",
    content: [
      {
        heading: "Account Deletion",
        text: "You may request account deletion by contacting our support team. Upon confirmed deletion, your personal data will be permanently removed within 30 days, except where retention is required by law.",
      },
      {
        heading: "Retention Period",
        text: "We retain account data for as long as your account is active. Anonymised usage statistics may be retained indefinitely for product improvement.",
      },
    ],
  },
  {
    id: "cookies",
    icon: Shield,
    color: "#4ECDC4",
    title: "Cookies",
    content: [
      {
        heading: "Essential Cookies",
        text: "We use session cookies and local storage tokens to keep you logged in and remember your preferences. These are necessary for the platform to function.",
      },
      {
        heading: "Analytics Cookies",
        text: "We may use analytics tools to understand how users navigate the platform. These are anonymised and help us improve the product.",
      },
    ],
  },
  {
    id: "children",
    icon: Users,
    color: "#F4736E",
    title: "Children's Privacy",
    content: [
      {
        heading: "Under-13 Policy",
        text: "Our platform is intended for students of all ages. When a user under 13 registers, we require parental or guardian consent. We collect only the minimum data necessary and do not display targeted advertising to minors.",
      },
    ],
  },
];

export default function PrivacyPolicy() {
  const [lastUpdated, setLastUpdated] = useState(DEFAULT_LAST_UPDATED);
  const [introText, setIntroText]     = useState(DEFAULT_INTRO);
  const [sections, setSections]       = useState(DEFAULT_SECTIONS);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    async function load() {
      try {
        const res  = await fetch(`${API}/api/privacy-policy`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.useDefault !== false) return; // keep default
        if (data.lastUpdated) setLastUpdated(data.lastUpdated);
        if (data.introText)   setIntroText(data.introText);
        if (Array.isArray(data.sections) && data.sections.length > 0) {
          // Re-attach icon components (stored as string keys aren't needed — use Shield as fallback)
          setSections(
            data.sections.map((s) => ({
              ...s,
              icon: ICON_MAP[s.iconKey] || Shield,
            }))
          );
        }
      } catch {
        // silently keep defaults
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "#FEF4E8" }}>
      {/* Hero */}
      <div
        className="relative overflow-hidden py-20 text-center"
        style={{ background: "#1B1F3B" }}
      >
        {/* Blobs */}
        <div
          className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full blur-3xl opacity-20"
          style={{ background: "#FFD23F" }}
        />
        <div
          className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full blur-3xl opacity-15"
          style={{ background: "#4ECDC4" }}
        />

        {/* Breadcrumb */}
        <div className="relative mb-6 flex items-center justify-center gap-2 text-xs" style={{ color: "#94a3b8" }}>
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <ChevronRight size={12} />
          <span style={{ color: "#FFD23F" }}>Privacy Policy</span>
        </div>

        <div
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl rotate-3 shadow-2xl"
          style={{ background: "#FFD23F" }}
        >
          <Shield className="h-8 w-8" style={{ color: "#1B1F3B" }} />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm" style={{ color: "#94a3b8" }}>
          Last updated: {lastUpdated}
        </p>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
          {introText}
        </p>

        {/* Three-colour strip */}
        <div className="absolute bottom-0 left-0 right-0 flex h-1.5">
          <div className="flex-1" style={{ background: "#FFD23F" }} />
          <div className="flex-1" style={{ background: "#F4736E" }} />
          <div className="flex-1" style={{ background: "#4ECDC4" }} />
        </div>
      </div>

      {/* Quick nav pills */}
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-wrap justify-center gap-2">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="rounded-full border px-4 py-1.5 text-xs font-semibold transition hover:shadow-sm"
              style={{
                borderColor: `${s.color}50`,
                color: s.color,
                background: `${s.color}10`,
              }}
            >
              {s.title}
            </a>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl space-y-6 px-4 pb-20">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.id}
              id={section.id}
              className="scroll-mt-24 overflow-hidden rounded-3xl border-2 bg-white shadow-sm"
              style={{ borderColor: `${section.color}30` }}
            >
              {/* Section header */}
              <div
                className="flex items-center gap-3 px-6 py-4"
                style={{ background: `${section.color}12`, borderBottom: `2px solid ${section.color}20` }}
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: section.color }}
                >
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-lg font-extrabold" style={{ color: "#1B1F3B" }}>
                  {section.title}
                </h2>
              </div>

              {/* Sub-sections */}
              <div className="divide-y px-6" style={{ divideColor: "#f1f5f9" }}>
                {section.content.map((item, i) => (
                  <div key={i} className="py-5">
                    <h3
                      className="mb-1.5 text-sm font-bold"
                      style={{ color: section.color }}
                    >
                      {item.heading}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "#475569" }}>
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Contact card */}
        <div
          className="overflow-hidden rounded-3xl border-2 bg-white shadow-sm"
          style={{ borderColor: "rgba(255,210,63,0.4)" }}
        >
          <div
            className="flex items-center gap-3 px-6 py-4"
            style={{ background: "rgba(255,210,63,0.1)", borderBottom: "2px solid rgba(255,210,63,0.2)" }}
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: "#FFD23F" }}
            >
              <Mail className="h-4 w-4" style={{ color: "#1B1F3B" }} />
            </div>
            <h2 className="text-lg font-extrabold" style={{ color: "#1B1F3B" }}>
              Contact Us
            </h2>
          </div>
          <div className="px-6 py-5">
            <p className="text-sm leading-relaxed" style={{ color: "#475569" }}>
              If you have questions about this Privacy Policy or wish to exercise any of your data
              rights, please reach out to us:
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
              <a
                href="mailto:support@edifyeight.com"
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-extrabold text-white transition active:scale-[0.98]"
                style={{ background: "#F4736E", boxShadow: "0 4px 0 0 #c9443e" }}
              >
                <Mail size={15} />
                support@edifyeight.com
              </a>
              <Link
                to="/contact-us"
                className="inline-flex items-center gap-1 text-sm font-semibold transition"
                style={{ color: "#4ECDC4" }}
              >
                Visit Contact Page <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs" style={{ color: "#94a3b8" }}>
          This policy may be updated periodically. We will notify you of significant changes via email or an in-app notice.
        </p>
      </div>
    </div>
  );
}
