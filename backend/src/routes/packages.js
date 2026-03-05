import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import Package from "../models/Package.js";
import Subscription from "../models/Subscription.js";
import User from "../models/User.js";
import crypto from "crypto";
import { razorpay } from "../utils/razorpay.js";
import { sendSubscriptionInvoiceEmail } from "../utils/sendMail.js";

const router = Router();

// Get all active packages (public for students to see)
router.get("/", async (req, res) => {
  try {
    const packages = await Package.find({ isActive: true })
      .select("-createdBy")
      .sort({ price: 1 });

    res.json({ packages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single package
router.get("/:id", async (req, res) => {
  try {
    const package_ = await Package.findById(req.params.id);
    if (!package_) {
      return res.status(404).json({ message: "Package not found" });
    }

    res.json({ package: package_ });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create package (admin only)
router.post("/", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const {
      name,
      displayName,
      description,
      price,
      duration,
      features,
      unlockedStages,
      studyMaterialsAccess,
      prioritySupport,
    } = req.body;

    const package_ = new Package({
      name,
      displayName,
      description,
      price,
      duration,
      features,
      unlockedStages,
      studyMaterialsAccess,
      prioritySupport,
      createdBy: req.user.id,
    });

    await package_.save();

    res.json({ message: "Package created successfully", package: package_ });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update package (admin only)
router.put("/:id", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const package_ = await Package.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!package_) {
      return res.status(404).json({ message: "Package not found" });
    }

    res.json({ message: "Package updated successfully", package: package_ });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete package (admin only)
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    await Package.findByIdAndDelete(req.params.id);

    res.json({ message: "Package deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Purchase package with Razorpay
router.post("/:id/purchase", requireAuth, async (req, res) => {
  try {
    const { paymentMethod, transactionId, coinsUsed } = req.body;

    const package_ = await Package.findById(req.params.id);
    if (!package_) {
      return res.status(404).json({ message: "Package not found" });
    }

    const user = await User.findById(req.user.id);

    if (package_.price > 0) {
      return res.status(400).json({ message: "Use Razorpay to purchase paid packages" });
    }

    if (paymentMethod !== "free") {
      return res.status(400).json({ message: "Only free packages can be activated without payment" });
    }

    // Calculate payment
    let amountPaid = package_.price;
    let finalCoinsUsed = 0;

    // If paying with coins (20 coins = ₹1)
    if (paymentMethod === "coins" && coinsUsed) {
      const coinValue = coinsUsed / 20; // 20 coins = ₹1
      if (user.points < coinsUsed) {
        return res.status(400).json({ message: "Insufficient coins" });
      }

      amountPaid = Math.max(0, package_.price - coinValue);
      finalCoinsUsed = coinsUsed;

      // Deduct coins
      user.points -= coinsUsed;
    }

    // If paying with wallet
    if (paymentMethod === "wallet") {
      if (user.wallet < amountPaid) {
        return res.status(400).json({ message: "Insufficient wallet balance" });
      }

      user.wallet -= amountPaid;
    }

    // Create subscription
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + package_.duration);

    const subscription = new Subscription({
      user: req.user.id,
      package: package_._id,
      packageName: package_.name,
      startDate,
      endDate,
      status: "active",
      paymentMethod,
      amountPaid,
      coinsUsed: finalCoinsUsed,
      transactionId: transactionId || "",
      unlockedStages: package_.unlockedStages,
      studyMaterialsAccess: package_.studyMaterialsAccess,
    });

    await subscription.save();

    // Update user subscription info
    user.activeSubscription = subscription._id;
    user.subscriptionType = package_.name;
    user.subscriptionEndDate = endDate;

    // Unlock stages
    const allStages = [...new Set([...user.unlockedStages, ...package_.unlockedStages])];
    user.unlockedStages = allStages.sort((a, b) => a - b);

    await user.save();

    const userInfo = await User.findById(req.user.id).select("name email phone");
    const purchaseDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });

    sendSubscriptionInvoiceEmail({
      to: userInfo.email,
      name: userInfo.name,
      packageName: package_.name,
      packageDisplayName: package_.displayName,
      duration: package_.duration,
      unlockedStages: package_.unlockedStages,
      studyMaterialsAccess: package_.studyMaterialsAccess,
      amount: amountPaid,
      paymentMethod: "Free",
      transactionId: transactionId || "FREE",
      purchaseDate,
      userEmail: userInfo.email,
      userPhone: userInfo.phone || "N/A",
      startDate,
      endDate,
    }).catch((err) =>
      console.error("Subscription invoice email failed:", err?.message)
    );

    res.json({
      message: "Package purchased successfully",
      subscription,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create Razorpay order for package purchase
router.post("/:id/create-order", requireAuth, async (req, res) => {
  try {
    const package_ = await Package.findById(req.params.id);
    if (!package_) {
      return res.status(404).json({ message: "Package not found" });
    }

    if (!package_.price || package_.price <= 0) {
      return res.status(400).json({ message: "Package is free" });
    }

    const receipt = `pkg_${package_._id.toString().slice(-6)}_${Date.now()
      .toString()
      .slice(-6)}`;

    const order = await razorpay.orders.create({
      amount: package_.price * 100,
      currency: "INR",
      receipt,
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("CREATE PACKAGE ORDER ERROR:", err);
    res.status(500).json({ message: "Failed to create order" });
  }
});

// Verify Razorpay payment and create subscription
router.post("/:id/verify-payment", requireAuth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const package_ = await Package.findById(req.params.id);
    if (!package_) {
      return res.status(404).json({ message: "Package not found" });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const user = await User.findById(req.user.id);

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + package_.duration);

    const subscription = new Subscription({
      user: req.user.id,
      package: package_._id,
      packageName: package_.name,
      startDate,
      endDate,
      status: "active",
      paymentMethod: "razorpay",
      amountPaid: package_.price,
      coinsUsed: 0,
      transactionId: razorpay_payment_id || "",
      unlockedStages: package_.unlockedStages,
      studyMaterialsAccess: package_.studyMaterialsAccess,
    });

    await subscription.save();

    user.activeSubscription = subscription._id;
    user.subscriptionType = package_.name;
    user.subscriptionEndDate = endDate;

    const allStages = [
      ...new Set([...(user.unlockedStages || []), ...package_.unlockedStages]),
    ];
    user.unlockedStages = allStages.sort((a, b) => a - b);

    await user.save();

    const userInfo = await User.findById(req.user.id).select("name email phone");
    const purchaseDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });

    sendSubscriptionInvoiceEmail({
      to: userInfo.email,
      name: userInfo.name,
      packageName: package_.name,
      packageDisplayName: package_.displayName,
      duration: package_.duration,
      unlockedStages: package_.unlockedStages,
      studyMaterialsAccess: package_.studyMaterialsAccess,
      amount: package_.price,
      paymentMethod: "Razorpay",
      transactionId: razorpay_payment_id || "",
      purchaseDate,
      userEmail: userInfo.email,
      userPhone: userInfo.phone || "N/A",
      startDate,
      endDate,
    }).catch((err) =>
      console.error("Subscription invoice email failed:", err?.message)
    );

    res.json({ message: "Payment verified", subscription });
  } catch (err) {
    console.error("VERIFY PACKAGE PAYMENT ERROR:", err);
    res.status(500).json({ message: "Payment verification failed" });
  }
});

export default router;
