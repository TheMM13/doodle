import { useEffect, useRef, useState } from "react";
import { ThumbUpIcon, ThumbDownIcon } from "./ToolIcons";

interface FloatingReaction {
  id: number;
  kind: "like" | "dislike";
  fromName: string;
}

interface Props {
  canReact: boolean;
  onReact: (kind: "like" | "dislike") => void;
  subscribe: (cb: (r: { kind: "like" | "dislike"; fromName: string }) => void) => () => void;
}

export function Reactions({ canReact, onReact, subscribe }: Props) {
  const [floating, setFloating] = useState<FloatingReaction[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    return subscribe((r) => {
      const id = nextId.current++;
      setFloating((prev) => [...prev.slice(-8), { id, ...r }]);
      setTimeout(() => setFloating((prev) => prev.filter((f) => f.id !== id)), 1800);
    });
  }, [subscribe]);

  return (
    <>
      <div className="reactions-overlay">
      {floating.map((f) => (
        <span key={f.id} className={`floating-reaction floating-reaction-${f.kind}`}>
          <span className="floating-reaction-emoji">
            {f.kind === "like" ? "👍" : "👎"}
          </span>
          <span className="floating-reaction-name">{f.fromName}</span>
        </span>
      ))}
    </div>
      {canReact && (
        <div className="reaction-buttons">
          <button className="reaction-btn reaction-btn-like" onClick={() => onReact("like")} title="Like the drawing">
            <ThumbUpIcon />
          </button>
          <button className="reaction-btn reaction-btn-dislike" onClick={() => onReact("dislike")} title="Not loving it">
            <ThumbDownIcon />
          </button>
        </div>
      )}
    </>
  );
}