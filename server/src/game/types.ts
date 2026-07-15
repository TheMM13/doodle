export type GameMode = "normal" | "hidden" | "combination";

export interface RoomSettings {
  maxPlayers: number; // 2-12
  drawTimeSec: number; // 30-240
  rounds: number; // 1-10
  wordCount: number; // 1-3 choices offered to drawer
  hints: number; // 0-4 letters revealed during a turn
  gameMode: GameMode;
  customWords: string[];
  useCustomWordsOnly: boolean;
}

export const DEFAULT_SETTINGS: RoomSettings = {
  maxPlayers: 8,
  drawTimeSec: 80,
  rounds: 3,
  wordCount: 3,
  hints: 2,
  gameMode: "normal",
  customWords: [],
  useCustomWordsOnly: false,
};

export type RoomStatus = "lobby" | "choosing_word" | "drawing" | "round_end" | "game_end";

export interface Avatar {
  face: number;
  color: string;
  hat?: number;
}

export interface Player {
  userId: string;
  name: string;
  avatar: Avatar;
  score: number;
  roundScore: number;
  isConnected: boolean;
  disconnectedAt: number | null;
  joinOrder: number;
  hasGuessedThisTurn: boolean;
  socketId: string | null;
}

export interface Stroke {
  type: "start" | "draw" | "end" | "fill" | "clear" | "undo";
  x?: number;
  y?: number;
  color?: string;
  size?: number;
}

export type ChatKind = "chat" | "system" | "guessed" | "reveal" | "drawing" | "kick" | "left" | "correct" | "close";

export interface ChatMessage {
  id: string;
  userId: string;
  name: string;
  text: string;
  kind: ChatKind;
  ts: number;
}
