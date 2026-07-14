import { useState } from "react";
import { type PlayerView, AVATAR_FACES, AVATAR_HATS, FACE_COUNT, HAT_COUNT } from "../game/types";

interface Props {
  players: PlayerView[];
  hostUserId: string;
  meUserId: string;
  onKickVote?: (userId: string) => void;
}

export function PlayerList({ players, hostUserId, meUserId, onKickVote }: Props) {
  const [kickTarget, setKickTarget] = useState<string | null>(null);
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="player-list">
      {sorted.map((p, i) => {
        const isMe = p.userId === meUserId;
        const canKick = Boolean(onKickVote) && !isMe;
        const expanded = kickTarget === p.userId;
        return (
          <div key={p.userId} className="player-row-wrap">
            <div
              className={[
                "player-row",
                !p.isConnected && "player-disconnected",
                p.isDrawing && "player-drawing",
                p.hasGuessed && "player-guessed",
                canKick && "player-clickable",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={canKick ? () => setKickTarget(expanded ? null : p.userId) : undefined}
            >
              <span className="player-rank">{i + 1}</span>
              <span className="player-avatar" style={{ backgroundColor: p.avatar.color }}>
                <span className="player-avatar-face">{AVATAR_FACES[p.avatar.face % FACE_COUNT]}</span>
                {p.avatar.hat > 0 && <span className="player-avatar-hat">{AVATAR_HATS[p.avatar.hat % HAT_COUNT]}</span>}
              </span>
              <span className="player-name">
                {p.userId === hostUserId && <span className="player-crown">★</span>}
                {p.name}
                {isMe && <span className="player-you"> (you)</span>}
                {p.isDrawing && <span className="player-pencil">✏️</span>}
                {!p.isConnected && <span className="player-away">away</span>}
              </span>
              <span className="player-points">{p.score}</span>
            </div>
            {expanded && (
              <button
                className="kick-confirm-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onKickVote?.(p.userId);
                  setKickTarget(null);
                }}
              >
                Vote to kick {p.name}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
