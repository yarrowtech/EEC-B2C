import React from 'react';

/* Unique decorative SVG per card type */
function FlameDecor() {
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" fill="none" className="opacity-20">
      <path d="M45 8 C45 8 62 24 62 42 C62 55 54 62 45 64 C36 62 28 55 28 42 C28 30 36 20 40 14 C38 26 44 32 44 32 C44 32 52 24 45 8Z" fill="white"/>
      <path d="M45 38 C45 38 52 44 52 52 C52 59 49 63 45 64 C41 63 38 59 38 52 C38 46 42 40 44 38 C43 44 46 46 46 46 C46 46 49 42 45 38Z" fill="white" opacity="0.6"/>
    </svg>
  );
}

function TargetDecor() {
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" fill="none" className="opacity-20">
      <circle cx="45" cy="45" r="38" stroke="white" strokeWidth="4"/>
      <circle cx="45" cy="45" r="26" stroke="white" strokeWidth="4"/>
      <circle cx="45" cy="45" r="14" stroke="white" strokeWidth="4"/>
      <circle cx="45" cy="45" r="5" fill="white"/>
      <line x1="45" y1="7" x2="45" y2="0" stroke="white" strokeWidth="3" strokeLinecap="round"/>
      <line x1="45" y1="90" x2="45" y2="83" stroke="white" strokeWidth="3" strokeLinecap="round"/>
      <line x1="7" y1="45" x2="0" y2="45" stroke="white" strokeWidth="3" strokeLinecap="round"/>
      <line x1="90" y1="45" x2="83" y2="45" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

function ChecklistDecor() {
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" fill="none" className="opacity-20">
      <rect x="12" y="18" width="66" height="16" rx="8" fill="white"/>
      <rect x="12" y="42" width="50" height="16" rx="8" fill="white"/>
      <rect x="12" y="66" width="58" height="16" rx="8" fill="white"/>
      <circle cx="8" cy="26" r="5" fill="white"/>
      <circle cx="8" cy="50" r="5" fill="white"/>
      <circle cx="8" cy="74" r="5" fill="white"/>
      <path d="M4 26 L7 29 L12 22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M4 50 L7 53 L12 46" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

function StarDecor() {
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" fill="none" className="opacity-20">
      <path d="M45 6 L54 32 L82 32 L59 50 L68 76 L45 59 L22 76 L31 50 L8 32 L36 32 Z" fill="white"/>
      <circle cx="45" cy="45" r="6" fill="white" opacity="0.6"/>
      <circle cx="20" cy="20" r="3" fill="white" opacity="0.5"/>
      <circle cx="70" cy="18" r="2" fill="white" opacity="0.4"/>
      <circle cx="72" cy="70" r="3" fill="white" opacity="0.5"/>
      <circle cx="18" cy="68" r="2" fill="white" opacity="0.4"/>
    </svg>
  );
}

const configs = {
  coral: {
    bg: "from-[#FF6B6B] to-[#ff9a9a]",
    shadow: "shadow-[#FF6B6B]/25",
    Decor: FlameDecor,
    label: "🔥",
  },
  teal: {
    bg: "from-[#4ECDC4] to-[#6BE4DC]",
    shadow: "shadow-[#4ECDC4]/25",
    Decor: TargetDecor,
    label: "🎯",
  },
  primary: {
    bg: "from-[#e7c555] to-[#f5d878]",
    shadow: "shadow-[#e7c555]/30",
    Decor: ChecklistDecor,
    label: "✅",
  },
  purple: {
    bg: "from-[#a29bfe] to-[#c4b5fd]",
    shadow: "shadow-[#a29bfe]/25",
    Decor: StarDecor,
    label: "⭐",
  },
};

const AdventureStatCard = ({ title, value, icon, accentColor }) => {
  const cfg = configs[accentColor] || configs.primary;
  const { Decor } = cfg;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${cfg.bg} shadow-lg ${cfg.shadow} hover:shadow-xl hover:scale-[1.03] transition-all duration-300 cursor-default`}
    >
      {/* Dot-grid texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.10]"
        style={{
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />

      {/* Decorative SVG — top-right */}
      <div className="absolute -top-2 -right-2 pointer-events-none select-none">
        <Decor />
      </div>

      {/* Blob accent — bottom-left */}
      <div className="absolute -bottom-5 -left-5 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 p-5">
        {/* Icon bubble */}
        <div className="w-11 h-11 rounded-xl bg-white/25 flex items-center justify-center text-white mb-4 shadow-sm">
          {icon}
        </div>

        {/* Value */}
        <p className="text-3xl font-black text-white leading-none tracking-tight">
          {value}
        </p>

        {/* Title */}
        <p className="mt-1.5 text-sm font-bold text-white/75">{title}</p>
      </div>
    </div>
  );
};

export default AdventureStatCard;
