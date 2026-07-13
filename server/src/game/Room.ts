import { EventEmitter } from "node:events";
import { RoomSettings, RoomStatus, Player, Avatar, Stroke } from "./types.js";
import { getWordBank, pickWordChoices } from "./words.js";
import { guesserPoints, drawerPointsForGuess, isCloseGuess } from "./scoring.js";

const CHOOSE_WORD_MS = 15_000;
const ROUND_END_PAUSE_MS = 5_000;

export class RoomError extends Error {}

export class Room extends EventEmitter {
  readonly id: string;
  readonly code: string;
  hostUserId: string;
  settings: RoomSettings;
  status: RoomStatus = "lobby";

  players = new Map<string, Player>();
  private turnOrder: string[] = [];
  private nextJoinOrder = 0;

  currentRound = 0;
  private currentDrawerIdx = -1;
  currentDrawerId: string | null = null;
  private currentWord: string | null = null;
  private wordChoices: string[] = [];
  private revealedIndices = new Set<number>();
  private usedWords = new Set<string>();
  private hideLengthThisTurn = false;
  strokes: Stroke[] = [];

  turnEndsAt: number | null = null;
  chooseEndsAt: number | null = null;

  private wordChoiceTimer: NodeJS.Timeout | null = null;
  private drawTimer: NodeJS.Timeout | null = null;
  private roundEndTimer: NodeJS.Timeout | null = null;
  private hintTimers: NodeJS.Timeout[] = [];
  private kickVotes = new Map<string, Set<string>>();

  constructor(id: string, code: string, hostUserId: string, settings: RoomSettings) {
    super();
    this.id = id;
    this.code = code;
    this.hostUserId = hostUserId;
    this.settings = settings;
  }

  private emitState() {
    this.emit("state");
  }

  // ---- membership -------------------------------------------------------

  addOrReconnectPlayer(userId: string, name: string, avatar: Avatar, socketId: string) {
    const existing = this.players.get(userId);
    if (existing) {
      const wasDisconnected = !existing.isConnected;
      existing.isConnected = true;
      existing.disconnectedAt = null;
      existing.socketId = socketId;
      existing.name = name;
      this.emitState();
      return { player: existing, resumed: wasDisconnected };
    }

    if (this.players.size >= this.settings.maxPlayers) {
      throw new RoomError("Room is full");
    }

    const player: Player = {
      userId,
      name,
      avatar,
      score: 0,
      isConnected: true,
      disconnectedAt: null,
      joinOrder: this.nextJoinOrder++,
      hasGuessedThisTurn: false,
      socketId,
    };
    this.players.set(userId, player);
    if (this.status !== "lobby") {
      // joined mid-game: added to rotation, will get a turn from next round on
      this.turnOrder.push(userId);
    }
    this.emitState();
    return { player, resumed: false };
  }

  markDisconnected(userId: string, socketId?: string): boolean {
    const player = this.players.get(userId);
    if (!player) return false;
    // A stale socket closing (e.g. the old tab after the player resumed in a
    // new one) must not mark the player's live connection as disconnected.
    if (socketId && player.socketId && player.socketId !== socketId) return false;
    player.isConnected = false;
    player.socketId = null;
    player.disconnectedAt = Date.now();

    if (this.hostUserId === userId) {
      const nextHost = [...this.players.values()]
        .sort((a, b) => a.joinOrder - b.joinOrder)
        .find((p) => p.isConnected);
      if (nextHost) this.hostUserId = nextHost.userId;
    }

    if (this.currentDrawerId === userId) {
      if (this.status === "drawing" || this.status === "choosing_word") {
        this.endTurn();
      }
    }
    this.emitState();
    return true;
  }

  leaveRoom(userId: string) {
    const wasDrawer = this.currentDrawerId === userId;
    const leavingName = this.players.get(userId)?.name ?? "A player";
    this.players.delete(userId);
    this.turnOrder = this.turnOrder.filter((id) => id !== userId);
    // Their pending kick votes (for them and by them) are meaningless now.
    this.kickVotes.delete(userId);
    for (const votes of this.kickVotes.values()) votes.delete(userId);
    if (this.hostUserId === userId) {
      const nextHost = [...this.players.values()].sort((a, b) => a.joinOrder - b.joinOrder)[0];
      if (nextHost) this.hostUserId = nextHost.userId;
    }
    if (wasDrawer && (this.status === "drawing" || this.status === "choosing_word")) {
      this.endTurn();
    }
    this.emit("chat", { userId, name: leavingName, text: `${leavingName} left the room!`, kind: "left" });
    this.emitState();
  }

