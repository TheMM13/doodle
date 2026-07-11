import { type PlayerView, AVATAR_FACES, AVATAR_HATS, FACE_COUNT, HAT_COUNT } from "../game/types";

interface Props {
  players: PlayerView[];
  hostUserId: string;
  meUserId: string;
  onKickVote?: (userId: string) => void;
}

export function PlayerList({ players, hostUserId, meUserId, onKickVote }: Props) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  return (
    <div className="player-list">
      {sorted.map((p, i) => (
        <div
          key={p.userId}
          className={`player-row ${!p.isConnected ? "player-disconnected" : ""} ${p.isDrawing ? "player-drawing" : ""} ${p.hasGuessed ? "player-guessed" : ""}`}
        >
          <span className="player-rank">#{i + 1}</span>
          <span className="player-avatar" style={{ backgroundColor: p.avatar.color }}>
            <span className="player-avatar-face">{AVATAR_FACES[p.avatar.face % FACE_COUNT]}</span>
            {p.avatar.hat > 0 && <span className="player-avatar-hat">{AVATAR_HATS[p.avatar.hat % HAT_COUNT]}</span>}
          </span>
          <div className="player-info">
            <span className="player-name">
              {p.userId === hostUserId ? <span className="player-crown">★</span> : null}
              {p.name}
              {p.userId === meUserId ? <span className="player-you"> (You)</span> : null}
              {p.isDrawing ? " ✏️" : ""}
            </span>
            <span className="player-points">{p.score} points</span>
            {!p.isConnected && <span className="player-away">disconnected – seat held</span>}
          </div>
          {onKickVote && p.userId !== meUserId && (
            <button className="kick-btn" onClick={() => onKickVote(p.userId)}>
              kick
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
