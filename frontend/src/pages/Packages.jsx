import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CreditCard,
  CheckCircle2,
  Lock,
  Zap,
  Shield,
  Star,
  Calendar,
  BookOpen,
  Layers,
  Check,
  Crown,
  Sparkles,
  Clock,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";

const TIER_CONFIG = {
  Basic: {
    gradient: "from-slate-500 to-gray-600",
    lightGradient: "from-slate-50 to-gray-50",
    border: "border-slate-200",
    activeBorder: "border-slate-400",
    badge: "bg-slate-100 text-slate-700",
    button: "from-slate-600 to-gray-700 hover:from-slate-700 hover:to-gray-800",
    icon: <Shield className="w-5 h-5" />,
    accentColor: "text-slate-600",
    ringColor: "ring-slate-400",
  },
  Intermediate: {
    gradient: "from-blue-500 to-cyan-500",
    lightGradient: "from-blue-50 to-cyan-50",
    border: "border-blue-200",
    activeBorder: "border-blue-400",
    badge: "bg-blue-100 text-blue-700",
    button: "from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700",
    icon: <Zap className="w-5 h-5" />,
    accentColor: "text-blue-600",
    ringColor: "ring-blue-400",
    popular: true,
  },
  Premium: {
    gradient: "from-amber-500 to-orange-500",
    lightGradient: "from-amber-50 to-orange-50",
    border: "border-amber-200",
    activeBorder: "border-amber-400",
    badge: "bg-amber-100 text-amber-700",
    button: "from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600",
    icon: <Crown className="w-5 h-5" />,
    accentColor: "text-amber-600",
    ringColor: "ring-amber-400",
  },
};

function getTierConfig(pkgName) {
  const key = Object.keys(TIER_CONFIG).find(
    (k) => k.toLowerCase() === String(pkgName || "").toLowerCase()
  );
  return TIER_CONFIG[key] || TIER_CONFIG.Basic;
}

