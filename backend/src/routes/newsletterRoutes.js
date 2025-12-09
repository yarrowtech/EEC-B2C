import express from "express";
import Newsletter from "../models/Newsletter.js";
import sendMail from "../utils/sendMail.js";

const router = express.Router();

// SUBSCRIBE
router.post("/subscribe", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });

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

    // Unsubscribe link
    const unsubscribeLink = `${process.env.CLIENT_ORIGIN}/unsubscribe/${subscriber._id}`;

    // Send welcome mail
    await sendMail({
      to: email,
      subject: "Welcome to EEC Newsletter 🎉",
      html: `
        <div style="background:#0B1E3C; padding:40px 0; font-family:Arial, sans-serif;">
    <div style="
      max-width:600px;
      margin:auto;
      background:#0E2A54;
      border-radius:14px;
      padding:30px;
      box-shadow:0 0 25px rgba(255, 204, 0, 0.2);
      border:1px solid rgba(255,255,255,0.08);
    ">
      
      <!-- Logo -->
      <div style="text-align:center; margin-bottom:20px;">
        <img src="https://eeclearning.com/logo_new.png" alt="EEC Logo" style="height:60px;" />
      </div>

      <!-- Title -->
      <h2 style="
        text-align:center;
        color:#FFD93D;
        font-size:24px;
        margin:0;
        font-weight:700;
        letter-spacing:0.5px;
      ">
        🎉 Welcome to EEC Learning Newsletter!
      </h2>

      <p style="
        color:#D8E3F2;
        font-size:15px;
        line-height:1.6;
        margin-top:20px;
      ">
        Hello,
        <br/><br/>
        Thank you for subscribing to the <strong style="color:#FFD93D;">EEC News & Updates</strong>!  
        You’re now part of a growing community that believes in:
      </p>

      <ul style="color:#D8E3F2; font-size:15px; line-height:1.7;">
        <li>AI-powered smart learning</li>
        <li>Emotionally supportive teaching</li>
        <li>Personalized student growth</li>
        <li>Modern educational innovation</li>
      </ul>

      <p style="color:#D8E3F2; font-size:15px; line-height:1.6;">
        From product launches to major updates, you will be the first to know.  
        Stay tuned — big things are coming!
      </p>

      <!-- Divider -->
      <div style="
        margin:30px 0;
        height:1px;
        background:linear-gradient(to right, transparent, rgba(255,217,61,0.4), transparent);
      "></div>

      <!-- Button -->
      <div style="text-align:center;">
        <a href="https://eeclearning.com" style="
          background:linear-gradient(90deg, #FFD93D, #FEE87E);
          padding:12px 28px;
          border-radius:50px;
          color:#0B1E3C;
          font-weight:700;
          text-decoration:none;
          font-size:15px;
          display:inline-block;
          box-shadow:0 4px 15px rgba(255, 217, 61, 0.3);
        ">
          Visit EEC Website
        </a>
      </div>

      <!-- Unsubscribe -->
      <p style="
        margin-top:35px;
        font-size:13px;
        color:#88A2C4;
        text-align:center;
      ">
        If you wish to unsubscribe, click below:
      </p>

      <div style="text-align:center; margin-top:10px;">
        <a href="${unsubscribeLink}
  " style="
          color:#FF6B6B;
          text-decoration:none;
          font-weight:600;
          font-size:14px;
        ">
          Unsubscribe
        </a>
      </div>

    </div>

    <!-- Footer -->
    <p style="
      margin-top:25px;
      text-align:center;
      color:#5F7FA5;
      font-size:12px;
    ">
      © ${new Date().getFullYear()} EEC Learning • All Rights Reserved
    </p>
  </div>

      `,
    });

    res.json({ message: "Subscribed successfully!" });
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
