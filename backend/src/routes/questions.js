// src/routes/questions.js
import { Router } from "express";
import {
  list,
  getOne,
  update,
  remove,
  // (optional extras if you also want them:)
  create,
  metaSubjects,
  metaTopics,
} from "../controllers/questionsController.js";
import {requireAuth} from "../middleware/auth.js";

const router = Router();

// Reads (auth)
router.get("/", requireAuth, list);
router.get("/:id", requireAuth, getOne);

// Writes (admin enforced in controller)
router.put("/:id", requireAuth, update);
router.delete("/:id", requireAuth, remove);

// Optional extras you already had:
router.get("/meta/subjects", requireAuth, metaSubjects);
router.get("/meta/topics", requireAuth, metaTopics);
router.post("/:type", requireAuth, create);

export default router;
