import React from "react";

export default function StudyGrumpySection() {
  return (
    <section className="py-24 bg-white relative">
      <div className="absolute top-0 left-0 w-full h-12 bg-[#FEF4E8] rounded-b-[100%]"></div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2
            className="text-4xl lg:text-6xl font-bold mb-6 text-slate-900"
            style={{ fontFamily: "'Balsamiq Sans', cursive" }}
          >
            Is Studying Getting{" "}
            <span className="text-[#FF6B6B] underline decoration-[#FFD23F] underline-offset-8">
              A Bit Grumpy?
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium">
            We turn those study-frowns upside down with tools that actually make
            sense!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="bg-[#FFFDF7] p-10 rounded-[2rem] shadow-sm hover:shadow-2xl transition-all border-4 border-transparent hover:border-[#FF6B6B] group text-center">
            <div className="w-20 h-20 bg-[#FF6B6B]/10 text-[#FF6B6B] rounded-full flex items-center justify-center mb-8 mx-auto group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-5xl">sentiment_dissatisfied</span>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-slate-900" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
              The "Boring" Search
            </h3>
            <p className="text-slate-600 font-medium">
              No more endless scrolling through dusty old websites looking for
              practice papers.
            </p>
          </div>

          <div className="bg-[#FFFDF7] p-10 rounded-[2rem] shadow-sm hover:shadow-2xl transition-all border-4 border-transparent hover:border-[#4ECDC4] group text-center">
            <div className="w-20 h-20 bg-[#4ECDC4]/10 text-[#4ECDC4] rounded-full flex items-center justify-center mb-8 mx-auto group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-5xl">mystery</span>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-slate-900" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
              Confusing Puzzles
            </h3>
            <p className="text-slate-600 font-medium">
              Textbooks can be like secret codes. We give you the key to unlock
              every chapter!
            </p>
          </div>

          <div className="bg-[#FFFDF7] p-10 rounded-[2rem] shadow-sm hover:shadow-2xl transition-all border-4 border-transparent hover:border-[#FFD23F] group text-center">
            <div className="w-20 h-20 bg-[#FFD23F]/15 text-[#FFD23F] rounded-full flex items-center justify-center mb-8 mx-auto group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-5xl">alarm_off</span>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-slate-900" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
              Clock Crushing
            </h3>
            <p className="text-slate-600 font-medium">
              Struggling to finish on time? Our fun mock tests help you race the
              clock and win!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
