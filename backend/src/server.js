import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import connectDB from "./config/db.js";
import lineRoutes from "./routes/line.js";  // Korrigierter Import-Name

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

// middleware
app.use(morgan("dev"));
app.use(express.json());

// CORS only in dev (use proxy in Angular)
if (NODE_ENV !== "production") {
  app.use(cors({ origin: ["http://localhost:4500", "http://localhost:5000"], credentials: true }));
}

// API Routes - KORRIGIERT
app.use("/api", lineRoutes);  // Jetzt funktioniert /api/lineSchedule

// Serve Angular build in production (optional)
if (process.env.SERVE_FRONTEND === "true" && NODE_ENV === "production") {
  const distPath = path.resolve(__dirname, process.env.FRONTEND_DIST || "../../frontend/dist/frontend");
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("📦 Serving frontend from:", distPath);
  } else {
    console.warn("⚠ FRONTEND_DIST path not found:", distPath);
  }
}

// start
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 API running on http://localhost:${PORT}`);
      console.log(`📍 Try: http://localhost:${PORT}/api/lineSchedule`);
    });
  })
  .catch((err) => {
    console.error("Mongo connection error:", err);
    process.exit(1);
  });
