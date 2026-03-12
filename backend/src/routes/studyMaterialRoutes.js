import express from "express";
import StudyMaterial from "../models/StudyMaterial.js";
import uploadPdf from "../middleware/uploadPdf.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import cloudinary from "../config/cloudinary.js";
import crypto from "crypto";
import { razorpay } from "../utils/razorpay.js";
import User from "../models/User.js";
import Purchase from "../models/Purchase.js";
import Package from "../models/Package.js";
import Subscription from "../models/Subscription.js";
import { sendPurchaseConfirmationEmail } from "../utils/sendMail.js";

const router = express.Router();

function getMaterialPrice(material) {
  return Number(material?.price || 0);
}

function isMaterialFree(material) {
  return Boolean(material?.isFree) && getMaterialPrice(material) <= 0;
}

function getAccessLevel(material) {
  const raw = String(material?.accessLevel || "").toLowerCase();
  if (["free", "limited", "premium"].includes(raw)) return raw;
  return isMaterialFree(material) ? "free" : "premium";
}

function canPackageAccessLevel(studyAccess, accessLevel) {
  if (accessLevel === "free") return true;
  if (studyAccess === "full") return true;
  if (studyAccess === "limited" && accessLevel === "limited") return true;
  return false;
}

function normalizeAccessLevel(rawAccessLevel, rawIsFree) {
  const normalized = String(rawAccessLevel || "").toLowerCase();
  if (["free", "limited", "premium"].includes(normalized)) return normalized;
  return rawIsFree === "true" ? "free" : "premium";
}

async function resolveStudyMaterialsAccessForUser(userDoc) {
  if (!userDoc) return "none";

  let activePackage = null;
  if (userDoc.activeSubscription) {
    const subscription = await Subscription.findById(userDoc.activeSubscription)
      .populate("package")
      .lean();
    activePackage = subscription?.package || null;
  }

  if (!activePackage) {
    activePackage = await Package.findOne({ name: "Basic", isActive: true })
      .select("studyMaterialsAccess")
      .lean();
  }

  const resolved = String(activePackage?.studyMaterialsAccess || "none").toLowerCase();
  return ["none", "limited", "full"].includes(resolved) ? resolved : "none";
}

/**
 * ADMIN & TEACHER → Upload Study Material PDF
 */
router.post(
  "/upload",
  requireAuth,
  async (req, res, next) => {
    // Allow both admin and teacher roles
    const user = req.user;
    if (user.role !== "admin" && user.role !== "teacher") {
      return res.status(403).json({ message: "Access denied. Only admins and teachers can upload materials." });
    }

    // Check if teacher is verified
    if (user.role === "teacher" && !user.isTeacherVerified) {
      return res.status(403).json({ message: "Teacher verification required. Please complete verification to upload materials." });
    }

    next();
  },
  uploadPdf.single("pdf"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "PDF file is required" });
      }

      const material = await StudyMaterial.create({
        ...(function () {
          const normalizedPrice = Math.max(0, Number(req.body.price || 0));
          const accessLevel = normalizeAccessLevel(req.body.accessLevel, req.body.isFree);
          return {
            accessLevel,
            isFree: accessLevel === "free",
            price: accessLevel === "free" ? 0 : normalizedPrice,
          };
        })(),
        title: req.body.title,
        class: req.body.class,
        board: req.body.board,
        subject: req.body.subject,
        category: req.body.category || "Notes",

        pdfUrl: req.file.path, // ✅ Cloudinary secure_url
        pdfPublicId: req.file.filename, // ✅ needed for delete

        createdBy: req.user.id,
      });

      res.status(201).json(material);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "PDF upload failed" });
    }
  }
);

/**
 * STUDENT → List materials
 */
/**
 * STUDENT → List materials (by class, board, subject)
 * PROTECTED (student must be logged in)
 */
// router.get("/", requireAuth, async (req, res) => {
//   try {
//     // ✅ take class directly from logged-in user
//     const studentClass = req.user.class || req.user.className;

//     if (!studentClass) {
//       return res.status(400).json({ message: "Student class not found" });
//     }

//     const materials = await StudyMaterial.find({
//       class: studentClass,
//     }).sort({ createdAt: -1 });

//     res.json(materials);
//   } catch (err) {
//     console.error("FETCH MATERIALS ERROR:", err);
//     res.status(500).json({ message: "Failed to fetch materials" });
//   }
// });

