import React from 'react';

const AdventureStatCard = ({ title, value, icon, accentColor }) => {
  const colorMap = {
    coral: {
      highlighted: false,
      bg: 'bg-[#ff6b6b]/15',
      text: 'text-[#ff6b6b]',
      border: 'border border-slate-100',
    },
    teal: {
      highlighted: true,
      bg: 'bg-[#4ecdc4]/15',
      text: 'text-[#4ecdc4]',
      border: 'border-2 border-[#4ecdc4]',
    },
    primary: {
      highlighted: false,
      bg: 'bg-[#e7c555]/15',
      text: 'text-[#e7c555]',
      border: 'border border-slate-100',
    },
    purple: {
      highlighted: true,
      bg: 'bg-[#a29bfe]/15',
      text: 'text-[#a29bfe]',
      border: 'border-2 border-[#a29bfe]',
    },
  };

  const colors = colorMap[accentColor] || colorMap.primary;

  return (
    <div className={`bg-white p-5 rounded-2xl ${colors.border} shadow-sm hover:shadow-md transition-all hover:scale-[1.02] cursor-default`}>
      <div className={`w-10 h-10 ${colors.bg} rounded-xl flex items-center justify-center ${colors.text} mb-3`}>
        {icon}
      </div>
      <h4 className="text-3xl font-black text-slate-900">{value}</h4>
      <p className="text-sm font-bold text-slate-500 mt-0.5">{title}</p>
    </div>
  );
};

export default AdventureStatCard;
