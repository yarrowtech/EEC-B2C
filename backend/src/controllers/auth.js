import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { isEmail, normalizeLoginId } from "../utils/validators.js";
import { sendWelcomeEmail } from "../services/mailer.js";

const SALT_ROUNDS = 10;

// src/controllers/auth.controller.js

function signToken(user) {
  const payload = {
    sub: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
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
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
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
