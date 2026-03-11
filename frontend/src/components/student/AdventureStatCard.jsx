import React from 'react';

const AdventureStatCard = ({ title, value, icon, accentColor }) => {
  const colorMap = {
    coral: {
      border: 'border-[#ff6b6b]',
      bg: 'bg-[#ff6b6b]/20',
      text: 'text-[#ff6b6b]'
    },
    teal: {
      border: 'border-[#4ecdc4]',
      bg: 'bg-[#4ecdc4]/20',
      text: 'text-[#4ecdc4]'
    },
    primary: {
      border: 'border-[#e7c555]',
      bg: 'bg-[#e7c555]/20',
      text: 'text-[#e7c555]'
    },
    purple: {
      border: 'border-[#a29bfe]',
      bg: 'bg-[#a29bfe]/20',
      text: 'text-[#a29bfe]'
    }
  };

  const colors = colorMap[accentColor] || colorMap.primary;

  return (
    <div className={`bg-white p-5 rounded-2xl border-b-4 ${colors.border} border-r border-l border-t border-[#e7c555]/10 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] cursor-default`}>
      <div className={`w-10 h-10 ${colors.bg} rounded-xl flex items-center justify-center ${colors.text} mb-3`}>
        {icon}
      </div>
      <h4 className="text-3xl font-black text-slate-900">{value}</h4>
      <p className="text-sm font-bold text-slate-500">{title}</p>
    </div>
  );
};

export default AdventureStatCard;
