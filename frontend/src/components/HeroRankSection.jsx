import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function HeroRankSection() {
  const navigate = useNavigate();
  const API =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000";
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function loadPackages() {
      try {
        const res = await fetch(`${API}/api/packages`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || "Failed to fetch packages");
        if (mounted) setPackages(Array.isArray(data?.packages) ? data.packages : []);
      } catch (err) {
        if (mounted) setPackages([]);
      }
    }
    loadPackages();
    return () => {
      mounted = false;
    };
  }, [API]);

  const fallbackPlans = [
    {
      _id: "starter-fallback",
      displayName: "Starter Scout",
      price: 0,
      duration: 0,
      features: [],
    },
    {
      _id: "master-fallback",
      displayName: "Master Scholar",
      price: 199,
      duration: 30,
      features: [
        "Unlimited Power-ups",
        "Step-by-Step Magic",
        "Weekly Mock Contests",
        "Zero Boring Ads",
      ],
    },
    {
      _id: "team-fallback",
      displayName: "Adventure Team",
      price: 349,
      duration: 30,
      features: ["Up to 3 Explorers", "HQ Parent Control", "Custom Quests"],
    },
  ];

  const plans = useMemo(() => {
    if (!packages.length) return fallbackPlans;
    return [...packages]
      .sort((a, b) => (a.price || 0) - (b.price || 0))
      .slice(0, 3);
  }, [packages]);

  const periodLabel = (plan) => {
    if (!plan) return "/ mo";
    if (Number(plan.duration) <= 0) return "/ Lifetime";
    if (!plan.duration) return "/ mo";
    return `/ ${plan.duration} days`;
  };

  const materialsLabel = (value) => {
    if (value === "full") return "Full Access";
    if (value === "limited") return "Limited Access";
    return "No Access";
  };

  const subjectContentLabel = (value) => {
    if (value === "full") return "Full";
    if (value === "extended") return "Extended";
    return "Basic";
  };

  const analyticsLabel = (value) => {
    if (value === "full") return "Full";
    if (value === "basic") return "Basic";
    return "None";
  };

  const mergedFeatureLines = (plan, fallback) => {
    const list = Array.isArray(plan?.features) && plan.features.length
      ? plan.features.filter(Boolean)
      : fallback.features;

    const extras = [];
    if (Array.isArray(plan?.unlockedStages) && plan.unlockedStages.length) {
      extras.push(`Unlocked Stages: ${plan.unlockedStages.join(", ")}`);
    }
    if (plan?.studyMaterialsAccess) {
      extras.push(`Study Materials: ${materialsLabel(plan.studyMaterialsAccess)}`);
    }
    if (plan?.subjectContentAccess) {
      extras.push(`Subject Content: ${subjectContentLabel(plan.subjectContentAccess)}`);
    }
    if (plan?.analyticsAccess) {
      extras.push(`Analytics: ${analyticsLabel(plan.analyticsAccess)}`);
    }
    if (Array.isArray(plan?.allowedTryoutTypes) && plan.allowedTryoutTypes.length) {
      extras.push(`Tryouts: ${plan.allowedTryoutTypes.join(", ")}`);
    }
    if (plan?.prioritySupport) {
      extras.push("Priority Support");
    }

    return [...list, ...extras];
  };

  const handlePlanClick = (plan) => {
    const packageId = String(plan?._id || "").trim();
    const target = packageId && !packageId.includes("fallback")
      ? `/dashboard/packages?buy=${encodeURIComponent(packageId)}`
      : "/dashboard/packages";

    const token = localStorage.getItem("jwt") || "";
    if (token) {
      navigate(target);
      return;
    }

    sessionStorage.setItem("redirectAfterLogin", target);
    window.dispatchEvent(new Event("eec:open-login"));
  };

  const ctaLabel = (plan, paidLabel) =>
    Number(plan?.price || 0) === 0 ? "Sign Up" : paidLabel;

  return (
    <section className="py-24 bg-[#FEF4E8]" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-6xl font-bold mb-4 text-slate-900" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
            Choose Your <span className="text-[#FF6B6B]">Hero Rank</span>
          </h2>
        </div>

        <div
          className={
            plans.length === 1
              ? "flex justify-center"
              : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          }
        >
          {plans.map((plan, index) => {
            const fallback = fallbackPlans[index] || fallbackPlans[0];
            return (
              <div
                key={plan._id || `plan-${index}`}
                className={`bg-white p-10 rounded-[2.5rem] border-4 border-slate-100 flex flex-col group hover:border-[#4ECDC4] transition-all w-full shadow-sm hover:shadow-xl ${
                  plans.length === 1 ? "max-w-md" : ""
                }`}
              >
                <h4
                  className="text-2xl font-bold mb-6 text-slate-900 text-center"
                  style={{ fontFamily: "'Balsamiq Sans', cursive" }}
                >
                  {plan.displayName || plan.name || fallback.displayName}
                </h4>
                <div className="text-center mb-6">
                  <span className="text-4xl font-black text-slate-900">
                    ₹{Number(plan?.price || 0)}
                  </span>
                  <span className="ml-2 text-sm font-semibold text-slate-500">
                    {periodLabel(plan)}
                  </span>
                </div>
                {!!plan.description && (
                  <p className="text-sm text-center text-slate-500 mb-6">{plan.description}</p>
                )}
                <ul className="space-y-5 mb-10 flex-grow">
                  {mergedFeatureLines(plan, fallback).map((feature, i) => (
                    <li
                      key={`${plan._id || `plan-${index}`}-${feature}-${i}`}
                      className="flex items-center gap-3 font-medium text-sm text-slate-700"
                    >
                      <span className="material-symbols-outlined text-[#4ECDC4]">
                        check_circle
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => handlePlanClick(plan)}
                  className="w-full py-4 rounded-full border-2 border-slate-200 font-bold hover:border-[#4ECDC4] hover:bg-[#4ECDC4] hover:text-white transition-all shadow-sm"
                >
                  {ctaLabel(plan, "Choose Plan")}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