export default function Packages() {
  const navigate = useNavigate();
  const location = useLocation();
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [packages, setPackages] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [subscriptionType, setSubscriptionType] = useState("none");
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState(null);
  const [autoBuyHandled, setAutoBuyHandled] = useState(false);

  const token = localStorage.getItem("jwt") || "";

  useEffect(() => {
    refreshAll();
  }, []);

  async function refreshAll() {
    setLoading(true);
    await Promise.all([loadPackages(), loadSubscription()]);
    setLoading(false);
  }

  async function loadPackages() {
    try {
      const res = await fetch(`${API}/api/packages`);
      const data = await res.json();
      setPackages(data.packages || []);
    } catch (err) {
      toast.error("Failed to load packages");
    }
  }

  async function loadSubscription() {
    try {
      const res = await fetch(`${API}/api/subscriptions/current`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data?.hasActiveSubscription) {
        setSubscription(data.subscription || null);
        const nextType =
          data.subscriptionType ||
          data.subscription?.package?.name ||
          data.subscription?.packageName ||
          "none";
        setSubscriptionType(nextType);
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({ ...stored, subscriptionType: nextType }));
      } else {
        setSubscription(null);
        setSubscriptionType("none");
      }
    } catch (err) {
      toast.error("Failed to load subscription");
    }
  }

  const activeType = String(subscriptionType || "none").toLowerCase();
  const activePackageId = subscription?.package?._id || "";
  const endDate = subscription?.endDate || null;
  const endDateLabel = endDate
    ? new Date(endDate).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      })
    : null;
  const daysLeft = endDate
    ? Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const sortedPackages = useMemo(() => {
    return [...packages].sort((a, b) => (a.price || 0) - (b.price || 0));
  }, [packages]);

  useEffect(() => {
    if (loading || autoBuyHandled || !sortedPackages.length) return;

    const params = new URLSearchParams(location.search);
    const buyId = params.get("buy");
    if (!buyId) return;

    const pkg = sortedPackages.find((p) => String(p._id) === String(buyId));
    setAutoBuyHandled(true);
    navigate(location.pathname, { replace: true });

    if (pkg) {
      purchasePackage(pkg, { skipConfirm: true });
    } else {
      toast.error("Selected package not found");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, autoBuyHandled, sortedPackages, location.search, location.pathname, navigate]);

  function loadRazorpay() {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async function purchasePackage(pkg, options = {}) {
    if (!pkg?._id) return;
    if (!options.skipConfirm && !window.confirm(`Subscribe to ${pkg.displayName || pkg.name}?`)) return;

    setPurchasingId(pkg._id);
    try {
      if (pkg.price === 0) {
        const res = await fetch(`${API}/api/packages/${pkg._id}/purchase`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentMethod: "free",
            coinsUsed: 0,
            transactionId: "",
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Subscription failed");
        toast.success("Package subscribed successfully");
        await refreshAll();
        return;
      }

      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Razorpay failed to load");

      const orderRes = await fetch(`${API}/api/packages/${pkg._id}/create-order`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const order = await orderRes.json();
      if (!orderRes.ok) throw new Error(order?.message || "Failed to create order");

      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "EEC Learning",
        description: pkg.displayName || pkg.name,
        order_id: order.orderId,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        handler: async function (response) {
          const verifyRes = await fetch(`${API}/api/packages/${pkg._id}/verify-payment`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ ...response }),
          });
          const verifyData = await verifyRes.json();
          if (!verifyRes.ok) {
            throw new Error(verifyData?.message || "Payment verification failed");
          }
          toast.success("Package subscribed successfully");
          await refreshAll();
        },
        theme: { color: "#f59e0b" },
      };

      new window.Razorpay(options).open();
    } catch (err) {
      toast.error(err.message || "Subscription failed");
    } finally {
      setPurchasingId(null);
    }
  }

  const hasActivePlan = activeType !== "none";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50">
      <ToastContainer />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">

        {/* ── Page Header ── */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-700 text-sm font-semibold mb-2">
            <Sparkles className="w-4 h-4" />
            Choose Your Plan
          </div>
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">
            Unlock Your Full Potential
          </h1>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Pick the plan that fits your learning goals. Upgrade anytime to access more stages and resources.
          </p>
        </div>

        {/* ── Active Subscription Banner ── */}
        {hasActivePlan && (
          <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 p-px shadow-lg">
            <div className="rounded-2xl bg-white/95 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Active Subscription</p>
                  <p className="text-lg font-bold text-slate-800 capitalize">{activeType} Plan</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm text-slate-600">
                {endDateLabel && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Expires <span className="font-semibold text-slate-700">{endDateLabel}</span></span>
                  </div>
                )}
                {daysLeft !== null && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className={`font-semibold ${daysLeft <= 7 ? "text-red-600" : "text-slate-700"}`}>
                      {daysLeft} days left
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Package Cards ── */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-slate-100 bg-white p-6 space-y-4 animate-pulse">
                <div className="h-4 w-24 bg-slate-200 rounded-full" />
                <div className="h-8 w-32 bg-slate-200 rounded" />
                <div className="h-10 w-20 bg-slate-200 rounded" />
                <div className="space-y-2">
                  {[1, 2, 3].map((j) => <div key={j} className="h-3 bg-slate-100 rounded w-full" />)}
                </div>
                <div className="h-10 bg-slate-200 rounded-xl" />
              </div>
            ))}
          </div>
        ) : sortedPackages.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <div className="text-5xl mb-4">📦</div>
            <p className="font-medium">No packages available yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sortedPackages.map((pkg) => {
              const isActive =
                (activePackageId && activePackageId === pkg._id) ||
                String(pkg.name || "").toLowerCase() === activeType;
              const cfg = getTierConfig(pkg.name);
              const priceLabel = pkg.price === 0 ? "Free" : `₹${pkg.price}`;
              const isPurchasing = purchasingId === pkg._id;

              const studyBadge = {
                full: { label: "Full Access", cls: "bg-emerald-100 text-emerald-700" },
                limited: { label: "Limited", cls: "bg-amber-100 text-amber-700" },
                none: { label: "No Access", cls: "bg-slate-100 text-slate-500" },
              }[pkg.studyMaterialsAccess] || { label: pkg.studyMaterialsAccess, cls: "bg-slate-100 text-slate-500" };

              return (
                <div
                  key={pkg._id || pkg.name}
                  className={`relative rounded-2xl border-2 bg-white shadow-sm transition-all duration-200 hover:shadow-xl flex flex-col ${
                    isActive ? `${cfg.activeBorder} shadow-lg` : cfg.border
                  } ${cfg.popular && !isActive ? "ring-2 ring-blue-300 ring-offset-2" : ""}`}
                >
                  {/* Popular badge */}
                  {cfg.popular && !isActive && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md">
                        <Star className="w-3 h-3 fill-white" /> Most Popular
                      </span>
                    </div>
                  )}

                  {/* Active badge */}
                  {isActive && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-md">
                        <CheckCircle2 className="w-3 h-3" /> Current Plan
                      </span>
                    </div>
                  )}

                  {/* Card Header */}
                  <div className={`rounded-t-xl bg-gradient-to-br ${cfg.lightGradient} px-6 pt-7 pb-5 border-b ${cfg.border}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.badge}`}>
                        {cfg.icon}
                        {pkg.name}
                      </span>
                      {pkg.prioritySupport && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                          Priority Support
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-1">{pkg.displayName || pkg.name}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{pkg.description}</p>

                    {/* Price */}
                    <div className="mt-4 flex items-baseline gap-1">
                      {pkg.price === 0 ? (
                        <span className="text-4xl font-extrabold text-slate-800">Free</span>
                      ) : (
                        <>
                          <span className="text-4xl font-extrabold text-slate-800">₹{pkg.price}</span>
                          <span className="text-sm text-slate-500 font-medium">/ {pkg.duration} days</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="px-6 py-5 flex-1 space-y-5">

                    {/* Features */}
                    {Array.isArray(pkg.features) && pkg.features.length > 0 && (
                      <div className="space-y-2.5">
                        {pkg.features.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-2.5">
                            <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-gradient-to-br ${cfg.gradient} flex items-center justify-center`}>
                              <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                            </span>
                            <span className="text-sm text-slate-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Meta Info */}
                    <div className="space-y-3 pt-1 border-t border-slate-100">
                      {/* Unlocked Stages */}
                      <div className="flex items-start gap-2">
                        <Layers className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(pkg.unlockedStages) && pkg.unlockedStages.length > 0 ? (
                            pkg.unlockedStages.map((stage) => (
                              <span key={stage} className={`px-2 py-0.5 rounded text-xs font-bold ${cfg.badge}`}>
                                Stage {stage}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">No stages unlocked</span>
                          )}
                        </div>
                      </div>

                      {/* Study Materials */}
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="text-xs text-slate-500">Study Materials:</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${studyBadge.cls}`}>
                          {studyBadge.label}
                        </span>
                      </div>

                      {/* Duration */}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="text-xs text-slate-500">
                          Valid for <span className="font-semibold text-slate-700">{pkg.duration} days</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-6 pb-6">
                    {isActive ? (
                      <div className="w-full py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-sm text-center flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Active Plan
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => purchasePackage(pkg)}
                        disabled={isPurchasing}
                        className={`w-full py-3 rounded-xl text-white font-semibold text-sm shadow-md transition-all duration-200 bg-gradient-to-r ${cfg.button} hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                      >
                        {isPurchasing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            Processing...
                          </>
                        ) : pkg.price === 0 ? (
                          <>Get Started Free</>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4" />
                            Subscribe — ₹{pkg.price}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Footer Note ── */}
        <p className="text-center text-xs text-slate-400">
          Payments are processed securely via Razorpay. By subscribing you agree to our Terms of Service.
        </p>
      </div>
    </div>
  );
}
