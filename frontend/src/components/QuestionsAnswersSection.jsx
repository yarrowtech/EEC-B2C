import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const FAQS = [
  {
    q: "What is Edify Eight?",
    a: "Edify Eight is a self-learning platform for individual students. It helps you practice, prepare and improve through exam-style questions, self-study materials all at your own pace, with no fixed schedules or classes to enroll in.",
    color: "#FFD23F",
    open: true,
  },
  {
    q: "Who can join Edify Eight?",
    a: "Edify Eight is open to school students class 3 to 10.",
    color: "#F4736E",
  },
  {
    q: "Can I learn at my own pace?",
    a: "Yes. Edify Eight is fully self-paced — there are no fixed schedules or live classes, so you can practice and study whenever it suits you.",
    color: "#4ECDC4",
  },
  {
    q: "Will I receive a certificate?",
    a: "Yes. You can earn badges for completing milestones and challenges as you progress.",
    color: "#6C63FF",
  },
  {
    q: "Is my payment secure?",
    a: "Yes. Payments are processed through trusted payment gateways with industry-standard security and encryption.",
    color: "#FF9F1C",
  },
  {
    q: "Can I access my account on mobile devices?",
    a: "Yes. Edify Eight is designed to work across desktops, tablets, and smartphones for a seamless learning experience.",
    color: "#F4736E",
  },
];

export default function QuestionsAnswersSection() {
  return (
    <section className="py-16 md:py-24 bg-white overflow-hidden relative">
      <div className="pointer-events-none absolute -top-16 right-0 w-64 h-64 rounded-full bg-[#FFD23F]/10 blur-3xl" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FFD23F]/40 bg-[#FFD23F]/10 px-4 py-1.5 text-sm font-bold text-slate-700 mb-4">
            <span
              className="material-symbols-outlined text-base"
              style={{ color: "#FFD23F", fontVariationSettings: "'FILL' 1,'wght' 700,'GRAD' 0,'opsz' 24" }}
            >
              help
            </span>
            FAQ
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold text-center text-slate-900"
            style={{ fontFamily: "'Balsamiq Sans', cursive" }}
          >
            Got Questions?{" "}
            <span className="text-[#FFD23F]">We Have Answers!</span>
          </h2>
        </motion.div>

        <div className="space-y-4">
          {FAQS.map((faq, i) => (
            <motion.details
              key={faq.q}
              className="group bg-[#FFFDF7] rounded-4xl border-2 border-slate-100 shadow-sm overflow-hidden"
              open={faq.open}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.45 }}
            >
              <summary className="flex justify-between items-center px-6 py-5 cursor-pointer font-bold list-none text-base text-slate-900 gap-4">
                <span>{faq.q}</span>
                <span
                  className="material-symbols-outlined group-open:rotate-180 transition-transform duration-300 shrink-0 text-white p-1 rounded-full"
                  style={{ background: faq.color }}
                >
                  expand_more
                </span>
              </summary>
              <div className="px-6 pb-6 text-slate-600 font-medium leading-relaxed text-sm border-t border-slate-100 pt-4">
                {faq.a}
              </div>
            </motion.details>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/faq"
            className="inline-flex items-center gap-2 rounded-full border-2 border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-[#F4736E]/40 hover:text-[#F4736E]"
          >
            View All FAQs
            <span
              className="material-symbols-outlined text-base"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 700, 'GRAD' 0, 'opsz' 24" }}
            >
              arrow_forward
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
