import express from "express";
import {
  getHeroSettings,
  updateHeroSettings
} from "../controllers/heroController.js";

const router = express.Router();

router.get("/", getHeroSettings);
router.put("/", updateHeroSettings);

export default router;
