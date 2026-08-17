import express from "express";
import {
  createRegistration,
  listRegistrations,
  updateRegistrationStatus,
  deleteRegistration,
} from "../controllers/registrationsController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Public: submit registration
router.post("/", createRegistration);

// Admin only: list, update status, delete
router.get("/", requireAuth, requireRole("admin"), listRegistrations);
router.patch("/:id/status", requireAuth, requireRole("admin"), updateRegistrationStatus);
router.delete("/:id", requireAuth, requireRole("admin"), deleteRegistration);

export default router;
