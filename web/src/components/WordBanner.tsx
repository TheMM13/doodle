import { useEffect, useState } from "react";

interface Props {
  word: string | null;
  round: number;
  totalRounds: number;
  endsAt: number | null;
  drawerName: string | null;
}

export function WordBanner({ word, round, totalRounds, endsAt, drawerName }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    const tick = () => setSecondsLeft(endsAt ? Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)) : 0);
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [endsAt]);

  return (
    <div className="word-banner">
      <span className="word-round">Round {round}/{totalRounds}</span>
      <span className="word-display">{word ? word.split("").join(" ") : ""}</span>
      <span className="word-timer">{secondsLeft}s</span>
      {drawerName && <span className="word-drawer">{drawerName} is drawing</span>}
    </div>
  );
}
