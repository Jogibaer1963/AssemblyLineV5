
import * as http from "node:http";
import dotenv from "dotenv";
import connectDB, { closeDB } from "./src/config/db.js";
import path from "node:path";
import express from "express";
import { fileURLToPath } from "node:url";
import cors from "cors";
import Schedule from "./src/models/asemblyLine.js";
import { Server as SocketIOServer } from "socket.io";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(express.json());

// Start a server after DB connection
let server;
let io; // socket.io instance
let scheduleChangeStream; // Mongo change stream

// CORS in non-production (Angular should use proxy in dev)
const devOrigins = ["http://localhost:4200", "http://localhost:4500"]; // Angular dev servers
const isProd = process.env.NODE_ENV === "production";
if (!isProd) {
  app.use(cors({ origin: devOrigins, credentials: true }));
}

async function getSortedSchedule(limit, sortDir) {
  const q = Schedule.find({activeList: "true"});
  q.sort({ sequenz: sortDir });
  if (limit && Number(limit) > 0) q.limit(Number(limit));
  return q.lean();
}

connectDB()
  .then(async () => {
    // REST endpoints
    app.get("/api/lineSchedule", async (req, res) => {
      try {
        const { limit, sort } = req.query;
        const sortDir = (typeof sort === "string" && sort.toLowerCase() === "desc") ? -1 : 1;
        const docs = await getSortedSchedule(limit, sortDir);
        res.json(docs);
      } catch (e) {
        console.error("/api/lineSchedule error:", e);
        res.status(500).json({ message: "Failed to load line schedule" });
      }
    });

    server = http.createServer(app);

    // Initialize Socket.IO attached to the same HTTP server
    io = new SocketIOServer(server, {
      cors: isProd ? undefined : { origin: devOrigins, credentials: true },
    });

    // Helper to broadcast the latest schedule to all clients
    async function broadcastSchedule(reason = "change") {
      try {
        const docs = await getSortedSchedule(undefined, 1);
        io.emit("schedule:update", { reason, data: docs });
      } catch (err) {
        console.error("Broadcast failed:", err);
      }
    }

    // Update flags when moving items between stations/bays
    app.patch("/api/lineSchedule/activeList", async (req, res) => {
      try {
        const { id, rowId, tag } = req.body ?? {};
        const docId = id || rowId;
        if (!docId) {
          return res.status(400).json({ message: "Missing id" });
        }
        // Base payload always removes from a list
        const setPayload = { activeList: "false", [tag]: "true" };
        // Starting FCB-1 timestamps
        if (tag === "activeBayFCB_1") {
          setPayload["fcb_1_start"] = new Date();
          setPayload["activeBayFCB_2"] = "false"; // ensure exclusivity
        }
        // Moving from FCB-1 to FCB-2 should end FCB-1 and clear its flag
        if (tag === "activeBayFCB_2") {
          setPayload["activeBayFCB_1"] = "false";
          setPayload["fcb_1_end"] = new Date();
          setPayload["fcb_2_start"] = new Date();
        }
        const updated = await Schedule.findByIdAndUpdate(
          docId,
          { $set: setPayload },
          { new: true }
        ).lean();
        if (!updated) {
          return res.status(404).json({ message: "Document not found" });
        }
        // Fallback broadcast in case change streams are not available
        try {
          await broadcastSchedule("manual-update");
        } catch (e) {
          // noop
        }
        return res.json({ ok: true, data: updated });
      } catch (e) {
        console.error("PATCH /api/lineSchedule/activeList error:", e);
        return res.status(500).json({ message: "Failed to update activeList" });
      }
    });

    // Get the active FCB 1 document (where activeBayFCB_1 == "true")
    app.get("/api/fcb/1/status", async (req, res) => {
      try {
        const doc = await Schedule.findOne({ activeBayFCB_1: "true" }).lean();
        if (!doc) return res.json({ active: false });
        return res.json({ active: true, _id: doc._id, machine: doc.machine, start: doc.fcb_1_start ?? null });
      } catch (e) {
        console.error("GET /api/fcb/1/status error:", e);
        return res.status(500).json({ message: "Failed to read FCB1 status" });
      }
    });




    // ---------------------------------------------------------------------------------
    io.on("connection", async (socket) => {
      console.log("🔌 Client connected:", socket.id);
      // Send initial snapshot
      try {
        const docs = await getSortedSchedule(undefined, 1);
        socket.emit("schedule:init", docs);
      } catch (e) {
        console.error("Emit init failed:", e);
      }

      socket.on("disconnect", () => {
        console.log("🔌 Client disconnected:", socket.id);
      });
    });

    // Watch MongoDB changes for the Schedule collection
    try {
      scheduleChangeStream = Schedule.watch([], { fullDocument: "updateLookup" });
      scheduleChangeStream.on("change", async (change) => {
        // change.operationType: 'insert' | 'update' | 'replace' | 'delete' | 'invalidate' | 'drop' ...
        if (change.operationType === "invalidate") return;
        await broadcastSchedule(change.operationType);
      });
      scheduleChangeStream.on("error", (err) => {
        console.error("Change stream error:", err);
      });
      console.log("👀 Watching Schedule changes for live updates");
    } catch (err) {
      console.warn("Change streams not available (replica set required). Live updates disabled.", err?.message ?? err);
    }

    server.listen(PORT, () => {
      console.log(`🚀 API running on http://localhost:${PORT}`);
      console.log(`📍 Try: http://localhost:${PORT}/api/lineSchedule`);
      console.log(`🔊 Socket.IO namespace: / (events: schedule:init, schedule:update)`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });

// Graceful shutdown
async function shutdown(signal) {
  try {
    console.log(`\n${signal} received. Shutting down gracefully...`);

    // Stop the change stream first
    if (scheduleChangeStream) {
      try {
        await scheduleChangeStream.close();
        console.log("Mongo change stream closed");
      } catch (e) {
        console.warn("Error closing change stream:", e);
      }
    }

    // Close Socket.IO (stops accepting new connections and closes existing)
    if (io) {
      await new Promise((resolve) => io.close(() => resolve()));
      console.log("Socket.IO server closed");
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

process.on("SIGINT", () => { void shutdown("SIGINT"); });
process.on("SIGTERM", () => { void shutdown("SIGTERM"); });

