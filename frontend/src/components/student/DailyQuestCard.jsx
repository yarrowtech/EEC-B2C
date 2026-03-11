import React from 'react';
import { useNavigate } from 'react-router-dom';

const DailyQuestCard = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#e7c555]/10 rounded-3xl p-6 border-2 border-dashed border-[#e7c555] relative overflow-hidden">
      <div className="relative z-10 flex flex-col gap-4">
        <span className="bg-[#e7c555] px-3 py-1 rounded-full text-slate-900 text-xs font-black uppercase self-start">
          Daily Quest
        </span>
        <h3 className="text-2xl font-black leading-tight text-slate-900">
          Start Your Next Challenge!
        </h3>
        <p className="text-sm text-slate-600 font-medium">
          Explore topics and earn bonus points by completing tryouts today!
        </p>
        <button
          onClick={() => navigate('/dashboard/syllabus?stage=1')}
          className="w-full bg-[#e7c555] py-3 rounded-full font-black shadow-lg shadow-[#e7c555]/30 hover:scale-[1.02] transition-transform text-slate-900"
        >
          Start Adventure
        </button>
      </div>
      <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-9xl text-[#e7c555]/20 -rotate-12 select-none pointer-events-none">
        rocket
      </span>
    </div>
  );
};

export default DailyQuestCard;
