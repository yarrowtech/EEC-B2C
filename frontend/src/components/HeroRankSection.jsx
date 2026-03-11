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
      features: ["5 Fun Samples / mo", "Public Solutions", "Secret Mock Exams"],
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

  const leftPlan = plans[0] || fallbackPlans[0];
  const middlePlan = plans[1] || fallbackPlans[1];
  const rightPlan = plans[2] || fallbackPlans[2];

  const periodLabel = (plan) => {
    if (!plan) return "/ mo";
    if ((plan.price || 0) === 0) return "/ forever";
    if (!plan.duration) return "/ mo";
    return `/ ${plan.duration} days`;
  };

  const materialsLabel = (value) => {
    if (value === "full") return "Full Access";
    if (value === "limited") return "Limited Access";
    return "No Access";
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
        <div className="text-center mb-20">
          <h2 className="text-4xl lg:text-6xl font-bold mb-6 text-slate-900" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
            Choose Your <span className="text-[#FF6B6B]">Hero Rank</span>
          </h2>
          <div className="inline-flex items-center gap-2 bg-[#4ECDC4]/10 text-[#4ECDC4] px-6 py-2 rounded-full text-sm font-bold mt-4 border border-[#4ECDC4]">
            <span className="material-symbols-outlined text-base">verified</span>
            7-Day Secret Trial on Scholar Plans!
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="bg-white p-10 rounded-[2.5rem] border-4 border-slate-100 flex flex-col group hover:border-slate-200 transition-all">
            <h4 className="text-2xl font-bold mb-2 text-slate-900" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
              {leftPlan.displayName || leftPlan.name || "Starter Scout"}
            </h4>
            {!!leftPlan.description && (
              <p className="text-sm text-slate-500 mb-4">{leftPlan.description}</p>
            )}
            <div className="text-5xl font-black mb-8 text-slate-900" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
              ₹{Number(leftPlan.price || 0)}{" "}
              <span className="text-lg font-normal text-slate-400">{periodLabel(leftPlan)}</span>
            </div>
            <ul className="space-y-5 mb-10 flex-grow">
              {mergedFeatureLines(leftPlan, fallbackPlans[0]).map((feature, i) => (
                <li
                  key={`${leftPlan._id || "left"}-${feature}-${i}`}
                  className={`flex items-center gap-3 font-medium text-sm ${
                    i < 2 ? "text-slate-700" : "text-slate-400"
                  }`}
                >
                  <span className={`material-symbols-outlined ${i < 2 ? "text-[#4ECDC4]" : ""}`}>
                    {i < 2 ? "check_circle" : "block"}
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => handlePlanClick(leftPlan)}
              className="w-full py-4 rounded-full border-2 border-slate-200 font-bold hover:bg-slate-50 transition-all"
            >
              {ctaLabel(leftPlan, "Join the Scouts")}
            </button>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border-4 border-[#FFD23F] shadow-[0_20px_50px_rgba(255,210,63,0.3)] relative flex flex-col transform md:scale-110 z-10 overflow-hidden">
            <div className="absolute top-4 right-4 bg-[#FFD23F] text-slate-900 text-[10px] font-black px-3 py-1 rounded-full uppercase shadow-sm leading-none tracking-wide z-20">
              Elite
            </div>
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#FF6B6B] text-white text-xs font-black px-6 py-2 rounded-full uppercase shadow-lg">
              Most Popular Quest
            </div>
            <h4 className="text-2xl font-bold mb-2 text-[#FFD23F]" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
              {middlePlan.displayName || middlePlan.name || "Master Scholar"}
            </h4>
            {!!middlePlan.description && (
              <p className="text-sm text-slate-500 mb-4">{middlePlan.description}</p>
            )}
            <div className="text-5xl font-black mb-8 text-slate-900" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
              ₹{Number(middlePlan.price || 0)}{" "}
              <span className="text-lg font-normal text-slate-400">{periodLabel(middlePlan)}</span>
            </div>
            <ul className="space-y-5 mb-10 flex-grow">
              {mergedFeatureLines(middlePlan, fallbackPlans[1]).map((feature, i) => {
                const icons = ["rocket", "auto_awesome", "emoji_events", "visibility_off"];
                return (
                  <li
                    key={`${middlePlan._id || "middle"}-${feature}-${i}`}
                    className="flex items-center gap-3 font-bold text-sm text-slate-900"
                  >
                    <span className="material-symbols-outlined text-[#FF6B6B]">{icons[i] || "check_circle"}</span>
                    {feature}
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={() => handlePlanClick(middlePlan)}
              className="w-full py-5 rounded-full bg-[#FFD23F] text-slate-900 font-black hover:bg-yellow-400 transition-all shadow-[0_6px_0_0_#D1A100] active:translate-y-1 active:shadow-none"
            >
              {ctaLabel(middlePlan, "Begin Your Trial")}
            </button>
          </div>

          <div className="bg-white p-10 rounded-[2.5rem] border-4 border-slate-100 flex flex-col group hover:border-[#6C63FF] transition-all">
            <h4 className="text-2xl font-bold mb-2 text-slate-900" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
              {rightPlan.displayName || rightPlan.name || "Adventure Team"}
            </h4>
            {!!rightPlan.description && (
              <p className="text-sm text-slate-500 mb-4">{rightPlan.description}</p>
            )}
            <div className="text-5xl font-black mb-8 text-slate-900" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
              ₹{Number(rightPlan.price || 0)}{" "}
              <span className="text-lg font-normal text-slate-400">{periodLabel(rightPlan)}</span>
            </div>
            <ul className="space-y-5 mb-10 flex-grow">
              {mergedFeatureLines(rightPlan, fallbackPlans[2]).map((feature, i) => {
                const icons = ["groups", "dashboard", "architecture", "check_circle"];
                return (
                  <li
                    key={`${rightPlan._id || "right"}-${feature}-${i}`}
                    className="flex items-center gap-3 font-medium text-sm text-slate-700"
                  >
                    <span className="material-symbols-outlined text-[#6C63FF]">{icons[i] || "check_circle"}</span>
                    {feature}
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={() => handlePlanClick(rightPlan)}
              className="w-full py-4 rounded-full border-2 border-slate-200 font-bold hover:bg-slate-50 transition-all"
            >
              {ctaLabel(rightPlan, "Enroll the Squad")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
