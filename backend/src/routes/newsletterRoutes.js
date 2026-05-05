import express from "express";
import Newsletter from "../models/Newsletter.js";
import { sendNewsletterWelcomeEmail } from "../utils/sendMail.js";

const router = express.Router();

// SUBSCRIBE
router.post("/subscribe", async (req, res) => {
  try {
    const rawEmail = String(req.body?.email || "");
    const email = rawEmail.trim().toLowerCase();

    if (!email) return res.status(400).json({ message: "Email is required" });
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    let subscriber = await Newsletter.findOne({ email });

    if (subscriber && subscriber.unsubscribed === false) {
      return res.status(400).json({ message: "You are already subscribed" });
    }

    // If user unsubscribed earlier, resubscribe
    if (subscriber && subscriber.unsubscribed === true) {
      subscriber.unsubscribed = false;
      await subscriber.save();
    }

    if (!subscriber) {
      subscriber = await Newsletter.create({ email });
    }

    // Unsubscribe should hit backend route directly (returns HTML confirmation page)
    const unsubscribeBase =
      process.env.PUBLIC_API_ORIGIN ||
      process.env.API_BASE_URL ||
      `${req.protocol}://${req.get("host")}`;
    const unsubscribeLink = `${unsubscribeBase}/api/newsletter/unsubscribe/${subscriber._id}`;

    await sendNewsletterWelcomeEmail({ to: email, unsubscribeLink });

    res.json({ message: "Subscribed successfully! Please check your email." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

// UNSUBSCRIBE
router.get("/unsubscribe/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const subscriber = await Newsletter.findById(id);
    if (!subscriber) return res.send("<h2>Invalid unsubscribe link</h2>");

    subscriber.unsubscribed = true;
    await subscriber.save();

    res.send(`
      <h2>You have been unsubscribed successfully.</h2>
      <p>You will no longer receive emails from EEC.</p>
    `);
  } catch (err) {
    res.send("<h2>Something went wrong</h2>");
  }
});

export default router;
