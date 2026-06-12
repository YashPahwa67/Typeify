// backend/server.js

import express from "express";
import { createServer } from "http"; // 1. ADD
import dns from "dns";
import mongoose from "mongoose";

// Some systems (e.g. macOS with only an IPv6 link-local resolver in
// /etc/resolv.conf) leave Node's c-ares unable to resolve MongoDB Atlas
// SRV records, causing querySrv ECONNREFUSED. Fall back to public DNS.
dns.setServers(["8.8.8.8", "1.1.1.1", ...dns.getServers()]);
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.routes.js";
import scoreRoutes from "./routes/score.routes.js";
import textRoutes from "./routes/text.routes.js";
import coachRoutes from "./routes/coach.routes.js";
import { initSocket } from "./room.socket.js"; // 2. ADD

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const httpServer = createServer(app); // 3. ADD

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

if (!process.env.MONGO_URI) {
  console.error("MONGO_URI is missing in .env");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully");
    initSocket(httpServer); // 4. ADD — init after DB connects
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

app.use("/api/auth", authRoutes);
app.use("/api/scores", scoreRoutes);
app.use("/api/text", textRoutes);
app.use("/api/coach", coachRoutes);

const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, () => {
  // 5. httpServer instead of app
  console.log(`Server running on port ${PORT}`);
});
