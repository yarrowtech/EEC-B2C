import React from "react";

function Stars() {
  return (
    <div className="flex items-center gap-1 text-[#FFD23F] mb-6">
      <span className="material-symbols-outlined fill-icon">star</span>
      <span className="material-symbols-outlined fill-icon">star</span>
      <span className="material-symbols-outlined fill-icon">star</span>
      <span className="material-symbols-outlined fill-icon">star</span>
      <span className="material-symbols-outlined fill-icon">star</span>
    </div>
  );
}

export default function StarExplorersSection() {
  return (
    <section className="py-24 bg-[#FEF4E8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2
          className="text-4xl lg:text-5xl font-bold text-center mb-20 text-slate-900"
          style={{ fontFamily: "'Balsamiq Sans', cursive" }}
        >
          Stories from our <span className="text-[#6C63FF]">Star Explorers</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          <div className="bg-white p-10 rounded-[3rem] shadow-xl relative border-t-8 border-[#FF6B6B]">
            <div className="absolute top-4 left-5 text-[#FF6B6B] opacity-20">
              <span className="material-symbols-outlined text-7xl">format_quote</span>
            </div>
            <Stars />
            <p className="text-slate-600 mb-8 font-medium italic">
              &quot;My daughter Priya used to hide her Math book! Now she calls it
              &apos;Puzzle Time&apos;. Her scores went from a &apos;yikes&apos; 72 to a
              &apos;wow&apos; 94! Best decision ever.&quot;
            </p>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FF6B6B]/20 flex items-center justify-center text-[#FF6B6B]">
                <span className="material-symbols-outlined text-3xl">woman_2</span>
              </div>
              <div>
                <div className="font-bold text-lg text-slate-900">Mrs. Anjali Sharma</div>
                <div className="text-xs text-slate-400">Proud Mom, Bangalore</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] shadow-xl relative border-t-8 border-[#4ECDC4]">
            <div className="absolute top-4 left-5 text-[#4ECDC4] opacity-20">
              <span className="material-symbols-outlined text-7xl">format_quote</span>
            </div>
            <Stars />
            <p className="text-slate-600 mb-8 font-medium italic">
              &quot;The mock tests are like levels in a game. I practiced so much
              that the actual Board exam felt like just another level. I actually
              finished early!&quot;
            </p>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#4ECDC4]/20 flex items-center justify-center text-[#4ECDC4]">
                <span className="material-symbols-outlined text-3xl">boy</span>
              </div>
              <div>
                <div className="font-bold text-lg text-slate-900">Rohan Gupta</div>
                <div className="text-xs text-slate-400">Class 10 Hero, Mumbai</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] shadow-xl relative border-t-8 border-[#6C63FF]">
            <div className="absolute top-4 left-5 text-[#6C63FF] opacity-20">
              <span className="material-symbols-outlined text-7xl">format_quote</span>
            </div>
            <Stars />
            <p className="text-slate-600 mb-8 font-medium italic">
              &quot;The Science diagrams are so colorful and clear. My son finally
              understands concepts instead of just memorizing them. ICSE prep is
              actually fun now!&quot;
            </p>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#6C63FF]/20 flex items-center justify-center text-[#6C63FF]">
                <span className="material-symbols-outlined text-3xl">man</span>
              </div>
              <div>
                <div className="font-bold text-lg text-slate-900">Mr. Vinay Iyer</div>
                <div className="text-xs text-slate-400">Dad &amp; Coach, Chennai</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