  connectedCount() {
    return [...this.players.values()].filter((p) => p.isConnected).length;
  }

  isEmpty() {
    return [...this.players.values()].every((p) => !p.isConnected);
  }

  // ---- game flow ----------------------------------------------------------

  updateSettings(requesterId: string, partial: Partial<RoomSettings>) {
    if (requesterId !== this.hostUserId) throw new RoomError("Only the host can change settings");
    if (this.status !== "lobby") throw new RoomError("Cannot change settings while a game is in progress");
    this.settings = {
      ...this.settings,
      ...partial,
      maxPlayers: Math.max(this.players.size, Math.min(12, partial.maxPlayers ?? this.settings.maxPlayers)),
      drawTimeSec: Math.min(240, Math.max(30, partial.drawTimeSec ?? this.settings.drawTimeSec)),
      rounds: Math.min(10, Math.max(1, partial.rounds ?? this.settings.rounds)),
      wordCount: Math.min(3, Math.max(1, partial.wordCount ?? this.settings.wordCount)),
      hints: Math.min(4, Math.max(0, partial.hints ?? this.settings.hints)),
      gameMode:
        partial.gameMode && ["normal", "hidden", "combination"].includes(partial.gameMode)
          ? partial.gameMode
          : this.settings.gameMode,
    };
    this.emitState();
  }

  startGame(requesterId: string) {
    if (requesterId !== this.hostUserId) throw new RoomError("Only the host can start the game");
    if (this.players.size < 2) throw new RoomError("Need at least 2 players");

    for (const p of this.players.values()) p.score = 0;
    this.turnOrder = [...this.players.values()].sort((a, b) => a.joinOrder - b.joinOrder).map((p) => p.userId);
    this.currentRound = 0;
    this.currentDrawerIdx = -1;
    this.usedWords.clear();
    this.nextTurn();
  }

  private clearTimers() {
    if (this.wordChoiceTimer) clearTimeout(this.wordChoiceTimer);
    if (this.drawTimer) clearTimeout(this.drawTimer);
    if (this.roundEndTimer) clearTimeout(this.roundEndTimer);
    this.hintTimers.forEach(clearTimeout);
    this.hintTimers = [];
    this.wordChoiceTimer = this.drawTimer = this.roundEndTimer = null;
  }

  private nextTurn(attempts = 0) {
    this.clearTimers();
    this.currentWord = null;
    if (this.turnOrder.length === 0) {
      this.status = "lobby";
      this.emitState();
      return;
    }
    if (attempts > this.turnOrder.length) {
      // nobody available to draw right now; pause back in lobby-like idle state
      this.status = "round_end";
      this.currentDrawerId = null;
      this.emitState();
      return;
    }

    this.currentDrawerIdx++;
    if (this.currentDrawerIdx >= this.turnOrder.length) {
      this.currentDrawerIdx = 0;
      this.currentRound++;
    }
    if (this.currentRound === 0) this.currentRound = 1;
    if (this.currentRound > this.settings.rounds) {
      this.endGame();
      return;
    }

    const drawerId = this.turnOrder[this.currentDrawerIdx];
    const drawer = this.players.get(drawerId);
    if (!drawer || !drawer.isConnected) {
      this.nextTurn(attempts + 1);
      return;
    }

    this.currentDrawerId = drawerId;
    this.strokes = [];
    this.revealedIndices.clear();
    this.hideLengthThisTurn =
      this.settings.gameMode === "hidden" || (this.settings.gameMode === "combination" && Math.random() < 0.5);
    for (const p of this.players.values()) p.hasGuessedThisTurn = false;

    const pool = getWordBank(this.settings.customWords, this.settings.useCustomWordsOnly);
    this.wordChoices = pickWordChoices(pool, this.settings.wordCount, this.usedWords);
    this.status = "choosing_word";
    this.chooseEndsAt = Date.now() + CHOOSE_WORD_MS;

    this.emit("wordChoices", { drawerId, choices: this.wordChoices });
    this.emitState();

    this.wordChoiceTimer = setTimeout(() => {
      const auto = this.wordChoices[Math.floor(Math.random() * this.wordChoices.length)];
      this.chooseWord(drawerId, auto);
    }, CHOOSE_WORD_MS);
  }

  chooseWord(userId: string, word: string) {
    if (this.status !== "choosing_word" || userId !== this.currentDrawerId) return;
    if (this.wordChoiceTimer) clearTimeout(this.wordChoiceTimer);

    this.currentWord = word;
    this.usedWords.add(word);
    this.status = "drawing";
    this.turnEndsAt = Date.now() + this.settings.drawTimeSec * 1000;
    this.scheduleHints();

    const drawerName = this.players.get(userId)?.name ?? "The drawer";
    this.emit("chat", { userId, name: drawerName, text: `${drawerName} is drawing now!`, kind: "drawing" });
    this.emitState();

    this.drawTimer = setTimeout(() => this.endTurn(), this.settings.drawTimeSec * 1000);
  }

