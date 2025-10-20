import { Router } from "express";
import { lineSchedule, advanceItem } from "../controllers/lineController.js";

const router = Router();
router.get("/lineSchedule", lineSchedule);
router.post("/lineSchedule/:id/advance", advanceItem);

export default router;
