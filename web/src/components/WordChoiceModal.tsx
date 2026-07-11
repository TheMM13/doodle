import { useEffect, useState } from "react";

interface Props {
  visible: boolean;
  choices: string[];
  endsAt: number | null;
  onChoose: (word: string) => void;
}

export function WordChoiceModal({ visible, choices, endsAt, onChoose }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    const tick = () => setSecondsLeft(endsAt ? Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)) : 0);
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [endsAt]);

  if (!visible) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2 className="modal-title">Choose a word to draw</h2>
        <p className="modal-timer">{secondsLeft}s</p>
        {choices.map((w) => (
          <button key={w} className="choice-btn" onClick={() => onChoose(w)}>
            {w}
          </button>
        ))}
      </div>
    </div>
  );
}
