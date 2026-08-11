import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  HelpCircle,
  BookOpen,
  Award,
  CreditCard,
  RotateCcw,
  UserCog,
  LifeBuoy,
  MessageCircleQuestion,
} from "lucide-react";

const CATEGORIES = [
  {
    title: "General",
    icon: HelpCircle,
    color: "#F4736E",
    items: [
      {
        q: "What is Edify Eight?",
        a: "Edify Eight is a self-learning platform for individual students. It helps you practice, prepare, and improve through exam-style questions, self-study materials all at your own pace, with no fixed schedules or classes to enroll in.",
      },
      {
        q: "Who can join Edify Eight?",
        intro: "Edify Eight is open to:",
        bullets: [
          "School Students class 3 to 10",
        ],
      },
      {
        q: "Why should I choose Edify Eight?",
        intro: "Edify Eight focuses on practical, self-paced learning through:",
        bullets: [
          "Practice aligned to your board, class, and topics",
          "Gamified progress with points, streaks, and rewards",
          "Detailed performance analytics",
          "Flexible learning — study whenever it suits you",
        ],
      },
    ],
  },
  {
    title: "Learning",
    icon: BookOpen,
    color: "#6C63FF",
    items: [
      {
        q: "How will I access my learning content?",
        a: "Once you sign up, you can access your practice questions, self-study materials, and progress through your Edify Eight dashboard.",
      },
      {
        q: "Can I learn at my own pace?",
        a: "Yes. Edify Eight is fully self-paced — there are no fixed schedules or live classes, so you can practice and study whenever it suits you.",
      },
      {
        q: "Will I receive study materials?",
        intro: "Yes. Most subjects include learning resources such as:",
        bullets: [
          "PDFs",
          "Practice Exercises",
          "Additional Reading Materials",
        ],
      },
    ],
  },
  {
    title: "Assessments & Certification",
    icon: Award,
    color: "#FF9F1C",
    items: [
      {
        q: "Are there assessments to test my progress?",
        a: "Yes. The platform includes quizzes, practice questions, and assessments across multiple formats — such as MCQ, true/false, match the list, and cloze — to evaluate your learning progress.",
      },
      {
        q: "Will I receive a certificate?",
        a: "Yes. You can earn badges for completing milestones and challenges as you progress.",
      },
      // {
      //   q: "Are the certificates verifiable?",
      //   a: "Yes. Digital certificates and badges are linked to your account and progress history.",
      // },
    ],
  },
  {
    title: "Payments",
    icon: CreditCard,
    color: "#F4736E",
    items: [
      {
        q: "What payment methods are accepted?",
        intro: "We accept secure online payments through:",
        bullets: ["UPI", "Debit Cards", "Credit Cards", "Net Banking", "Digital Wallets"],
      },
      {
        q: "Is my payment secure?",
        a: "Yes. Payments are processed through trusted payment gateways with industry-standard security and encryption.",
      },
      // {
      //   q: "Can I pay in installments?",
      //   a: "Installment options may be available for selected subscription plans. Details are provided during checkout.",
      // },
    ],
  },
  {
    title: "Refunds & Cancellations",
    icon: RotateCcw,
    color: "#4ECDC4",
    items: [
      {
        q: "Can I cancel my subscription?",
        a: "Cancellation requests are handled according to our subscription cancellation policy.",
      },
      {
        q: "Will I receive a refund?",
        a: "Refund eligibility depends on your plan, cancellation timing, and Edify Eight's refund policy.",
      },
    ],
  },
  {
    title: "Account",
    icon: UserCog,
    color: "#FF9F1C",
    items: [
      {
        q: "How do I update my profile?",
        a: "You can edit your personal information, contact details, and learning preferences through your account settings.",
      },
      {
        q: "I forgot my password. What should I do?",
        a: "Click Forgot Password on the login page and follow the instructions sent to your registered email.",
      },
      {
        q: "Can I access my account on mobile devices?",
        a: "Yes. Edify Eight is designed to work across desktops, tablets, and smartphones for a seamless learning experience.",
      },
    ],
  },
  {
    title: "Support",
    icon: LifeBuoy,
    color: "#F4736E",
    items: [
      {
        q: "How can I contact Edify Eight?",
        intro: "You can reach us through:",
        bullets: ["Contact Us page", "Email Support"],
      },
      {
        q: "What should I do if I face technical issues?",
        a: "If you're experiencing login problems, payment issues, or difficulty accessing your content, contact our support team with relevant details, and we'll assist you promptly.",
      },
      {
        q: "Can I get career guidance?",
        a: "Yes. Selected premium plans include career guidance, mentorship, and professional development resources.",
      },
    ],
  },
];

