import express from "express";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import serviceTokenAuth from "../../middleware/serviceTokenAuth.js";
import User from "../../models/User.js";

const router = express.Router();

router.use(serviceTokenAuth);

function ok(res, data, extra = {}) {
  return res.json({
    success: true,
    ...extra,
    data,
  });
}

function fail(res, status, error, extra = {}) {
  return res.status(status).json({
    success: false,
    error,
    ...extra,
  });
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function pickTeacher(user) {
  if (!user) return null;
  return {
    _id: user._id,
    id: user._id,
    teacherId: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.isTeacherVerified ? "verified" : "active",
    isTeacherVerified: Boolean(user.isTeacherVerified),
    legalTermsAccepted: Boolean(user.legalTermsAccepted),
    biometricVerified: Boolean(user.biometricVerified),
    department: user.department,
    bio: user.bio,
    avatar: user.avatar,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function buildTeacherUpdate(body = {}) {
  const update = {};
  ["name", "phone", "department", "bio", "avatar"].forEach((field) => {
    if (body[field] !== undefined) update[field] = body[field];
  });
  if (body.email !== undefined) update.email = normalizeEmail(body.email);
  if (body.isTeacherVerified !== undefined) update.isTeacherVerified = Boolean(body.isTeacherVerified);
  if (body.legalTermsAccepted !== undefined) update.legalTermsAccepted = Boolean(body.legalTermsAccepted);
  if (body.biometricVerified !== undefined) update.biometricVerified = Boolean(body.biometricVerified);
  return update;
}

router.get("/health", (_req, res) => {
  return ok(res, { service: "teachers", status: "ok" });
});

router.get("/stats", async (_req, res) => {
  try {
    const [total, verified] = await Promise.all([
      User.countDocuments({ role: "teacher" }),
      User.countDocuments({ role: "teacher", isTeacherVerified: true }),
    ]);

    return ok(res, {
      total,
      verified,
      unverified: total - verified,
    });
  } catch (err) {
    console.error("Internal teacher stats error:", err);
    return fail(res, 500, "Failed to fetch teacher stats");
  }
});

router.get("/", async (req, res) => {
  try {
    const q = String(req.query.q || req.query.search || "").trim();
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 100);
    const filter = { role: "teacher" };

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
      ];
    }

    const [teachers, total] = await Promise.all([
      User.find(filter)
        .select("-password -resetPasswordToken -resetPasswordExpire")
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return ok(res, teachers.map(pickTeacher), {
      items: teachers.map(pickTeacher),
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Internal list teachers error:", err);
    return fail(res, 500, "Failed to fetch teachers");
  }
});

router.get("/:teacherId", async (req, res) => {
  try {
    const { teacherId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      return fail(res, 400, "Valid teacherId is required");
    }

    const teacher = await User.findOne({ _id: teacherId, role: "teacher" })
      .select("-password -resetPasswordToken -resetPasswordExpire")
      .lean();

    if (!teacher) return fail(res, 404, "Teacher not found");
    return ok(res, pickTeacher(teacher));
  } catch (err) {
    console.error("Internal get teacher error:", err);
    return fail(res, 500, "Failed to fetch teacher");
  }
});

router.post("/", async (req, res) => {
  try {
    const name = String(req.body.name || req.body.fullName || "").trim();
    const email = normalizeEmail(req.body.email);
    const phone = String(req.body.phone || req.body.mobile || "").trim();
    const password = String(req.body.password || "").trim();

    if (!name || !email || !phone || !password) {
      return fail(res, 400, "Teacher name, email, phone, and password are required");
    }

    const exists = await User.findOne({ email }).select("_id").lean();
    if (exists) return fail(res, 409, "Email already exists");

    const hashedPassword = await bcrypt.hash(password, 10);
    const teacher = await User.create({
      ...buildTeacherUpdate(req.body),
      name,
      email,
      phone,
      password: hashedPassword,
      role: "teacher",
    });

    return res.status(201).json({
      success: true,
      message: "Teacher created successfully",
      teacher: pickTeacher(teacher),
      data: pickTeacher(teacher),
    });
  } catch (err) {
    console.error("Internal create teacher error:", err);
    return fail(res, 500, "Failed to create teacher");
  }
});

router.put("/:teacherId", async (req, res) => {
  try {
    const { teacherId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      return fail(res, 400, "Valid teacherId is required");
    }

    const update = buildTeacherUpdate(req.body);
    if (update.email) {
      const exists = await User.findOne({ email: update.email, _id: { $ne: teacherId } }).select("_id").lean();
      if (exists) return fail(res, 409, "Email already exists");
    }

    const teacher = await User.findOneAndUpdate(
      { _id: teacherId, role: "teacher" },
      update,
      { new: true, runValidators: true }
    ).select("-password -resetPasswordToken -resetPasswordExpire");

    if (!teacher) return fail(res, 404, "Teacher not found");
    return ok(res, pickTeacher(teacher), {
      message: "Teacher updated successfully",
      teacher: pickTeacher(teacher),
    });
  } catch (err) {
    console.error("Internal update teacher error:", err);
    return fail(res, 500, "Failed to update teacher");
  }
});

router.delete("/:teacherId", async (req, res) => {
  try {
    const { teacherId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      return fail(res, 400, "Valid teacherId is required");
    }

    const teacher = await User.findOneAndDelete({ _id: teacherId, role: "teacher" })
      .select("-password -resetPasswordToken -resetPasswordExpire")
      .lean();

    if (!teacher) return fail(res, 404, "Teacher not found");
    return ok(res, pickTeacher(teacher), {
      message: "Teacher deleted successfully",
      teacher: pickTeacher(teacher),
    });
  } catch (err) {
    console.error("Internal delete teacher error:", err);
    return fail(res, 500, "Failed to delete teacher");
  }
});

export default router;
