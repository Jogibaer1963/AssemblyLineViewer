import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import connectDB, { closeDB } from "./src/config/db.js";
import lineRoutes from "./src/routes/line.js";
import Schedule from "./src/models/assemblyLine.js";
import mongoose from "mongoose";
import { Server as SocketIOServer } from "socket.io";

// Ensure .env is loaded from the backend folder regardless of CWD
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Middleware
app.use(morgan("dev"));
app.use(express.json());

// CORS in non-production (Angular should use proxy in dev)
if (NODE_ENV !== "production") {
  app.use(cors({ origin: ["http://localhost:4200", "http://localhost:4500"], credentials: true }));
}

// Health check
app.get(["/", "/health", "/api/health"], (_req, res) => {
  res.json({ status: "ok", env: NODE_ENV, time: new Date().toISOString() });
});

// API routes
app.use("/api", lineRoutes);

// 404 handler
app.use((req, res, _next) => {
  res.status(404).json({ error: "Not found", path: req.originalUrl });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

let server;
let io;
let changeStream;

async function fetchActiveSchedule() {
  const rawItems = await Schedule.find({ activeList: { $in: [true, "true", 1, "1"] } })
    .sort({ sequenz: 1 })
    .lean()
    .exec();
  const items = rawItems.map(it => ({
    ...it,
    activeList: it?.activeList === "true"
  }));
  return items;
}

function setupSocketIO(httpServer) {
  io = new SocketIOServer(httpServer, {
    cors: NODE_ENV !== "production" ? { origin: ["http://localhost:4500"], credentials: true } : undefined,
  });

  io.on("connection", async (socket) => {
    console.log(`🔌 Client connected ${socket.id}`);
    try {
      const items = await fetchActiveSchedule();
      socket.emit("schedule:init", items);
    } catch (e) {
      console.error("Failed to load initial schedule:", e);
      socket.emit("schedule:init", []);
    }

    socket.on("disconnect", (reason) => {
      console.log(`👋 Client disconnected ${socket.id} (${reason})`);
    });
  });
}

function emitScheduleUpdate(payload) {
  if (io) {
    io.emit("schedule:update", payload);
  }
}

async function setupChangeStreamWithFallback() {
  // Try MongoDB change streams first
  try {
    if (mongoose.connection.readyState !== 1) return;

    // Use the underlying native collection to avoid model-level schema mapping in stream
    const nativeCollection = mongoose.connection.collection("productionSchedule");
    changeStream = nativeCollection.watch([], { fullDocument: "updateLookup" });

    changeStream.on("change", async (change) => {
      // For simplicity: re-fetch the current active schedule on any change
      try {
        const items = await fetchActiveSchedule();
        emitScheduleUpdate(items);
      } catch (e) {
        console.error("Error fetching schedule after change:", e);
      }
    });

    changeStream.on("error", (err) => {
      console.warn("Change stream error, switching to interval fallback:", err?.message || err);
      changeStream?.close().catch(() => {});
      setupIntervalFallback();
    });

    console.log("👂 Change stream established on productionSchedule");
  } catch (err) {
    console.warn("Change streams not available, using interval fallback:", err?.message || err);
    setupIntervalFallback();
  }
}

let intervalId;
let lastSerialized = "";
async function setupIntervalFallback() {
  clearInterval(intervalId);
  intervalId = setInterval(async () => {
    try {
      const items = await fetchActiveSchedule();
      const serialized = JSON.stringify(items);
      if (serialized !== lastSerialized) {
        lastSerialized = serialized;
        emitScheduleUpdate(items);
      }
    } catch (e) {
      console.error("Interval fetch error:", e);
    }
  }, 3000);
  console.log("⏱️ Fallback interval polling enabled (3s)");
}

// Start server after DB connection
connectDB()
  .then(async () => {
    server = http.createServer(app);
    setupSocketIO(server);

    server.listen(PORT, () => {
      console.log(`🚀 API running on http://localhost:${PORT}`);
      console.log(`📍 Try: http://localhost:${PORT}/api/lineSchedule`);
    });

    await setupChangeStreamWithFallback();
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });

// Graceful shutdown
async function shutdown(signal) {
  try {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    if (changeStream) {
      try { await changeStream.close(); } catch {}
      changeStream = undefined;
    }
    if (intervalId) {
      clearInterval(intervalId);
    }
    if (io) {
      io.removeAllListeners();
    }
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      console.log("HTTP server closed");
    }
    await closeDB?.();
  } catch (e) {
    console.error("Error during shutdown:", e);
  } finally {
    process.exit(0);
  }
}

["SIGINT", "SIGTERM"].forEach((sig) => {
  process.on(sig, () => shutdown(sig));
});
