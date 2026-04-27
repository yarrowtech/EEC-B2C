import React from "react";

export default function VictoryPathSection() {
  return (
    <section className="py-24 overflow-hidden bg-[#FEF4E8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2
            className="text-4xl lg:text-6xl font-bold mb-6 text-slate-900"
            style={{ fontFamily: "'Balsamiq Sans', cursive" }}
          >
            Your 3-Step <span className="text-[#4ECDC4]">Victory Path</span>
          </h2>
        </div>

        <div className="relative flex flex-col md:flex-row justify-between items-center md:items-start gap-16">
          <div className="pointer-events-none absolute left-0 right-0 top-24 z-0 hidden md:block">
            <svg
              className="w-full h-10"
              viewBox="0 0 1200 40"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M20 20 H1180"
                fill="none"
                stroke="#FFD23F"
                opacity="0.75"
                strokeWidth="8"
                strokeDasharray="14 18"
                strokeLinecap="round"
              />
              <path d="M8 20 L18 14 L18 26 Z" fill="#FFD23F" opacity="0.75" />
              <path d="M1192 20 L1182 14 L1182 26 Z" fill="#FFD23F" opacity="0.75" />
            </svg>
          </div>

          <div className="flex flex-col items-center text-center max-w-xs w-full">
            <div className="relative mb-10">
              <div
                className="w-32 h-32 bg-[#FFD23F] rounded-[2.5rem] flex items-center justify-center text-5xl font-black text-slate-900 shadow-xl rotate-[-6deg] hover:rotate-0 transition-transform"
                style={{ fontFamily: "'Balsamiq Sans', cursive" }}
              >
                1
              </div>
              <div className="absolute -bottom-4 -right-4 bg-white p-3 rounded-2xl shadow-lg">
                <span className="material-symbols-outlined text-[#FF6B6B] text-3xl">map</span>
              </div>
            </div>
            <h4 className="text-2xl font-bold mb-4 text-slate-900" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
              Pick Your Map
            </h4>
            <p className="text-slate-600 font-medium">
              Tell us your Board and Class. We&apos;ll show you the perfect treasure
              trove of content!
            </p>
          </div>

          <div className="flex flex-col items-center text-center max-w-xs w-full">
            <div className="relative mb-10">
              <div
                className="w-32 h-32 bg-[#4ECDC4] rounded-[2.5rem] flex items-center justify-center text-5xl font-black text-slate-900 shadow-xl rotate-[6deg] hover:rotate-0 transition-transform"
                style={{ fontFamily: "'Balsamiq Sans', cursive" }}
              >
                2
              </div>
              <div className="absolute -bottom-4 -right-4 bg-white p-3 rounded-2xl shadow-lg">
                <span className="material-symbols-outlined text-[#FFD23F] text-3xl">download_for_offline</span>
              </div>
            </div>
            <h4 className="text-2xl font-bold mb-4 text-slate-900" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
              Grab Your Gear
            </h4>
            <p className="text-slate-600 font-medium">
              Download colorful Smart PDFs with expert solutions that act like a
              friendly guide.
            </p>
          </div>

          <div className="flex flex-col items-center text-center max-w-xs w-full">
            <div className="relative mb-10">
              <div
                className="w-32 h-32 bg-[#6C63FF] rounded-[2.5rem] flex items-center justify-center text-5xl font-black shadow-xl rotate-[-3deg] hover:rotate-0 transition-transform text-white"
                style={{ fontFamily: "'Balsamiq Sans', cursive" }}
              >
                3
              </div>
              <div className="absolute -bottom-4 -right-4 bg-white p-3 rounded-2xl shadow-lg">
                <span className="material-symbols-outlined text-[#4ECDC4] text-3xl">workspace_premium</span>
              </div>
            </div>
            <h4 className="text-2xl font-bold mb-4 text-slate-900" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
              Win the Game!
            </h4>
            <p className="text-slate-600 font-medium">
              Practice with joy and see your scores soar like a rocket to the
              moon!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