function FAQItem({ item, color, isOpen, onToggle }) {
  return (
    <details
      open={isOpen}
      onToggle={(e) => onToggle(e.target.open)}
      className="group rounded-3xl border-2 border-slate-100 bg-[#FFFDF7] shadow-sm overflow-hidden"
    >
      <summary className="flex list-none cursor-pointer items-center justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5">
        <span className="font-bold text-slate-900 text-[15px] sm:text-base">{item.q}</span>
        <span
          className="material-symbols-outlined shrink-0 rounded-full p-1 text-white transition-transform duration-300 group-open:rotate-180"
          style={{ background: color }}
        >
          expand_more
        </span>
      </summary>
      <div className="border-t border-slate-100 px-5 pb-5 pt-4 text-sm leading-relaxed text-slate-600 sm:px-6">
        {item.intro && <p className="mb-2">{item.intro}</p>}
        {Array.isArray(item.bullets) && (
          <ul className="mb-2 list-disc space-y-1 pl-5">
            {item.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        )}
        {item.outro && <p>{item.outro}</p>}
        {item.a && <p>{item.a}</p>}
      </div>
    </details>
  );
}

export default function FAQPage() {
  const [query, setQuery] = useState("");
  const [openKey, setOpenKey] = useState("General-0");

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CATEGORIES;

    return CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => {
        const haystack = [item.q, item.intro, item.outro, item.a, ...(item.bullets || [])]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      }),
    })).filter((cat) => cat.items.length > 0);
  }, [query]);

  const totalResults = filteredCategories.reduce((sum, cat) => sum + cat.items.length, 0);

  return (
    <div className="bg-white text-blue-950">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Balsamiq+Sans:wght@400;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
      `}</style>

      {/* Header */}
      <section className="relative overflow-hidden bg-[radial-gradient(1200px_600px_at_90%_-10%,rgba(59,130,246,0.08),transparent_60%),radial-gradient(900px_500px_at_10%_110%,rgba(234,179,8,0.10),transparent_60%)] py-14 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FFD23F]/40 bg-[#FFD23F]/10 px-4 py-1.5 text-sm font-bold text-slate-700">
            <MessageCircleQuestion className="h-4 w-4" style={{ color: "#FFD23F" }} />
            FAQ
          </div>
          <h1
            className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl md:text-5xl"
            style={{ fontFamily: "'Balsamiq Sans', cursive" }}
          >
            Frequently Asked Questions
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-blue-900/80 sm:text-base">
            Everything you need to know about learning, enrolling, and growing with Edify Eight.
          </p>

          <div className="relative mx-auto mt-8 max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search questions..."
              className="w-full rounded-full border-2 border-slate-100 bg-white py-3.5 pl-12 pr-5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#F4736E]/40 focus:ring-2 focus:ring-[#F4736E]/15"
            />
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          {query.trim() && (
            <p className="mb-6 text-sm font-semibold text-slate-500">
              {totalResults} result{totalResults === 1 ? "" : "s"} for &ldquo;{query.trim()}&rdquo;
            </p>
          )}

          {filteredCategories.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-slate-200 py-16 text-center text-slate-500">
              No questions matched your search. Try a different keyword.
            </div>
          ) : (
            <div className="space-y-12">
              {filteredCategories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <div key={cat.title}>
                    <div className="mb-5 flex items-center gap-3">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
                        style={{ background: cat.color }}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{cat.title}</h2>
                    </div>

                    <div className="space-y-4">
                      {cat.items.map((item, i) => {
                        const key = `${cat.title}-${i}`;
                        return (
                          <motion.div
                            key={key}
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-40px" }}
                            transition={{ duration: 0.35, delay: Math.min(i, 4) * 0.05 }}
                          >
                            <FAQItem
                              item={item}
                              color={cat.color}
                              isOpen={openKey === key}
                              onToggle={(open) => setOpenKey(open ? key : null)}
                            />
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-16 rounded-3xl border-2 border-slate-100 bg-slate-50 px-6 py-8 text-center sm:px-10">
            <h3 className="text-lg font-bold text-slate-900 sm:text-xl">Still have questions?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Can't find the answer you're looking for? Our support team is happy to help.
            </p>
            <Link
              to="/contact-us"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#F4736E] px-6 py-3 text-sm font-bold text-white shadow-[0_4px_0_0_#c9443e] transition-all hover:bg-[#e85e58] active:translate-y-1 active:shadow-none"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