  private scheduleHints() {
    if (!this.currentWord) return;
    const letterIdx = [...this.currentWord].map((c, i) => (c !== " " ? i : -1)).filter((i) => i >= 0);
    const hintsToReveal = Math.min(this.settings.hints, Math.max(0, letterIdx.length - 1));
    if (hintsToReveal <= 0) return;
    const interval = (this.settings.drawTimeSec * 1000) / (hintsToReveal + 1);
    for (let i = 1; i <= hintsToReveal; i++) {
      this.hintTimers.push(
        setTimeout(() => {
          const remaining = letterIdx.filter((idx) => !this.revealedIndices.has(idx));
          if (!remaining.length) return;
          const pick = remaining[Math.floor(Math.random() * remaining.length)];
          this.revealedIndices.add(pick);
          this.emitState();
        }, interval * i)
      );
    }
  }

  handleStroke(userId: string, stroke: Stroke) {
    if (userId !== this.currentDrawerId || this.status !== "drawing") return;
    if (stroke.type === "clear") {
      this.strokes = [];
    } else if (stroke.type === "undo") {
      // Actually remove the undone action from the authoritative history --
      // if we only relayed the undo, anyone who joins/reconnects later would
      // get the pre-undo strokes replayed via canvas:sync.
      let i = this.strokes.length - 1;
      while (i >= 0 && this.strokes[i].type !== "start" && this.strokes[i].type !== "fill") i--;
      this.strokes = i >= 0 ? this.strokes.slice(0, i) : [];
    } else if (stroke.type !== "end") {
      this.strokes.push(stroke);
      if (this.strokes.length > 8000) this.strokes.shift();
    }
    this.emit("stroke", { fromUserId: userId, stroke });
  }

  handleGuess(userId: string, rawText: string): void {
    const player = this.players.get(userId);
    const text = rawText.trim();
    if (!text) return;

    const canGuess =
      player &&
      player.isConnected &&
      this.status === "drawing" &&
      userId !== this.currentDrawerId &&
      !player.hasGuessedThisTurn &&
      this.currentWord;

    if (!canGuess || !player) {
      // The drawer, and anyone who has already guessed correctly this turn,
      // knows the word -- their messages must never reach players who are
      // still guessing, or they could just type the answer for them.
      const isSpoilRisk = this.status === "drawing" && (userId === this.currentDrawerId || player?.hasGuessedThisTurn);
      if (isSpoilRisk) {
        const canSeeSpoilers = [...this.players.values()]
          .filter((p) => p.userId === this.currentDrawerId || p.hasGuessedThisTurn)
          .map((p) => p.userId);
        this.emit("chat", { userId, name: player?.name ?? "?", text, kind: "chat", restrictedTo: canSeeSpoilers });
      } else {
        this.emit("chat", { userId, name: player?.name ?? "?", text, kind: "chat" });
      }
      return;
    }

    const normalized = text.toLowerCase().replace(/[^a-z]/g, '');
    const word = this.currentWord!.toLowerCase().replace(/[^a-z]/g, '');

    if (normalized === word) {
      player.hasGuessedThisTurn = true;
      const orderIndex = [...this.players.values()].filter(
        (p) => p.hasGuessedThisTurn && p.userId !== userId && p.userId !== this.currentDrawerId
      ).length;
      const timeLeft = this.turnEndsAt ? (this.turnEndsAt - Date.now()) / 1000 : 0;
      const points = guesserPoints(timeLeft, this.settings.drawTimeSec, orderIndex);
      player.score += points;
      const drawer = this.currentDrawerId ? this.players.get(this.currentDrawerId) : null;
      if (drawer) drawer.score += drawerPointsForGuess(points);

      this.emit("chat", { userId, name: player.name, text: `${player.name} guessed the word!`, kind: "guessed" });
      this.emit("privateMessage", { toUserId: userId, kind: "correct", text: `You guessed it! +${points}`, points });
      this.emitState();

      const nonDrawerPlayers = [...this.players.values()].filter(
        (p) => p.userId !== this.currentDrawerId && p.isConnected
      );
      if (nonDrawerPlayers.every((p) => p.hasGuessedThisTurn)) {
        this.endTurn();
      }
      return;
    }

    if (isCloseGuess(normalized, word)) {
      // Near-misses still appear in chat for everyone (like any wrong guess);
      // only the "is close!" nudge is private to the guesser.
      this.emit("chat", { userId, name: player.name, text, kind: "chat" });
      this.emit("privateMessage", { toUserId: userId, kind: "close", text: `"${text}" is close!` });
      return;
    }

    this.emit("chat", { userId, name: player.name, text, kind: "chat" });
  }

