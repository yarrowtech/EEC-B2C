// src/routes/questions.js
import { Router } from "express";
import multer from "multer";
import Question from "../models/Question.js";
import {
  list,
  getOne,
  update,
  remove,
  // (optional extras if you also want them:)
  create,
  bulkCreateMcqSingle,
  bulkCreateMcqMulti,
  bulkCreateChoiceMatrix,
  bulkCreateTrueFalse,
  metaSubjects,
  metaTopics,
  metaStages,
  getQuestionTypes,
} from "../controllers/questionsController.js";
import {requireAuth} from "../middleware/auth.js";

const router = Router();
const uploadExcel = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.get("/classes", async (req, res) => {
  try {
    const classes = await Question.distinct("class");
    res.json(classes);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to load classes" });
  }
});

router.get("/stages", async (req, res) => {
  try {
    const stages = await Question.distinct("stage");
    const normalizedStages = stages
      .map((s) => Number(s))
      .filter((s) => Number.isFinite(s) && s >= 1)
      .sort((a, b) => a - b);
    res.json({ stages: normalizedStages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// Reads (auth)
// Reads (auth)
router.get("/", requireAuth, list);

// Meta routes (STATIC, must be before ANY dynamic params)
router.get("/meta/stages", metaStages);
router.get("/meta/subjects", requireAuth, metaSubjects);
router.get("/meta/topics", requireAuth, metaTopics);

// Get question types with counts (MUST be before /:id route)
router.get("/types", requireAuth, getQuestionTypes);

// Dynamic routes (place these LAST)
router.get("/:id", requireAuth, getOne);

// Writes
router.put("/:id", requireAuth, update);
router.delete("/:id", requireAuth, remove);

// Bulk upload
router.post("/bulk/mcq-single", requireAuth, uploadExcel.single("file"), bulkCreateMcqSingle);
router.post("/bulk/mcq-multi", requireAuth, uploadExcel.single("file"), bulkCreateMcqMulti);
router.post("/bulk/choice-matrix", requireAuth, uploadExcel.single("file"), bulkCreateChoiceMatrix);
router.post("/bulk/true-false", requireAuth, uploadExcel.single("file"), bulkCreateTrueFalse);

// Create question by type
router.post("/:type", requireAuth, create);


export default router;
