import { randomUUID } from "node:crypto";
import { customAlphabet } from "nanoid";
import { Room, RoomError } from "./Room.js";
import { RoomSettings, DEFAULT_SETTINGS, Avatar } from "./types.js";
import { query } from "../db.js";

const genCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);
const EMPTY_ROOM_TTL_MS = 30 * 60 * 1000;

export { RoomError };

class RoomManager {
  private rooms = new Map<string, Room>();
  private codeToId = new Map<string, string>();

  async createRoom(hostUserId: string, isPrivate: boolean, settingsOverride: Partial<RoomSettings> = {}) {
    const id = randomUUID();
    let code = genCode();
    while (this.codeToId.has(code)) code = genCode();

    const settings: RoomSettings = { ...DEFAULT_SETTINGS, ...settingsOverride };
    const room = new Room(id, code, hostUserId, settings);
    this.rooms.set(id, room);
    this.codeToId.set(code, id);
    this.wireRoomPersistence(room);

    await query(
      `INSERT INTO rooms (id, code, host_user_id, is_private, settings, status) VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, code, hostUserId, isPrivate, JSON.stringify(settings), room.status]
    );
    return room;
  }

  getByCode(code: string): Room | undefined {
    const id = this.codeToId.get(code.toUpperCase());
    return id ? this.rooms.get(id) : undefined;
  }

  getById(id: string): Room | undefined {
    return this.rooms.get(id);
  }

  async joinRoom(code: string, userId: string, name: string, avatar: Avatar, socketId: string) {
    const room = this.getByCode(code);
    if (!room) throw new RoomError("Room not found");

    const result = room.addOrReconnectPlayer(userId, name, avatar, socketId);
    await query(
      `INSERT INTO room_players (room_id, user_id, join_order, score, is_connected, avatar)
       VALUES ($1,$2,$3,$4,TRUE,$5)
       ON CONFLICT (room_id, user_id)
       DO UPDATE SET is_connected = TRUE, disconnected_at = NULL`,
      [room.id, userId, result.player.joinOrder, result.player.score, JSON.stringify(avatar)]
    );
    return { room, ...result };
  }

  async markDisconnected(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.markDisconnected(userId);
    await query(
      `UPDATE room_players SET is_connected = FALSE, disconnected_at = now() WHERE room_id=$1 AND user_id=$2`,
      [roomId, userId]
    );
    this.scheduleCleanupIfEmpty(room);
  }

  async leaveRoom(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.leaveRoom(userId);
    await query(`UPDATE room_players SET left_permanently = TRUE WHERE room_id=$1 AND user_id=$2`, [roomId, userId]);
    this.scheduleCleanupIfEmpty(room);
  }

  private wireRoomPersistence(room: Room) {
    const persistScores = async () => {
      for (const p of room.players.values()) {
        await query(`UPDATE room_players SET score=$1 WHERE room_id=$2 AND user_id=$3`, [p.score, room.id, p.userId]);
      }
    };
    room.on("roundEnd", persistScores);
    room.on("gameEnd", persistScores);
  }

  private scheduleCleanupIfEmpty(room: Room) {
    if (!room.isEmpty()) return;
    setTimeout(() => {
      if (room.isEmpty()) {
        this.rooms.delete(room.id);
        this.codeToId.delete(room.code);
      }
    }, EMPTY_ROOM_TTL_MS);
  }
}

export const roomManager = new RoomManager();
