interface ScoreRow {
  userId: string;
  name: string;
  score: number;
  roundScore: number;
}

interface Props {
  visible: boolean;
  title: string;
  word?: string | null;
  scores: ScoreRow[];
  useRoundScore?: boolean;
  showPlayAgain?: boolean;
  onPlayAgain?: () => void;
  onLeave?: () => void;
}

export function ScoreboardOverlay({ visible, title, word, scores, useRoundScore, showPlayAgain, onPlayAgain, onLeave }: Props) {
  if (!visible) return null;
  const sorted = [...scores].sort((a, b) => useRoundScore ? b.roundScore - a.roundScore : b.score - a.score);
  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2 className="modal-title">{title}</h2>
        {word && <p className="scoreboard-word">The word was: {word}</p>}
        {sorted.map((s, i) => (
          <div key={s.userId} className="scoreboard-row">
            <span className="scoreboard-rank">{i + 1}.</span>
            <span className="scoreboard-name">{s.name}</span>
            <span className="scoreboard-score">
              {useRoundScore ? (s.roundScore > 0 ? `+${s.roundScore}` : "—") : s.score}
            </span>
          </div>
        ))}
        {showPlayAgain && (
          <button className="primary-btn" onClick={onPlayAgain}>
            Play again
          </button>
        )}
        {!showPlayAgain && onLeave && <p className="waiting-text">Waiting for the host to start a new game...</p>}
        {onLeave && (
          <button className="link-btn" onClick={onLeave}>
            Leave room
          </button>
        )}
      </div>
    </div>
  );
}
