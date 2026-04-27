import Package from "../models/Package.js";
import Subscription from "../models/Subscription.js";
import User from "../models/User.js";

const ALL_LEVELS = ["basic", "intermediate", "advanced"];

function normalizeLevel(value) {
  const raw = String(value || "").trim().toLowerCase();
  return ALL_LEVELS.includes(raw) ? raw : "";
}

function normalizePackageLevels(pkg) {
  const rawLevels = Array.isArray(pkg?.allowedLevels) ? pkg.allowedLevels : [];
  const cleaned = rawLevels.map(normalizeLevel).filter(Boolean);
  if (cleaned.length > 0) return [...new Set(cleaned)];

  const pkgName = String(pkg?.name || "").trim().toLowerCase();
  if (pkgName === "premium") return [...ALL_LEVELS];
  if (pkgName === "intermediate") return ["basic", "intermediate"];
  return ["basic"];
}

function findBasicPackage(packages = []) {
  return packages.find((pkg) => String(pkg?.name || "").trim().toLowerCase() === "basic") || null;
}

export async function resolveLevelAccessForUser(userId, role) {
  const packages = await Package.find({ isActive: true })
    .select("name displayName allowedLevels")
    .lean();

  const levelPackagesMap = ALL_LEVELS.reduce((acc, level) => {
    acc[level] = [];
    return acc;
  }, {});

  for (const pkg of packages) {
    const levels = normalizePackageLevels(pkg);
    for (const level of levels) {
      levelPackagesMap[level].push({
        name: String(pkg?.name || ""),
        displayName: String(pkg?.displayName || pkg?.name || ""),
      });
    }
  }

  const basicPackage = findBasicPackage(packages);
  const freeLevels = basicPackage ? normalizePackageLevels(basicPackage) : ["basic"];
  const roleName = String(role || "").toLowerCase();
  if (roleName !== "student") {
    return {
      allLevels: ALL_LEVELS,
      freeLevels,
      allowedLevels: [...ALL_LEVELS],
      levelPackagesMap,
      activePackage: null,
      hasActiveSubscription: false,
    };
  }

  const userDoc = await User.findById(userId).select("activeSubscription").lean();
  let activePackage = null;
  let hasActiveSubscription = false;

  if (userDoc?.activeSubscription) {
    const subscription = await Subscription.findById(userDoc.activeSubscription)
      .populate("package")
      .lean();

    const isActive =
      subscription &&
      String(subscription.status || "").toLowerCase() === "active" &&
      (!subscription.endDate || new Date(subscription.endDate) > new Date());

    if (isActive && subscription?.package) {
      activePackage = subscription.package;
      hasActiveSubscription = true;
    }
  }

  const allowedSet = new Set(freeLevels);
  if (activePackage) {
    for (const level of normalizePackageLevels(activePackage)) {
      allowedSet.add(level);
    }
  }

  return {
    allLevels: ALL_LEVELS,
    freeLevels,
    allowedLevels: ALL_LEVELS.filter((level) => allowedSet.has(level)),
    levelPackagesMap,
    activePackage: activePackage
      ? {
          name: String(activePackage?.name || ""),
          displayName: String(activePackage?.displayName || activePackage?.name || ""),
        }
      : null,
    hasActiveSubscription,
  };
}
