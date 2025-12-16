// routes/razorpayWebhook.js
import crypto from "crypto";
import Payment from "../models/Payment.js";
import User from "../models/User.js";

router.post("/razorpay", async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  const signature = req.headers["x-razorpay-signature"];
  const body = req.body.toString();

  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  if (signature !== expected) {
    return res.status(400).send("Invalid signature");
  }

  const event = JSON.parse(body);

  if (event.event === "payment.captured") {
    const payment = event.payload.payment.entity;

    await Payment.findOneAndUpdate(
      { paymentId: payment.id },
      {
        status: "paid",
        amount: payment.amount / 100,
      }
    );

    await User.findByIdAndUpdate(payment.notes.userId, {
      $addToSet: { purchasedMaterials: payment.notes.materialId },
    });
  }

  res.json({ ok: true });
});
