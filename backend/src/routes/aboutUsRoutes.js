import express from "express";
import { getAboutUs, updateAboutUs } from "../controllers/aboutUsController.js";

const router = express.Router();

router.get("/", getAboutUs);
router.put("/", updateAboutUs);

export default router;
