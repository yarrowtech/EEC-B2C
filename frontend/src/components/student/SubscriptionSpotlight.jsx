import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const SubscriptionSpotlight = ({ subscriptionType, subscriptionInfo }) => {
  const navigate = useNavigate();
  const isPaid =
    subscriptionType &&
    subscriptionType.toLowerCase() !== 'none' &&
    subscriptionType.toLowerCase() !== '';

  const planName = isPaid
    ? subscriptionType.charAt(0).toUpperCase() + subscriptionType.slice(1) + ' Plan'
    : 'Free Plan';

  const planSubtitle = isPaid
    ? 'Active subscription'
    : 'Upgrade to unlock all features';

  const iconClass = isPaid
    ? 'bg-[#4ecdc4]/15 text-[#4ecdc4]'
    : 'bg-slate-100 text-slate-400';

  const iconName = isPaid ? 'workspace_premium' : 'account_circle';

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
      <h4 className="font-extrabold flex items-center gap-2 text-slate-800 mb-4 text-sm">
        <span className="material-symbols-outlined text-[#a29bfe] text-xl">workspace_premium</span>
        Plan Spotlight
      </h4>

      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconClass}`}
        >
          <span className="material-symbols-outlined">{iconName}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-800 text-sm">{planName}</div>
          <div className="text-xs text-slate-500 mt-0.5">{planSubtitle}</div>
        </div>
        <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
      </div>

      <button
        onClick={() => navigate('/dashboard/packages')}
        className="w-full py-2.5 rounded-xl bg-[#a29bfe]/10 text-[#a29bfe] font-bold text-sm hover:bg-[#a29bfe] hover:text-white transition-colors"
      >
        {isPaid ? 'Manage Plan' : 'Upgrade Plan'}
      </button>
    </div>
  );
};

export default SubscriptionSpotlight;
