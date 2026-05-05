import React from "react";
import { motion } from "framer-motion";

const FAQS = [
  {
    q: "What is Edify Eight and who is it for?",
    a: "Edify Eight is an adaptive learning platform for students in Grades 3–10. It supports CBSE, ICSE, IB, and State Board syllabi. Teachers can upload materials and questions, while students practice, track progress, and compete on the leaderboard.",
    color: "#FFD23F",
    open: true,
  },
  {
    q: "Is the content aligned with the latest syllabus?",
    a: "Yes! Our team of qualified teachers continuously updates the question bank and study materials to stay aligned with the latest board guidelines for CBSE, ICSE, and IB curricula.",
    color: "#F4736E",
  },
  {
    q: "What types of questions are available?",
    a: "We support 8+ question types — MCQ (single & multiple answer), True/False, Match the List, Choice Matrix, Cloze (fill-in-the-blank), Essay, and more. Each question is tagged by subject, topic, board, grade, and difficulty stage.",
    color: "#4ECDC4",
  },
  {
    q: "How does the Daily Challenge work?",
    a: "Every day, a new question is unlocked based on your board and grade. Answer it correctly to maintain your streak and earn badges. Miss a day and your streak resets — so stay consistent!",
    color: "#6C63FF",
  },
  {
    q: "Can I track my weak areas?",
    a: "Absolutely. After each practice session, the platform automatically identifies the topics where you're struggling most and surfaces them in your Weak Areas Auto-Revision section so you can focus your effort where it counts.",
    color: "#FF9F1C",
  },
  {
    q: "Is Edify Eight free to use?",
    a: "Yes — you can sign up for free and access a range of features immediately. Premium subscription packages are also available for students and schools that want full access to all content, analytics, and advanced features.",
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
      </div>
    </section>
  );
}