router.get("/", requireAuth, async (req, res) => {
  try {
    const studentClass = req.user.class || req.user.className;
    const studentBoard = req.user.board;

    if (!studentClass) {
      return res.status(400).json({ message: "Student class not found" });
    }

    // ✅ build dynamic filter
    const filter = {
      class: studentClass,
    };

    // ✅ board filter (important)
    if (studentBoard) {
      filter.board = studentBoard;
    }

    // ✅ subject filter (from frontend buttons)
    if (req.query.subject && req.query.subject !== "All") {
      filter.subject = req.query.subject;
    }

    // console.log("📘 STUDY MATERIAL FILTER:", filter);

    const materials = await StudyMaterial.find(filter).sort({
      createdAt: -1,
    }).lean();

    const userDoc = await User.findById(req.user.id)
      .select("purchasedMaterials activeSubscription role")
      .lean();
    const studyAccess =
      String(userDoc?.role || "").toLowerCase() === "student"
        ? await resolveStudyMaterialsAccessForUser(userDoc)
        : "full";
    const purchasedSet = new Set((userDoc?.purchasedMaterials || []).map((id) => String(id)));

    const normalizedMaterials = materials.map((m) => ({
      ...m,
      accessLevel: getAccessLevel(m),
      price: getMaterialPrice(m),
      isFree: isMaterialFree(m),
      canAccess: (function () {
        const accessLevel = getAccessLevel(m);
        return (
          canPackageAccessLevel(studyAccess, accessLevel) ||
          purchasedSet.has(String(m._id))
        );
      })(),
    }));

    res.json(normalizedMaterials);
  } catch (err) {
    console.error("FETCH MATERIALS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch materials" });
  }
});


router.get("/secure-pdf/:id", requireAuth, async (req, res) => {
  const material = await StudyMaterial.findById(req.params.id);
  const user = await User.findById(req.user.id);
  if (!material || !user) {
    return res.status(404).json({ message: "Not found" });
  }

  let studyAccess = "none";
  if (String(user.role || "").toLowerCase() === "student") {
    studyAccess = await resolveStudyMaterialsAccessForUser(user);
  } else {
    studyAccess = "full";
  }

  const materialAccessLevel = getAccessLevel(material);

  if (!canPackageAccessLevel(studyAccess, materialAccessLevel) &&
    !user.purchasedMaterials.includes(material._id)) {
    return res.status(403).json({ message: "Access denied" });
  }

  res.redirect(material.pdfUrl); // or stream file
});

router.put(
  "/:id",
  requireAuth,
  async (req, res, next) => {
    // Allow both admin and teacher roles
    const user = req.user;
    if (user.role !== "admin" && user.role !== "teacher") {
      return res.status(403).json({ message: "Access denied." });
    }

    // Check if teacher is verified
    if (user.role === "teacher" && !user.isTeacherVerified) {
      return res.status(403).json({ message: "Teacher verification required." });
    }

    next();
  },
  uploadPdf.single("pdf"),
  async (req, res) => {
    try {
      const material = await StudyMaterial.findById(req.params.id);
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }

      const role = String(req.user?.role || "").toLowerCase();
      if (role === "teacher" && String(material.createdBy) !== String(req.user.id)) {
        return res.status(403).json({ message: "You can only update your own materials." });
      }

      // Update text fields
      material.title = req.body.title;
      material.class = req.body.class;
      material.board = req.body.board;
      material.subject = req.body.subject;
      material.category = req.body.category || material.category;
      const normalizedPrice = Math.max(0, Number(req.body.price || 0));
      const accessLevel = normalizeAccessLevel(req.body.accessLevel, req.body.isFree);
      material.accessLevel = accessLevel;
      material.isFree = accessLevel === "free";
      material.price = accessLevel === "free" ? 0 : normalizedPrice;

      // 🔥 Only replace PDF if a new one is uploaded
      if (req.file) {
        if (material.pdfPublicId) {
          await cloudinary.uploader.destroy(material.pdfPublicId, {
            resource_type: "raw",
          });
        }

        material.pdfUrl = req.file.path;
        material.pdfPublicId = req.file.filename;
      }

      await material.save();
      res.json(material);
    } catch (err) {
      console.error("UPDATE ERROR:", err);
      res.status(500).json({ message: "Update failed" });
    }
  }
);

// public route
// router.get("/", async (req, res) => {
//   try {
//     const materials = await StudyMaterial.find();
//     res.json(materials);
//   } catch (err) {
//     res.status(500).json({ message: "Failed to fetch materials" });
//   }
// });

/* ADMIN → list all materials */
router.get("/admin/all", requireAuth, requireAdmin, async (req, res) => {
  const role = String(req.user?.role || "").toLowerCase();
  const filter = role === "teacher" ? { createdBy: req.user.id } : {};
  const materials = await StudyMaterial.find(filter)
    .populate("createdBy", "name email role")
    .sort({ createdAt: -1 });
  res.json(materials);
});

