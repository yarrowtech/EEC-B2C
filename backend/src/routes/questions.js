// src/routes/questions.js
import { Router } from "express";
import Question from "../models/Question.js";
import {
  list,
  getOne,
  update,
  remove,
  // (optional extras if you also want them:)
  create,
  metaSubjects,
  metaTopics,
  metaStages,
} from "../controllers/questionsController.js";
import {requireAuth} from "../middleware/auth.js";

const router = Router();

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
    res.json({ stages });
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

// Dynamic routes (place these LAST)
router.get("/:id", requireAuth, getOne);

// Writes
router.put("/:id", requireAuth, update);
router.delete("/:id", requireAuth, remove);


// Create question by type
router.post("/:type", requireAuth, create);


export default router;
