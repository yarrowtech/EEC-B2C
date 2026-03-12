import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import Subscription from "../models/Subscription.js";
import User from "../models/User.js";

const router = Router();

// Get current user's active subscription
router.get("/current", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "activeSubscription subscriptionType subscriptionEndDate"
    );

    if (!user.activeSubscription) {
      return res.json({ subscription: null, hasActiveSubscription: false });
    }

    const subscription = await Subscription.findById(
      user.activeSubscription
    ).populate("package");

    // Check if subscription is expired
    if (subscription && new Date() > subscription.endDate) {
      subscription.status = "expired";
      await subscription.save();

      // Update user
      user.activeSubscription = null;
      user.subscriptionType = "none";
      user.subscriptionEndDate = null;
      await user.save();

      return res.json({ subscription: null, hasActiveSubscription: false });
    }

    res.json({
      subscription,
      hasActiveSubscription: true,
      subscriptionType: user.subscriptionType,
      endDate: user.subscriptionEndDate,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user's subscription history
router.get("/history", requireAuth, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user.id })
      .populate("package")
      .sort({ createdAt: -1 });

    res.json({ subscriptions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Cancel subscription
router.post("/:id/cancel", requireAuth, async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    if (subscription.user.toString() !== String(req.user.id)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    subscription.status = "cancelled";
    await subscription.save();

    // Update user
    const user = await User.findById(req.user.id);
    user.activeSubscription = null;
    user.subscriptionType = "none";
    user.subscriptionEndDate = null;
    await user.save();

    res.json({ message: "Subscription cancelled successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: Get all subscriptions
router.get("/all", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const subscriptions = await Subscription.find()
      .populate("user", "name email")
      .populate("package")
      .sort({ createdAt: -1 });

    res.json({ subscriptions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
