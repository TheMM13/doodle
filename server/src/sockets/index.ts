import type { Server, Socket } from "socket.io";
import { verifyAppJwt } from "../auth/jwt.js";
import { roomManager, RoomError } from "../game/RoomManager.js";
import type { Room } from "../game/Room.js";
import type { Avatar, RoomSettings, Stroke } from "../game/types.js";
import { query } from "../db.js";

interface SocketData {
  userId: string;
  name: string;
  roomId: string | null;
}

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

// Everything a client sends over the socket is untrusted. Strokes and
// avatars in particular get stored in room state and rebroadcast to every
// player, so oversized or malformed values are an amplification lever.
function sanitizeStroke(raw: unknown): Stroke | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;
  if (typeof s.type !== "string" || !["start", "draw", "end", "fill", "clear", "undo"].includes(s.type)) return null;
  const clean: Stroke = { type: s.type as Stroke["type"] };
  if (s.x !== undefined) {
    if (typeof s.x !== "number" || !Number.isFinite(s.x) || s.x < -50 || s.x > 2050) return null;
    clean.x = Math.round(s.x);
  }
  if (s.y !== undefined) {
    if (typeof s.y !== "number" || !Number.isFinite(s.y) || s.y < -50 || s.y > 2050) return null;
    clean.y = Math.round(s.y);
  }
  if (s.color !== undefined) {
    if (typeof s.color !== "string" || !HEX_COLOR.test(s.color)) return null;
    clean.color = s.color;
  }
  if (s.size !== undefined) {
    if (typeof s.size !== "number" || !Number.isFinite(s.size)) return null;
    clean.size = Math.min(60, Math.max(1, Math.round(s.size)));
  }
  return clean;
}

function sanitizeAvatar(raw: unknown): Avatar {
  const a = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    face: Number.isInteger(a.face) ? Math.min(28, Math.max(1, a.face as number)) : 1,
    hat: Number.isInteger(a.hat) ? Math.min(5, Math.max(0, a.hat as number)) : 0,
    color: typeof a.color === "string" && HEX_COLOR.test(a.color) ? a.color : "#5aa9e6",
  };
}

// Fixed-window rate limiter, one instance per socket per event family.
function makeLimiter(max: number, windowMs: number) {
  let count = 0;
  let windowStart = 0;
  return () => {
    const now = Date.now();
    if (now - windowStart > windowMs) {
      windowStart = now;
      count = 0;
    }
    return ++count <= max;
  };
}

function broadcastState(io: Server, room: Room) {
  const sockets = io.sockets.adapter.rooms.get(room.id);
  if (!sockets) return;
  for (const socketId of sockets) {
    const socket = io.sockets.sockets.get(socketId);
    if (!socket) continue;
    const data = socket.data as SocketData;
    socket.emit("room:state", room.serializeFor(data.userId));
  }
}

function wireRoomEvents(io: Server, room: Room) {
  if ((room as any)._wired) return;
  (room as any)._wired = true;

  room.on("state", () => broadcastState(io, room));
  room.on("chat", ({ restrictedTo, ...msg }: { restrictedTo?: string[]; [key: string]: unknown }) => {
    if (!restrictedTo) {
      io.to(room.id).emit("chat:message", { ...msg, ts: Date.now() });
      return;
    }
    // Spoiler-risk message (from the drawer or someone who already
    // guessed) -- only deliver it to sockets that already know the word.
    const sockets = io.sockets.adapter.rooms.get(room.id);
    if (!sockets) return;
    for (const socketId of sockets) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket && restrictedTo.includes((socket.data as SocketData).userId)) {
        socket.emit("chat:message", { ...msg, ts: Date.now() });
      }
    }
  });
  room.on("privateMessage", ({ toUserId, ...rest }) => {
    const sockets = io.sockets.adapter.rooms.get(room.id);
    if (!sockets) return;
    for (const socketId of sockets) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket && (socket.data as SocketData).userId === toUserId) {
        socket.emit("chat:private", { ...rest, ts: Date.now() });
      }
    }
  });
  room.on("roundEnd", (payload) => io.to(room.id).emit("game:roundEnd", payload));
  room.on("gameEnd", (payload) => io.to(room.id).emit("game:gameEnd", payload));
  room.on("reaction", (payload) => io.to(room.id).emit("game:reaction", payload));
  room.on("stroke", ({ fromUserId, stroke }: { fromUserId: string; stroke: Stroke }) => {
    const sockets = io.sockets.adapter.rooms.get(room.id);
    if (!sockets) return;
    for (const socketId of sockets) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket && (socket.data as SocketData).userId !== fromUserId) {
        socket.emit("canvas:stroke", stroke);
      }
    }
  });
}

