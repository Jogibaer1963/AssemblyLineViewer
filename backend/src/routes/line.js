import { Router } from "express";
import { listReports, createReport } from "../controllers/lineController.js";

const router = Router();
router.get("/", listReports);
router.post("/", createReport);

export default router;
