import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CreditCard,
  CheckCircle2,
  Shield,
  Rocket,
  Award,
  Circle,
  Star,
  Calendar,
  BookOpen,
  Layers,
  Check,
  Sparkles,
  Clock,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";

const TIER_CONFIG = {
  Basic: {
    icon: <Shield className="w-6 h-6" />,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-500",
    border: "border-slate-100",
    activeBorder: "border-emerald-400",
    bulletColor: "text-emerald-500",
    button: "bg-slate-900 hover:bg-slate-800",
    ctaPaid: "Subscribe Now",
    ctaFree: "Get Started Free",
    priceCaption: (pkg) => (Number(pkg.price) === 0 ? "Always and forever" : null),
  },
  Intermediate: {
    icon: <Rocket className="w-6 h-6" />,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    border: "border-amber-300",
    activeBorder: "border-emerald-400",
    bulletColor: "text-amber-500",
    button: "bg-amber-900 hover:bg-amber-950",
    ctaPaid: "Start My Adventure",
    ctaFree: "Get Started Free",
    priceCaption: () => "SAVE 20% YEARLY",
    popular: true,
  },
  Premium: {
    icon: <Award className="w-6 h-6" />,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    border: "border-violet-100",
    activeBorder: "border-emerald-400",
    bulletColor: "text-violet-500",
    button: "bg-indigo-600 hover:bg-indigo-700",
    ctaPaid: "Go Master Tier",
    ctaFree: "Get Started Free",
    priceCaption: () => "Full premium access",
  },
};

function getTierConfig(pkgName) {
  const key = Object.keys(TIER_CONFIG).find(
    (k) => k.toLowerCase() === String(pkgName || "").toLowerCase()
  );
  return TIER_CONFIG[key] || TIER_CONFIG.Basic;
}

