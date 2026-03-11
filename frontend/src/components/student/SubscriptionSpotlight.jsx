import React from 'react';
import { useNavigate } from 'react-router-dom';

const SubscriptionSpotlight = ({ subscriptionType, subscriptionInfo }) => {
  const navigate = useNavigate();
  const isPremium = subscriptionType?.toLowerCase() === 'premium';

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#e7c555]/10 shadow-sm flex flex-col gap-4">
      <h4 className="font-extrabold flex items-center gap-2">
        <span className="material-symbols-outlined text-[#a29bfe]">workspace_premium</span>
        Your Plan
      </h4>

      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-slate-800">
          {subscriptionType?.charAt(0).toUpperCase() + subscriptionType?.slice(1) || 'Free'}
        </span>
        {isPremium ? (
          <span className="px-2 py-1 rounded-full bg-[#4ecdc4]/10 text-[#4ecdc4] text-xs font-black border border-[#4ecdc4]/20">
            Active
          </span>
        ) : (
          <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-black">
            Free Tier
          </span>
        )}
      </div>

      {!isPremium && (
        <>
          <div className="h-px bg-[#e7c555]/10"></div>
          <button
            onClick={() => navigate('/dashboard/packages')}
            className="w-full py-2 rounded-xl bg-[#a29bfe]/10 text-[#a29bfe] font-bold text-sm hover:bg-[#a29bfe] hover:text-white transition-colors"
          >
            Upgrade to Premium
          </button>
        </>
      )}
    </div>
  );
};

export default SubscriptionSpotlight;
