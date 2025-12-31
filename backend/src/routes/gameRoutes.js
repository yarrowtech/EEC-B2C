import express from "express";
import { protect } from "../middleware/auth.js";
import { saveMindTrainingResult } from "../controllers/gameController.js";

const router = express.Router();

router.post(
  "/mind-training/result",
  protect,
  saveMindTrainingResult
);

export default router;
