import express from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import PrivacyPolicy from "../models/PrivacyPolicy.js";
import Newsletter from "../models/Newsletter.js";
import User from "../models/User.js";
import { sendPrivacyPolicyUpdateEmail } from "../utils/sendMail.js";

const router = express.Router();
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

async function notifyPrivacyPolicyUpdated({ lastUpdated }) {
  const [subscribers, users] = await Promise.all([
    Newsletter.find({ unsubscribed: false }).select("email").lean(),
    User.find({}).select("email").lean(),
  ]);

  const recipientSet = new Set();
  for (const row of [...subscribers, ...users]) {
    const email = normalizeEmail(row?.email);
    if (email) recipientSet.add(email);
  }

  const recipients = Array.from(recipientSet);
  if (!recipients.length) return 0;

  const policyUrl = `${CLIENT_ORIGIN || ""}/privacy-policy`;
  const batchSize = 20;

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    await Promise.allSettled(
      batch.map((to) =>
        sendPrivacyPolicyUpdateEmail({
          to,
          policyUrl,
          lastUpdated,
        })
      )
    );
  }

  return recipients.length;
}

// Public – get current policy (custom or signals to use default)
router.get("/", async (req, res) => {
  try {
    const doc = await PrivacyPolicy.findOne();
    if (!doc) return res.json({ useDefault: true });
    res.json(doc);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// Admin – save custom policy
router.put("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { useDefault, lastUpdated, introText, sections } = req.body;
    let doc = await PrivacyPolicy.findOne();
    if (!doc) {
      doc = new PrivacyPolicy({ useDefault, lastUpdated, introText, sections });
    } else {
      doc.useDefault  = Boolean(useDefault);
      doc.lastUpdated = String(lastUpdated || "").trim();
      doc.introText   = String(introText || "").trim();
      doc.sections    = Array.isArray(sections) ? sections : doc.sections;
    }
    await doc.save();

    // Send update notification in background so policy save is not blocked by mail latency.
    notifyPrivacyPolicyUpdated({ lastUpdated: doc.lastUpdated }).catch((err) => {
      console.error("Privacy policy update email broadcast failed:", err?.message || err);
    });

    res.json(doc);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
