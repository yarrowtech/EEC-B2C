import express from "express";
import mongoose from "mongoose";
import serviceTokenAuth from "../../middleware/serviceTokenAuth.js";
import uploadPdf from "../../middleware/uploadPdf.js";
import cloudinary from "../../config/cloudinary.js";
import User from "../../models/User.js";
import StudyMaterial from "../../models/StudyMaterial.js";
import Class from "../../models/Class.js";
import Board from "../../models/Board.js";

const router = express.Router();

router.use(serviceTokenAuth);

function ok(res, data, extra = {}) {
  return res.json({
    success: true,
    ...extra,
    data,
  });
}

function fail(res, status, error) {
  return res.status(status).json({
    success: false,
    error,
  });
}

function normalizeAccessLevel(rawAccessLevel, rawIsFree) {
  const normalized = String(rawAccessLevel || "").toLowerCase();
  if (["free", "limited", "premium"].includes(normalized)) return normalized;
  return rawIsFree === "true" || rawIsFree === true ? "free" : "premium";
}

function normalizePrice(rawPrice, accessLevel) {
  if (accessLevel === "free") return 0;
  return Math.max(0, Number(rawPrice || 0));
}

function pickMaterialFields(material) {
  return {
    _id: material._id,
    title: material.title,
    class: material.class,
    board: material.board,
    subject: material.subject,
    category: material.category,
    pdfUrl: material.pdfUrl,
    pdfPublicId: material.pdfPublicId,
    isFree: material.isFree,
    price: material.price,
    accessLevel: material.accessLevel,
    createdBy: material.createdBy,
    createdAt: material.createdAt,
    updatedAt: material.updatedAt,
  };
}

async function findVerifiedTeacher(teacherId) {
  if (!teacherId || !mongoose.Types.ObjectId.isValid(teacherId)) {
    return { error: "Valid teacherId is required" };
  }

  const teacher = await User.findById(teacherId).select(
    "name email role isTeacherVerified"
  );

  if (!teacher) return { error: "Teacher not found" };
  if (String(teacher.role || "").toLowerCase() !== "teacher") {
    return { error: "User is not a teacher" };
  }
  if (!teacher.isTeacherVerified) {
    return { error: "Only verified teachers can upload content" };
  }

  return { teacher };
}

router.get("/health", (_req, res) => {
  res.json({
    success: true,
    service: "teacher-content",
    status: "ok",
  });
});

router.get("/teachers/:teacherId/status", async (req, res) => {
  try {
    const { teacherId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      return fail(res, 400, "Valid teacherId is required");
    }

    const teacher = await User.findById(teacherId).select(
      "name email role isTeacherVerified"
    );

    if (!teacher) return fail(res, 404, "Teacher not found");
    if (String(teacher.role || "").toLowerCase() !== "teacher") {
      return fail(res, 400, "User is not a teacher");
    }

    return ok(res, {
      teacherId: teacher._id,
      name: teacher.name,
      email: teacher.email,
      role: teacher.role,
      isTeacherVerified: Boolean(teacher.isTeacherVerified),
      canUploadContent: Boolean(teacher.isTeacherVerified),
    });
  } catch (err) {
    console.error("Internal teacher status error:", err);
    return fail(res, 500, "Failed to fetch teacher status");
  }
});

router.get("/classes", async (_req, res) => {
  try {
    const classes = await Class.find().sort({ createdAt: 1 }).lean();
    return ok(res, classes, { count: classes.length });
  } catch (err) {
    console.error("Internal classes error:", err);
    return fail(res, 500, "Failed to fetch classes");
  }
});

router.get("/boards", async (_req, res) => {
  try {
    const boards = await Board.find().sort({ createdAt: 1 }).lean();
    return ok(res, boards, { count: boards.length });
  } catch (err) {
    console.error("Internal boards error:", err);
    return fail(res, 500, "Failed to fetch boards");
  }
});

