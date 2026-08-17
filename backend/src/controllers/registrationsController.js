import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Registration from "../models/Registration.js";
import User from "../models/User.js";
import { buildLoginPayload } from "./auth.js";
import { sendChildRegistrationEmail } from "../utils/sendMail.js";
import { isEmail } from "../utils/validators.js";

const GENDER_VALUES = new Set(["male", "female", "other"]);
const SALT_ROUNDS = 10;

function validateChild(child, label) {
  if (!child?.name || !child?.gender || !child?.board || !child?.class || !child?.schoolName) {
    return `Please fill in all fields for ${label}`;
  }
  if (!GENDER_VALUES.has(String(child.gender).toLowerCase())) {
    return `Select a valid gender for ${label}`;
  }
  return null;
}

export const createRegistration = async (req, res) => {
  try {
    const {
      name,
      gender,
      parentName,
      mobile,
      email,
      password,
      board,
      class: className,
      schoolName,
      additionalChildren = [],
    } = req.body;

    if (!name || !gender || !parentName || !mobile || !email || !password || !board || !className || !schoolName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const primaryChildError = validateChild(
      { name, gender, board, class: className, schoolName },
      "the student"
    );
    if (primaryChildError) {
      return res.status(400).json({ message: primaryChildError });
    }

    if (!Array.isArray(additionalChildren)) {
      return res.status(400).json({ message: "Invalid additional children data" });
    }
    for (let i = 0; i < additionalChildren.length; i += 1) {
      const err = validateChild(additionalChildren[i], `sibling ${i + 2}`);
      if (err) return res.status(400).json({ message: err });
    }

    const mobileDigits = String(mobile).replace(/\D/g, "");
    if (mobileDigits.length !== 10) {
      return res.status(400).json({ message: "Enter a valid 10-digit mobile number" });
    }

    const emailValue = String(email).trim().toLowerCase();
    if (!isEmail(emailValue)) {
      return res.status(400).json({ message: "Enter a valid email address" });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email: emailValue });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered. Please login instead." });
    }

    const passwordHash = await bcrypt.hash(String(password), SALT_ROUNDS);
    const currentDate = new Date();
    const familyId = new mongoose.Types.ObjectId();

    const user = await User.create({
      name: String(name).trim(),
      email: emailValue,
      phone: mobileDigits,
      password: passwordHash,
      class: String(className).trim(),
      className: String(className).trim(),
      board: String(board).trim(),
      points: 100,
      registrationYear: currentDate.getFullYear(),
      registrationMonth: currentDate.getMonth() + 1,
      initialClass: String(className).trim(),
      canChangeClass: false,
      familyId,
    });

    // Give every sibling their own real login account too, sharing the same
    // password and family group, so they can be switched to without a password.
    const cleanedSiblings = [];
    for (let i = 0; i < additionalChildren.length; i += 1) {
      const child = additionalChildren[i];
      const siblingClass = String(child.class).trim();
      const siblingUser = await User.create({
        name: String(child.name).trim(),
        // Intentionally the same as the parent/primary account's email —
        // siblings are differentiated by familyId, not by a unique login email.
        email: emailValue,
        phone: mobileDigits,
        password: passwordHash,
        class: siblingClass,
        className: siblingClass,
        board: String(child.board).trim(),
        gender: String(child.gender).toLowerCase(),
        schoolName: String(child.schoolName).trim(),
        points: 100,
        registrationYear: currentDate.getFullYear(),
        registrationMonth: currentDate.getMonth() + 1,
        initialClass: siblingClass,
        canChangeClass: false,
        familyId,
      });

      cleanedSiblings.push({
        name: String(child.name).trim(),
        gender: String(child.gender).toLowerCase(),
        board: String(child.board).trim(),
        class: siblingClass,
        schoolName: String(child.schoolName).trim(),
        userId: siblingUser._id,
      });
    }

    sendChildRegistrationEmail({
      to: emailValue,
      parentName: String(parentName).trim(),
      childName: String(name).trim(),
      siblingNames: cleanedSiblings.map((s) => s.name),
    }).catch((err) => console.error("Registration confirmation email failed:", err?.message));

    const registration = await Registration.create({
      name: String(name).trim(),
      gender: String(gender).toLowerCase(),
      board: String(board).trim(),
      class: String(className).trim(),
      schoolName: String(schoolName).trim(),
      additionalChildren: cleanedSiblings,
      parentName: String(parentName).trim(),
      mobile: mobileDigits,
      email: emailValue,
      userId: user._id,
      familyId,
    });

    const loginPayload = await buildLoginPayload(user);

    return res.status(201).json({
      message: "Registered successfully",
      registration,
      ...loginPayload,
    });
  } catch (error) {
    console.error("createRegistration error:", error);
    return res.status(500).json({ message: "Failed to submit registration" });
  }
};

export const listRegistrations = async (req, res) => {
  try {
    const { status, q, limit = 50, page = 1 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (q) {
      const regex = new RegExp(String(q).trim(), "i");
      query.$or = [
        { name: regex },
        { parentName: regex },
        { mobile: regex },
        { email: regex },
        { schoolName: regex },
        { "additionalChildren.name": regex },
      ];
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const safePage = Math.max(Number(page) || 1, 1);

    const [items, total] = await Promise.all([
      Registration.find(query)
        .sort({ createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit),
      Registration.countDocuments(query),
    ]);

    return res.json({
      items,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    });
  } catch (error) {
    console.error("listRegistrations error:", error);
    return res.status(500).json({ message: "Failed to fetch registrations" });
  }
};

export const updateRegistrationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    const allowed = ["new", "contacted", "closed"];
    if (!allowed.includes(String(status || "").trim())) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const item = await Registration.findByIdAndUpdate(
      id,
      { status: String(status).trim() },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ message: "Registration not found" });
    }

    return res.json({ message: "Status updated", registration: item });
  } catch (error) {
    console.error("updateRegistrationStatus error:", error);
    return res.status(500).json({ message: "Failed to update status" });
  }
};

export const deleteRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Registration.findByIdAndDelete(id);
    if (!item) {
      return res.status(404).json({ message: "Registration not found" });
    }
    return res.json({ message: "Deleted" });
  } catch (error) {
    console.error("deleteRegistration error:", error);
    return res.status(500).json({ message: "Failed to delete registration" });
  }
};
