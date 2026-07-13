import { RoomSettings, GameMode } from "./types.js";

const GAME_MODES: GameMode[] = ["normal", "hidden", "combination"];
const MAX_CUSTOM_WORDS = 200;
const MAX_CUSTOM_WORD_LEN = 32;

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

// Every settings payload from a client -- room creation AND later host edits --
// must pass through here. Untrusted numbers get clamped (a drawTimeSec of 1e9
// would make a turn never end), custom words get bounded in count and length
// (they're rebroadcast to every player inside every room:state payload), and
// unknown keys are dropped entirely.
export function sanitizeSettings(base: RoomSettings, partial: Partial<RoomSettings> | undefined): RoomSettings {
  const p = partial ?? {};
  const rawWords = Array.isArray(p.customWords) ? p.customWords : base.customWords;
  const customWords = rawWords
    .filter((w): w is string => typeof w === "string")
    .map((w) => w.trim().slice(0, MAX_CUSTOM_WORD_LEN))
    .filter(Boolean)
    .slice(0, MAX_CUSTOM_WORDS);

  return {
    maxPlayers: clampInt(p.maxPlayers, base.maxPlayers, 2, 12),
    drawTimeSec: clampInt(p.drawTimeSec, base.drawTimeSec, 30, 240),
    rounds: clampInt(p.rounds, base.rounds, 1, 10),
    wordCount: clampInt(p.wordCount, base.wordCount, 1, 3),
    hints: clampInt(p.hints, base.hints, 0, 4),
    gameMode: GAME_MODES.includes(p.gameMode as GameMode) ? (p.gameMode as GameMode) : base.gameMode,
    customWords,
    useCustomWordsOnly: typeof p.useCustomWordsOnly === "boolean" ? p.useCustomWordsOnly : base.useCustomWordsOnly,
  };
}
