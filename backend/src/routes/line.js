import { Router } from "express";
import { lineSchedule } from "../controllers/lineController.js";

const router = Router();
router.get("/lineSchedule", lineSchedule);

export default router;
