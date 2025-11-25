import express from "express";
import { getFeatures, updateFeatures } from "../controllers/featuresController.js";

const router = express.Router();

router.get("/", getFeatures);
router.put("/", updateFeatures);

export default router;
