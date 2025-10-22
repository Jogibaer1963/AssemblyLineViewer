import { Router } from "express";
import { lineSchedule, advanceItem, getFcbStatus } from "../controllers/lineController.js";

const router = Router();
router.get("/lineSchedule", lineSchedule);
router.get("/fcbStatus", getFcbStatus);
router.post("/lineSchedule/:id/advance", advanceItem);

export default router;
