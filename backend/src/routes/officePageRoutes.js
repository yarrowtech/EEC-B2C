// backend/src/routes/officePageRoutes.js
import express from "express";
import { getOfficePage, updateOfficePage } from "../controllers/officePageController.js";
// import requireAdmin if you want to protect update route

const router = express.Router();

router.get("/", getOfficePage);
router.put("/", updateOfficePage); // consider protecting this route with auth

export default router;
