import express from "express";
import serviceTokenAuth from "../../middleware/serviceTokenAuth.js";
import uploadPdf from "../../middleware/uploadPdf.js";
import cloudinary from "../../config/cloudinary.js";
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
  const source = typeof material.toObject === "function" ? material.toObject() : material;
  return {
    _id: source._id,
    title: source.title,
    class: source.class,
    board: source.board,
    subject: source.subject,
    category: source.category,
    pdfUrl: source.pdfUrl,
    pdfPublicId: source.pdfPublicId,
    isFree: source.isFree,
    price: source.price,
    accessLevel: source.accessLevel,
    createdBy: source.createdBy,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
}

router.get("/health", (_req, res) => {
  res.json({
    success: true,
    service: "internal-study-materials",
    status: "ok",
  });
});

router.get("/stats", async (_req, res) => {
  try {
    const [total, free, paid] = await Promise.all([
      StudyMaterial.countDocuments({}),
      StudyMaterial.countDocuments({ isFree: true }),
      StudyMaterial.countDocuments({ isFree: { $ne: true } }),
    ]);

    return ok(res, { total, free, paid });
  } catch (err) {
    console.error("Internal study material stats error:", err);
    return fail(res, 500, "Failed to fetch study material stats");
  }
});

router.get("/metadata", async (_req, res) => {
  try {
    const [classes, boards] = await Promise.all([
      Class.find().sort({ createdAt: 1 }).lean(),
      Board.find().sort({ createdAt: 1 }).lean(),
    ]);

    return ok(res, {
      classes,
      boards,
      subjects: ["Maths", "Science", "English"],
      categories: ["Notes", "Reference Books", "Practice Papers", "Video Content", "Syllabus", "Other"],
      accessLevels: ["free", "limited", "premium"],
    });
  } catch (err) {
    console.error("Internal study material metadata error:", err);
    return fail(res, 500, "Failed to fetch study material metadata");
  }
});

router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.class) filter.class = req.query.class;
    if (req.query.board) filter.board = req.query.board;
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.category) filter.category = req.query.category;

    const materials = await StudyMaterial.find(filter)
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    return ok(res, materials.map(pickMaterialFields), { count: materials.length });
  } catch (err) {
    console.error("Internal list study materials error:", err);
    return fail(res, 500, "Failed to fetch study materials");
  }
});

router.post("/", uploadPdf.single("pdf"), async (req, res) => {
  try {
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
      createdBy: req.body.createdBy || undefined,
    });

    return ok(res, pickMaterialFields(material), {
      message: "Study material uploaded successfully",
    });
  } catch (err) {
    console.error("Internal upload study material error:", err);
    return fail(res, 500, "Failed to upload study material");
  }
});

router.put("/:materialId", uploadPdf.single("pdf"), async (req, res) => {
  try {
    const material = await StudyMaterial.findById(req.params.materialId);
    if (!material) return fail(res, 404, "Study material not found");

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
    console.error("Internal update study material error:", err);
    return fail(res, 500, "Failed to update study material");
  }
});

router.delete("/:materialId", async (req, res) => {
  try {
    const material = await StudyMaterial.findById(req.params.materialId);
    if (!material) return fail(res, 404, "Study material not found");

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
    console.error("Internal delete study material error:", err);
    return fail(res, 500, "Failed to delete study material");
  }
});

export default router;
