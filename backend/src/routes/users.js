// src/routes/users.js
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { listStudents } from "../controllers/users.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

const router = Router();


// Allow admin AND teacher. We gate with requireAuth, then manual role check.

router.get("/students-count", async (req, res) => {
  try {
    const students = await User.find({ role: "student" })
      .select("name email phone createdAt");

    res.json({ students }); // 🔥 IMPORTANT → must return { students: [...] }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/teachers-count", async (req, res) => {
  try {
    const teachers = await User.find({ role: "teacher" })
      .select("name email phone createdAt");

    res.json({ teachers }); // 🔥 IMPORTANT → must return { teachers: [...] }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/students", requireAuth, (req, res, next) => {
  if (!["admin", "teacher"].includes(req.user?.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}, listStudents);

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

router.get("/profile", async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/update-profile", async (req, res) => {
  try {
    const { name, phone } = req.body;

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone },
      { new: true }
    ).select("-password");

    res.json({ message: "Updated", user: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


export default router;
