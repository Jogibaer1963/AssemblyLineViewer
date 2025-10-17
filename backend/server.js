import express from "express";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import connectDB from "./src/config/db.js";
import { lineSchedule } from "./src/controllers/lineController.js";

// Ensure .env is loaded from the backend folder regardless of CWD
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
app.use(express.json());

// API routes
app.get("/api/lineSchedule", lineSchedule);

// Start server after DB connection
connectDB()
  .then(() => {
    app.listen(5000, () =>
      console.log("API on http://localhost:5000"));
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });
