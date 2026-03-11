import React from "react";

export default function PaprIqFooterSection() {
  return (
    <footer className="relative mt-14 bg-slate-900 pb-20 pt-24 text-slate-300 border-t-8 border-[#FFD23F]">
      <div className="pointer-events-none absolute -top-14 left-0 right-0 h-14 overflow-hidden">
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="block h-full w-full"
          aria-hidden="true"
        >
          <path
            fill="#0f172a"
            d="M0,96L60,80C120,64,240,32,360,37.3C480,43,600,85,720,96C840,107,960,85,1080,74.7C1200,64,1320,64,1380,64L1440,64V120H1380C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120H0Z"
          />
        </svg>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-16">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-[#FFD23F] p-2 rounded-xl rotate-[-3deg] shadow-lg">
                <span className="material-symbols-outlined text-slate-900 text-xl font-bold">auto_stories</span>
              </div>
              <span className="text-2xl font-bold tracking-tight text-white" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
                EEC<span className="text-[#FFD23F]"></span>
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-8 font-medium">
              Empowering India&apos;s next generation of thinkers, leaders, and
              explorers with the most engaging practice materials. Let&apos;s make
              learning fun together!
            </p>
            <div className="flex gap-4">
              <a className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center hover:bg-[#FF6B6B] hover:text-white transition-all" href="#">
                <span className="material-symbols-outlined">star_rate</span>
              </a>
              <a className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center hover:bg-[#4ECDC4] hover:text-white transition-all" href="#">
                <span className="material-symbols-outlined">rocket</span>
              </a>
              <a className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center hover:bg-[#6C63FF] hover:text-white transition-all" href="#">
                <span className="material-symbols-outlined">play_circle</span>
              </a>
            </div>
          </div>

          <div>
            <h5 className="text-white font-bold mb-8 uppercase text-xs tracking-[0.2em]">Map Routes</h5>
            <ul className="space-y-4 text-sm font-medium">
              <li>
                <a className="hover:text-[#FFD23F] transition-colors flex items-center gap-2" href="#">
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  Class 10 CBSE Quests
                </a>
              </li>
              <li>
                <a className="hover:text-[#FFD23F] transition-colors flex items-center gap-2" href="#">
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  ICSE Science Lab
                </a>
              </li>
              <li>
                <a className="hover:text-[#FFD23F] transition-colors flex items-center gap-2" href="#">
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  Math Adventure Notes
                </a>
              </li>
              <li>
                <a className="hover:text-[#FFD23F] transition-colors flex items-center gap-2" href="#">
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  New Syllabus Updates
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-bold mb-8 uppercase text-xs tracking-[0.2em]">Our Base</h5>
            <ul className="space-y-4 text-sm font-medium">
              <li><a className="hover:text-[#FFD23F] transition-colors" href="#">Our Mission</a></li>
              <li><a className="hover:text-[#FFD23F] transition-colors" href="#">Join the Crew</a></li>
              <li><a className="hover:text-[#FFD23F] transition-colors" href="#">Explorer Privacy</a></li>
              <li><a className="hover:text-[#FFD23F] transition-colors" href="#">Quest Rules</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-bold mb-8 uppercase text-xs tracking-[0.2em]">Help Signal</h5>
            <ul className="space-y-4 text-sm font-medium">
              <li><a className="hover:text-[#FFD23F] transition-colors" href="#">Support HQ</a></li>
              <li><a className="hover:text-[#FFD23F] transition-colors" href="#">Talk to a Guide</a></li>
              <li><a className="hover:text-[#FFD23F] transition-colors" href="#">Scholarships</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 text-xs font-bold text-slate-500">
          <p>© 2024 PaprIQ Magic Labs Pvt Ltd. Adventure Awaits!</p>
          <p className="flex items-center gap-2">
            Built with{" "}
            <span className="material-symbols-outlined text-[#FF6B6B] text-sm fill-icon">favorite</span>
            for incredible Indian students
          </p>
        </div>
      </div>
    </footer>
  );
}