  kickVote(requesterId: string, targetUserId: string) {
    if (!this.players.has(targetUserId) || requesterId === targetUserId) return;
    let votes = this.kickVotes.get(targetUserId);
    if (!votes) {
      votes = new Set();
      this.kickVotes.set(targetUserId, votes);
    }
    votes.add(requesterId);
    const threshold = Math.ceil(this.connectedCount() / 2);
    if (votes.size >= threshold) {
      this.kickVotes.delete(targetUserId);
      this.leaveRoom(targetUserId); // emits its own "left the room" chat message
    } else {
      this.emit("chat", {
        userId: "system",
        name: "System",
        text: `Vote to kick: ${votes.size}/${threshold}`,
        kind: "kick",
      });
    }
  }

  private endTurn() {
    this.clearTimers();
    const word = this.currentWord;
    this.status = "round_end";
    this.turnEndsAt = null;
    this.emit("roundEnd", {
      word,
      scores: [...this.players.values()].map((p) => ({ userId: p.userId, name: p.name, score: p.score })),
    });
    if (word) {
      this.emit("chat", { userId: "system", name: "System", text: `The word was '${word}'`, kind: "reveal" });
    }
    // currentWord is intentionally kept until the next turn starts so the
    // round-end scoreboard can show everyone what the word was.
    this.emitState();
    this.roundEndTimer = setTimeout(() => this.nextTurn(), ROUND_END_PAUSE_MS);
  }

  private endGame() {
    this.clearTimers();
    this.status = "game_end";
    this.currentDrawerId = null;
    this.currentWord = null;
    const finalScores = [...this.players.values()]
      .map((p) => ({ userId: p.userId, name: p.name, score: p.score }))
      .sort((a, b) => b.score - a.score);
    this.emit("gameEnd", { finalScores });
    this.emitState();
  }

  // In "hidden" (or a "combination" turn that rolled hidden), unrevealed
  // letters are omitted entirely rather than shown as underscores, so
  // guessers can't infer the word's length from the blank count -- only
  // hint-revealed letters appear, in order.
  private maskedWord(): string | null {
    if (!this.currentWord) return null;
    if (this.hideLengthThisTurn) {
      return [...this.currentWord]
        .map((c, i) => (c !== " " && this.revealedIndices.has(i) ? c : null))
        .filter((c): c is string => c !== null)
        .join("");
    }
    return [...this.currentWord]
      .map((c, i) => (c === " " ? " " : this.revealedIndices.has(i) ? c : "_"))
      .join("");
  }

  serializeFor(userId: string) {
    const isDrawer = userId === this.currentDrawerId;
    const me = this.players.get(userId);
    const revealWord = isDrawer || this.status === "round_end" || this.status === "game_end" || (me?.hasGuessedThisTurn ?? false);
    const trueWordLength = this.currentWord?.replace(/ /g, "").length ?? 0;

    return {
      roomId: this.id,
      code: this.code,
      hostUserId: this.hostUserId,
      settings: this.settings,
      status: this.status,
      round: Math.min(this.currentRound, this.settings.rounds),
      totalRounds: this.settings.rounds,
      currentDrawerId: this.currentDrawerId,
      isYourTurnToChoose: isDrawer && this.status === "choosing_word",
      wordChoices: isDrawer && this.status === "choosing_word" ? this.wordChoices : [],
      word: revealWord ? this.currentWord : this.maskedWord(),
      wordRevealed: revealWord,
      // Withheld (not just hidden in the UI) while a hidden-mode turn hasn't
      // been revealed yet, so the length can't be read off the network payload.
      wordLength: revealWord || !this.hideLengthThisTurn ? trueWordLength : 0,
      turnEndsAt: this.turnEndsAt,
      chooseEndsAt: this.chooseEndsAt,
      players: [...this.players.values()]
        .sort((a, b) => a.joinOrder - b.joinOrder)
        .map((p) => ({
          userId: p.userId,
          name: p.name,
          avatar: p.avatar,
          score: p.score,
          isConnected: p.isConnected,
          isDrawing: p.userId === this.currentDrawerId,
          hasGuessed: p.hasGuessedThisTurn,
        })),
      strokes: this.strokes,
    };
  }
}
