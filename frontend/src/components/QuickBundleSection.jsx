import React from "react";

export default function QuickBundleSection() {
  return (
    <section className="bg-[#FF6B6B] py-20 relative overflow-hidden">
      <div className="absolute -left-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2
          className="text-4xl lg:text-6xl font-black text-white mb-6"
          style={{ fontFamily: "'Balsamiq Sans', cursive" }}
        >
          Quick! Catch the Golden Bundle! 🏃‍♂️💨
        </h2>
        <p className="text-white/90 text-xl mb-10 max-w-2xl mx-auto font-medium">
          Be a fast explorer! Sign up in the next 15 minutes and unlock the
          &quot;Top 100 Secret Exam Questions&quot; PDF instantly!
        </p>
 
        <div className="flex flex-col items-center gap-8">
        {/*<div className="flex gap-6 mb-4">
             <div className="bg-white text-[#FF6B6B] w-24 h-28 rounded-[2rem] flex flex-col items-center justify-center shadow-2xl border-b-8 border-slate-200">
              <span
                className="text-4xl font-black"
                style={{ fontFamily: "'Balsamiq Sans', cursive" }}
              >
                14
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest">
                Minutes
              </span>
            </div>
            <div className="bg-white text-[#FF6B6B] w-24 h-28 rounded-[2rem] flex flex-col items-center justify-center shadow-2xl border-b-8 border-slate-200">
              <span
                className="text-4xl font-black"
                style={{ fontFamily: "'Balsamiq Sans', cursive" }}
              >
                52
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest">
                Seconds
              </span>
            </div>
          </div>
          */}
          <div className="w-full max-w-xl flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              placeholder="Enter your email to claim!"
              className="bg-white flex-grow px-8 py-5 rounded-full border-none focus:ring-4 focus:ring-[#FFD23F] text-lg outline-none"
            />
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("eec:open-login"))}
              className="bg-slate-900 text-white font-black px-10 py-5 rounded-full shadow-xl hover:scale-105 transition-all"
            >
              Gimme My Bundle!
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
