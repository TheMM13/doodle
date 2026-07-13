import { useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useSocket } from "../socket/SocketContext";
import { DrawingCanvas, type DrawingCanvasHandle } from "../components/DrawingCanvas";
import { Toolbar } from "../components/Toolbar";
import { PlayerList } from "../components/PlayerList";
import { ChatGuessBox } from "../components/ChatGuessBox";
import { WordBanner } from "../components/WordBanner";
import { WordChoiceModal } from "../components/WordChoiceModal";
import { ScoreboardOverlay } from "../components/ScoreboardOverlay";
import { RoomSettingsModal } from "../components/RoomSettingsModal";
import { BRUSH_SIZES } from "../game/canvasSize";

export function RoomScreen() {
  const { user } = useAuth();
  const { room, messages, privateNotice, leaveRoom, startGame, chooseWord, sendStroke, sendGuess, kickVote, onCanvasStroke, onCanvasSync, updateSettings } =
    useSocket();
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState<number>(BRUSH_SIZES.medium);
  const [tool, setTool] = useState<"pen" | "eraser" | "fill">("pen");
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastTurnKey = useRef<string>("");

  useEffect(() => onCanvasStroke((s) => canvasRef.current?.applyRemoteStroke(s)), [onCanvasStroke]);
  useEffect(() => onCanvasSync((s) => canvasRef.current?.loadStrokes(s)), [onCanvasSync]);

  useEffect(() => {
    if (!room) return;
    const key = `${room.round}-${room.currentDrawerId}`;
    if (key !== lastTurnKey.current) {
      lastTurnKey.current = key;
      canvasRef.current?.loadStrokes(room.strokes ?? []);
    }
  }, [room?.round, room?.currentDrawerId, room?.strokes]);

  if (!room || !user) return null;

  const isDrawer = room.currentDrawerId === user.id;
  const isHost = room.hostUserId === user.id;
  const drawer = room.players.find((p) => p.userId === room.currentDrawerId);
  const canDraw = isDrawer && room.status === "drawing";

  const handleStart = async () => {
    const ack = await startGame();
    if (!ack.ok) setError(ack.error ?? "Can't start game");
  };

  if (room.status === "lobby") {
    return (
      <div className="screen room-screen lobby-screen">
        <div className="lobby-header">
          <span className="code-label">Room Code</span>
          <span className="room-code">{room.code}</span>
          <span className="code-hint">Share this code so friends can join</span>
        </div>
        <div className="lobby-players">
          <PlayerList players={room.players} hostUserId={room.hostUserId} meUserId={user.id} />
        </div>
        <div className="lobby-footer">
          {isHost && (
            <button className="secondary-btn" onClick={() => setSettingsVisible(true)}>
              Settings
            </button>
          )}
          {isHost ? (
            <button className="primary-btn" disabled={room.players.length < 2} onClick={handleStart}>
              Start Game ({room.players.length}/{room.settings.maxPlayers})
            </button>
          ) : (
            <p className="waiting-text">
              Waiting for host to start... ({room.players.length}/{room.settings.maxPlayers})
            </p>
          )}
          {error && <p className="error-text">{error}</p>}
          <button className="link-btn" onClick={leaveRoom}>
            Leave room
          </button>
        </div>
        <RoomSettingsModal
          visible={settingsVisible}
          settings={room.settings}
          onClose={() => setSettingsVisible(false)}
          onSave={(s) => updateSettings(s)}
        />
      </div>
    );
  }

  return (
    <div className="screen room-screen game-screen">
      <WordBanner
        word={room.status === "drawing" || room.status === "round_end" ? room.word : null}
        wordRevealed={room.wordRevealed}
        wordLength={room.wordLength}
        round={room.round}
        totalRounds={room.totalRounds}
        endsAt={room.status === "choosing_word" ? room.chooseEndsAt : room.turnEndsAt}
        drawerName={drawer?.name ?? null}
      />
      {privateNotice && (
        <p className={`private-notice ${privateNotice.kind === "correct" ? "notice-correct" : "notice-close"}`}>{privateNotice.text}</p>
      )}
      <button className="leave-floating" onClick={leaveRoom}>
        Leave
      </button>

      <div className="game-body">
        <div className="players-column">
          <PlayerList players={room.players} hostUserId={room.hostUserId} meUserId={user.id} onKickVote={kickVote} />
        </div>
        <div className="canvas-area">
          <DrawingCanvas ref={canvasRef} isDrawer={canDraw} color={color} brushSize={brushSize} tool={tool} onLocalStroke={sendStroke} />
          <Toolbar
            color={color}
            setColor={setColor}
            brushSize={brushSize}
            setBrushSize={setBrushSize}
            tool={tool}
            setTool={setTool}
            onUndo={() => {
              canvasRef.current?.applyRemoteStroke({ type: "undo" });
              sendStroke({ type: "undo" });
            }}
            onClear={() => {
              canvasRef.current?.applyRemoteStroke({ type: "clear" });
              sendStroke({ type: "clear" });
            }}
            disabled={!canDraw}
          />
        </div>
        <div className="chat-column">
          <ChatGuessBox messages={messages} onSend={sendGuess} disabledPlaceholder={isDrawer ? "You're drawing..." : "Type your guess..."} />
        </div>
      </div>

      <WordChoiceModal visible={room.isYourTurnToChoose} choices={room.wordChoices} endsAt={room.chooseEndsAt} onChoose={chooseWord} />
      <ScoreboardOverlay visible={room.status === "round_end"} title="Round over!" word={room.word} scores={room.players} />
      <ScoreboardOverlay
        visible={room.status === "game_end"}
        title="Game over!"
        scores={room.players}
        showPlayAgain={isHost}
        onPlayAgain={handleStart}
        onLeave={leaveRoom}
      />
    </div>
  );
}
