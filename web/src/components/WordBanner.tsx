import { useEffect, useState } from "react";

interface Props {
  word: string | null;
  wordRevealed: boolean;
  wordLength: number;
  round: number;
  totalRounds: number;
  endsAt: number | null;
  drawerName: string | null;
}

export function WordBanner({ word, wordRevealed, wordLength, round, totalRounds, endsAt, drawerName }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    const tick = () => setSecondsLeft(endsAt ? Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)) : 0);
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [endsAt]);

  // In "hidden length" mode, unrevealed letters aren't sent as underscores
  // at all (so the length can't be inferred) -- an empty string means no
  // hints have landed yet, which needs its own placeholder so it doesn't
  // look like a blank/broken banner.
  const displayWord = word && word.length > 0 ? word.split("").join(" ") : word !== null ? "???" : "";

  return (
    <div className="word-banner">
      <div className="word-banner-timer">
        <span className="timer-badge">{secondsLeft}</span>
        <span className="word-round">Round {round} of {totalRounds}</span>
      </div>
      <div className="word-banner-center">
        <span className="word-display">
          {displayWord}
          {wordRevealed && wordLength > 0 && <sup className="word-length-badge">{wordLength}</sup>}
        </span>
        {drawerName && <span className="word-drawer">{drawerName} is drawing</span>}
      </div>
    </div>
  );
}
