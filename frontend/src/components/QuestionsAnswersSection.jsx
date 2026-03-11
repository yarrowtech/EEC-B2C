import React from "react";

export default function QuestionsAnswersSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2
          className="text-4xl font-bold text-center mb-12 text-slate-900"
          style={{ fontFamily: "'Balsamiq Sans', cursive" }}
        >
          Got Questions? We Have <span className="text-[#FFD23F]">Answers!</span>
        </h2>

        <div className="space-y-6">
          <details
            className="group bg-[#FFFDF7] rounded-[2rem] border-2 border-slate-100 shadow-sm overflow-hidden"
            open
          >
            <summary className="flex justify-between items-center p-8 cursor-pointer font-bold list-none text-lg text-slate-900">
              Is this the latest 2024-25 syllabus?
              <span className="material-symbols-outlined group-open:rotate-180 transition-transform bg-[#FFD23F] text-white p-1 rounded-full">
                expand_more
              </span>
            </summary>
            <div className="px-8 pb-8 text-slate-600 font-medium">
              Yes, absolutely! Our team of teacher-wizards works day and night to
              make sure every question is perfectly aligned with the newest board
              guidelines. No old stuff here!
            </div>
          </details>

          <details className="group bg-[#FFFDF7] rounded-[2rem] border-2 border-slate-100 shadow-sm overflow-hidden">
            <summary className="flex justify-between items-center p-8 cursor-pointer font-bold list-none text-lg text-slate-900">
              Can we print the papers for a real experience?
              <span className="material-symbols-outlined group-open:rotate-180 transition-transform bg-[#FF6B6B] text-white p-1 rounded-full">
                expand_more
              </span>
            </summary>
            <div className="px-8 pb-8 text-slate-600 font-medium">
              You bet! Every paper is a high-quality PDF. Print them out, get
              your favorite pen, and practice just like a real exam. It&apos;s the
              best way to train your brain!
            </div>
          </details>

          <details className="group bg-[#FFFDF7] rounded-[2rem] border-2 border-slate-100 shadow-sm overflow-hidden">
            <summary className="flex justify-between items-center p-8 cursor-pointer font-bold list-none text-lg text-slate-900">
              What if we get stuck on a hard level?
              <span className="material-symbols-outlined group-open:rotate-180 transition-transform bg-[#4ECDC4] text-white p-1 rounded-full">
                expand_more
              </span>
            </summary>
            <div className="px-8 pb-8 text-slate-600 font-medium">
              Don&apos;t worry, every explorer gets stuck sometimes! Our Scholar
              plan gives you access to Expert Help. Just send a flare, and our
              teachers will guide you through the solution!
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}
