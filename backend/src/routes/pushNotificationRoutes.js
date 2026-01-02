import express from "express";
import webpush from "web-push";
import PushSubscription from "../models/PushSubscription.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Configure web-push with VAPID keys
// Generate keys with: npx web-push generate-vapid-keys
const vapidKeys = {
  publicKey:
    process.env.VAPID_PUBLIC_KEY ||
    "BC0eeJ-xVDt4gnRz6wkcPWqjfFUXYLm3fte5hZEU-q_cFWm8rgfdMYvu6R4A-bgMdQ4IlGRgmRlFDGHPdeAo5pw",
  privateKey: process.env.VAPID_PRIVATE_KEY || "ENlyeXIbgx1Sr9Zv6T0WzVvzmt7pDRxRHqIaCOYw6X0",
};

webpush.setVapidDetails(
  "mailto:admin@eec.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

/* ---------------- GET VAPID PUBLIC KEY ---------------- */
router.get("/vapid-public-key", (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

/* ---------------- SUBSCRIBE TO PUSH NOTIFICATIONS ---------------- */
router.post("/subscribe", requireAuth, async (req, res) => {
  try {
    const { endpoint, keys } = req.body;

    console.log("Subscribe request received:", { endpoint, keys: keys ? "present" : "missing", userId: req.user.id });

    if (!endpoint || !keys) {
      return res.status(400).json({ message: "Missing endpoint or keys" });
    }

    // Check if subscription already exists
    const existing = await PushSubscription.findOne({ endpoint });

    if (existing) {
      // Update userId if different
      if (existing.userId.toString() !== req.user.id) {
        existing.userId = req.user.id;
        await existing.save();
      }
      return res.json({ message: "Subscription already exists" });
    }

    // Create new subscription
    const subscription = await PushSubscription.create({
      userId: req.user.id,
      endpoint,
      keys,
    });

    console.log("Subscription created successfully");
    res.status(201).json({ message: "Subscribed successfully", subscription });
  } catch (error) {
    console.error("Push subscribe error:", error);
    console.error("Error details:", error.message);
    res.status(500).json({ message: "Failed to subscribe", error: error.message });
  }
});

/* ---------------- UNSUBSCRIBE FROM PUSH NOTIFICATIONS ---------------- */
router.post("/unsubscribe", requireAuth, async (req, res) => {
  try {
    const { endpoint } = req.body;

    await PushSubscription.deleteOne({ endpoint, userId: req.user.id });

    res.json({ message: "Unsubscribed successfully" });
  } catch (error) {
    console.error("Push unsubscribe error:", error);
    res.status(500).json({ message: "Failed to unsubscribe" });
  }
});

/* ---------------- SEND PUSH NOTIFICATION (HELPER) ---------------- */
export async function sendPushNotification(userId, title, message, notificationId = null) {
  try {
    // Get user's push subscriptions
    const subscriptions = await PushSubscription.find({ userId });

    if (subscriptions.length === 0) {
      return;
    }

    const payload = JSON.stringify({
      title,
      body: message,
      icon: "/logo_new.png",
      badge: "/logo_new.png",
      timestamp: Date.now(),
      notificationId,
      url: notificationId ? `/dashboard/notification/${notificationId}` : "/dashboard",
    });

    // Send to all subscriptions
    const promises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys.p256dh,
              auth: sub.keys.auth,
            },
          },
          payload
        );
      } catch (error) {
        console.error("Push send error:", error);
        // If subscription is invalid, remove it
        if (error.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: sub._id });
        }
      }
    });

    await Promise.all(promises);
  } catch (error) {
    console.error("Send push notification error:", error);
  }
}

export default router;
