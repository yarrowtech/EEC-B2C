// src/components/EECFAQ.jsx
// Upgraded FAQ — cooler, more modern & polished
// • Two-column responsive grid
// • Conic gradient ring + hover lift
// • Smooth expand using CSS grid row trick (no extra libs)
// • Accessible buttons with aria attributes

import { useState } from "react";
import { ChevronDown, PlayCircle, WifiOff, GraduationCap, Gift, BarChart3, ShieldCheck } from "lucide-react";

const faqs = [
  { q: "Is EEC a video-based app?", a: "No. EEC uses smart text and audio to teach – no long videos.", icon: PlayCircle },
  { q: "Can I use it offline?", a: "Not yet. EEC requires active internet for accurate AI functioning.", icon: WifiOff },
  { q: "What grades does it support?", a: "From Class 1 to Class 12.", icon: GraduationCap },
  { q: "How much is free?", a: "The first 5 stages are completely free.", icon: Gift },
  { q: "Can parents track progress?", a: "Yes. Every account includes a Parent Dashboard.", icon: BarChart3 },
  { q: "Is my data safe with EEC?", a: "Absolutely. All user data is encrypted and securely stored on cloud servers.", icon: ShieldCheck },
];


function Ring() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-[24px] p-[1.5px] [background:conic-gradient(var(--tw-gradient-stops))] from-yellow-400 via-blue-400 to-indigo-500 opacity-70"
      style={{
        mask: "linear-gradient(#000,#000) content-box,linear-gradient(#000,#000)",
        WebkitMask: "linear-gradient(#000,#000) content-box,linear-gradient(#000,#000)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
      }}
    />
  );
}

export default function EECFAQ() {
  const [open, setOpen] = useState(null);
  const toggle = (i) => setOpen(open === i ? null : i);

  return (
    <section className="relative overflow-hidden bg-[radial-gradient(1200px_600px_at_90%_-10%,rgba(59,130,246,0.08),transparent_60%),radial-gradient(900px_500px_at_10%_110%,rgba(234,179,8,0.10),transparent_60%)] py-16">
      {/* soft background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-[-10%] h-[420px] w-[420px] rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(50% 50% at 50% 50%, rgba(59,130,246,0.18) 0%, rgba(99,102,241,0.12) 40%, transparent 70%)" }}
      />

      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-blue-950 md:text-4xl">FAQ – Frequently Asked Questions</h2>
          <p className="mt-3 text-blue-900/80">Quick answers to common questions about how EEC works.</p>
        </div>

        {/* grid */}
        <div className="grid gap-5 sm:grid-cols-2">
          {faqs.map((faq, i) => {
            const Icon = faq.icon;
            const isOpen = open === i;
            return (
              <div key={i} className="relative">
                <article className="relative isolate rounded-[24px] border border-blue-100/70 bg-white/70 shadow-[0_18px_60px_rgba(2,32,71,0.10)] backdrop-blur-md transition-transform duration-300 hover:-translate-y-[2px]">
                  <Ring />

                  {/* clickable header */}
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    onClick={() => toggle(i)}
                    className="flex w-full items-center gap-3 rounded-[24px] px-5 py-5 text-left"
                  >
                    <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-yellow-100 to-blue-50 text-blue-900 shadow-sm">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="flex-1">
                      <h3 className="text-base font-semibold leading-tight text-blue-950">Q. {faq.q}</h3>
                    </span>
                    <ChevronDown className={`h-5 w-5 text-blue-700 transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`} />
                  </button>

                  {/* answer */}
                  <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`} id={`faq-panel-${i}`}>
                    <div className="overflow-hidden px-5 pb-5">
                      <p className="text-[15px] leading-relaxed text-blue-900/85">{faq.a}</p>
                    </div>
                  </div>

                  {/* bottom accent stripe */}
                  <div className="pointer-events-none h-[3px] w-full rounded-b-[24px] bg-gradient-to-r from-yellow-100 via-white to-sky-100" />
                </article>
              </div>
            );
          })}
        </div>
      </div>

      {/* bottom decorative curve */}
      <div className="pointer-events-none mt-14 h-16">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="h-full w-full">
          <path fill="currentColor" className="text-white" d="M0,64L48,58.7C96,53,192,43,288,48C384,53,480,75,576,80C672,85,768,75,864,58.7C960,43,1056,21,1152,21.3C1248,21,1344,43,1392,53.3L1440,64V120H0Z" />
        </svg>
      </div>
    </section>
  );
}
