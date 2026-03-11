import React from "react";

export default function StatsStripSection() {
  return (
    <div className="bg-[#0B1C47] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
        <div>
          <div className="text-5xl font-black mb-2 text-[#FFD23F]" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
            50k+
          </div>
          <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">
            Mini Geniuses
          </div>
        </div>
        <div>
          <div className="text-5xl font-black mb-2 text-[#FF6B6B]" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
            10k+
          </div>
          <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">
            Magic Papers
          </div>
        </div>
        <div>
          <div className="text-5xl font-black mb-2 text-[#4ECDC4]" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
            3-10
          </div>
          <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">
            Grade Heroes
          </div>
        </div>
        <div>
          <div className="text-5xl font-black mb-2 text-[#6C63FF]" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
            98%
          </div>
          <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">
            Smile Rate
          </div>
        </div>
      </div>
    </div>
  );
}
