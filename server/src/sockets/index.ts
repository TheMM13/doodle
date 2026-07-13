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

    socket.on("room:create", async (payload: { isPrivate?: boolean; settings?: Partial<RoomSettings>; avatar: Avatar }, ack) => {
      try {
        const room = await roomManager.createRoom(data.userId, payload.isPrivate ?? true, payload.settings ?? {});
        wireRoomEvents(io, room);
        const { player } = room.addOrReconnectPlayer(data.userId, data.name, payload.avatar, socket.id);
        await query(
          `INSERT INTO room_players (room_id, user_id, join_order, score, is_connected, avatar)
           VALUES ($1,$2,$3,$4,TRUE,$5)
           ON CONFLICT (room_id, user_id) DO UPDATE SET is_connected = TRUE, disconnected_at = NULL`,
          [room.id, data.userId, player.joinOrder, player.score, JSON.stringify(payload.avatar)]
        );
        data.roomId = room.id;
        socket.join(room.id);
        ack?.({ ok: true, code: room.code, roomId: room.id });
        broadcastState(io, room);
      } catch (err: any) {
        ack?.({ ok: false, error: err.message ?? "Failed to create room" });
      }
    });

    socket.on("room:join", async (payload: { code: string; avatar: Avatar }, ack) => {
      try {
        const { room, resumed } = await roomManager.joinRoom(payload.code, data.userId, data.name, payload.avatar, socket.id);
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

    socket.on("game:chooseWord", (payload: { word: string }) => {
      const room = data.roomId ? roomManager.getById(data.roomId) : undefined;
      room?.chooseWord(data.userId, payload.word);
    });

    socket.on("game:stroke", (stroke: Stroke) => {
      const room = data.roomId ? roomManager.getById(data.roomId) : undefined;
      room?.handleStroke(data.userId, stroke);
    });

    socket.on("game:guess", (payload: { text: string }) => {
      const room = data.roomId ? roomManager.getById(data.roomId) : undefined;
      room?.handleGuess(data.userId, payload.text);
    });

    socket.on("game:kickVote", (payload: { targetUserId: string }) => {
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