export function registerSocketHandlers(io: Server) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) throw new Error("No token");
      const payload = verifyAppJwt(token);
      (socket.data as SocketData) = { userId: payload.userId, name: payload.name, roomId: null };
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const data = socket.data as SocketData;
    const allowCreate = makeLimiter(5, 60_000);
    const allowJoin = makeLimiter(20, 60_000);
    const allowGuess = makeLimiter(6, 2_000);
    const allowStroke = makeLimiter(800, 2_000);
    const allowReaction = makeLimiter(5, 3_000);

    socket.on("room:create", async (payload: { isPrivate?: boolean; settings?: Partial<RoomSettings>; avatar?: Avatar }, ack) => {
      if (!allowCreate()) return ack?.({ ok: false, error: "Slow down — too many rooms created" });
      try {
        const avatar = sanitizeAvatar(payload?.avatar);
        const room = await roomManager.createRoom(data.userId, payload?.isPrivate ?? true, payload?.settings ?? {});
        wireRoomEvents(io, room);
        const { player } = room.addOrReconnectPlayer(data.userId, data.name, avatar, socket.id);
        await query(
          `INSERT INTO room_players (room_id, user_id, join_order, score, is_connected, avatar)
           VALUES ($1,$2,$3,$4,TRUE,$5)
           ON CONFLICT (room_id, user_id) DO UPDATE SET is_connected = TRUE, disconnected_at = NULL`,
          [room.id, data.userId, player.joinOrder, player.score, JSON.stringify(avatar)]
        );
        data.roomId = room.id;
        socket.join(room.id);
        ack?.({ ok: true, code: room.code, roomId: room.id });
        broadcastState(io, room);
      } catch (err: any) {
        ack?.({ ok: false, error: err.message ?? "Failed to create room" });
      }
    });

    socket.on("room:join", async (payload: { code?: string; avatar?: Avatar }, ack) => {
      if (!allowJoin()) return ack?.({ ok: false, error: "Slow down — too many join attempts" });
      if (typeof payload?.code !== "string" || payload.code.length > 12) {
        return ack?.({ ok: false, error: "Invalid room code" });
      }
      try {
        const avatar = sanitizeAvatar(payload.avatar);
        const { room, resumed } = await roomManager.joinRoom(payload.code, data.userId, data.name, avatar, socket.id);
        wireRoomEvents(io, room);
        data.roomId = room.id;
        socket.join(room.id);
        ack?.({ ok: true, code: room.code, roomId: room.id, resumed });
        socket.emit("canvas:sync", room.strokes);
        broadcastState(io, room);
        io.to(room.id).emit("chat:message", {
          userId: "system",
          name: "System",
          text: resumed ? `${data.name} reconnected.` : `${data.name} joined the room.`,
          kind: "system",
          ts: Date.now(),
        });
      } catch (err: any) {
        ack?.({ ok: false, error: err instanceof RoomError ? err.message : "Failed to join room" });
      }
    });

    socket.on("room:leave", async () => {
      if (!data.roomId) return;
      const roomId = data.roomId;
      data.roomId = null;
      try {
        // Leave the socket.io room first so the state broadcast triggered
        // by roomManager.leaveRoom() below doesn't loop back to this same
        // socket and re-populate the room it just left.
        socket.leave(roomId);
        await roomManager.leaveRoom(roomId, data.userId);
        const room = roomManager.getById(roomId);
        if (room) broadcastState(io, room);
      } catch (err) {
        console.error("room:leave failed", err);
      }
    });

    socket.on("game:start", (_payload, ack) => {
      const room = data.roomId ? roomManager.getById(data.roomId) : undefined;
      if (!room) return ack?.({ ok: false, error: "Not in a room" });
      try {
        room.startGame(data.userId);
        ack?.({ ok: true });
      } catch (err: any) {
        ack?.({ ok: false, error: err.message });
      }
    });

    socket.on("room:updateSettings", (payload: Partial<RoomSettings>, ack) => {
      const room = data.roomId ? roomManager.getById(data.roomId) : undefined;
      if (!room) return ack?.({ ok: false, error: "Not in a room" });
      try {
        room.updateSettings(data.userId, payload);
        ack?.({ ok: true });
      } catch (err: any) {
        ack?.({ ok: false, error: err.message });
      }
    });

    socket.on("game:chooseWord", (payload: { word?: string }) => {
      if (typeof payload?.word !== "string" || payload.word.length > 64) return;
      const room = data.roomId ? roomManager.getById(data.roomId) : undefined;
      room?.chooseWord(data.userId, payload.word);
    });

    socket.on("game:stroke", (raw: unknown) => {
      if (!allowStroke()) return;
      const stroke = sanitizeStroke(raw);
      if (!stroke) return;
      const room = data.roomId ? roomManager.getById(data.roomId) : undefined;
      room?.handleStroke(data.userId, stroke);
    });

    socket.on("game:guess", (payload: { text?: string }) => {
      if (!allowGuess()) return;
      if (typeof payload?.text !== "string") return;
      const room = data.roomId ? roomManager.getById(data.roomId) : undefined;
      room?.handleGuess(data.userId, payload.text);
    });

    socket.on("game:reaction", (payload: { kind?: string }) => {
      if (!allowReaction()) return;
      if (payload?.kind !== "like" && payload?.kind !== "dislike") return;
      const room = data.roomId ? roomManager.getById(data.roomId) : undefined;
      room?.react(data.userId, payload.kind);
    });

    socket.on("game:kickVote", (payload: { targetUserId?: string }) => {
      if (typeof payload?.targetUserId !== "string" || payload.targetUserId.length > 64) return;
      const room = data.roomId ? roomManager.getById(data.roomId) : undefined;
      room?.kickVote(data.userId, payload.targetUserId);
    });

    socket.on("disconnect", async () => {
      if (!data.roomId) return;
      try {
        await roomManager.markDisconnected(data.roomId, data.userId, socket.id);
        const room = roomManager.getById(data.roomId);
        if (room) broadcastState(io, room);
      } catch (err) {
        console.error("disconnect handling failed", err);
      }
    });
  });
}
