export type GameMode = "normal" | "hidden" | "combination";

export interface RoomSettings {
  maxPlayers: number;
  drawTimeSec: number;
  rounds: number;
  wordCount: number;
  hints: number;
  gameMode: GameMode;
  customWords: string[];
  useCustomWordsOnly: boolean;
}

export interface Avatar {
  face: number;
  color: string;
  hat: number;
}

export type RoomStatus = "lobby" | "choosing_word" | "drawing" | "round_end" | "game_end";

export interface PlayerView {
  userId: string;
  name: string;
  avatar: Avatar;
  score: number;
  isConnected: boolean;
  isDrawing: boolean;
  hasGuessed: boolean;
}

export interface Stroke {
  type: "start" | "draw" | "end" | "fill" | "clear" | "undo";
  x?: number;
  y?: number;
  color?: string;
  size?: number;
}

export interface RoomState {
  roomId: string;
  code: string;
  hostUserId: string;
  settings: RoomSettings;
  status: RoomStatus;
  round: number;
  totalRounds: number;
  currentDrawerId: string | null;
  isYourTurnToChoose: boolean;
  wordChoices: string[];
  word: string | null;
  wordRevealed: boolean;
  wordLength: number;
  turnEndsAt: number | null;
  chooseEndsAt: number | null;
  players: PlayerView[];
  strokes: Stroke[];
}

export type ChatKind = "chat" | "system" | "guessed" | "reveal" | "drawing" | "kick" | "left" | "correct" | "close";

export interface ChatMessage {
  userId: string;
  name: string;
  text: string;
  kind: ChatKind;
  ts: number;
}

export const FACE_COUNT = 8;
export const HAT_COUNT = 6;
export const AVATAR_COLORS = [
  "#e15b5b", "#5aa9e6", "#5cc46f", "#f2b632", "#a877e0", "#ef8b4d", "#4dc9c0", "#e069b0",
];
export const AVATAR_FACES = ["🙂", "😀", "😎", "🥳", "🤓", "😜", "🙃", "🤠"];
export const AVATAR_HATS = ["", "🎩", "👑", "🧢", "🎓", "🪖"];
