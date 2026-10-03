import express from "express";
import jwt from "jsonwebtoken";
import SiteEvent from "../models/SiteEvent.js";
import UiClickEvent from "../models/UiClickEvent.js";
import User from "../models/User.js";
import Payment from "../models/Payment.js";
import Newsletter from "../models/Newsletter.js";
import Registration from "../models/Registration.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

const EXCLUDED_PATH = /^\/(dashboard|admin|teacher)/i;
const CAMPAIGN_PARAM = /[?&](utm_[a-z]+|coupon|code|ref|campaign|promo)=/i;
const ONLINE_WINDOW_MS = 5 * 60 * 1000;

function detectDevice(ua) {
  const s = String(ua || "");
  if (/ipad|tablet|playbook|silk|(android(?!.*mobi))/i.test(s)) return "tablet";
  if (/mobi|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(s)) return "mobile";
  return "desktop";
}

function sourceFromReferrer(ref) {
  if (!ref) return "Direct";
  try {
    return new URL(ref).hostname || "Direct";
  } catch {
    return "Direct";
  }
}

const CAMPAIGN_KEYS = ["coupon", "code", "promo", "utm_campaign", "campaign", "ref", "utm_source"];

function campaignName(path) {
  try {
    const params = new URL(path, "http://x").searchParams;
    for (const key of CAMPAIGN_KEYS) {
      const v = params.get(key);
      if (v) return v.trim().slice(0, 60);
    }
  } catch {
    // fall through
  }
  return "Other";
}

function pageName(path) {
  const p = String(path || "/").split("?")[0] || "/";
  if (p === "/") return "Home";
  if (p.startsWith("/learn/topic/")) return "Topic page";
  return p;
}

function tokenRole(req) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return { role: "", userId: null };
  try {
    const p = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
    return { role: String(p?.role || "").toLowerCase(), userId: p?.sub || null };
  } catch {
    return { role: "", userId: null };
  }
}

router.post("/", async (req, res) => {
  try {
    const { type, sessionId, pagePath = "", referrer = "" } = req.body || {};
    if (!["pageview", "ping"].includes(type) || !sessionId) return res.status(400).end();

    const path = String(pagePath).slice(0, 500);
    if (EXCLUDED_PATH.test(path)) return res.status(204).end();

    const { role, userId } = tokenRole(req);
    if (role && role !== "student") return res.status(204).end();

    await SiteEvent.create({
      type,
      sessionId: String(sessionId).slice(0, 100),
      userId: userId || null,
      pagePath: path,
      referrer: String(referrer).slice(0, 500),
      isCampaign: type === "pageview" && CAMPAIGN_PARAM.test(path),
      device: detectDevice(req.headers["user-agent"]),
    });
    res.status(201).json({ success: true });
  } catch (err) {
    console.error("site-event create error:", err);
    res.status(500).end();
  }
});

function dayKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Per-day counts for one metric; `distinctField` counts unique values per day instead of documents.
async function dailySeries(Model, match, distinctField) {
  const group = distinctField
    ? [
        { $group: { _id: { day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, v: `$${distinctField}` } } },
        { $group: { _id: "$_id.day", count: { $sum: 1 } } },
      ]
    : [{ $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } }];
  const rows = await Model.aggregate([{ $match: match }, ...group]);
  return Object.fromEntries(rows.map((r) => [r._id, r.count]));
}

async function distinctCount(Model, match, field) {
  const rows = await Model.aggregate([{ $match: match }, { $group: { _id: `$${field}` } }, { $count: "n" }]);
  return rows[0]?.n || 0;
}

