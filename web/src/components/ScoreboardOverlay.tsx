interface ScoreRow {
  userId: string;
  name: string;
  score: number;
}

interface Props {
  visible: boolean;
  title: string;
  word?: string | null;
  scores: ScoreRow[];
  showPlayAgain?: boolean;
  onPlayAgain?: () => void;
}

export function ScoreboardOverlay({ visible, title, word, scores, showPlayAgain, onPlayAgain }: Props) {
  if (!visible) return null;
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2 className="modal-title">{title}</h2>
        {word && <p className="scoreboard-word">The word was: {word}</p>}
        {sorted.map((s, i) => (
          <div key={s.userId} className="scoreboard-row">
            <span className="scoreboard-rank">{i + 1}.</span>
            <span className="scoreboard-name">{s.name}</span>
            <span className="scoreboard-score">{s.score}</span>
          </div>
        ))}
        {showPlayAgain && (
          <button className="primary-btn" onClick={onPlayAgain}>
            Play again
          </button>
        )}
      </div>
    </div>
  );
}
