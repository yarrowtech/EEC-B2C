import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import crypto from "crypto";
import { isEmail, normalizeLoginId } from "../utils/validators.js";
import {
  sendWelcomeEmail,
  sendResetPasswordEmail,
  sendPasswordResetSuccessEmail,
} from "../utils/sendMail.js";

const SALT_ROUNDS = 10;

// src/controllers/auth.controller.js

function signToken(user) {
  const payload = {
    sub: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    board: user.board,
  }; // ✅ role added
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  });
}

export async function register(req, res) {
  try {
    // NOTE: "class" is a reserved word in JS, so alias it while destructuring
    const {
      name,
      email,
      phone,
      password,
      class: classValue, // <-- NEW
      state, // <-- NEW
      referral, // <-- NEW
      board, // <-- NEW
    } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required." });
    }
    if (!isEmail(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }
    if (String(password).length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters." });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ message: "Email already registered." });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      phone: phone?.trim() || "",
      password: hash,
      class: (classValue || "").trim(), // <-- NEW
      state: (state || "").trim(), // <-- NEW
      referral: (referral || "").trim(), // <-- NEW
      board: (board || "").trim(), // <-- NEW
    });
    sendWelcomeEmail({ to: user.email, name: user.name }).catch((err) =>
      console.error("Welcome email failed:", err?.message)
    );

    const token = signToken(user);
    res.status(201).json({
      message: "Registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        class: user.class,
        state: user.state,
        referral: user.referral,
      },
      token,
    });
  } catch (err) {
    console.error("register error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

export async function login(req, res) {
  try {
    const { emailOrPhone, password } = req.body;
    if (!emailOrPhone || !password) {
      return res
        .status(400)
        .json({ message: "emailOrPhone and password required." });
    }

    const id = normalizeLoginId(emailOrPhone);
    // We login only by email here (simplify). If you want phone login, add phone lookup.
    const user = await User.findOne({ email: id }).select("+password");
    if (!user) return res.status(401).json({ message: "Invalid credentials." });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials." });

    const token = signToken(user);
    res.json({
      message: "Logged in",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        className: user.className,
        state: user.state,
        role: user.role,
        points: user.points || 0,
        board: user.board,
      }, // ✅ include role
      token,
    });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

export async function me(req, res) {
  // req.user is set by auth middleware
  res.json({ user: req.user });
}

export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user) {
      return res.status(200).json({
        message: "If the email exists, a reset link has been sent",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const hash = crypto.createHash("sha256").update(token).digest("hex");

    user.resetPasswordToken = hash;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 min
    await user.save();

    const resetLink = `${process.env.CLIENT_ORIGIN}/reset-password/${token}`;

    // await sendResetPasswordEmail({
    //   to: user.email,
    //   name: user.name,
    //   resetLink,
    // });

    // res.json({ message: "Reset link sent to your email" });
    await sendResetPasswordEmail({
      to: user.email,
      name: user.name,
      resetLink,
    });

    res.json({ message: "Reset link sent to your email" });
  } catch (err) {
    console.error("forgot password error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

export async function resetPassword(req, res) {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hash,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired link" });
    }

    user.password = await bcrypt.hash(password, SALT_ROUNDS);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();
    sendPasswordResetSuccessEmail({
      to: user.email,
      name: user.name,
    }).catch((err) =>
      console.error("Password reset success email failed:", err?.message)
    );

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("reset password error:", err);
    res.status(500).json({ message: "Server error" });
  }
}
