import { useState } from "react";
import { type PlayerView, AVATAR_FACES, AVATAR_HATS, FACE_COUNT, HAT_COUNT } from "../game/types";

interface Props {
  players: PlayerView[];
  hostUserId: string;
  meUserId: string;
  roomCode?: string;
  onKickVote?: (userId: string) => void;
}

export function PlayerList({ players, hostUserId, meUserId, roomCode, onKickVote }: Props) {
  const [copiedCode, setCopiedCode] = useState(false);

  // Sort descending by score — live leaderboard order
  const sorted = [...players].sort((a, b) => b.score - a.score);

  const handleSelfClick = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode).catch(() => {});
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="player-list" style={{ position: "relative" }}>
      {copiedCode && (
        <div className="code-copied-toast">
          📋 Room code <strong>{roomCode}</strong> copied!
        </div>
      )}
      {sorted.map((p) => {
        const isMe = p.userId === meUserId;
        const isHost = p.userId === hostUserId;

        return (
          <div
            key={p.userId}
            className={[
              "player-row",
              !p.isConnected ? "player-disconnected" : "",
              p.isDrawing ? "player-drawing" : "",
              p.hasGuessed ? "player-guessed" : "",
              isMe ? "player-me" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={isMe ? handleSelfClick : undefined}
            title={isMe && roomCode ? "Click to copy room code" : undefined}
            style={isMe ? { cursor: "pointer" } : undefined}
          >
            <span className="player-avatar" style={{ backgroundColor: p.avatar.color }}>
              <span className="player-avatar-face">{AVATAR_FACES[p.avatar.face % FACE_COUNT]}</span>
              {p.avatar.hat > 0 && (
                <span className="player-avatar-hat">{AVATAR_HATS[p.avatar.hat % HAT_COUNT]}</span>
              )}
            </span>

            <div className="player-info">
              <span className="player-name">
                {isHost && <span className="player-crown">★ </span>}
                {p.name}
                {isMe && <span className="player-you"> (You)</span>}
                {p.isDrawing && <span style={{ marginLeft: 4 }}>✏️</span>}
              </span>
              <span className="player-points">{p.score} pts</span>
              {!p.isConnected && <span className="player-away">disconnected</span>}
            </div>

            {onKickVote && !isMe && (
              <button
                className="kick-btn"
                onClick={(e) => { e.stopPropagation(); onKickVote(p.userId); }}
                title="Vote to kick"
              >
                kick
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
