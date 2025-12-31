// src/routes/users.js
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { listStudents } from "../controllers/users.js";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import { autoPromoteStudent } from "../utils/autoPromoteStudent.js";
import Redemption from "../models/Redemption.js";
import GiftCard from "../models/GiftCard.js";
import { sendGiftCardEmail } from "../utils/sendMail.js";

const router = Router();

// Allow admin AND teacher. We gate with requireAuth, then manual role check.

router.get("/students-count", async (req, res) => {
  try {
    const students = await User.find({ role: "student" }).select(
      "name email phone createdAt"
    );

    res.json({ students }); // 🔥 IMPORTANT → must return { students: [...] }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/teachers-count", async (req, res) => {
  try {
    const teachers = await User.find({ role: "teacher" }).select(
      "name email phone createdAt"
    );

    res.json({ teachers }); // 🔥 IMPORTANT → must return { teachers: [...] }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// router.get(
//   "/students",
//   requireAuth,
//   (req, res, next) => {
//     if (!["admin", "teacher"].includes(req.user?.role)) {
//       return res.status(403).json({ message: "Forbidden" });
//     }
//     next();
//   },
//   listStudents
// );

router.get(
  "/students",
  requireAuth,
  (req, res, next) => {
    if (!["admin", "teacher"].includes(req.user?.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  },
  async (req, res) => {
    try {
      const q = req.query.q?.trim() || "";

      let filter = { role: "student" };

      if (q) {
        filter.$or = [
          { name: { $regex: q, $options: "i" } },
          { email: { $regex: q, $options: "i" } },
          { phone: { $regex: q, $options: "i" } },
          { class: { $regex: q, $options: "i" } },
        ];
      }

      // ⭐ RETURN ALL FIELDS
      const students = await User.find(filter).select("-password");

      res.json({ students });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

router.get("/teachers", async (req, res) => {
  try {
    const q = req.query.q?.trim() || "";
    const filter = { role: "teacher" };

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
      ];
    }

    const teachers = await User.find(filter).sort({ name: 1 });
    res.json({ teachers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/teachers", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already exists." });
    }

    // Hash password BEFORE saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      phone,
      password: hashedPassword, // 🔐 hashed password
      role: "teacher",
    });

    await user.save();
    res.json({ message: "Teacher created successfully.", teacher: user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update teacher
router.put("/teachers/:id", async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    const teacher = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, phone },
      { new: true }
    );

    res.json({ message: "Teacher updated.", teacher });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete teacher
router.delete("/teachers/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Teacher deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============
// Old Profile Routes
// =============== //
// router.get("/profile", async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id).select("-password");
//     res.json({ user });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// =============
// Old Profile Routes 2.0
// =============== //
// router.get("/profile", requireAuth, async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id).select("-password");

//     if (!user) return res.status(404).json({ message: "User not found" });

//     // MAP "class" → "className"
//     const mapped = {
//       ...user._doc,
//       className: user.className || user.class || "",
//     };

//     res.json({ user: mapped });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

router.get("/profile", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    /* ---------------- AUTO PROMOTION ---------------- */
    // const promoted = autoPromoteStudent(user);
    // if (promoted) {
    //   await user.save(); // save only if promotion happened
    // }

    const mappedUser = {
      ...user._doc,

      // Fix class → className
      className: user.className || user.class || "",
      board: user.board || "",

      // Ensure missing fields exist
      gender: user.gender || "",
      dob: user.dob || "",
      address: user.address || "",
      department: user.department || "",
      bio: user.bio || "",
      avatar: user.avatar || "",
      username: user.username || "",
      language: user.language || "en",
      emailNotifications: user.emailNotifications ?? true,
      smsNotifications: user.smsNotifications ?? false,
      pushNotifications: user.pushNotifications ?? true,
      lastPromotedYear: user.lastPromotedYear || null,
    };

    res.json({ user: mappedUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ============================
//   UPDATE USER PROFILE OLD
// ============================

// router.put("/update-profile", async (req, res) => {
//   try {
//     const { name, phone } = req.body;

//     const updated = await User.findByIdAndUpdate(
//       req.user.id,
//       { name, phone },
//       { new: true }
//     ).select("-password");

//     res.json({ message: "Updated", user: updated });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// ============================
//   UPDATE USER PROFILE 2.0
// ============================
// router.put("/update-profile", requireAuth, async (req, res) => {
//   try {
//     const allowedFields = [
//       "name",
//       "email",
//       "phone",
//       "gender",
//       "dob",
//       "address",
//       "className",
//       "department",
//       "bio",
//       "avatar",
//       "username",
//       "language",
//       "emailNotifications",
//       "smsNotifications",
//       "pushNotifications",
//     ];

//     if (req.body.className !== undefined) {
//       updateData.class = req.body.className; // Save in DB
//       updateData.className = req.body.className; // Keep consistency
//     }

//     let updateData = {};

//     allowedFields.forEach((f) => {
//       if (req.body[f] !== undefined) updateData[f] = req.body[f];
//     });

//     const updated = await User.findByIdAndUpdate(req.user.id, updateData, {
//       new: true,
//     }).select("-password");

//     res.json({
//       message: "Profile updated successfully",
//       user: updated,
//     });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

router.put("/update-profile", requireAuth, async (req, res) => {
  try {
    delete req.body.points;
    const allowedFields = [
      "name",
      "email",
      "phone",
      "gender",
      "dob",
      "address",
      "className",
      "department",
      "bio",
      "avatar",
      "username",
      "language",
      "emailNotifications",
      "smsNotifications",
      "pushNotifications",
      "fatherName",
      "fatherOccupation",
      "motherName",
      "motherOccupation",
      "fatherContact",
      "motherContact",
    ];

    let updateData = {};

    // Add allowed fields
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Special handling: Save className into "class" for old DB compatibility
    if (req.body.className !== undefined) {
      updateData.class = req.body.className;
    }

    const updated = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
    }).select("-password");

    // Map again before sending to frontend
    const mappedUser = {
      ...updated._doc,
      className: updated.className || updated.class || "",
    };

    res.json({
      message: "Profile updated successfully",
      user: mappedUser,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/change-password", requireAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Old password and new password are required" });
    }

    const user = await User.findById(req.user.id);

    // Check old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    user.password = hashed;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// routes/users.js
router.get("/me/purchased", requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id).select("purchasedMaterials");
  res.json(user?.purchasedMaterials || []);
});

// ============================
//   COIN REDEMPTION ENDPOINTS
// ============================

// Helper function to generate gift card code
function generateGiftCardCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "AMZ-";
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Redeem coins for cash or gift card
router.post("/redeem-coins", requireAuth, async (req, res) => {
  try {
    const { type, amount, coinsUsed } = req.body;

    // Validate input
    if (!type || !amount || !coinsUsed) {
      return res.status(400).json({
        message: "Type, amount, and coins used are required"
      });
    }

    if (!["cash", "giftcard"].includes(type)) {
      return res.status(400).json({
        message: "Invalid redemption type"
      });
    }

    // Get user
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user has enough coins
    if (user.points < coinsUsed) {
      return res.status(400).json({
        message: "Insufficient coins for this redemption"
      });
    }

    let redemption;
    let description = "";

    if (type === "cash") {
      // Cash redemption for study materials
      // Conversion: 10 coins = ₹0.50, so 20 coins = ₹1
      const expectedCoins = Math.ceil(amount * 20);

      if (coinsUsed < expectedCoins) {
        return res.status(400).json({
          message: `Insufficient coins. Required: ${expectedCoins} coins for ₹${amount}`
        });
      }

      // Deduct coins from user
      user.points -= coinsUsed;

      // Add amount to wallet
      user.wallet = (user.wallet || 0) + amount;

      description = `Redeemed ${coinsUsed} coins for ₹${amount} wallet credit`;

      // Create redemption record
      redemption = new Redemption({
        userId: user._id,
        type: "cash",
        amount: amount,
        coinsUsed: coinsUsed,
        status: "completed",
        description: description,
      });

      // Save user and redemption for cash type
      await user.save();
      await redemption.save();

    } else if (type === "giftcard") {
      // Gift card redemption using actual gift cards from database
      // Validate gift card amounts
      const validAmounts = [100, 250, 500, 1000];
      if (!validAmounts.includes(amount)) {
        return res.status(400).json({
          message: "Invalid gift card amount. Choose from: ₹100, ₹250, ₹500, ₹1000"
        });
      }

      // Expected coins: amount * 20 (since 10 coins = ₹0.50)
      const expectedCoins = amount * 20;

      if (coinsUsed < expectedCoins) {
        return res.status(400).json({
          message: `Insufficient coins. Required: ${expectedCoins} coins for ₹${amount} gift card`
        });
      }

      // ✅ Check if there's an available gift card in inventory
      const availableGiftCard = await GiftCard.findOne({
        amount: amount,
        status: "available",
        $or: [
          { expiryDate: null },
          { expiryDate: { $gt: new Date() } }
        ]
      }).sort({ createdAt: 1 }); // FIFO - First In First Out

      if (!availableGiftCard) {
        return res.status(400).json({
          message: `Sorry, no ₹${amount} gift cards available in inventory. Please try a different amount or contact support.`
        });
      }

      // Deduct coins from user
      user.points -= coinsUsed;

      description = `Redeemed ${coinsUsed} coins for Amazon ₹${amount} gift card`;

      // Create redemption record with pending status initially
      redemption = new Redemption({
        userId: user._id,
        type: "giftcard",
        amount: amount,
        coinsUsed: coinsUsed,
        status: "pending",
        giftCardCode: availableGiftCard.code,
        giftCardProvider: availableGiftCard.provider,
        description: description,
      });

      // Save user and redemption first
      await user.save();
      await redemption.save();

      // ✅ Mark the gift card as redeemed
      availableGiftCard.status = "redeemed";
      availableGiftCard.redeemedBy = user._id;
      availableGiftCard.redeemedAt = new Date();
      availableGiftCard.redemptionId = redemption._id;
      await availableGiftCard.save();

      // Send gift card email asynchronously
      try {
        await sendGiftCardEmail({
          to: user.email,
          name: user.name,
          giftCardCode: availableGiftCard.code,
          amount: amount,
          provider: availableGiftCard.provider,
          redemptionId: redemption._id.toString()
        });

        // Update redemption status to completed after email sent
        redemption.status = "completed";
        await redemption.save();

        console.log(`✅ Gift card email sent successfully to ${user.email} for ₹${amount}`);
      } catch (emailErr) {
        console.error("❌ Failed to send gift card email:", emailErr);

        // Mark as completed but log the email failure
        redemption.status = "completed";
        redemption.description += " (Email delivery pending)";
        await redemption.save();

        // Don't fail the entire request if email fails
        console.log(`⚠️ Gift card redeemed but email failed. Code: ${availableGiftCard.code}`);
      }
    }

    res.json({
      message: type === "cash"
        ? `Successfully redeemed ₹${amount} to your wallet!`
        : `Gift card redeemed! Code will be sent to ${user.email} within 24 hours.`,
      remainingPoints: user.points,
      wallet: user.wallet,
      redemption: {
        type: redemption.type,
        amount: redemption.amount,
        coinsUsed: redemption.coinsUsed,
        giftCardCode: redemption.giftCardCode,
        description: redemption.description,
      },
    });

  } catch (err) {
    console.error("Redeem coins error:", err);
    res.status(500).json({ message: "Failed to redeem coins" });
  }
});

// Get user's redemption history
router.get("/redemption-history", requireAuth, async (req, res) => {
  try {
    const redemptions = await Redemption.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ redemptions });
  } catch (err) {
    console.error("Redemption history error:", err);
    res.status(500).json({ message: "Failed to fetch redemption history" });
  }
});

// Get user's wallet balance
router.get("/wallet", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("wallet points");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      wallet: user.wallet || 0,
      points: user.points || 0,
    });
  } catch (err) {
    console.error("Get wallet error:", err);
    res.status(500).json({ message: "Failed to fetch wallet balance" });
  }
});

// Resend gift card email (Admin/Support)
router.post("/resend-gift-card-email/:redemptionId", requireAuth, async (req, res) => {
  try {
    // Get redemption
    const redemption = await Redemption.findById(req.params.redemptionId);

    if (!redemption) {
      return res.status(404).json({ message: "Redemption not found" });
    }

    // Check if it's a gift card redemption
    if (redemption.type !== "giftcard") {
      return res.status(400).json({ message: "This redemption is not a gift card" });
    }

    // Get user
    const user = await User.findById(redemption.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Only allow the user themselves or admin to resend
    if (req.user.id !== redemption.userId.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Send email
    await sendGiftCardEmail({
      to: user.email,
      name: user.name,
      giftCardCode: redemption.giftCardCode,
      amount: redemption.amount,
      provider: redemption.giftCardProvider,
      redemptionId: redemption._id.toString()
    });

    // Update description to remove pending note if it exists
    if (redemption.description.includes("(Email delivery pending)")) {
      redemption.description = redemption.description.replace(" (Email delivery pending)", "");
      await redemption.save();
    }

    console.log(`✅ Gift card email resent successfully to ${user.email}`);

    res.json({
      success: true,
      message: "Gift card email sent successfully"
    });

  } catch (err) {
    console.error("Resend gift card email error:", err);
    res.status(500).json({ message: "Failed to resend gift card email" });
  }
});

// Get pending gift card emails (Admin only - for monitoring)
router.get("/admin/pending-gift-cards", requireAuth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const pendingRedemptions = await Redemption.find({
      type: "giftcard",
      $or: [
        { status: "pending" },
        { description: { $regex: "Email delivery pending" } }
      ]
    })
    .populate("userId", "name email")
    .sort({ createdAt: -1 })
    .limit(50);

    res.json({ redemptions: pendingRedemptions });
  } catch (err) {
    console.error("Get pending gift cards error:", err);
    res.status(500).json({ message: "Failed to fetch pending gift cards" });
  }
});

// Check gift card availability (for users before redemption)
router.get("/gift-card-availability", requireAuth, async (req, res) => {
  try {
    const amounts = [100, 250, 500, 1000];
    const availability = {};

    for (const amount of amounts) {
      const count = await GiftCard.countDocuments({
        amount: amount,
        status: "available",
        $or: [
          { expiryDate: null },
          { expiryDate: { $gt: new Date() } }
        ]
      });

      availability[amount] = {
        available: count > 0,
        count: count,
      };
    }

    res.json({ availability });
  } catch (err) {
    console.error("Check gift card availability error:", err);
    res.status(500).json({ message: "Failed to check availability" });
  }
});

export default router;