function durationLabel(duration) {
  const days = Number(duration) || 0;
  if (days >= 360) return "/year";
  if (days >= 28 && days <= 31) return "/month";
  return days ? `/${days} days` : "";
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
  const [cancelBusy, setCancelBusy] = useState(false);
  const [autoBuyHandled, setAutoBuyHandled] = useState(false);
  const [confirmPkg, setConfirmPkg] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

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
    if (!options.skipConfirm) {
      setConfirmPkg(pkg);
      return;
    }

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
  const activePackage = subscription?.package || null;
  const isFreeTierActive =
    hasActivePlan &&
    (String(activeType) === "basic" || Number(activePackage?.price || 0) === 0);
  const startDate = subscription?.startDate || null;
  const startDateLabel = startDate
    ? new Date(startDate).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      })
    : null;
  const paymentMethod = String(subscription?.paymentMethod || "").toUpperCase();
  const amountPaid = Number(subscription?.amountPaid || 0);
  const activeStudyAccess = subscription?.studyMaterialsAccess || activePackage?.studyMaterialsAccess || "none";
  const activeStudyBadge = {
    full: { label: "Full Access", cls: "bg-emerald-100 text-emerald-700" },
    limited: { label: "Limited", cls: "bg-amber-100 text-amber-700" },
    none: { label: "No Access", cls: "bg-slate-100 text-slate-500" },
  }[activeStudyAccess] || { label: activeStudyAccess, cls: "bg-slate-100 text-slate-500" };

  function openCancelModal() {
    if (!subscription?._id || cancelBusy) return;
    setShowCancelModal(true);
  }

  async function confirmCancelSubscription() {
    if (!subscription?._id || cancelBusy) return;

    setCancelBusy(true);
    try {
      const res = await fetch(`${API}/api/subscriptions/${subscription._id}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to cancel subscription");

      setSubscription(null);
      setSubscriptionType("none");
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...stored, subscriptionType: "none" }));
      setShowCancelModal(false);
      toast.success("Subscription cancelled successfully");
    } catch (err) {
      toast.error(err.message || "Failed to cancel subscription");
    } finally {
      setCancelBusy(false);
    }
  }

  function handleUpgradeFromFreeTier() {
    const nextPaidPackage = sortedPackages.find((pkg) => Number(pkg?.price || 0) > 0);
    if (!nextPaidPackage) {
      toast.info("No paid upgrade package available right now");
      return;
    }
    purchasePackage(nextPaidPackage);
  }

  return (
    <div className="min-h-screen bg-[#fdf5ee]">
      <ToastContainer />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">

        {/* ── Page Header ── */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400 text-amber-950 text-sm font-bold mb-2">
            <Sparkles className="w-4 h-4" />
            Pick Your Adventure
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Unlock Your Full Potential
          </h1>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Join thousands of young explorers on a journey of discovery. Choose the pass that fits your learning goals and level up your skills today!
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

        {hasActivePlan && activePackage && (
          <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Current Active Package</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-800">
                  {activePackage.displayName || activePackage.name}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{activePackage.description}</p>
              </div>
              {isFreeTierActive ? (
                <button
                  type="button"
                  onClick={handleUpgradeFromFreeTier}
                  className="inline-flex items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                >
                  Upgrade Plan
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openCancelModal}
                  disabled={cancelBusy}
                  className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {cancelBusy ? "Cancelling..." : "Cancel Subscription"}
                </button>
              )}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Plan Type</p>
                <p className="text-sm font-semibold text-slate-800">{activePackage.name}</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Duration</p>
                <p className="text-sm font-semibold text-slate-800">{activePackage.duration} days</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Amount Paid</p>
                <p className="text-sm font-semibold text-slate-800">{amountPaid > 0 ? `₹${amountPaid}` : "Free"}</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Payment Method</p>
                <p className="text-sm font-semibold text-slate-800">{paymentMethod || "N/A"}</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Start Date</p>
                <p className="text-sm font-semibold text-slate-800">{startDateLabel || "N/A"}</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">End Date</p>
                <p className="text-sm font-semibold text-slate-800">{endDateLabel || "N/A"}</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Study Materials</p>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${activeStudyBadge.cls}`}>
                  {activeStudyBadge.label}
                </span>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3 sm:col-span-2">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Unlocked Stages</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {Array.isArray(subscription?.unlockedStages) && subscription.unlockedStages.length > 0 ? (
                    subscription.unlockedStages.map((stage) => (
                      <span key={stage} className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        Stage {stage}
                      </span>
                    ))
                  ) : Array.isArray(activePackage.unlockedStages) && activePackage.unlockedStages.length > 0 ? (
                    activePackage.unlockedStages.map((stage) => (
                      <span key={stage} className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        Stage {stage}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">No stages unlocked</span>
                  )}
                </div>
              </div>
            </div>

            {Array.isArray(activePackage.features) && activePackage.features.length > 0 && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="mb-2 text-[11px] uppercase tracking-wide text-slate-500">Included Features</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {activePackage.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {subscription?.transactionId && (
              <p className="mt-4 text-xs text-slate-500">
                Transaction ID: <span className="font-semibold text-slate-700">{subscription.transactionId}</span>
              </p>
            )}
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
              const isImplicitFreePlan = !hasActivePlan && Number(pkg.price) === 0;
              const isActive =
                isImplicitFreePlan ||
                (activePackageId && activePackageId === pkg._id) ||
                String(pkg.name || "").toLowerCase() === activeType;
              const cfg = getTierConfig(pkg.name);
              const isPurchasing = purchasingId === pkg._id;
              const isFree = Number(pkg.price) === 0;
              const caption = cfg.priceCaption(pkg);
              const features = Array.isArray(pkg.features) ? pkg.features : [];
              const studyBadge = {
                full: { label: "Full Access", cls: "bg-emerald-100 text-emerald-700" },
                limited: { label: "Limited", cls: "bg-amber-100 text-amber-700" },
                none: { label: "No Access", cls: "bg-slate-100 text-slate-500" },
              }[pkg.studyMaterialsAccess] || { label: pkg.studyMaterialsAccess, cls: "bg-slate-100 text-slate-500" };

              return (
                <div
                  key={pkg._id || pkg.name}
                  className={`relative rounded-3xl border-2 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-lg flex flex-col ${
                    isActive ? cfg.activeBorder : cfg.border
                  } ${cfg.popular && !isActive ? "shadow-lg lg:-mt-2" : ""}`}
                >
                  {/* Popular badge */}
                  {cfg.popular && !isActive && (
                    <span className="absolute top-4 right-4 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-400 text-amber-950 shadow-sm">
                      <Star className="w-3 h-3 fill-amber-950" /> Most Popular
                    </span>
                  )}

                  {/* Active badge */}
                  {isActive && (
                    <span className="absolute top-4 right-4 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-500 text-white shadow-sm">
                      <CheckCircle2 className="w-3 h-3" /> Current Plan
                    </span>
                  )}

                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${cfg.iconBg} ${cfg.iconColor}`}>
                    {cfg.icon}
                  </div>

                  {/* Title & description */}
                  <h3 className="mt-4 text-lg font-bold text-slate-900">{pkg.displayName || pkg.name}</h3>
                  <p className="mt-1 text-sm text-slate-500 leading-relaxed">{pkg.description}</p>

                  {/* Price */}
                  <div className="mt-5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-slate-900">
                        {isFree ? "Free" : `₹${pkg.price}`}
                      </span>
                      {!isFree && (
                        <span className="text-sm text-slate-400 font-medium">{durationLabel(pkg.duration)}</span>
                      )}
                    </div>
                    {caption && (
                      <p className={`mt-1 text-xs font-semibold ${isFree ? "text-slate-400" : cfg.popular ? "text-amber-600 uppercase tracking-wide" : "text-slate-400"}`}>
                        {caption}
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  {features.length > 0 && (
                    <div className="mt-6 space-y-3 flex-1">
                      {features.map((feature, idx) => {
                        const isLastDisabled = isFree && features.length > 1 && idx === features.length - 1;
                        return (
                          <div key={idx} className="flex items-center gap-2.5">
                            {isLastDisabled ? (
                              <Circle className="w-4 h-4 shrink-0 text-slate-300" />
                            ) : (
                              <CheckCircle2 className={`w-4 h-4 shrink-0 ${cfg.bulletColor}`} />
                            )}
                            <span className={`text-sm ${isLastDisabled ? "text-slate-400" : "text-slate-600"}`}>
                              {feature}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Plan Details */}
                  {(() => {
                    const hasStages = Array.isArray(pkg.unlockedStages) && pkg.unlockedStages.length > 0;
                    const hasTryoutTypes = Array.isArray(pkg.allowedTryoutTypes) && pkg.allowedTryoutTypes.length > 0;
                    if (!hasStages && !hasTryoutTypes && !pkg.studyMaterialsAccess && !pkg.subjectContentAccess && !pkg.analyticsAccess && !pkg.duration) {
                      return null;
                    }
                    return (
                      <div className="mt-5 pt-4 border-t border-slate-100 space-y-2.5 text-xs">
                        {hasStages && (
                          <div className="flex items-start gap-2">
                            <Layers className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${cfg.iconColor}`} />
                            <div className="flex flex-wrap gap-1">
                              {pkg.unlockedStages.map((stage) => (
                                <span key={stage} className={`px-2 py-0.5 rounded-full font-bold ${cfg.iconBg} ${cfg.iconColor}`}>
                                  Stage {stage}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {pkg.studyMaterialsAccess && (
                          <div className="flex items-center gap-2">
                            <BookOpen className={`w-3.5 h-3.5 shrink-0 ${cfg.iconColor}`} />
                            <span className="text-slate-500">Study Materials:</span>
                            <span className={`px-2 py-0.5 rounded-full font-semibold ${studyBadge.cls}`}>
                              {studyBadge.label}
                            </span>
                          </div>
                        )}

                        {pkg.subjectContentAccess && (
                          <div className="flex items-center gap-2">
                            <Layers className={`w-3.5 h-3.5 shrink-0 ${cfg.iconColor}`} />
                            <span className="text-slate-500">Subject Content:</span>
                            <span className={`px-2 py-0.5 rounded-full font-semibold ${cfg.iconBg} ${cfg.iconColor}`}>
                              {pkg.subjectContentAccess}
                            </span>
                          </div>
                        )}

                        {pkg.analyticsAccess && (
                          <div className="flex items-center gap-2">
                            <Clock className={`w-3.5 h-3.5 shrink-0 ${cfg.iconColor}`} />
                            <span className="text-slate-500">Analytics:</span>
                            <span className={`px-2 py-0.5 rounded-full font-semibold ${cfg.iconBg} ${cfg.iconColor}`}>
                              {pkg.analyticsAccess}
                            </span>
                          </div>
                        )}

                        {Boolean(pkg.duration) && (
                          <div className="flex items-center gap-2">
                            <Calendar className={`w-3.5 h-3.5 shrink-0 ${cfg.iconColor}`} />
                            <span className="text-slate-500">
                              Valid for <span className="font-semibold text-slate-700">{pkg.duration} days</span>
                            </span>
                          </div>
                        )}

                        {hasTryoutTypes && (
                          <div className="flex items-start gap-2">
                            <Zap className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${cfg.iconColor}`} />
                            <div className="flex flex-wrap gap-1">
                              {pkg.allowedTryoutTypes.map((typeName) => (
                                <span key={typeName} className={`px-2 py-0.5 rounded-full font-bold ${cfg.iconBg} ${cfg.iconColor}`}>
                                  {typeName}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Footer */}
                  <div className="mt-6">
                    {isActive ? (
                      <div className="w-full py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-sm text-center flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Active Plan
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => purchasePackage(pkg)}
                        disabled={isPurchasing}
                        className={`w-full py-3 rounded-xl text-white font-semibold text-sm shadow-md transition-all duration-200 ${cfg.button} hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                      >
                        {isPurchasing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            Processing...
                          </>
                        ) : isFree ? (
                          cfg.ctaFree
                        ) : (
                          cfg.ctaPaid
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

      {/* ── Subscribe Confirm Modal ── */}
      {confirmPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col items-center gap-4 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
              <CreditCard className="w-7 h-7 text-white" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-slate-800">Confirm Subscription</h2>
              <p className="text-sm text-slate-500 mt-1">
                You're about to subscribe to{" "}
                <span className="font-semibold text-orange-600">
                  {confirmPkg.displayName || confirmPkg.name}
                </span>
                {confirmPkg.price > 0 && (
                  <> for <span className="font-semibold text-slate-700">₹{confirmPkg.price}</span></>
                )}
                .
              </p>
            </div>
            <div className="flex gap-3 w-full mt-2">
              <button
                type="button"
                onClick={() => setConfirmPkg(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const pkg = confirmPkg;
                  setConfirmPkg(null);
                  purchasePackage(pkg, { skipConfirm: true });
                }}
                className="flex-1 py-2.5 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-sm shadow-md transition-all"
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel Subscription Modal ── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
              <AlertTriangle className="h-7 w-7 text-rose-600" />
            </div>

            <div className="text-center">
              <h2 className="text-lg font-bold text-slate-800">Cancel Subscription?</h2>
              <p className="mt-1 text-sm text-slate-500">
                You will lose your current package access after cancellation.
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelBusy}
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Keep Plan
              </button>
              <button
                type="button"
                onClick={confirmCancelSubscription}
                disabled={cancelBusy}
                className="rounded-xl bg-rose-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancelBusy ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
