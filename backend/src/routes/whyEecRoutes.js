import express from "express";
import {
  getWhyEec,
  updateWhyEec
} from "../controllers/whyEecController.js";

const router = express.Router();

router.get("/", getWhyEec);
router.put("/", updateWhyEec);

export default router;
