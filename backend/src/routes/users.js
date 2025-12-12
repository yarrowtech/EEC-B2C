// src/routes/users.js
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { listStudents } from "../controllers/users.js";
import User from "../models/User.js";
import bcrypt from "bcrypt";

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

router.get(
  "/students",
  requireAuth,
  (req, res, next) => {
    if (!["admin", "teacher"].includes(req.user?.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  },
  listStudents
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

    const mappedUser = {
      ...user._doc,

      // Fix class → className
      className: user.className || user.class || "",

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

export default router;
