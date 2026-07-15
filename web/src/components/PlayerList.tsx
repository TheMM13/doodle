import { useState } from "react";
import { type PlayerView } from "../game/types";
import { FaceIcon } from "./FaceIcon";

interface Props {
  players: PlayerView[];
  hostUserId: string;
  meUserId: string;
  roomCode?: string;
  onKickVote?: (userId: string) => void;
}

export function PlayerList({ players, hostUserId, meUserId, roomCode, onKickVote }: Props) {
  const [kickTarget, setKickTarget] = useState<string | null>(null);
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="player-list">
      {sorted.map((p) => {
        const isMe = p.userId === meUserId;
        const canKick = Boolean(onKickVote) && !isMe;
        const expanded = kickTarget === p.userId;

        const handleClick = () => {
          if (canKick) {
            setKickTarget(expanded ? null : p.userId);
          } else if (isMe && roomCode) {
            navigator.clipboard.writeText(roomCode).catch(() => {});
          }
        };

        const clickable = canKick || (isMe && Boolean(roomCode));

        return (
          <div key={p.userId} className="player-row-wrap">
            <div
              className={[
                "player-row",
                !p.isConnected && "player-disconnected",
                p.isDrawing && "player-drawing",
                p.hasGuessed && "player-guessed",
                clickable && "player-clickable",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={clickable ? handleClick : undefined}
            >
              <span className="player-avatar">
                <FaceIcon faceId={p.avatar.face} size={36} />
              </span>
              <span className="player-name">
                {p.userId === hostUserId && <span className="player-crown"></span>}
                {p.name}<br />
                {isMe && <span className="player-you"> (you)</span>}
                {p.isDrawing && <span className="player-pencil"> ✏️</span>}
                {!p.isConnected && <span className="player-away"> away</span>}
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