async function computeMetrics(from, to) {
  const createdAt = { $gte: from, $lt: to };
  const pv = { type: "pageview", createdAt };
  const clickMatch = { createdAt, userRole: { $in: ["student", ""] }, pagePath: { $not: EXCLUDED_PATH } };
  const topicMatch = { ...pv, pagePath: { $regex: "^/learn/topic/" } };
  const signupMatch = { createdAt, role: { $in: ["student", null] } };

  const [uniqueVisitors, pageViews, linkVisits, clicks, logins, signups, topicViews, purchaseAttempts] =
    await Promise.all([
      distinctCount(SiteEvent, pv, "sessionId"),
      SiteEvent.countDocuments(pv),
      SiteEvent.countDocuments({ ...pv, isCampaign: true }),
      UiClickEvent.countDocuments(clickMatch),
      SiteEvent.countDocuments({ type: "login", createdAt }),
      User.countDocuments(signupMatch),
      SiteEvent.countDocuments(topicMatch),
      Payment.countDocuments({ createdAt }),
    ]);

  return {
    totals: { uniqueVisitors, pageViews, linkVisits, clicks, logins, signups, topicViews, purchaseAttempts },
    matches: { pv, clickMatch, topicMatch, signupMatch, createdAt },
  };
}

router.get("/admin/overview", requireAuth, async (req, res) => {
  try {
    if (String(req.user?.role || "").toLowerCase() !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const days = [7, 30, 90].includes(Number(req.query.days)) ? Number(req.query.days) : 7;
    const to = new Date();
    to.setHours(24, 0, 0, 0);
    const from = new Date(to);
    from.setDate(from.getDate() - days);
    const prevFrom = new Date(from);
    prevFrom.setDate(prevFrom.getDate() - days);

    const [current, previous, onlineNow] = await Promise.all([
      computeMetrics(from, to),
      computeMetrics(prevFrom, from),
      SiteEvent.distinct("sessionId", { createdAt: { $gte: new Date(Date.now() - ONLINE_WINDOW_MS) } }),
    ]);

    const m = current.matches;
    const [uv, pvs, lv, cl, lg, su, tv, pa] = await Promise.all([
      dailySeries(SiteEvent, m.pv, "sessionId"),
      dailySeries(SiteEvent, m.pv),
      dailySeries(SiteEvent, { ...m.pv, isCampaign: true }),
      dailySeries(UiClickEvent, m.clickMatch),
      dailySeries(SiteEvent, { type: "login", createdAt: m.createdAt }),
      dailySeries(User, m.signupMatch),
      dailySeries(SiteEvent, m.topicMatch),
      dailySeries(Payment, { createdAt: m.createdAt }),
    ]);

    const series = [];
    for (let d = new Date(from); d < to; d.setDate(d.getDate() + 1)) {
      const k = dayKey(d);
      series.push({
        date: k,
        uniqueVisitors: uv[k] || 0,
        pageViews: pvs[k] || 0,
        linkVisits: lv[k] || 0,
        clicks: cl[k] || 0,
        logins: lg[k] || 0,
        signups: su[k] || 0,
        topicViews: tv[k] || 0,
        purchaseAttempts: pa[k] || 0,
      });
    }

    const pv = m.pv;
    const ownHost = (() => {
      try {
        return new URL(req.headers.origin || req.headers.referer || "").hostname;
      } catch {
        return "";
      }
    })();

    const [sessionsInRange, priorSessions, deviceRows, pageRows, refRows, signedIn, topicSessions, sessionDays] =
      await Promise.all([
        SiteEvent.distinct("sessionId", pv),
        SiteEvent.distinct("sessionId", { type: "pageview", createdAt: { $lt: from } }),
        SiteEvent.aggregate([
          { $match: { ...pv, device: { $ne: "" } } },
          { $sort: { createdAt: 1 } },
          { $group: { _id: "$sessionId", device: { $last: "$device" } } },
          { $group: { _id: "$device", count: { $sum: 1 } } },
        ]),
        SiteEvent.aggregate([{ $match: pv }, { $group: { _id: "$pagePath", count: { $sum: 1 } } }]),
        SiteEvent.aggregate([
          { $match: pv },
          { $sort: { createdAt: 1 } },
          { $group: { _id: "$sessionId", referrer: { $first: "$referrer" } } },
        ]),
        SiteEvent.distinct("userId", { createdAt: m.createdAt, userId: { $ne: null } }),
        SiteEvent.distinct("sessionId", m.topicMatch),
        SiteEvent.aggregate([
          { $match: pv },
          { $group: { _id: { s: "$sessionId", d: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } } } },
          { $count: "n" },
        ]),
      ]);

    const prior = new Set(priorSessions);
    const returning = sessionsInRange.filter((sid) => prior.has(sid)).length;

    const devices = { desktop: 0, mobile: 0, tablet: 0 };
    deviceRows.forEach((r) => {
      if (r._id in devices) devices[r._id] = r.count;
    });

    const pages = {};
    pageRows.forEach((r) => {
      const name = pageName(r._id);
      pages[name] = (pages[name] || 0) + r.count;
    });
    const topPages = Object.entries(pages)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Referrers from our own domain are internal navigation, i.e. direct traffic.
    const sources = {};
    refRows.forEach((r) => {
      let ref = r.referrer;
      try {
        if (ref && ownHost && new URL(ref).hostname === ownHost) ref = "";
      } catch {
        // keep as-is
      }
      const name = sourceFromReferrer(ref);
      sources[name] = (sources[name] || 0) + 1;
    });
    const trafficSources = Object.entries(sources)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const [campaignRows, clickRows] = await Promise.all([
      SiteEvent.find({ ...pv, isCampaign: true }).select("pagePath").lean(),
      UiClickEvent.aggregate([
        { $match: m.clickMatch },
        { $group: { _id: "$buttonLabel", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
    ]);

    const campaigns = {};
    campaignRows.forEach((r) => {
      const name = campaignName(r.pagePath);
      campaigns[name] = (campaigns[name] || 0) + 1;
    });
    const campaignLinks = Object.entries(campaigns)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
    const mostClicked = clickRows.map((r) => ({ name: r._id || "Unlabeled", count: r.count }));

    // Heatmap is bucketed in the admin's own timezone so "11:00" means their local 11:00.
    let tz = String(req.query.tz || "UTC");
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: tz });
    } catch {
      tz = "UTC";
    }

    const [heatRows, newsletterDaily, leads, paidUsers] = await Promise.all([
      SiteEvent.aggregate([
        { $match: pv },
        {
          $group: {
            _id: {
              dow: { $dayOfWeek: { date: "$createdAt", timezone: tz } },
              hour: { $hour: { date: "$createdAt", timezone: tz } },
            },
            count: { $sum: 1 },
          },
        },
      ]),
      dailySeries(Newsletter, { createdAt: m.createdAt }),
      Registration.find({ createdAt: m.createdAt }).select("status userId").lean(),
      Payment.distinct("user", { status: "paid" }),
    ]);

    // Mongo $dayOfWeek: 1 = Sunday … 7 = Saturday; we want Monday-first rows.
    const heatmap = Array.from({ length: 7 }, () => Array(24).fill(0));
    heatRows.forEach((r) => {
      heatmap[(r._id.dow + 5) % 7][r._id.hour] = r.count;
    });

    const newsletter = [];
    for (let d = new Date(from); d < to; d.setDate(d.getDate() + 1)) {
      const k = dayKey(d);
      newsletter.push({ date: k, count: newsletterDaily[k] || 0 });
    }

    const paid = new Set(paidUsers.map(String));
    const leadFunnel = [
      { label: "Leads captured", count: leads.length },
      { label: "Contacted", count: leads.filter((l) => ["contacted", "closed"].includes(l.status)).length },
      { label: "Qualified", count: leads.filter((l) => l.status === "closed").length },
      { label: "Converted", count: leads.filter((l) => l.userId && paid.has(String(l.userId))).length },
    ];

    const t = current.totals;
    const funnel = [
      { label: "Visited the site", count: t.uniqueVisitors },
      { label: "Viewed a topic", count: topicSessions.length },
      { label: "Logged in or signed up", count: t.logins + t.signups },
      { label: "Started a purchase", count: t.purchaseAttempts },
    ];

    res.json({
      funnel,
      audience: {
        visitors: sessionsInRange.length,
        devices,
        newVisitors: sessionsInRange.length - returning,
        returning,
        signedIn: signedIn.length,
        sessions: sessionDays[0]?.n || 0,
      },
      topPages,
      trafficSources,
      campaignLinks,
      mostClicked,
      heatmap,
      newsletter,
      leadFunnel,
      days,
      onlineNow: onlineNow.filter(Boolean).length,
      totals: current.totals,
      previous: previous.totals,
      series,
    });
  } catch (err) {
    console.error("site-event overview error:", err);
    res.status(500).json({ message: "Failed to load analytics" });
  }
});

export default router;
