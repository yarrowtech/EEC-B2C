import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import GiftCard from "../models/GiftCard.js";

const router = Router();

// ============================
//   ADMIN GIFT CARD MANAGEMENT
// ============================

/**
 * Add a new gift card to inventory
 * POST /api/gift-cards/add
 * Admin only
 */
router.post("/add", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { code, provider, amount, expiryDate, notes } = req.body;

    // Validate required fields
    if (!code || !amount) {
      return res.status(400).json({
        message: "Gift card code and amount are required",
      });
    }

    // Validate amount
    const validAmounts = [100, 250, 500, 1000];
    if (!validAmounts.includes(parseInt(amount))) {
      return res.status(400).json({
        message: "Invalid amount. Choose from: ₹100, ₹250, ₹500, ₹1000",
      });
    }

    // Check if gift card code already exists
    const existingCard = await GiftCard.findOne({ code: code.trim() });
    if (existingCard) {
      return res.status(400).json({
        message: "This gift card code already exists in the system",
      });
    }

    // Create new gift card
    const giftCard = new GiftCard({
      code: code.trim(),
      provider: provider || "Amazon",
      amount: parseInt(amount),
      addedBy: req.user.id,
      expiryDate: expiryDate || null,
      notes: notes || "",
      status: "available",
    });

    await giftCard.save();

    res.status(201).json({
      message: "Gift card added successfully",
      giftCard: {
        id: giftCard._id,
        code: giftCard.code,
        provider: giftCard.provider,
        amount: giftCard.amount,
        status: giftCard.status,
      },
    });
  } catch (err) {
    console.error("Add gift card error:", err);
    res.status(500).json({ message: "Failed to add gift card" });
  }
});

/**
 * Add multiple gift cards at once (bulk upload)
 * POST /api/gift-cards/bulk-add
 * Admin only
 */
router.post("/bulk-add", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { giftCards } = req.body;

    if (!Array.isArray(giftCards) || giftCards.length === 0) {
      return res.status(400).json({
        message: "Please provide an array of gift cards",
      });
    }

    const validAmounts = [100, 250, 500, 1000];
    const results = {
      success: [],
      failed: [],
    };

    for (const card of giftCards) {
      try {
        // Validate
        if (!card.code || !card.amount) {
          results.failed.push({
            code: card.code || "N/A",
            reason: "Missing code or amount",
          });
          continue;
        }

        if (!validAmounts.includes(parseInt(card.amount))) {
          results.failed.push({
            code: card.code,
            reason: "Invalid amount",
          });
          continue;
        }

        // Check for duplicates
        const exists = await GiftCard.findOne({ code: card.code.trim() });
        if (exists) {
          results.failed.push({
            code: card.code,
            reason: "Code already exists",
          });
          continue;
        }

        // Create gift card
        const newCard = new GiftCard({
          code: card.code.trim(),
          provider: card.provider || "Amazon",
          amount: parseInt(card.amount),
          addedBy: req.user.id,
          expiryDate: card.expiryDate || null,
          notes: card.notes || "",
          status: "available",
        });

        await newCard.save();
        results.success.push({
          code: newCard.code,
          amount: newCard.amount,
        });
      } catch (err) {
        results.failed.push({
          code: card.code || "N/A",
          reason: err.message,
        });
      }
    }

    res.json({
      message: `Bulk upload completed. ${results.success.length} added, ${results.failed.length} failed`,
      results,
    });
  } catch (err) {
    console.error("Bulk add gift cards error:", err);
    res.status(500).json({ message: "Failed to add gift cards" });
  }
});

/**
 * Get all gift cards (with filters)
 * GET /api/gift-cards/all
 * Admin only
 */
router.get("/all", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status, amount, provider } = req.query;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (amount) filter.amount = parseInt(amount);
    if (provider) filter.provider = provider;

    const giftCards = await GiftCard.find(filter)
      .populate("redeemedBy", "name email")
      .populate("addedBy", "name email")
      .sort({ createdAt: -1 });

    // Group by status for summary
    const summary = {
      available: giftCards.filter((c) => c.status === "available").length,
      redeemed: giftCards.filter((c) => c.status === "redeemed").length,
      expired: giftCards.filter((c) => c.status === "expired").length,
      total: giftCards.length,
    };

    res.json({
      giftCards,
      summary,
    });
  } catch (err) {
    console.error("Get gift cards error:", err);
    res.status(500).json({ message: "Failed to fetch gift cards" });
  }
});

/**
 * Get gift card inventory summary
 * GET /api/gift-cards/inventory
 * Admin only
 */
router.get("/inventory", requireAuth, requireAdmin, async (req, res) => {
  try {
    const inventory = await GiftCard.aggregate([
      {
        $group: {
          _id: { amount: "$amount", status: "$status" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.amount": 1, "_id.status": 1 },
      },
    ]);

    // Format the response
    const formattedInventory = {
      100: { available: 0, redeemed: 0, expired: 0 },
      250: { available: 0, redeemed: 0, expired: 0 },
      500: { available: 0, redeemed: 0, expired: 0 },
      1000: { available: 0, redeemed: 0, expired: 0 },
    };

    inventory.forEach((item) => {
      const amount = item._id.amount;
      const status = item._id.status;
      if (formattedInventory[amount]) {
        formattedInventory[amount][status] = item.count;
      }
    });

    res.json({ inventory: formattedInventory });
  } catch (err) {
    console.error("Get inventory error:", err);
    res.status(500).json({ message: "Failed to fetch inventory" });
  }
});

/**
 * Update gift card status
 * PUT /api/gift-cards/:id
 * Admin only
 */
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status, notes, expiryDate } = req.body;

    const giftCard = await GiftCard.findById(req.params.id);
    if (!giftCard) {
      return res.status(404).json({ message: "Gift card not found" });
    }

    // Update fields
    if (status) giftCard.status = status;
    if (notes !== undefined) giftCard.notes = notes;
    if (expiryDate !== undefined) giftCard.expiryDate = expiryDate;

    await giftCard.save();

    res.json({
      message: "Gift card updated successfully",
      giftCard,
    });
  } catch (err) {
    console.error("Update gift card error:", err);
    res.status(500).json({ message: "Failed to update gift card" });
  }
});

/**
 * Delete a gift card
 * DELETE /api/gift-cards/:id
 * Admin only
 */
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const giftCard = await GiftCard.findById(req.params.id);

    if (!giftCard) {
      return res.status(404).json({ message: "Gift card not found" });
    }

    // Prevent deletion of redeemed cards
    if (giftCard.status === "redeemed") {
      return res.status(400).json({
        message: "Cannot delete a redeemed gift card",
      });
    }

    await giftCard.deleteOne();

    res.json({ message: "Gift card deleted successfully" });
  } catch (err) {
    console.error("Delete gift card error:", err);
    res.status(500).json({ message: "Failed to delete gift card" });
  }
});

export default router;