/* ADMIN → delete material */
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const material = await StudyMaterial.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }

    const role = String(req.user?.role || "").toLowerCase();
    if (role === "teacher" && String(material.createdBy) !== String(req.user.id)) {
      return res.status(403).json({ message: "You can only delete your own materials." });
    }

    // ✅ Safely attempt Cloudinary delete
    if (material.pdfPublicId) {
      try {
        await cloudinary.uploader.destroy(material.pdfPublicId, {
          resource_type: "raw",
        });
      } catch (cloudErr) {
        console.warn("Cloudinary delete failed, continuing:", cloudErr.message);
        // DO NOT crash delete
      }
    }

    await material.deleteOne();

    res.json({ message: "Material deleted successfully" });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ message: "Delete failed" });
  }
});

// router.post("/create-order", requireAuth, async (req, res) => {
//   try {
//     const { materialId } = req.body;

//     if (!materialId) {
//       return res.status(400).json({ message: "materialId is required" });
//     }

//     const material = await StudyMaterial.findById(materialId);
//     if (!material) {
//       return res.status(404).json({ message: "Study material not found" });
//     }

//     const receipt = `mat_${material._id.toString().slice(-6)}_${Date.now()
//       .toString()
//       .slice(-6)}`;

//     const order = await razorpay.orders.create({
//       amount: material.price * 100,
//       currency: "INR",
//       receipt,
//     });

//     return res.json({
//       orderId: order.id,
//       amount: order.amount,
//       currency: order.currency,
//       key: process.env.RAZORPAY_KEY_ID,
//     });
//   } catch (err) {
//     console.error("CREATE ORDER ERROR:", err);
//     return res.status(500).json({ message: "Failed to create order" });
//   }
// });

// studyMaterialRoutes.js

router.post("/create-order", requireAuth, async (req, res) => {
  try {
    const { materialId } = req.body;

    const user = await User.findById(req.user.id);
    if (user.purchasedMaterials.includes(materialId)) {
      return res.status(400).json({ message: "Already purchased" });
    }

    const material = await StudyMaterial.findById(materialId);
    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }

    const studyAccess = await resolveStudyMaterialsAccessForUser(user);
    const materialLevel = getAccessLevel(material);
    if (canPackageAccessLevel(studyAccess, materialLevel)) {
      return res.status(400).json({ message: "This material is already unlocked by your package" });
    }

    if (materialLevel === "free") {
      return res.status(400).json({ message: "This material is free and does not require payment" });
    }

    const receipt = `mat_${material._id.toString().slice(-6)}_${Date.now()
      .toString()
      .slice(-6)}`;

    const order = await razorpay.orders.create({
      amount: material.price * 100,
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
    console.error("CREATE ORDER ERROR:", err);
    res.status(500).json({ message: "Failed to create order" });
  }
});

router.post("/verify-payment", requireAuth, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      materialId,
    } = req.body;

    // Get user and material details first
    const user = await User.findById(req.user.id);
    const material = await StudyMaterial.findById(materialId);

    if (!user || !material) {
      return res.status(404).json({ message: "User or Material not found" });
    }

    const studyAccess = await resolveStudyMaterialsAccessForUser(user);
    const materialLevel = getAccessLevel(material);
    if (canPackageAccessLevel(studyAccess, materialLevel)) {
      return res.status(400).json({ message: "This material is already unlocked by your package" });
    }

    if (materialLevel === "free") {
      return res.status(400).json({ message: "This material is free and does not require payment" });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      // Payment verification failed - save as failed transaction
      const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      await Purchase.create({
        user: user._id,
        material: material._id,
        amount: material.price,
        paymentMethod: "Razorpay",
        transactionId: razorpay_payment_id || `FAILED_${Date.now()}`,
        invoiceNumber: invoiceNumber,
        status: "failed",
      });

      return res.status(400).json({ message: "Payment verification failed" });
    }

    // Update user's purchased materials
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { purchasedMaterials: materialId },
    });

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Create purchase record
    await Purchase.create({
      user: user._id,
      material: material._id,
      amount: material.price,
      paymentMethod: "Razorpay",
      transactionId: razorpay_payment_id,
      invoiceNumber: invoiceNumber,
      status: "completed",
    });

    // Send purchase confirmation email
    sendPurchaseConfirmationEmail({
      to: user.email,
      name: user.name,
      materialTitle: material.title,
      materialSubject: material.subject,
      materialClass: material.class,
      amount: material.price,
      paymentMethod: "Razorpay",
      transactionId: razorpay_payment_id,
      purchaseDate: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      userEmail: user.email,
      userPhone: user.phone || "N/A",
    }).catch((err) =>
      console.error("Purchase confirmation email failed:", err?.message)
    );

    res.json({ success: true });
  } catch (err) {
    console.error("VERIFY PAYMENT ERROR:", err);
    res.status(500).json({ message: "Payment verification failed" });
  }
});