router.get("/materials", async (req, res) => {
  try {
    const { teacherId } = req.query;
    const teacherCheck = await findVerifiedTeacher(teacherId);
    if (teacherCheck.error) return fail(res, 403, teacherCheck.error);

    const materials = await StudyMaterial.find({ createdBy: teacherId })
      .sort({ createdAt: -1 })
      .lean();

    return ok(res, materials.map(pickMaterialFields), { count: materials.length });
  } catch (err) {
    console.error("Internal list materials error:", err);
    return fail(res, 500, "Failed to fetch study materials");
  }
});

router.post("/materials", uploadPdf.single("pdf"), async (req, res) => {
  try {
    const teacherCheck = await findVerifiedTeacher(req.body.teacherId);
    if (teacherCheck.error) return fail(res, 403, teacherCheck.error);

    if (!req.file) return fail(res, 400, "PDF file is required");

    const accessLevel = normalizeAccessLevel(req.body.accessLevel, req.body.isFree);
    const material = await StudyMaterial.create({
      title: req.body.title,
      class: req.body.class,
      board: req.body.board,
      subject: req.body.subject,
      category: req.body.category || "Notes",
      accessLevel,
      isFree: accessLevel === "free",
      price: normalizePrice(req.body.price, accessLevel),
      pdfUrl: req.file.path,
      pdfPublicId: req.file.filename,
      createdBy: teacherCheck.teacher._id,
    });

    return ok(res, pickMaterialFields(material), {
      message: "Study material uploaded successfully",
    });
  } catch (err) {
    console.error("Internal upload material error:", err);
    return fail(res, 500, "Failed to upload study material");
  }
});

router.put("/materials/:materialId", uploadPdf.single("pdf"), async (req, res) => {
  try {
    const teacherCheck = await findVerifiedTeacher(req.body.teacherId);
    if (teacherCheck.error) return fail(res, 403, teacherCheck.error);

    const material = await StudyMaterial.findById(req.params.materialId);
    if (!material) return fail(res, 404, "Study material not found");

    if (String(material.createdBy) !== String(teacherCheck.teacher._id)) {
      return fail(res, 403, "Teacher can update only own materials");
    }

    const accessLevel = normalizeAccessLevel(req.body.accessLevel, req.body.isFree);
    material.title = req.body.title || material.title;
    material.class = req.body.class || material.class;
    material.board = req.body.board || material.board;
    material.subject = req.body.subject || material.subject;
    material.category = req.body.category || material.category;
    material.accessLevel = accessLevel;
    material.isFree = accessLevel === "free";
    material.price = normalizePrice(req.body.price, accessLevel);

    if (req.file) {
      if (material.pdfPublicId) {
        await cloudinary.uploader.destroy(material.pdfPublicId, {
          resource_type: "raw",
        });
      }
      material.pdfUrl = req.file.path;
      material.pdfPublicId = req.file.filename;
    }

    await material.save();

    return ok(res, pickMaterialFields(material), {
      message: "Study material updated successfully",
    });
  } catch (err) {
    console.error("Internal update material error:", err);
    return fail(res, 500, "Failed to update study material");
  }
});

router.delete("/materials/:materialId", async (req, res) => {
  try {
    const teacherCheck = await findVerifiedTeacher(req.body.teacherId);
    if (teacherCheck.error) return fail(res, 403, teacherCheck.error);

    const material = await StudyMaterial.findById(req.params.materialId);
    if (!material) return fail(res, 404, "Study material not found");

    if (String(material.createdBy) !== String(teacherCheck.teacher._id)) {
      return fail(res, 403, "Teacher can delete only own materials");
    }

    if (material.pdfPublicId) {
      try {
        await cloudinary.uploader.destroy(material.pdfPublicId, {
          resource_type: "raw",
        });
      } catch (cloudErr) {
        console.warn("Internal Cloudinary delete failed:", cloudErr.message);
      }
    }

    await material.deleteOne();

    return res.json({
      success: true,
      message: "Study material deleted successfully",
    });
  } catch (err) {
    console.error("Internal delete material error:", err);
    return fail(res, 500, "Failed to delete study material");
  }
});

export default router;
