import React from "react";

export default function FeatureCardsSection() {
  return (
    <section className="py-24 bg-[#FFD23F]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <div className="p-10 bg-white rounded-[2.5rem] border-b-8 border-[#FF6B6B] shadow-lg hover:translate-y-[-10px] transition-all">
            <div className="mb-6 inline-block p-4 bg-[#FF6B6B]/10 rounded-3xl">
              <span className="material-symbols-outlined text-5xl text-[#FF6B6B]">extension</span>
            </div>
            <h4 className="text-2xl font-bold mb-4 text-slate-900" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
              One Piece at a Time
            </h4>
            <p className="text-slate-600 font-medium">
              Focus on one chapter like a puzzle piece until the whole picture is
              clear!
            </p>
          </div>

          <div className="p-10 bg-white rounded-[2.5rem] border-b-8 border-[#4ECDC4] shadow-lg hover:translate-y-[-10px] transition-all">
            <div className="mb-6 inline-block p-4 bg-[#4ECDC4]/10 rounded-3xl">
              <span className="material-symbols-outlined text-5xl text-[#4ECDC4]">verified_user</span>
            </div>
            <h4 className="text-2xl font-bold mb-4 text-slate-900" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
              Teacher&apos;s Favorites
            </h4>
            <p className="text-slate-600 font-medium">
              100% aligned with CBSE, ICSE, and State Boards. Just like what&apos;s in
              school!
            </p>
          </div>

          <div className="p-10 bg-white rounded-[2.5rem] border-b-8 border-[#FFD23F] shadow-lg hover:translate-y-[-10px] transition-all">
            <div className="mb-6 inline-block p-4 bg-[#FFD23F]/10 rounded-3xl">
              <span className="material-symbols-outlined text-5xl text-[#FFD23F]">fitness_center</span>
            </div>
            <h4 className="text-2xl font-bold mb-4 text-slate-900" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
              Choose Your Level
            </h4>
            <p className="text-slate-600 font-medium">
              From &apos;Easy Peasy&apos; to &apos;Super Challenging&apos; - we grow as you grow!
            </p>
          </div>

          <div className="p-10 bg-white rounded-[2.5rem] border-b-8 border-[#6C63FF] shadow-lg hover:translate-y-[-10px] transition-all">
            <div className="mb-6 inline-block p-4 bg-[#6C63FF]/10 rounded-3xl">
              <span className="material-symbols-outlined text-5xl text-[#6C63FF]">print</span>
            </div>
            <h4 className="text-2xl font-bold mb-4 text-slate-900" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
              Real-World Paper
            </h4>
            <p className="text-slate-600 font-medium">
              Download and print our beautiful PDFs. Great for drawing and solving!
            </p>
          </div>

          <div className="p-10 bg-white rounded-[2.5rem] border-b-8 border-pink-500 shadow-lg hover:translate-y-[-10px] transition-all">
            <div className="mb-6 inline-block p-4 bg-pink-500/10 rounded-3xl">
              <span className="material-symbols-outlined text-5xl text-pink-500">lightbulb</span>
            </div>
            <h4 className="text-2xl font-bold mb-4 text-slate-900" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
              A-ha! Moments
            </h4>
            <p className="text-slate-600 font-medium">
              Not just answers, but &quot;how-to&quot; guides that make you go &quot;Oh, now I
              get it!&quot;
            </p>
          </div>

          <div className="p-10 bg-white rounded-[2.5rem] border-b-8 border-orange-500 shadow-lg hover:translate-y-[-10px] transition-all">
            <div className="mb-6 inline-block p-4 bg-orange-500/10 rounded-3xl">
              <span className="material-symbols-outlined text-5xl text-orange-500">auto_awesome</span>
            </div>
            <h4 className="text-2xl font-bold mb-4 text-slate-900" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
              Fresh Surprises
            </h4>
            <p className="text-slate-600 font-medium">
              New quests and papers added every single week to keep the fun alive.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