// Purchase with wallet
router.post("/purchase-with-wallet", requireAuth, async (req, res) => {
  try {
    const { materialId } = req.body;

    if (!materialId) {
      return res.status(400).json({ message: "materialId is required" });
    }

    // Get user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already purchased
    if (user.purchasedMaterials.includes(materialId)) {
      return res.status(400).json({ message: "Already purchased this material" });
    }

    // Get material
    const material = await StudyMaterial.findById(materialId);
    if (!material) {
      return res.status(404).json({ message: "Study material not found" });
    }

    const studyAccess = await resolveStudyMaterialsAccessForUser(user);
    const materialLevel = getAccessLevel(material);
    if (canPackageAccessLevel(studyAccess, materialLevel)) {
      return res.status(400).json({ message: "This material is already unlocked by your package" });
    }

    if (materialLevel === "free") {
      return res.status(400).json({ message: "This material is free and does not require payment" });
    }

    // Check if wallet has sufficient balance
    const walletBalance = user.wallet || 0;
    if (walletBalance < material.price) {
      // Save failed transaction due to insufficient balance
      const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const walletTransactionId = `WALLET_FAILED_${Date.now()}_${user._id.toString().slice(-6)}`;

      await Purchase.create({
        user: user._id,
        material: material._id,
        amount: material.price,
        paymentMethod: "Wallet",
        transactionId: walletTransactionId,
        invoiceNumber: invoiceNumber,
        status: "failed",
      });

      return res.status(400).json({
        message: `Insufficient wallet balance. Required: ₹${material.price}, Available: ₹${walletBalance}`,
      });
    }

    // Deduct from wallet
    user.wallet = walletBalance - material.price;

    // Add to purchased materials
    user.purchasedMaterials.push(materialId);

    // Save user
    await user.save();

    // Generate transaction ID for wallet purchase
    const walletTransactionId = `WALLET_${Date.now()}_${user._id.toString().slice(-6)}`;

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create purchase record
    await Purchase.create({
      user: user._id,
      material: material._id,
      amount: material.price,
      paymentMethod: "Wallet",
      transactionId: walletTransactionId,
      invoiceNumber: invoiceNumber,
      status: "completed",
    });

    // Send purchase confirmation email
    sendPurchaseConfirmationEmail({
      to: user.email,
      name: user.name,
      materialTitle: material.title,
      materialSubject: material.subject,
      materialClass: material.class,
      amount: material.price,
      paymentMethod: "Wallet",
      transactionId: walletTransactionId,
      purchaseDate: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      userEmail: user.email,
      userPhone: user.phone || "N/A",
    }).catch((err) =>
      console.error("Purchase confirmation email failed:", err?.message)
    );

    res.json({
      success: true,
      message: "Material purchased successfully",
      remainingWallet: user.wallet,
      purchasedMaterial: {
        id: material._id,
        title: material.title,
        price: material.price,
      },
    });
  } catch (err) {
    console.error("WALLET PURCHASE ERROR:", err);
    res.status(500).json({ message: "Failed to purchase with wallet" });
  }
});

// Admin: Get all purchases
router.get("/admin/purchases", requireAuth, requireAdmin, async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .populate("user", "name email phone")
      .populate("material", "title subject class price")
      .sort({ createdAt: -1 });

    res.json(purchases);
  } catch (err) {
    console.error("FETCH PURCHASES ERROR:", err);
    res.status(500).json({ message: "Failed to fetch purchases" });
  }
});

// Admin: Download invoice PDF
router.get("/admin/purchases/:id/invoice", requireAuth, requireAdmin, async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate("user", "name email phone")
      .populate("material", "title subject class price");

    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    const { generateInvoicePdf, deleteInvoicePdf } = await import("../utils/generateInvoicePdf.js");

    // Generate PDF
    const pdfPath = await generateInvoicePdf({
      name: purchase.user.name,
      materialTitle: purchase.material.title,
      materialSubject: purchase.material.subject,
      materialClass: purchase.material.class,
      amount: purchase.amount,
      paymentMethod: purchase.paymentMethod,
      transactionId: purchase.transactionId,
      purchaseDate: new Date(purchase.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      userEmail: purchase.user.email,
      userPhone: purchase.user.phone || "N/A",
      invoiceNumber: purchase.invoiceNumber,
    });

    // Send PDF file
    res.download(pdfPath, `${purchase.invoiceNumber}.pdf`, (err) => {
      // Clean up PDF after sending
      deleteInvoicePdf(pdfPath);

      if (err) {
        console.error("PDF download error:", err);
      }
    });
  } catch (err) {
    console.error("DOWNLOAD INVOICE ERROR:", err);
    res.status(500).json({ message: "Failed to download invoice" });
  }
});

export default router;
