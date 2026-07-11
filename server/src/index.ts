import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";
import { env } from "./env.js";
import { authRouter } from "./auth/routes.js";
import { registerSocketHandlers } from "./sockets/index.js";

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection (kept server alive):", err);
});

const app = express();
app.use(cors({ origin: env.clientOrigin }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/auth", authRouter);

// In production this one service also serves the built web app (see
// README for the Render build command), so the frontend and API share an
// origin -- no CORS, no separate deployment to keep in sync.
const webDist = join(dirname(fileURLToPath(import.meta.url)), "../../web/dist");
if (existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/auth") || req.path.startsWith("/socket.io")) return next();
    res.sendFile(join(webDist, "index.html"));
  });
}

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: env.clientOrigin },
});

registerSocketHandlers(io);

httpServer.listen(env.port, () => {
  console.log(`skribbl-clone server listening on :${env.port}`);
});
